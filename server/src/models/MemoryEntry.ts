import mongoose, { Document, Schema } from 'mongoose';

export type MemoryType = 'incident_symptom' | 'confirmed_resolution' | 'failed_approach' | 'lesson_learned' | 'reflection';

export interface IMemoryEntry extends Document {
  memoryId: string;
  incidentId: string;
  bankId: string;
  memoryType: MemoryType;
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
  createdAt: Date;
}

const MemoryEntrySchema = new Schema<IMemoryEntry>(
  {
    memoryId: { type: String, required: true, unique: true, index: true },
    incidentId: { type: String, required: true, index: true },
    bankId: { type: String, required: true, index: true },
    memoryType: {
      type: String,
      enum: ['incident_symptom', 'confirmed_resolution', 'failed_approach', 'lesson_learned', 'reflection'],
      required: true,
      index: true,
    },
    content: { type: String, required: true },
    metadata: {
      service: { type: String, required: true },
      severity: { type: String },
      environment: { type: String },
      tags: [{ type: String }],
      confirmedBy: { type: String },
      worked: { type: Boolean },
      rawHindsightId: { type: String },
    },
    syncedWithHindsight: { type: Boolean, default: false },
    hindsightError: { type: String },
  },
  {
    timestamps: true,
  }
);

export const MemoryEntry = mongoose.model<IMemoryEntry>('MemoryEntry', MemoryEntrySchema);
