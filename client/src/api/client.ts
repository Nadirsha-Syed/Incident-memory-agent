import {
  IIncident,
  IInvestigation,
  IMemoryEntry,
  IDashboardStats,
  ISystemHealth,
} from '../types';

const API_BASE = '/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  const data = await response.json();
  if (!response.ok || data.success === false) {
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Health
  getHealth: () => request<ISystemHealth>('/health'),

  // Incidents
  getDashboardStats: () => request<{ success: boolean; stats: IDashboardStats }>('/incidents/stats'),
  
  getIncidents: (params?: {
    status?: string;
    severity?: string;
    service?: string;
    search?: string;
    limit?: number;
    skip?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.severity) query.set('severity', params.severity);
    if (params?.service) query.set('service', params.service);
    if (params?.search) query.set('search', params.search);
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.skip) query.set('skip', params.skip.toString());
    const qs = query.toString();
    return request<{ success: boolean; total: number; incidents: IIncident[] }>(
      `/incidents${qs ? `?${qs}` : ''}`
    );
  },

  getIncidentById: (id: string) =>
    request<{ success: boolean; incident: IIncident; investigations: IInvestigation[] }>(`/incidents/${id}`),

  createIncident: (data: {
    title: string;
    service: string;
    severity: string;
    environment: string;
    errorMessage: string;
    logs?: string;
    tags?: string[];
    autoInvestigate?: boolean;
  }) =>
    request<{ success: boolean; incident: IIncident; investigation?: IInvestigation }>('/incidents', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  investigateIncident: (id: string, withMemory = true) =>
    request<{ success: boolean; investigation: IInvestigation }>(`/incidents/${id}/investigate`, {
      method: 'POST',
      body: JSON.stringify({ withMemory }),
    }),

  resolveIncident: (
    id: string,
    data: {
      confirmedRootCause: string;
      resolutionSteps: string;
      worked: boolean;
      notes?: string;
      lessonsLearned?: string;
      failedApproaches?: string[];
      resolvedBy?: string;
    }
  ) =>
    request<{
      success: boolean;
      message: string;
      incident: IIncident;
      retainedMemoryIds: string[];
    }>(`/incidents/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Memory
  searchMemory: (query: string, service?: string) => {
    const q = new URLSearchParams({ query });
    if (service) q.set('service', service);
    return request<{ success: boolean; count: number; memories: any[] }>(`/memory/search?${q.toString()}`);
  },

  getMemoryActivity: (limit = 50) =>
    request<{
      success: boolean;
      stats: {
        totalMemories: number;
        confirmedResolutions: number;
        symptoms: number;
        failedApproaches: number;
        syncedCount: number;
      };
      activity: IMemoryEntry[];
    }>(`/memory/activity?limit=${limit}`),

  getMemoryHealth: () =>
    request<{
      success: boolean;
      health: {
        configured: boolean;
        connected: boolean;
        apiUrl: string;
        bankId: string;
        version?: any;
        error?: string;
      };
    }>('/memory/health'),

  reflectMemory: (query: string) =>
    request<{ success: boolean; query: string; reflection: string }>('/memory/reflect', {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),

  // Demo
  seedDemoData: (forceReset = false) =>
    request<{ success: boolean; message: string; data: any }>('/demo/seed', {
      method: 'POST',
      body: JSON.stringify({ forceReset }),
    }),

  resetDemoData: () =>
    request<{ success: boolean; message: string; data: any }>('/demo/reset', {
      method: 'POST',
    }),

  runMemoryComparison: () =>
    request<{
      success: boolean;
      incident: IIncident;
      scenario: { name: string; description: string };
      investigationA_withoutMemory: {
        title: string;
        badge: string;
        report: any;
        recalledMemories: any[];
        modelUsed: string;
      };
      investigationB_withMemory: {
        title: string;
        badge: string;
        report: any;
        recalledMemories: any[];
        modelUsed: string;
      };
      comparisonSummary: {
        memoryRecalled: boolean;
        recalledCount: number;
        primaryPastIncidentRecalled: string;
        keyDifference: string;
      };
    }>('/demo/compare', {
      method: 'POST',
    }),
};
