import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITimeEntry extends Document {
  _id: mongoose.Types.ObjectId;
  task: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  description?: string;
  isRunning: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TimeEntrySchema = new Schema<ITimeEntry>(
  {
    task: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    duration: { type: Number },
    description: { type: String },
    isRunning: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const TimeEntry: Model<ITimeEntry> = mongoose.model<ITimeEntry>('TimeEntry', TimeEntrySchema);
