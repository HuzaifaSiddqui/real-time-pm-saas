import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IInvitation extends Document {
  _id: mongoose.Types.ObjectId;
  workspace: mongoose.Types.ObjectId;
  email: string;
  role: string;
  token: string;
  status: 'pending' | 'accepted' | 'rejected';
  expiresAt: Date;
  createdAt: Date;
}

const InvitationSchema = new Schema<IInvitation>(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    email: { type: String, required: true, lowercase: true },
    role: {
      type: String,
      enum: ['admin', 'project_manager', 'member', 'viewer'],
      default: 'member',
    },
    token: { type: String, required: true, unique: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export const Invitation: Model<IInvitation> = mongoose.model<IInvitation>('Invitation', InvitationSchema);
