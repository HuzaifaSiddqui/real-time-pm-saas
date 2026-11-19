import { Router, Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { Workspace } from '../models/Workspace';
import { WorkspaceMember } from '../models/WorkspaceMember';
import { Invitation } from '../models/Invitation';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/workspaces
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const memberships = await WorkspaceMember.find({ user: req.user!.id }).populate('workspace');
    const workspaces = memberships.map((m) => ({ ...((m.workspace as any).toJSON()), role: m.role }));
    res.json({ workspaces });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/workspaces
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const schema = z.object({
      name: z.string().min(2).max(50),
      description: z.string().optional(),
      slug: z.string().min(2).max(30).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation error', errors: parsed.error.errors });
      return;
    }
    const { name, description } = parsed.data;
    const slug = parsed.data.slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
    const existing = await Workspace.findOne({ slug });
    if (existing) {
      res.status(409).json({ message: 'Workspace slug already taken' });
      return;
    }
    const workspace = await Workspace.create({ name, description, slug, owner: req.user!.id });
    await WorkspaceMember.create({ workspace: workspace._id, user: req.user!.id, role: 'owner' });
    res.status(201).json({ workspace });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/workspaces/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const member = await WorkspaceMember.findOne({ workspace: req.params.id, user: req.user!.id });
    if (!member) { res.status(403).json({ message: 'Not a member' }); return; }
    const workspace = await Workspace.findById(req.params.id).populate('owner', 'name email avatar');
    if (!workspace) { res.status(404).json({ message: 'Workspace not found' }); return; }
    res.json({ workspace });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/workspaces/:id
router.put('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const member = await WorkspaceMember.findOne({ workspace: req.params.id, user: req.user!.id });
    if (!member || !['owner', 'admin'].includes(member.role)) {
      res.status(403).json({ message: 'Insufficient permissions' }); return;
    }
    const workspace = await Workspace.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ workspace });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/workspaces/:id
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const member = await WorkspaceMember.findOne({ workspace: req.params.id, user: req.user!.id });
    if (!member || member.role !== 'owner') {
      res.status(403).json({ message: 'Only owner can delete' }); return;
    }
    await Workspace.findByIdAndDelete(req.params.id);
    await WorkspaceMember.deleteMany({ workspace: req.params.id });
    res.json({ message: 'Workspace deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/workspaces/:id/members
router.get('/:id/members', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const member = await WorkspaceMember.findOne({ workspace: req.params.id, user: req.user!.id });
    if (!member) { res.status(403).json({ message: 'Not a member' }); return; }
    const members = await WorkspaceMember.find({ workspace: req.params.id }).populate('user', 'name email avatar bio');
    res.json({ members });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/workspaces/:id/members/:userId
router.put('/:id/members/:userId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const member = await WorkspaceMember.findOne({ workspace: req.params.id, user: req.user!.id });
    if (!member || !['owner', 'admin'].includes(member.role)) {
      res.status(403).json({ message: 'Insufficient permissions' }); return;
    }
    const updated = await WorkspaceMember.findOneAndUpdate(
      { workspace: req.params.id, user: req.params.userId },
      { role: req.body.role },
      { new: true }
    ).populate('user', 'name email avatar');
    res.json({ member: updated });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/workspaces/:id/members/:userId
router.delete('/:id/members/:userId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const member = await WorkspaceMember.findOne({ workspace: req.params.id, user: req.user!.id });
    if (!member || !['owner', 'admin'].includes(member.role)) {
      res.status(403).json({ message: 'Insufficient permissions' }); return;
    }
    await WorkspaceMember.findOneAndDelete({ workspace: req.params.id, user: req.params.userId });
    res.json({ message: 'Member removed' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/workspaces/:id/invite
router.post('/:id/invite', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const member = await WorkspaceMember.findOne({ workspace: req.params.id, user: req.user!.id });
    if (!member || !['owner', 'admin', 'project_manager'].includes(member.role)) {
      res.status(403).json({ message: 'Insufficient permissions' }); return;
    }
    const { email, role = 'member' } = req.body;
    const token = crypto.randomBytes(32).toString('hex');
    const invitation = await Invitation.create({
      workspace: req.params.id,
      email,
      role,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 3600000),
    });
    res.status(201).json({ invitation, inviteUrl: `${process.env.FRONTEND_URL}/invite/${token}` });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
