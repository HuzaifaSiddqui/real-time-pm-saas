import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMilestone extends Document {
  _id: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  dueDate: Date;
  status: 'pending' | 'completed';
  completedAt?: Date;
  createdAt: Date;
}

const MilestoneSchema = new Schema<IMilestone>(
  {
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export const Milestone: Model<IMilestone> = mongoose.model<IMilestone>('Milestone', MilestoneSchema);
