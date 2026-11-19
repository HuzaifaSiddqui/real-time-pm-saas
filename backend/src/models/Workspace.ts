import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWorkspace extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  slug: string;
  owner: mongoose.Types.ObjectId;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WorkspaceSchema = new Schema<IWorkspace>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    avatar: { type: String },
  },
  { timestamps: true }
);

export const Workspace: Model<IWorkspace> = mongoose.model<IWorkspace>('Workspace', WorkspaceSchema);
