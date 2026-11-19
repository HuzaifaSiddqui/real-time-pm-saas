import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { TimeEntry } from '../models/TimeEntry';
import { Task } from '../models/Task';

const router = Router();

// POST /api/tasks/:taskId/time/start
router.post('/tasks/:taskId/time/start', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Stop any running timer for this user
    await TimeEntry.updateMany({ user: req.user!.id, isRunning: true }, {
      $set: { isRunning: false, endTime: new Date(), duration: 0 }
    });
    const entry = await TimeEntry.create({
      task: req.params.taskId,
      user: req.user!.id,
      startTime: new Date(),
      isRunning: true,
      description: req.body.description || '',
    });
    res.status(201).json({ entry });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/tasks/:taskId/time/stop
router.post('/tasks/:taskId/time/stop', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const entry = await TimeEntry.findOne({ task: req.params.taskId, user: req.user!.id, isRunning: true });
    if (!entry) { res.status(404).json({ message: 'No active timer' }); return; }
    const endTime = new Date();
    const duration = Math.round((endTime.getTime() - entry.startTime.getTime()) / 60000);
    entry.endTime = endTime;
    entry.duration = duration;
    entry.isRunning = false;
    await entry.save();
    // Update task actualHours
    const totalMins = await TimeEntry.aggregate([
      { $match: { task: entry.task, isRunning: false } },
      { $group: { _id: null, total: { $sum: '$duration' } } },
    ]);
    const totalHours = (totalMins[0]?.total || 0) / 60;
    await Task.findByIdAndUpdate(req.params.taskId, { actualHours: totalHours });
    res.json({ entry });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/tasks/:taskId/time (manual)
router.post('/tasks/:taskId/time', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startTime, endTime, duration, description } = req.body;
    const entry = await TimeEntry.create({
      task: req.params.taskId, user: req.user!.id, startTime, endTime, duration, description, isRunning: false
    });
    res.status(201).json({ entry });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/tasks/:taskId/time
router.get('/tasks/:taskId/time', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const entries = await TimeEntry.find({ task: req.params.taskId })
      .populate('user', 'name email avatar').sort({ startTime: -1 });
    res.json({ entries });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/me/time
router.get('/users/me/time', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const entries = await TimeEntry.find({ user: req.user!.id })
      .populate('task', 'title project').sort({ startTime: -1 }).limit(50);
    res.json({ entries });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/time/:id
router.put('/time/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const entry = await TimeEntry.findOneAndUpdate(
      { _id: req.params.id, user: req.user!.id }, req.body, { new: true }
    );
    if (!entry) { res.status(404).json({ message: 'Entry not found' }); return; }
    res.json({ entry });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/time/:id
router.delete('/time/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await TimeEntry.findOneAndDelete({ _id: req.params.id, user: req.user!.id });
    res.json({ message: 'Entry deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
