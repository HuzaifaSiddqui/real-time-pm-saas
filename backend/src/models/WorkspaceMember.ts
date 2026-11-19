import mongoose, { Schema, Document, Model } from 'mongoose';

export type WorkspaceRole = 'owner' | 'admin' | 'project_manager' | 'member' | 'viewer';

export interface IWorkspaceMember extends Document {
  _id: mongoose.Types.ObjectId;
  workspace: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  role: WorkspaceRole;
  joinedAt: Date;
}

const WorkspaceMemberSchema = new Schema<IWorkspaceMember>({
  workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: {
    type: String,
    enum: ['owner', 'admin', 'project_manager', 'member', 'viewer'],
    default: 'member',
  },
  joinedAt: { type: Date, default: Date.now },
});

WorkspaceMemberSchema.index({ workspace: 1, user: 1 }, { unique: true });

export const WorkspaceMember: Model<IWorkspaceMember> = mongoose.model<IWorkspaceMember>(
  'WorkspaceMember',
  WorkspaceMemberSchema
);
