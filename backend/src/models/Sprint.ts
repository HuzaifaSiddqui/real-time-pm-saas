import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISprint extends Document {
  _id: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  workspace: mongoose.Types.ObjectId;
  name: string;
  goal?: string;
  status: 'planning' | 'active' | 'completed';
  startDate: Date;
  endDate: Date;
  velocity?: number;
  createdAt: Date;
  updatedAt: Date;
}

const SprintSchema = new Schema<ISprint>(
  {
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    name: { type: String, required: true, trim: true },
    goal: { type: String },
    status: { type: String, enum: ['planning', 'active', 'completed'], default: 'planning' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    velocity: { type: Number },
  },
  { timestamps: true }
);

export const Sprint: Model<ISprint> = mongoose.model<ISprint>('Sprint', SprintSchema);
