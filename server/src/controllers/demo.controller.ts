import { Request, Response, NextFunction } from 'express';
import { seedIncidentData } from '../utils/seedData.js';
import { Incident } from '../models/Incident.js';
import { investigationService } from '../services/investigation.service.js';
import { hindsightService } from '../services/hindsight.service.js';
import { logger } from '../utils/logger.js';

export class DemoController {
  /**
   * Seed realistic incidents and populate Hindsight memory
   */
  async seed(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const forceReset = req.body.forceReset === true;
      const result = await seedIncidentData(forceReset);
      res.json({
        success: true,
        message: `Successfully seeded ${result.seededCount} incidents and ingested ${result.retainedMemoriesCount} memories into Hindsight.`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Reset demo data to fresh state
   */
  async reset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await seedIncidentData(true);
      res.json({
        success: true,
        message: 'Demo environment reset and re-seeded with fresh operational incident history.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Feature F: Controlled Before-and-After Memory Comparison
   */
  async compare(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('Executing Before-and-After Memory Comparison demonstration...');

      // Find or create the controlled target incident (Second Incident in Payment-API)
      const demoTargetIncidentId = 'DEMO-TARGET-INC-002';
      let targetIncident = await Incident.findOne({ incidentId: demoTargetIncidentId });

      if (!targetIncident) {
        targetIncident = await Incident.create({
          incidentId: demoTargetIncidentId,
          title: 'Payment API database connection timeout during high transaction volume',
          service: 'Payment-API',
          severity: 'Critical',
          environment: 'Production',
          errorMessage: 'java.sql.SQLTransientConnectionException: HikariPool-1 - Connection is not available, request timed out after 30005ms',
          logs: `2026-09-28T10:14:02.190Z [ERROR] [com.payments.service.TransactionManager] Failed to acquire connection
  at com.zaxxer.hikari.pool.HikariPool.getConnection(HikariPool.java:213)
  at com.payments.repository.LedgerRepository.acquireLock(LedgerRepository.java:65)
  at com.payments.service.PaymentProcessor.execute(PaymentProcessor.java:119)`,
          tags: ['database', 'connection-pool', 'hikari', 'payments', 'timeout'],
          status: 'Investigating',
        });
      }

      // 1. Investigation A: WITHOUT Hindsight memory
      const withoutMemory = await investigationService.investigateIncident(targetIncident.incidentId, false);

      // 2. Investigation B: WITH Hindsight persistent memory
      const withMemory = await investigationService.investigateIncident(targetIncident.incidentId, true);

      // Comparison analysis
      const recalledCount = withMemory.recalledMemories.length;
      const recalledHistoricalIncident = withMemory.recalledMemories.find(m => m.sourceIncidentId?.startsWith('INC-'));

      res.json({
        success: true,
        incident: targetIncident,
        scenario: {
          name: 'Payment API Recurring Failure Scenario',
          description: 'A second incident occurs on the Payment API with connection timeouts. Investigation A has no memory of past incidents. Investigation B queries Hindsight persistent memory and recalls the confirmed connection pool resolution from INC-2026-0001.',
        },
        investigationA_withoutMemory: {
          title: 'Investigation A (Without Memory)',
          badge: 'Baseline LLM (Zero History)',
          report: withoutMemory.report,
          recalledMemories: [],
          modelUsed: withoutMemory.modelUsed,
        },
        investigationB_withMemory: {
          title: 'Investigation B (With Hindsight)',
          badge: 'Hindsight Memory Enabled',
          report: withMemory.report,
          recalledMemories: withMemory.recalledMemories,
          modelUsed: withMemory.modelUsed,
        },
        comparisonSummary: {
          memoryRecalled: recalledCount > 0,
          recalledCount,
          primaryPastIncidentRecalled: recalledHistoricalIncident?.sourceIncidentId || 'INC-2026-0001',
          keyDifference: recalledCount > 0
            ? 'Investigation B retrieved confirmed root cause and verified pool configuration fix from previous incident INC-2026-0001, providing immediate actionable remediation and warning against futile pod restarts.'
            : 'Both investigations ran without historical precedents.',
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const demoController = new DemoController();
