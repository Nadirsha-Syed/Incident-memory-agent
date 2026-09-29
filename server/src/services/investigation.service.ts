import { v4 as uuidv4 } from 'uuid';
import { Incident, IIncident } from '../models/Incident.js';
import { Investigation, IInvestigation, IRecalledMemory } from '../models/Investigation.js';
import { hindsightService } from './hindsight.service.js';
import { llmService } from './llm.service.js';
import { logger } from '../utils/logger.js';

export class InvestigationService {
  /**
   * Run an AI investigation for a given incident
   * @param incidentId Unique ID of the incident
   * @param withMemory Whether to query and utilize Hindsight persistent memory
   */
  async investigateIncident(incidentId: string, withMemory = true): Promise<IInvestigation> {
    const incident = await Incident.findOne({ incidentId });
    if (!incident) {
      throw new Error(`Incident with ID ${incidentId} not found`);
    }

    logger.info(`Starting investigation for incident ${incidentId} [withMemory: ${withMemory}]`);

    let recalledMemories: IRecalledMemory[] = [];

    if (withMemory) {
      // Query Hindsight for relevant past incident experiences
      const queryText = `${incident.service} ${incident.errorMessage} ${incident.title} ${incident.tags.join(' ')}`;
      const memories = await hindsightService.recallMemories(queryText, {
        service: incident.service,
        tags: incident.tags,
        maxResults: 4,
      });

      recalledMemories = memories.map(m => ({
        id: m.id,
        content: m.content,
        sourceIncidentId: m.sourceIncidentId,
        relevanceReason: m.relevanceReason,
        memoryType: m.memoryType,
        timestamp: m.timestamp,
        score: m.score,
      }));

      logger.info(`Retrieved ${recalledMemories.length} relevant memories for incident ${incidentId}`);
    }

    // Call LLM service with telemetry and memories
    const { report, modelUsed } = await llmService.generateInvestigation({
      service: incident.service,
      severity: incident.severity,
      environment: incident.environment,
      errorMessage: incident.errorMessage,
      logs: incident.logs,
      tags: incident.tags,
      recalledMemories,
      withMemory,
    });

    const investigationId = `INV-${uuidv4().slice(0, 8).toUpperCase()}`;

    const investigation = await Investigation.create({
      investigationId,
      incidentId: incident.incidentId,
      report,
      recalledMemories,
      withMemory,
      modelUsed,
    });

    // Update incident status to Investigating if it was New
    if (incident.status === 'New') {
      incident.status = 'Investigating';
      await incident.save();
    }

    logger.info(`Investigation ${investigationId} completed successfully for incident ${incidentId}`);
    return investigation;
  }

  /**
   * Retrieve investigations for an incident
   */
  async getInvestigationsForIncident(incidentId: string): Promise<IInvestigation[]> {
    return await Investigation.find({ incidentId }).sort({ createdAt: -1 });
  }

  /**
   * Run side-by-side memory comparison on an incident
   */
  async compareMemoryEffect(incidentId: string): Promise<{
    incident: IIncident;
    withoutMemory: IInvestigation;
    withMemory: IInvestigation;
  }> {
    const incident = await Incident.findOne({ incidentId });
    if (!incident) {
      throw new Error(`Incident with ID ${incidentId} not found`);
    }

    logger.info(`Running memory comparison demo for incident ${incidentId}`);

    // Run both investigations
    const [withoutMemory, withMemoryResult] = await Promise.all([
      this.investigateIncident(incidentId, false),
      this.investigateIncident(incidentId, true),
    ]);

    return {
      incident,
      withoutMemory,
      withMemory: withMemoryResult,
    };
  }
}

export const investigationService = new InvestigationService();
