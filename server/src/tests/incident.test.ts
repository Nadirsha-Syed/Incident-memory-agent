import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { incidentService } from '../services/incident.service.js';
import { learningService } from '../services/learning.service.js';
import { Incident } from '../models/Incident.js';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Incident Management & Lifecycle', () => {
  it('should create an incident with a formatted incident ID and default status New', async () => {
    const incident = await incidentService.createIncident({
      title: 'Payment Gateway Connection Timeout',
      service: 'Payment-API',
      severity: 'Critical',
      environment: 'Production',
      errorMessage: 'Connection pool exhausted waiting for socket',
      tags: ['database', 'payments'],
    });

    expect(incident).toBeDefined();
    expect(incident.incidentId).toMatch(/^INC-\d{4}-\d{4}$/);
    expect(incident.status).toBe('New');
    expect(incident.service).toBe('Payment-API');
    expect(incident.resolution).toBeUndefined();
  });

  it('should retrieve incidents with filtering by severity and service', async () => {
    await incidentService.createIncident({
      title: 'Redis Cache Eviction Storm',
      service: 'Session-Gateway',
      severity: 'High',
      environment: 'Production',
      errorMessage: 'OOM command not allowed when used memory > maxmemory',
    });

    const result = await incidentService.getIncidents({ service: 'Session-Gateway' });
    expect(result.total).toBeGreaterThanOrEqual(1);
    expect(result.incidents[0].service).toBe('Session-Gateway');
  });

  it('should record a confirmed resolution and prevent unconfirmed proposals from being treated as verified knowledge', async () => {
    const incident = await incidentService.createIncident({
      title: 'Auth Token Expiration Spikes',
      service: 'Auth-Service',
      severity: 'Medium',
      environment: 'Production',
      errorMessage: 'Token expired signature check failed',
    });

    // Before resolution, incident is unconfirmed
    expect(incident.status).toBe('New');
    expect(incident.resolution).toBeUndefined();

    // Confirm resolution
    const resolvedResult = await learningService.recordResolutionAndLearn({
      incidentId: incident.incidentId,
      confirmedRootCause: 'Clock drift of 3 seconds on auth worker nodes exceeded token leeway',
      resolutionSteps: 'Synchronized chrony NTP daemon and increased JWT clock tolerance to 10s',
      worked: true,
      notes: 'Fixed across all 4 worker nodes',
      resolvedBy: 'Senior SRE',
    });

    expect(resolvedResult.incident.status).toBe('Resolved');
    expect(resolvedResult.incident.resolution).toBeDefined();
    expect(resolvedResult.incident.resolution?.worked).toBe(true);
    expect(resolvedResult.incident.resolution?.confirmedRootCause).toContain('Clock drift');
    expect(resolvedResult.retainedMemoryIds.length).toBeGreaterThan(0);
  });
});
