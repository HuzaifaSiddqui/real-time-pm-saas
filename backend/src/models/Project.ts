import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProject extends Document {
  _id: mongoose.Types.ObjectId;
  workspace: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  startDate?: Date;
  dueDate?: Date;
  manager: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  progress: number;
  health: 'on_track' | 'at_risk' | 'delayed';
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    status: {
      type: String,
      enum: ['planning', 'active', 'on_hold', 'completed', 'cancelled'],
      default: 'planning',
    },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    startDate: { type: Date },
    dueDate: { type: Date },
    manager: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    progress: { type: Number, min: 0, max: 100, default: 0 },
    health: { type: String, enum: ['on_track', 'at_risk', 'delayed'], default: 'on_track' },
    color: { type: String, default: '#3B82F6' },
  },
  { timestamps: true }
);

export const Project: Model<IProject> = mongoose.model<IProject>('Project', ProjectSchema);
