import mongoose, { Document, Schema } from 'mongoose';

export interface IRecalledMemory {
  id?: string;
  content: string;
  sourceIncidentId?: string;
  relevanceReason?: string;
  memoryType?: string;
  timestamp?: Date | string;
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

export interface IInvestigation extends Document {
  investigationId: string;
  incidentId: string;
  report: IInvestigationReport;
  recalledMemories: IRecalledMemory[];
  withMemory: boolean;
  modelUsed: string;
  createdAt: Date;
}

const RecalledMemorySchema = new Schema<IRecalledMemory>(
  {
    id: { type: String },
    content: { type: String, required: true },
    sourceIncidentId: { type: String },
    relevanceReason: { type: String },
    memoryType: { type: String, default: 'confirmed_resolution' },
    timestamp: { type: Schema.Types.Mixed },
    score: { type: Number },
  },
  { _id: false }
);

const InvestigationReportSchema = new Schema<IInvestigationReport>(
  {
    summary: { type: String, required: true },
    possibleCauses: [{ type: String }],
    confidenceExplanation: { type: String, required: true },
    recommendedDiagnosticSteps: [{ type: String }],
    relevantPastIncidents: [
      {
        incidentId: { type: String },
        summary: { type: String },
        resolutionApplied: { type: String },
        relevanceReason: { type: String },
      },
    ],
    suggestedResolution: { type: String, required: true },
    safetyConsiderations: [{ type: String }],
    humanConfirmationRequired: { type: Boolean, default: true },
  },
  { _id: false }
);

const InvestigationSchema = new Schema<IInvestigation>(
  {
    investigationId: { type: String, required: true, unique: true, index: true },
    incidentId: { type: String, required: true, index: true },
    report: { type: InvestigationReportSchema, required: true },
    recalledMemories: [RecalledMemorySchema],
    withMemory: { type: Boolean, default: true },
    modelUsed: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export const Investigation = mongoose.model<IInvestigation>('Investigation', InvestigationSchema);
