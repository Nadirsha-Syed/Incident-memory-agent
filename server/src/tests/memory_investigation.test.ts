import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { incidentService } from '../services/incident.service.js';
import { investigationService } from '../services/investigation.service.js';
import { hindsightService } from '../services/hindsight.service.js';
import { llmService } from '../services/llm.service.js';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Hindsight Persistent Memory & AI Investigation Workflow', () => {
  it('should retain memory knowledge and retrieve it on semantic recall', async () => {
    const incident = await incidentService.createIncident({
      title: 'Database connection pool exhausted',
      service: 'Billing-Service',
      severity: 'Critical',
      environment: 'Production',
      errorMessage: 'HikariPool-1 - Connection pool exhausted, timeout waiting for idle connection',
    });

    // Retain knowledge
    const retained = await hindsightService.retainKnowledge({
      incident,
      memoryType: 'confirmed_resolution',
      content: 'Resolved by increasing Hikari maxPoolSize from 10 to 50 and reducing connectionTimeout.',
      metadata: { service: 'Billing-Service', confirmedRootCause: 'Under-provisioned connection pool' },
    });

    expect(retained.memoryId).toBeDefined();

    // Recall memory with related query
    const recalled = await hindsightService.recallMemories('connection pool exhausted Billing-Service', {
      service: 'Billing-Service',
    });

    expect(recalled.length).toBeGreaterThan(0);
    expect(recalled[0].content).toContain('maxPoolSize');
    expect(recalled[0].sourceIncidentId).toBe(incident.incidentId);
  });

  it('should handle empty memory results gracefully without hallucinating past incidents', async () => {
    const incident = await incidentService.createIncident({
      title: 'Obscure quantum cosmic ray bit flip',
      service: 'Experimental-Service',
      severity: 'Low',
      environment: 'Development',
      errorMessage: 'E_UNEXPECTED_COSMIC_ANOMALY',
    });

    // Investigate without any pre-existing memories
    const investigation = await investigationService.investigateIncident(incident.incidentId, true);

    expect(investigation).toBeDefined();
    expect(investigation.report).toBeDefined();
    expect(investigation.report.summary).toBeDefined();
    expect(investigation.report.possibleCauses.length).toBeGreaterThan(0);
    expect(investigation.report.humanConfirmationRequired).toBe(true);
  });

  it('should generate investigation report and properly incorporate recalled memories', async () => {
    // Query investigation with memory for Billing-Service
    const incident = await incidentService.createIncident({
      title: 'Billing service timeouts under load',
      service: 'Billing-Service',
      severity: 'High',
      environment: 'Production',
      errorMessage: 'Timeout waiting for idle connection from pool',
    });

    const investigation = await investigationService.investigateIncident(incident.incidentId, true);

    expect(investigation.report).toBeDefined();
    expect(investigation.recalledMemories.length).toBeGreaterThan(0);
    expect(investigation.recalledMemories[0].content).toContain('maxPoolSize');
  });

  it('should execute memory comparison demo showing with vs without memory differences', async () => {
    const incident = await incidentService.createIncident({
      title: 'Payment Gateway Connection Drop',
      service: 'Payment-API',
      severity: 'Critical',
      environment: 'Production',
      errorMessage: 'HikariPool-1 - Connection is not available',
    });

    const comparison = await investigationService.compareMemoryEffect(incident.incidentId);

    expect(comparison.withoutMemory).toBeDefined();
    expect(comparison.withMemory).toBeDefined();
    expect(comparison.withoutMemory.withMemory).toBe(false);
    expect(comparison.withMemory.withMemory).toBe(true);
  });

  it('should handle malformed LLM responses safely without crashing', async () => {
    const params = {
      service: 'Test-Service',
      severity: 'Medium',
      environment: 'Staging',
      errorMessage: 'Test error message',
      withMemory: false,
    };

    // Call internal parser or test service with invalid JSON string
    const result = (llmService as any).parseAndValidateReport('Malformed raw string without json', params);
    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.recommendedDiagnosticSteps.length).toBeGreaterThan(0);
    expect(result.humanConfirmationRequired).toBe(true);
  });
});
