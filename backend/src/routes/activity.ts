import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { ActivityLog } from '../models/ActivityLog';

const router = Router();

// GET /api/workspaces/:id/activity
router.get('/workspaces/:id/activity', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 30;
    const logs = await ActivityLog.find({ workspace: req.params.id })
      .populate('actor', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    res.json({ logs, page });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/projects/:id/activity
router.get('/projects/:id/activity', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const logs = await ActivityLog.find({ project: req.params.id })
      .populate('actor', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    res.json({ logs, page });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
