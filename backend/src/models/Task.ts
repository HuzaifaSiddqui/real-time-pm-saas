import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITask extends Document {
  _id: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  workspace: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  status: 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'blocked' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee?: mongoose.Types.ObjectId;
  reporter: mongoose.Types.ObjectId;
  startDate?: Date;
  dueDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  labels: string[];
  sprint?: mongoose.Types.ObjectId;
  storyPoints?: number;
  order: number;
  parentTask?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    status: {
      type: String,
      enum: ['backlog', 'todo', 'in_progress', 'in_review', 'blocked', 'done'],
      default: 'backlog',
    },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    assignee: { type: Schema.Types.ObjectId, ref: 'User' },
    reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    startDate: { type: Date },
    dueDate: { type: Date },
    estimatedHours: { type: Number },
    actualHours: { type: Number, default: 0 },
    labels: [{ type: String }],
    sprint: { type: Schema.Types.ObjectId, ref: 'Sprint' },
    storyPoints: { type: Number },
    order: { type: Number, default: 0 },
    parentTask: { type: Schema.Types.ObjectId, ref: 'Task' },
  },
  { timestamps: true }
);

TaskSchema.index({ project: 1, status: 1 });
TaskSchema.index({ workspace: 1 });
TaskSchema.index({ assignee: 1 });

export const Task: Model<ITask> = mongoose.model<ITask>('Task', TaskSchema);
