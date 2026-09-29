import mongoose, { Document, Schema } from 'mongoose';

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
  resolvedAt: Date;
  resolvedBy?: string;
}

export interface IIncident extends Document {
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
  createdAt: Date;
  updatedAt: Date;
}

const ResolutionSchema = new Schema<IResolution>(
  {
    confirmedRootCause: { type: String, required: true },
    resolutionSteps: { type: String, required: true },
    worked: { type: Boolean, required: true, default: true },
    notes: { type: String },
    lessonsLearned: { type: String },
    failedApproaches: [{ type: String }],
    resolvedAt: { type: Date, default: Date.now },
    resolvedBy: { type: String, default: 'Engineer' },
  },
  { _id: false }
);

const IncidentSchema = new Schema<IIncident>(
  {
    incidentId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    service: { type: String, required: true, trim: true, index: true },
    severity: {
      type: String,
      enum: ['Critical', 'High', 'Medium', 'Low'],
      required: true,
      default: 'Medium',
      index: true,
    },
    environment: {
      type: String,
      enum: ['Production', 'Staging', 'Development'],
      required: true,
      default: 'Production',
    },
    errorMessage: { type: String, required: true, trim: true },
    logs: { type: String, default: '' },
    tags: [{ type: String, trim: true }],
    status: {
      type: String,
      enum: ['New', 'Investigating', 'Resolved', 'Closed'],
      required: true,
      default: 'New',
      index: true,
    },
    resolution: { type: ResolutionSchema },
  },
  {
    timestamps: true,
  }
);

export const Incident = mongoose.model<IIncident>('Incident', IncidentSchema);
