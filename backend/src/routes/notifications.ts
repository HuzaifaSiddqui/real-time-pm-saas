import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Notification } from '../models/Notification';

const router = Router();

// GET /api/notifications
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const notifications = await Notification.find({ user: req.user!.id })
      .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);
    const unreadCount = await Notification.countDocuments({ user: req.user!.id, read: false });
    res.json({ notifications, unreadCount, page });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user!.id }, { read: true });
    res.json({ message: 'Marked as read' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/notifications/read-all
router.put('/read-all', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Notification.updateMany({ user: req.user!.id, read: false }, { read: true });
    res.json({ message: 'All marked as read' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/notifications/:id
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, user: req.user!.id });
    res.json({ message: 'Notification deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
