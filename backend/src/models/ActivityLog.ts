import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IActivityLog extends Document {
  _id: mongoose.Types.ObjectId;
  workspace: mongoose.Types.ObjectId;
  project?: mongoose.Types.ObjectId;
  task?: mongoose.Types.ObjectId;
  actor: mongoose.Types.ObjectId;
  action: string;
  resourceType: string;
  resourceId: mongoose.Types.ObjectId;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project' },
    task: { type: Schema.Types.ObjectId, ref: 'Task' },
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    resourceType: { type: String, required: true },
    resourceId: { type: Schema.Types.ObjectId, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

ActivityLogSchema.index({ workspace: 1, createdAt: -1 });

export const ActivityLog: Model<IActivityLog> = mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
