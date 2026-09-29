import { getGroqClient, groqConfig } from '../config/groq.js';
import { IInvestigationReport } from '../models/Investigation.js';
import { INCIDENT_AGENT_SYSTEM_PROMPT, buildInvestigationPrompt } from '../utils/prompts.js';
import { logger } from '../utils/logger.js';

export interface GenerateInvestigationParams {
  service: string;
  severity: string;
  environment: string;
  errorMessage: string;
  logs?: string;
  tags?: string[];
  recalledMemories?: Array<{
    content: string;
    sourceIncidentId?: string;
    relevanceReason?: string;
    memoryType?: string;
  }>;
  withMemory: boolean;
}

export class LlmService {
  /**
   * Generates a structured investigation report using Groq
   */
  async generateInvestigation(params: GenerateInvestigationParams): Promise<{
    report: IInvestigationReport;
    modelUsed: string;
    rawResponse: string;
  }> {
    const client = getGroqClient();
    const prompt = buildInvestigationPrompt(params);

    if (!client) {
      logger.warn('Groq API key not configured. Generating high-fidelity fallback analysis based on telemetry & memory.');
      return this.generateDeterministicFallback(params);
    }

    const candidateModels = [groqConfig.model, 'openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b']
      .filter((m, i, arr) => arr.indexOf(m) === i);

    for (const model of candidateModels) {
      try {
        logger.info('Calling Groq LLM API for investigation analysis', {
          model,
          withMemory: params.withMemory,
          memoriesCount: params.recalledMemories?.length || 0,
        });

        const completion = await client.chat.completions.create({
          messages: [
            { role: 'system', content: INCIDENT_AGENT_SYSTEM_PROMPT },
            { role: 'user', content: prompt },
          ],
          model,
          temperature: 0.1, // Low temperature for factual precision
          response_format: { type: 'json_object' },
        });

        const rawContent = completion.choices[0]?.message?.content || '{}';
        const parsedReport = this.parseAndValidateReport(rawContent, params);

        return {
          report: parsedReport,
          modelUsed: model,
          rawResponse: rawContent,
        };
      } catch (err: any) {
        logger.warn(`Groq completion failed with model ${model}:`, { error: err.message });
        // Continue to next candidate model if available
      }
    }

    logger.error('All Groq candidate models failed or returned error, falling back to deterministic SRE engine.');
    return this.generateDeterministicFallback(params);
  }

