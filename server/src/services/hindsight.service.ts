import { v4 as uuidv4 } from 'uuid';
import { getHindsightClient, hindsightConfig } from '../config/hindsight.js';
import { IMemoryEntry, MemoryEntry, MemoryType } from '../models/MemoryEntry.js';
import { IIncident } from '../models/Incident.js';
import { logger } from '../utils/logger.js';

export interface RecalledResult {
  id: string;
  content: string;
  sourceIncidentId?: string;
  relevanceReason?: string;
  memoryType: string;
  timestamp: Date | string;
  score?: number;
}

export class HindsightService {
  private bankId: string;

  constructor() {
    this.bankId = hindsightConfig.bankId;
  }

  /**
   * Check connection status to Hindsight
   */
  async checkHealth(): Promise<{
    configured: boolean;
    connected: boolean;
    apiUrl: string;
    bankId: string;
    version?: any;
    error?: string;
  }> {
    const client = getHindsightClient();
    if (!client) {
      return {
        configured: false,
        connected: false,
        apiUrl: hindsightConfig.apiUrl,
        bankId: this.bankId,
        error: 'Hindsight credentials not configured (HINDSIGHT_API_KEY required for Hindsight Cloud).',
      };
    }

    try {
      const version = await client.getVersion();
      return {
        configured: true,
        connected: true,
        apiUrl: hindsightConfig.apiUrl,
        bankId: this.bankId,
        version,
      };
    } catch (err: any) {
      logger.warn('Hindsight health check warning:', { message: err.message });
      return {
        configured: true,
        connected: false,
        apiUrl: hindsightConfig.apiUrl,
        bankId: this.bankId,
        error: err.message || 'Unable to connect to Hindsight server',
      };
    }
  }

  /**
   * Retain confirmed incident knowledge in Hindsight
   */
  async retainKnowledge(params: {
    incident: IIncident;
    memoryType: MemoryType;
    content: string;
    metadata?: Record<string, any>;
  }): Promise<{ memoryId: string; syncedWithHindsight: boolean; error?: string }> {
    const { incident, memoryType, content, metadata = {} } = params;
    const memoryId = `MEM-${uuidv4().slice(0, 8).toUpperCase()}`;

    const client = getHindsightClient();
    let syncedWithHindsight = false;
    let hindsightError: string | undefined;

    // Structured metadata for Hindsight (string values required by SDK)
    const stringifiedMetadata: Record<string, string> = {
      incidentId: incident.incidentId,
      service: incident.service,
      severity: incident.severity,
      environment: incident.environment,
      memoryType,
      worked: String(incident.resolution?.worked ?? true),
    };
    for (const [k, v] of Object.entries(metadata)) {
      stringifiedMetadata[k] = typeof v === 'string' ? v : JSON.stringify(v);
    }

    if (client) {
      try {
        logger.info(`Retaining memory to Hindsight bank [${this.bankId}]`, {
          incidentId: incident.incidentId,
          memoryType,
        });

        await client.retain(this.bankId, content, {
          timestamp: new Date(),
          context: `Incident ${incident.incidentId}: ${incident.title}`,
          metadata: stringifiedMetadata,
          tags: [incident.service, incident.severity.toLowerCase(), memoryType, ...(incident.tags || [])],
        });

        syncedWithHindsight = true;
        logger.info(`Successfully retained memory in Hindsight bank: ${this.bankId}`);
      } catch (err: any) {
        hindsightError = err.message || 'Failed to retain memory in Hindsight';
        logger.error('Hindsight retain failed:', { error: hindsightError });
      }
    } else {
      logger.info('Hindsight client not connected. Storing memory entry in local persistent store for demo/evaluation.');
    }

    // Always persist to local MemoryEntry collection for tracking, audit log, and instant display
    try {
      await MemoryEntry.create({
        memoryId,
        incidentId: incident.incidentId,
        bankId: this.bankId,
        memoryType,
        content,
        metadata: {
          service: incident.service,
          severity: incident.severity,
          environment: incident.environment,
          tags: incident.tags,
          confirmedBy: incident.resolution?.resolvedBy,
          worked: incident.resolution?.worked,
        },
        syncedWithHindsight,
        hindsightError,
      });
    } catch (dbErr: any) {
      logger.error('Failed to save local MemoryEntry:', { error: dbErr.message });
    }

    return { memoryId, syncedWithHindsight, error: hindsightError };
  }

