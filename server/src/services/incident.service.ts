import { Incident, IIncident, IncidentSeverity, IncidentStatus, IncidentEnvironment } from '../models/Incident.js';
import { logger } from '../utils/logger.js';

export interface CreateIncidentDTO {
  title: string;
  service: string;
  severity: IncidentSeverity;
  environment: IncidentEnvironment;
  errorMessage: string;
  logs?: string;
  tags?: string[];
}

export interface IncidentFilters {
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  service?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  skip?: number;
}

export class IncidentService {
  /**
   * Generates a sequential or high-entropy human-readable Incident ID
   */
  private async generateIncidentId(): Promise<string> {
    const count = await Incident.countDocuments();
    const year = new Date().getFullYear();
    const sequential = (count + 1).toString().padStart(4, '0');
    return `INC-${year}-${sequential}`;
  }

  /**
   * Create a new incident
   */
  async createIncident(data: CreateIncidentDTO): Promise<IIncident> {
    const incidentId = await this.generateIncidentId();
    logger.info(`Creating incident ${incidentId} for service ${data.service}`);

    const incident = await Incident.create({
      incidentId,
      title: data.title,
      service: data.service,
      severity: data.severity,
      environment: data.environment,
      errorMessage: data.errorMessage,
      logs: data.logs || '',
      tags: data.tags || [],
      status: 'New',
    });

    return incident;
  }

  /**
   * Get incidents with filtering and pagination
   */
  async getIncidents(filters: IncidentFilters = {}): Promise<{ incidents: IIncident[]; total: number }> {
    const query: any = {};

    if (filters.status) query.status = filters.status;
    if (filters.severity) query.severity = filters.severity;
    if (filters.service) query.service = new RegExp(filters.service, 'i');

    if (filters.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      query.$or = [
        { title: searchRegex },
        { service: searchRegex },
        { incidentId: searchRegex },
        { errorMessage: searchRegex },
      ];
    }

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
    }

    const limit = filters.limit ? Number(filters.limit) : 50;
    const skip = filters.skip ? Number(filters.skip) : 0;

    const [incidents, total] = await Promise.all([
      Incident.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Incident.countDocuments(query),
    ]);

    return { incidents, total };
  }

  /**
   * Get incident by unique incident ID
   */
  async getIncidentById(incidentId: string): Promise<IIncident | null> {
    return await Incident.findOne({ incidentId });
  }

  /**
   * Update incident fields
   */
  async updateIncident(incidentId: string, updates: Partial<IIncident>): Promise<IIncident | null> {
    return await Incident.findOneAndUpdate(
      { incidentId },
      { $set: updates },
      { new: true, runValidators: true }
    );
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<{
    totalIncidents: number;
    activeIncidents: number;
    resolvedIncidents: number;
    criticalIncidents: number;
    severityDistribution: Array<{ name: string; count: number; color: string }>;
    statusDistribution: Array<{ name: string; count: number }>;
    serviceDistribution: Array<{ name: string; count: number }>;
    trendData: Array<{ date: string; incidents: number; resolved: number }>;
  }> {
    const allIncidents = await Incident.find().sort({ createdAt: 1 });

    const total = allIncidents.length;
    const active = allIncidents.filter(i => i.status === 'New' || i.status === 'Investigating').length;
    const resolved = allIncidents.filter(i => i.status === 'Resolved' || i.status === 'Closed').length;
    const critical = allIncidents.filter(i => i.severity === 'Critical').length;

    // Severity counts
    const severityMap: Record<string, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    const statusMap: Record<string, number> = { New: 0, Investigating: 0, Resolved: 0, Closed: 0 };
    const serviceMap: Record<string, number> = {};

    allIncidents.forEach(inc => {
      severityMap[inc.severity] = (severityMap[inc.severity] || 0) + 1;
      statusMap[inc.status] = (statusMap[inc.status] || 0) + 1;
      serviceMap[inc.service] = (serviceMap[inc.service] || 0) + 1;
    });

    const severityColors: Record<string, string> = {
      Critical: '#EF4444',
      High: '#F97316',
      Medium: '#F59E0B',
      Low: '#10B981',
    };

    const severityDistribution = Object.keys(severityMap).map(key => ({
      name: key,
      count: severityMap[key],
      color: severityColors[key] || '#6366F1',
    }));

    const statusDistribution = Object.keys(statusMap).map(key => ({
      name: key,
      count: statusMap[key],
    }));

    const serviceDistribution = Object.keys(serviceMap)
      .map(key => ({ name: key, count: serviceMap[key] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // Group by day for trends (last 7 days or recent distribution)
    const trendMap: Record<string, { incidents: number; resolved: number }> = {};
    allIncidents.forEach(inc => {
      const d = new Date(inc.createdAt).toISOString().split('T')[0];
      if (!trendMap[d]) trendMap[d] = { incidents: 0, resolved: 0 };
      trendMap[d].incidents++;
      if (inc.status === 'Resolved' || inc.status === 'Closed') {
        trendMap[d].resolved++;
      }
    });

    const trendData = Object.keys(trendMap)
      .sort()
      .slice(-7)
      .map(date => ({
        date: date.slice(5), // MM-DD
        incidents: trendMap[date].incidents,
        resolved: trendMap[date].resolved,
      }));

    return {
      totalIncidents: total,
      activeIncidents: active,
      resolvedIncidents: resolved,
      criticalIncidents: critical,
      severityDistribution,
      statusDistribution,
      serviceDistribution,
      trendData,
    };
  }
}

export const incidentService = new IncidentService();
