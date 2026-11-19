import { Router, Request, Response } from 'express';
import { Invitation } from '../models/Invitation';
import { WorkspaceMember } from '../models/WorkspaceMember';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/invitations/:token
router.get('/:token', async (req: Request, res: Response): Promise<void> => {
  try {
    const invitation = await Invitation.findOne({ token: req.params.token }).populate('workspace', 'name avatar description');
    if (!invitation) { res.status(404).json({ message: 'Invitation not found' }); return; }
    if (invitation.status !== 'pending') { res.status(400).json({ message: 'Invitation already used' }); return; }
    if (invitation.expiresAt < new Date()) { res.status(400).json({ message: 'Invitation expired' }); return; }
    res.json({ invitation });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/invitations/:token/accept
router.post('/:token/accept', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const invitation = await Invitation.findOne({ token: req.params.token });
    if (!invitation || invitation.status !== 'pending') {
      res.status(400).json({ message: 'Invalid invitation' }); return;
    }
    if (invitation.expiresAt < new Date()) {
      res.status(400).json({ message: 'Invitation expired' }); return;
    }
    const existing = await WorkspaceMember.findOne({ workspace: invitation.workspace, user: req.user!.id });
    if (!existing) {
      await WorkspaceMember.create({
        workspace: invitation.workspace,
        user: req.user!.id,
        role: invitation.role,
      });
    }
    invitation.status = 'accepted';
    await invitation.save();
    res.json({ message: 'Invitation accepted', workspaceId: invitation.workspace });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/invitations/:token/reject
router.post('/:token/reject', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const invitation = await Invitation.findOne({ token: req.params.token });
    if (!invitation) { res.status(404).json({ message: 'Not found' }); return; }
    invitation.status = 'rejected';
    await invitation.save();
    res.json({ message: 'Invitation rejected' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