  /**
   * Recall memories from Hindsight given an incident query
   */
  async recallMemories(query: string, options: {
    service?: string;
    tags?: string[];
    maxResults?: number;
  } = {}): Promise<RecalledResult[]> {
    const client = getHindsightClient();
    const results: RecalledResult[] = [];

    if (client) {
      try {
        logger.info(`Querying Hindsight recall API for bank [${this.bankId}]`, { query });
        const recallResponse = await client.recall(this.bankId, query, {
          budget: 'mid',
          includeChunks: true,
          includeSourceFacts: true,
          tags: options.service ? [options.service] : undefined,
        });

        logger.info('Received Hindsight recall response', { recallResponse });

        // Parse official Hindsight response structure
        const rawResults = (recallResponse as any)?.results || (recallResponse as any)?.memories || [];
        if (Array.isArray(rawResults)) {
          for (const item of rawResults) {
            const content = typeof item === 'string' ? item : item.content || item.text || JSON.stringify(item);
            const meta = item.metadata || {};
            
            // Extract raw score from Hindsight scores object (reranker, final, semantic, or direct score)
            const rawScore = item.score ?? item.scores?.reranker ?? item.scores?.final ?? item.scores?.semantic ?? 0.90;
            const normalizedScore = typeof rawScore === 'number' ? Math.min(1.0, Math.max(0, rawScore > 1 ? rawScore / 1.5 : rawScore)) : 0.90;
            const scorePercent = (normalizedScore * 100).toFixed(0) + '%';
            
            // Extract source incident ID from metadata, entities list, or regex in text
            const entityIncident = Array.isArray(item.entities) ? item.entities.find((e: string) => /^(INC|DEMO)-/i.test(e)) : undefined;
            const textIncident = typeof content === 'string' ? content.match(/(INC-\d{4}-\d+|DEMO-[A-Z0-9-]+)/i)?.[0] : undefined;
            const sourceIncidentId = meta.incidentId || entityIncident || textIncident || item.document_id;

            results.push({
              id: item.id || `MEM-${uuidv4().slice(0, 6)}`,
              content,
              sourceIncidentId,
              relevanceReason: item.reason || `Retrieved from Hindsight persistent memory (${scorePercent} match)`,
              memoryType: meta.memoryType || 'confirmed_resolution',
              timestamp: item.timestamp || item.mentioned_at || new Date(),
              score: normalizedScore,
            });
          }
        }
      } catch (err: any) {
        logger.warn('Hindsight recall failed, querying local memory store:', { error: err.message });
      }
    }

    // If client is unavailable or returns 0 results, perform local semantic matching from recorded memory entries
    if (results.length === 0) {
      logger.info('Checking local memory entries for relevant incident history...');
      const searchTerms = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      const entries = await MemoryEntry.find().sort({ createdAt: -1 }).limit(30);

      for (const entry of entries) {
        const text = `${entry.content} ${entry.metadata.service} ${entry.incidentId}`.toLowerCase();
        let matchCount = 0;
        for (const term of searchTerms) {
          if (text.includes(term)) matchCount++;
        }

        // Service match gives strong relevance
        const serviceMatch = options.service && entry.metadata.service.toLowerCase() === options.service.toLowerCase();

        if (matchCount > 0 || serviceMatch) {
          results.push({
            id: entry.memoryId,
            content: entry.content,
            sourceIncidentId: entry.incidentId,
            relevanceReason: serviceMatch
              ? `Same affected service (${entry.metadata.service}) with matching symptom keywords`
              : `Keyword overlap with past confirmed resolution (${matchCount} terms matched)`,
            memoryType: entry.memoryType,
            timestamp: entry.createdAt,
            score: serviceMatch ? 0.92 : Math.min(0.85, 0.4 + matchCount * 0.1),
          });
        }
      }
    }

    // Sort by score descending and limit results
    const max = options.maxResults || 5;
    return results.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, max);
  }

  /**
   * Reflect over memories using Hindsight reflection engine
   */
  async reflectOverMemories(query: string): Promise<string | null> {
    const client = getHindsightClient();
    if (!client) return null;

    try {
      const response = await client.reflect(this.bankId, query, { budget: 'mid' });
      return (response as any)?.text || (response as any)?.answer || null;
    } catch (err: any) {
      logger.warn('Hindsight reflect failed:', { error: err.message });
      return null;
    }
  }

  /**
   * List recent memory activities for the Memory Explorer
   */
  async listRecentActivity(limit = 50): Promise<IMemoryEntry[]> {
    return await MemoryEntry.find().sort({ createdAt: -1 }).limit(limit);
  }

  /**
   * Get aggregate statistics on memories
   */
  async getMemoryStats(): Promise<{
    totalMemories: number;
    confirmedResolutions: number;
    symptoms: number;
    failedApproaches: number;
    syncedCount: number;
  }> {
    const [total, confirmed, symptoms, failed, synced] = await Promise.all([
      MemoryEntry.countDocuments(),
      MemoryEntry.countDocuments({ memoryType: 'confirmed_resolution' }),
      MemoryEntry.countDocuments({ memoryType: 'incident_symptom' }),
      MemoryEntry.countDocuments({ memoryType: 'failed_approach' }),
      MemoryEntry.countDocuments({ syncedWithHindsight: true }),
    ]);

    return {
      totalMemories: total,
      confirmedResolutions: confirmed,
      symptoms,
      failedApproaches: failed,
      syncedCount: synced,
    };
  }
}

export const hindsightService = new HindsightService();
