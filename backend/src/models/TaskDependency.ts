import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITaskDependency extends Document {
  _id: mongoose.Types.ObjectId;
  task: mongoose.Types.ObjectId;
  dependsOn: mongoose.Types.ObjectId;
  type: 'blocks' | 'is_blocked_by';
  createdAt: Date;
}

const TaskDependencySchema = new Schema<ITaskDependency>(
  {
    task: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
    dependsOn: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
    type: { type: String, enum: ['blocks', 'is_blocked_by'], required: true },
  },
  { timestamps: true }
);

export const TaskDependency: Model<ITaskDependency> = mongoose.model<ITaskDependency>(
  'TaskDependency',
  TaskDependencySchema
);
