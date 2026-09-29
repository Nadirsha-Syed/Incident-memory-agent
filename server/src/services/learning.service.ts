import { Incident, IIncident, IResolution } from '../models/Incident.js';
import { MemoryEntry } from '../models/MemoryEntry.js';
import { hindsightService } from './hindsight.service.js';
import { logger } from '../utils/logger.js';

export interface ResolveIncidentParams {
  incidentId: string;
  confirmedRootCause: string;
  resolutionSteps: string;
  worked: boolean;
  notes?: string;
  lessonsLearned?: string;
  failedApproaches?: string[];
  resolvedBy?: string;
}

export class LearningService {
  /**
   * Records a confirmed resolution, updates incident, and feeds learning into Hindsight
   */
  async recordResolutionAndLearn(params: ResolveIncidentParams): Promise<{
    incident: IIncident;
    retainedMemoryIds: string[];
  }> {
    const { incidentId, confirmedRootCause, resolutionSteps, worked, notes, lessonsLearned, failedApproaches, resolvedBy } = params;

    const incident = await Incident.findOne({ incidentId });
    if (!incident) {
      throw new Error(`Incident with ID ${incidentId} not found`);
    }

    const resolution: IResolution = {
      confirmedRootCause,
      resolutionSteps,
      worked,
      notes,
      lessonsLearned,
      failedApproaches: failedApproaches || [],
      resolvedAt: new Date(),
      resolvedBy: resolvedBy || 'Senior SRE',
    };

    // Idempotency check: prevent duplicate retention if incident was already resolved with same root cause
    const existingConfirmed = await MemoryEntry.findOne({ incidentId, memoryType: 'confirmed_resolution' });
    if (existingConfirmed && worked && incident.status === 'Resolved' && incident.resolution?.confirmedRootCause === confirmedRootCause) {
      logger.info(`Incident ${incidentId} resolution already retained as [${existingConfirmed.memoryId}]. Skipping duplicate retention.`);
      return {
        incident,
        retainedMemoryIds: [existingConfirmed.memoryId],
      };
    }

    incident.resolution = resolution;
    incident.status = 'Resolved';
    await incident.save();

    logger.info(`Incident ${incidentId} marked as Resolved. Ingesting confirmed learning into Hindsight...`);

    const retainedMemoryIds: string[] = [];

    // 1. Ingest confirmed resolution into Hindsight
    if (worked) {
      const memoryContent = `[CONFIRMED RESOLUTION] Service: ${incident.service}. Error: ${incident.errorMessage}. Root Cause: ${confirmedRootCause}. Verified Fix: ${resolutionSteps}.${lessonsLearned ? ` Lesson Learned: ${lessonsLearned}` : ''}`;

      const res = await hindsightService.retainKnowledge({
        incident,
        memoryType: 'confirmed_resolution',
        content: memoryContent,
        metadata: {
          confirmedRootCause,
          resolutionSteps,
          lessonsLearned,
          outcome: 'success',
        },
      });

      retainedMemoryIds.push(res.memoryId);
    }

    // 2. Ingest failed approaches if any (critical context for future SREs)
    if (failedApproaches && failedApproaches.length > 0) {
      for (const failedAttempt of failedApproaches) {
        if (!failedAttempt.trim()) continue;
        const failedContent = `[FAILED APPROACH - DO NOT REPEAT] Service: ${incident.service}. Error: ${incident.errorMessage}. Ineffective Attempt: ${failedAttempt}. Reason: Failed to resolve the root cause (${confirmedRootCause}).`;

        const res = await hindsightService.retainKnowledge({
          incident,
          memoryType: 'failed_approach',
          content: failedContent,
          metadata: {
            attempt: failedAttempt,
            outcome: 'failed',
          },
        });

        retainedMemoryIds.push(res.memoryId);
      }
    }

    logger.info(`Learning cycle complete for ${incidentId}. Created ${retainedMemoryIds.length} Hindsight memory records.`);

    return {
      incident,
      retainedMemoryIds,
    };
  }
}

export const learningService = new LearningService();
