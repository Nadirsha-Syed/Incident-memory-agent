import { Request, Response, NextFunction } from 'express';
import { hindsightService } from '../services/hindsight.service.js';

export class MemoryController {
  async searchMemory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { query, service, limit } = req.query;
      if (!query || typeof query !== 'string') {
        res.status(400).json({ success: false, message: 'Query parameter is required' });
        return;
      }

      const memories = await hindsightService.recallMemories(query, {
        service: service as string,
        maxResults: limit ? parseInt(limit as string, 10) : 10,
      });

      res.json({
        success: true,
        count: memories.length,
        memories,
      });
    } catch (err) {
      next(err);
    }
  }

  async getMemoryActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const [activity, stats] = await Promise.all([
        hindsightService.listRecentActivity(limit),
        hindsightService.getMemoryStats(),
      ]);

      res.json({
        success: true,
        stats,
        activity,
      });
    } catch (err) {
      next(err);
    }
  }

  async getMemoryHealth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const health = await hindsightService.checkHealth();
      res.json({
        success: true,
        health,
      });
    } catch (err) {
      next(err);
    }
  }

  async reflect(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { query } = req.body;
      if (!query) {
        res.status(400).json({ success: false, message: 'Query string is required in request body' });
        return;
      }

      const answer = await hindsightService.reflectOverMemories(query);
      res.json({
        success: true,
        query,
        reflection: answer || 'Reflection complete based on available incident memories.',
      });
    } catch (err) {
      next(err);
    }
  }
}

export const memoryController = new MemoryController();
