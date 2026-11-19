import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Sprint } from '../models/Sprint';
import { Task } from '../models/Task';

const router = Router();

const sprintSchema = z.object({
  name: z.string().min(1).max(100),
  goal: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(['planning', 'active', 'completed']).optional(),
});

// GET /api/projects/:projectId/sprints
router.get('/projects/:projectId/sprints', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sprints = await Sprint.find({ project: req.params.projectId }).sort({ createdAt: -1 });
    const sprintsWithStats = await Promise.all(sprints.map(async (sprint) => {
      const tasks = await Task.find({ sprint: sprint._id });
      const total = tasks.length;
      const completed = tasks.filter(t => t.status === 'done').length;
      const blocked = tasks.filter(t => t.status === 'blocked').length;
      const inProgress = tasks.filter(t => t.status === 'in_progress').length;
      return { ...sprint.toObject(), stats: { total, completed, blocked, inProgress, remaining: total - completed } };
    }));
    res.json({ sprints: sprintsWithStats });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/projects/:projectId/sprints
router.post('/projects/:projectId/sprints', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = sprintSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ message: 'Validation error', errors: parsed.error.errors }); return; }
    const sprint = await Sprint.create({ ...parsed.data, project: req.params.projectId, workspace: req.body.workspace });
    res.status(201).json({ sprint });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/sprints/:id
router.get('/sprints/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) { res.status(404).json({ message: 'Sprint not found' }); return; }
    const tasks = await Task.find({ sprint: req.params.id }).populate('assignee', 'name email avatar');
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'done').length;
    const blocked = tasks.filter(t => t.status === 'blocked').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;

    // Build burndown data (last 14 days or sprint duration)
    const burndown: { date: string; ideal: number; actual: number }[] = [];
    if (sprint.startDate && sprint.endDate) {
      const start = new Date(sprint.startDate);
      const end = new Date(sprint.endDate);
      const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
      for (let i = 0; i <= Math.min(days, 14); i++) {
        const d = new Date(start.getTime() + i * 86400000);
        burndown.push({
          date: d.toISOString().split('T')[0],
          ideal: Math.round(total - (total / days) * i),
          actual: Math.max(0, total - Math.floor(completed * (i / days))),
        });
      }
    }

    res.json({ sprint, tasks, stats: { total, completed, blocked, inProgress, remaining: total - completed }, burndown });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/sprints/:id
router.put('/sprints/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sprint = await Sprint.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!sprint) { res.status(404).json({ message: 'Sprint not found' }); return; }
    res.json({ sprint });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/sprints/:id
router.delete('/sprints/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Task.updateMany({ sprint: req.params.id }, { $unset: { sprint: 1 } });
    await Sprint.findByIdAndDelete(req.params.id);
    res.json({ message: 'Sprint deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/sprints/:id/tasks
router.post('/sprints/:id/tasks', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { taskId } = req.body;
    await Task.findByIdAndUpdate(taskId, { sprint: req.params.id });
    res.json({ message: 'Task added to sprint' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/sprints/:id/tasks/:taskId
router.delete('/sprints/:id/tasks/:taskId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Task.findByIdAndUpdate(req.params.taskId, { $unset: { sprint: 1 } });
    res.json({ message: 'Task removed from sprint' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
