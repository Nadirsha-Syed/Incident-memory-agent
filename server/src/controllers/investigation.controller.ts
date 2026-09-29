import { Request, Response, NextFunction } from 'express';
import { investigationService } from '../services/investigation.service.js';
import { learningService } from '../services/learning.service.js';

export class InvestigationController {
  async investigate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const withMemory = req.body.withMemory !== false;

      const investigation = await investigationService.investigateIncident(id, withMemory);

      res.status(201).json({
        success: true,
        investigation,
      });
    } catch (err) {
      next(err);
    }
  }

  async resolveIncident(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const {
        confirmedRootCause,
        resolutionSteps,
        worked,
        notes,
        lessonsLearned,
        failedApproaches,
        resolvedBy,
      } = req.body;

      if (!confirmedRootCause || !resolutionSteps) {
        res.status(400).json({
          success: false,
          message: 'Both confirmedRootCause and resolutionSteps are required to resolve an incident.',
        });
        return;
      }

      const result = await learningService.recordResolutionAndLearn({
        incidentId: id,
        confirmedRootCause,
        resolutionSteps,
        worked: worked !== false,
        notes,
        lessonsLearned,
        failedApproaches,
        resolvedBy,
      });

      res.json({
        success: true,
        message: 'Incident resolved successfully and confirmed resolution ingested into Hindsight memory bank.',
        incident: result.incident,
        retainedMemoryIds: result.retainedMemoryIds,
      });
    } catch (err) {
      next(err);
    }
  }

  async getIncidentInvestigations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const investigations = await investigationService.getInvestigationsForIncident(id);
      res.json({
        success: true,
        investigations,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const investigationController = new InvestigationController();
