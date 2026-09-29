import { Request, Response, NextFunction } from 'express';
import { incidentService } from '../services/incident.service.js';
import { investigationService } from '../services/investigation.service.js';

export class IncidentController {
  async createIncident(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const incident = await incidentService.createIncident(req.body);

      // Auto-trigger investigation if requested (default: true)
      let initialInvestigation = null;
      if (req.body.autoInvestigate !== false) {
        try {
          initialInvestigation = await investigationService.investigateIncident(incident.incidentId, true);
        } catch (invErr) {
          // Non-blocking if investigation encounters an issue, return created incident
        }
      }

      res.status(201).json({
        success: true,
        incident,
        investigation: initialInvestigation,
      });
    } catch (err) {
      next(err);
    }
  }

  async getIncidents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, severity, service, search, startDate, endDate, limit, skip } = req.query;
      const result = await incidentService.getIncidents({
        status: status as any,
        severity: severity as any,
        service: service as string,
        search: search as string,
        startDate: startDate as string,
        endDate: endDate as string,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        skip: skip ? parseInt(skip as string, 10) : undefined,
      });

      res.json({
        success: true,
        total: result.total,
        incidents: result.incidents,
      });
    } catch (err) {
      next(err);
    }
  }

  async getIncidentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const incident = await incidentService.getIncidentById(id);
      if (!incident) {
        res.status(404).json({ success: false, message: `Incident ${id} not found` });
        return;
      }

      const investigations = await investigationService.getInvestigationsForIncident(id);

      res.json({
        success: true,
        incident,
        investigations,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateIncident(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updated = await incidentService.updateIncident(id, req.body);
      if (!updated) {
        res.status(404).json({ success: false, message: `Incident ${id} not found` });
        return;
      }
      res.json({ success: true, incident: updated });
    } catch (err) {
      next(err);
    }
  }

  async getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await incidentService.getDashboardStats();
      res.json({ success: true, stats });
    } catch (err) {
      next(err);
    }
  }
}

export const incidentController = new IncidentController();
