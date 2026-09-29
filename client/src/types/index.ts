export type IncidentSeverity = 'Critical' | 'High' | 'Medium' | 'Low';
export type IncidentEnvironment = 'Production' | 'Staging' | 'Development';
export type IncidentStatus = 'New' | 'Investigating' | 'Resolved' | 'Closed';

export interface IResolution {
  confirmedRootCause: string;
  resolutionSteps: string;
  worked: boolean;
  notes?: string;
  lessonsLearned?: string;
  failedApproaches?: string[];
  resolvedAt: string;
  resolvedBy?: string;
}

export interface IIncident {
  _id?: string;
  incidentId: string;
  title: string;
  service: string;
  severity: IncidentSeverity;
  environment: IncidentEnvironment;
  errorMessage: string;
  logs?: string;
  tags: string[];
  status: IncidentStatus;
  resolution?: IResolution;
  createdAt: string;
  updatedAt: string;
}

export interface IRecalledMemory {
  id?: string;
  content: string;
  sourceIncidentId?: string;
  relevanceReason?: string;
  memoryType?: string;
  timestamp?: string;
  score?: number;
}

export interface IInvestigationReport {
  summary: string;
  possibleCauses: string[];
  confidenceExplanation: string;
  recommendedDiagnosticSteps: string[];
  relevantPastIncidents: Array<{
    incidentId?: string;
    summary: string;
    resolutionApplied?: string;
    relevanceReason: string;
  }>;
  suggestedResolution: string;
  safetyConsiderations: string[];
  humanConfirmationRequired: boolean;
}

export interface IInvestigation {
  _id?: string;
  investigationId: string;
  incidentId: string;
  report: IInvestigationReport;
  recalledMemories: IRecalledMemory[];
  withMemory: boolean;
  modelUsed: string;
  createdAt: string;
}

export interface IMemoryEntry {
  _id?: string;
  memoryId: string;
  incidentId: string;
  bankId: string;
  memoryType: 'incident_symptom' | 'confirmed_resolution' | 'failed_approach' | 'lesson_learned' | 'reflection';
  content: string;
  metadata: {
    service: string;
    severity?: string;
    environment?: string;
    tags?: string[];
    confirmedBy?: string;
    worked?: boolean;
    rawHindsightId?: string;
  };
  syncedWithHindsight: boolean;
  hindsightError?: string;
  createdAt: string;
}

export interface IDashboardStats {
  totalIncidents: number;
  activeIncidents: number;
  resolvedIncidents: number;
  criticalIncidents: number;
  severityDistribution: Array<{ name: string; count: number; color: string }>;
  statusDistribution: Array<{ name: string; count: number }>;
  serviceDistribution: Array<{ name: string; count: number }>;
  trendData: Array<{ date: string; incidents: number; resolved: number }>;
}

export interface ISystemHealth {
  status: string;
  service: string;
  timestamp: string;
  uptime: number;
  integrations: {
    hindsight: {
      apiUrl: string;
      bankId: string;
      configured: boolean;
    };
    groq: {
      model: string;
      configured: boolean;
    };
  };
}