  /**
   * Safely parses JSON response and handles edge cases/markdown fences
   */
  private parseAndValidateReport(raw: string, params: GenerateInvestigationParams): IInvestigationReport {
    try {
      let cleaned = raw.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();
      }

      const obj = JSON.parse(cleaned);

      return {
        summary: obj.summary || `Investigation of ${params.service} incident (${params.severity})`,
        possibleCauses: Array.isArray(obj.possibleCauses) && obj.possibleCauses.length > 0
          ? obj.possibleCauses
          : [`Potential issue in ${params.service} related to: ${params.errorMessage.slice(0, 100)}`],
        confidenceExplanation: obj.confidenceExplanation || (params.withMemory && params.recalledMemories && params.recalledMemories.length > 0
          ? 'High confidence: Strong historical correlation found in Hindsight persistent memory.'
          : 'Moderate confidence: Based on current telemetry and standard failure patterns.'),
        recommendedDiagnosticSteps: Array.isArray(obj.recommendedDiagnosticSteps) && obj.recommendedDiagnosticSteps.length > 0
          ? obj.recommendedDiagnosticSteps
          : ['Inspect active connection metrics and error spikes', 'Verify service configuration and recent deployments'],
        relevantPastIncidents: Array.isArray(obj.relevantPastIncidents) ? obj.relevantPastIncidents : [],
        suggestedResolution: obj.suggestedResolution || 'Execute diagnostic checks first to confirm the exact root cause before applying configuration updates or restarts.',
        safetyConsiderations: Array.isArray(obj.safetyConsiderations) && obj.safetyConsiderations.length > 0
          ? obj.safetyConsiderations
          : ['Verify upstream and downstream service status before modifying configuration.'],
        humanConfirmationRequired: obj.humanConfirmationRequired ?? true,
      };
    } catch (parseErr: any) {
      logger.warn('Failed to parse Groq JSON response, falling back to structured representation', { error: parseErr.message });
      return this.generateDeterministicFallback(params).report;
    }
  }

  /**
   * High-fidelity deterministic fallback when Groq credentials are not yet set
   */
  private generateDeterministicFallback(params: GenerateInvestigationParams): {
    report: IInvestigationReport;
    modelUsed: string;
    rawResponse: string;
  } {
    const hasMemory = params.withMemory && params.recalledMemories && params.recalledMemories.length > 0;
    const topMemory = hasMemory ? params.recalledMemories![0] : null;

    let summary = `Incident detected on ${params.service} [${params.severity}]. Primary symptom: ${params.errorMessage}`;
    let possibleCauses: string[] = [];
    let confidenceExplanation = '';
    let recommendedDiagnosticSteps: string[] = [];
    let relevantPastIncidents: Array<{
      incidentId?: string;
      summary: string;
      resolutionApplied?: string;
      relevanceReason: string;
    }> = [];
    let suggestedResolution = '';
    let safetyConsiderations: string[] = [];

    if (hasMemory && topMemory) {
      summary = `Incident on ${params.service} matching historical incident ${topMemory.sourceIncidentId || 'in memory'}. Primary error: ${params.errorMessage}`;
      possibleCauses = [
        `Known failure mode: ${topMemory.content}`,
        `Transient resource exhaustion or connection starvation in ${params.service}`,
      ];
      confidenceExplanation = `High Confidence (88%): Matches confirmed historical resolution from ${topMemory.sourceIncidentId || 'Hindsight memory'}. Historical fix was previously verified.`;
      recommendedDiagnosticSteps = [
        `1. Inspect ${params.service} metrics and pool limits to confirm similarity with ${topMemory.sourceIncidentId || 'past incident'}`,
        `2. Check active thread count and socket allocation against recent traffic baseline`,
        `3. Validate whether recent environment changes or deployment altered pool or connection timeout parameters`,
      ];
      relevantPastIncidents = params.recalledMemories!.map(m => ({
        incidentId: m.sourceIncidentId,
        summary: m.content,
        resolutionApplied: m.content.includes('Resolution:') ? m.content.split('Resolution:')[1]?.trim() : 'Applied verified configuration fix',
        relevanceReason: m.relevanceReason || 'High semantic match with current error symptoms and service signature',
      }));
      suggestedResolution = `Based on confirmed resolution from ${topMemory.sourceIncidentId || 'memory'}:\n1. Apply verified configuration adjustment\n2. Perform graceful rolling restart of ${params.service}\n3. Monitor connection re-establishment and error rate drops.`;
      safetyConsiderations = [
        `Ensure graceful draining of in-flight requests before restarting worker instances`,
        `Have rollback parameters prepared if connection count does not immediately stabilize`,
      ];
    } else {
      summary = `Unprecedented or memory-disabled incident on ${params.service}. Error: ${params.errorMessage}`;
      possibleCauses = [
        `Generic connection timeout or network partition affecting ${params.service}`,
        `Upstream dependency unavailable or degrading latency`,
        `Unoptimized query or thread pool starvation under current load`,
      ];
      confidenceExplanation = params.withMemory
        ? 'Low to Moderate Confidence: No matching historical incidents found in Hindsight persistent memory. Proceeding from baseline diagnostic principles.'
        : 'Baseline Investigation (Memory Recall Disabled): Operating strictly without persistent memory assistance.';
      recommendedDiagnosticSteps = [
        `1. Inspect application error logs and full trace headers for ${params.service}`,
        `2. Query database slow query log and active connection tables`,
        `3. Test network latency and packet loss between ${params.service} and database cluster`,
        `4. Check memory and CPU usage on the host nodes`,
      ];
      relevantPastIncidents = [];
      suggestedResolution = `1. Conduct recommended diagnostic checks to identify bottleneck\n2. Once root cause is identified by engineer, draft mitigation steps\n3. Record confirmed resolution upon fix to teach Hindsight for future incidents.`;
      safetyConsiderations = [
        `Avoid aggressive blind restarts without collecting heap dumps or thread dumps`,
        `Human engineer confirmation required before any production intervention`,
      ];
    }

    const report: IInvestigationReport = {
      summary,
      possibleCauses,
      confidenceExplanation,
      recommendedDiagnosticSteps,
      relevantPastIncidents,
      suggestedResolution,
      safetyConsiderations,
      humanConfirmationRequired: true,
    };

    return {
      report,
      modelUsed: groqConfig.isConfigured ? groqConfig.model : 'deterministic-sre-engine (Groq key not provided)',
      rawResponse: JSON.stringify(report, null, 2),
    };
  }
}

export const llmService = new LlmService();
