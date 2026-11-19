import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Task } from '../models/Task';
import { TaskComment } from '../models/TaskComment';
import { TaskDependency } from '../models/TaskDependency';
import { ActivityLog } from '../models/ActivityLog';
import { Notification } from '../models/Notification';
import { io } from '../index';

const router = Router();

const taskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  status: z.enum(['backlog', 'todo', 'in_progress', 'in_review', 'blocked', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignee: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  estimatedHours: z.number().optional(),
  labels: z.array(z.string()).optional(),
  sprint: z.string().optional().nullable(),
  storyPoints: z.number().optional(),
  parentTask: z.string().optional().nullable(),
});

// GET /api/projects/:projectId/tasks
router.get('/projects/:projectId/tasks', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { status, assignee, priority, sprint, search, sort = 'createdAt' } = req.query;
    const filter: any = { project: projectId };
    if (status) filter.status = status;
    if (assignee) filter.assignee = assignee;
    if (priority) filter.priority = priority;
    if (sprint) filter.sprint = sprint;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const tasks = await Task.find(filter)
      .populate('assignee', 'name email avatar')
      .populate('reporter', 'name email avatar')
      .populate('sprint', 'name')
      .sort({ [sort as string]: 1, createdAt: -1 });

    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/projects/:projectId/tasks
router.post('/projects/:projectId/tasks', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const parsed = taskSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation error', errors: parsed.error.errors });
      return;
    }
    const { workspace } = req.body;
    const count = await Task.countDocuments({ project: projectId });
    const task = new Task({
      ...parsed.data,
      project: projectId,
      workspace,
      reporter: req.user!.id,
      order: count,
    });
    await task.save();
    await task.populate('assignee reporter', 'name email avatar');

    // Activity log
    await ActivityLog.create({
      workspace,
      project: projectId,
      task: task._id,
      actor: req.user!.id,
      action: 'task_created',
      resourceType: 'task',
      resourceId: task._id,
      metadata: { title: task.title },
    });

    // Notify assignee
    if (task.assignee && task.assignee.toString() !== req.user!.id) {
      const notif = await Notification.create({
        user: task.assignee,
        type: 'task_assigned',
        title: 'You were assigned a task',
        message: `You were assigned: ${task.title}`,
        link: `/projects/${projectId}`,
        metadata: { taskId: task._id },
      });
      io.to(`user:${task.assignee}`).emit('notification:new', notif);
    }

    io.to(`project:${projectId}`).emit('task:created', task);
    res.status(201).json({ task });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/tasks/:id
router.get('/tasks/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee reporter', 'name email avatar')
      .populate('sprint', 'name')
      .populate('parentTask', 'title');
    if (!task) { res.status(404).json({ message: 'Task not found' }); return; }
    const comments = await TaskComment.find({ task: req.params.id })
      .populate('author', 'name email avatar')
      .sort({ createdAt: 1 });
    const dependencies = await TaskDependency.find({ task: req.params.id })
      .populate('dependsOn', 'title status');
    res.json({ task, comments, dependencies });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/tasks/:id
router.put('/tasks/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const before = await Task.findById(req.params.id);
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: false })
      .populate('assignee reporter', 'name email avatar')
      .populate('sprint', 'name');
    if (!task) { res.status(404).json({ message: 'Task not found' }); return; }

    await ActivityLog.create({
      workspace: task.workspace,
      project: task.project,
      task: task._id,
      actor: req.user!.id,
      action: 'task_updated',
      resourceType: 'task',
      resourceId: task._id,
      metadata: { changes: req.body, before: before?.toObject() },
    });

    // Notify on assignment change
    if (req.body.assignee && req.body.assignee !== before?.assignee?.toString() && req.body.assignee !== req.user!.id) {
      const notif = await Notification.create({
        user: req.body.assignee,
        type: 'task_assigned',
        title: 'You were assigned a task',
        message: `You were assigned: ${task.title}`,
        link: `/projects/${task.project}`,
        metadata: { taskId: task._id },
      });
      io.to(`user:${req.body.assignee}`).emit('notification:new', notif);
    }

    io.to(`project:${task.project.toString()}`).emit('task:updated', task);
    io.to(`task:${task._id}`).emit('task:updated', task);
    res.json({ task });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/tasks/:id
router.delete('/tasks/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) { res.status(404).json({ message: 'Task not found' }); return; }
    await TaskComment.deleteMany({ task: req.params.id });
    await TaskDependency.deleteMany({ $or: [{ task: req.params.id }, { dependsOn: req.params.id }] });
    io.to(`project:${task.project.toString()}`).emit('task:deleted', { taskId: req.params.id });
    res.json({ message: 'Task deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/tasks/:id/comments
router.post('/tasks/:id/comments', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { content } = req.body;
    if (!content?.trim()) { res.status(400).json({ message: 'Content required' }); return; }
    const comment = new TaskComment({ task: req.params.id, author: req.user!.id, content });
    await comment.save();
    await comment.populate('author', 'name email avatar');

    const task = await Task.findById(req.params.id);
    if (task && task.reporter?.toString() !== req.user!.id) {
      const notif = await Notification.create({
        user: task.reporter,
        type: 'comment',
        title: 'New comment on your task',
        message: `${content.slice(0, 80)}...`,
        link: `/projects/${task.project}`,
        metadata: { taskId: task._id },
      });
      io.to(`user:${task.reporter}`).emit('notification:new', notif);
    }

    io.to(`task:${req.params.id}`).emit('comment:new', comment);
    res.status(201).json({ comment });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/tasks/:id/comments
router.get('/tasks/:id/comments', authenticate, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const comments = await TaskComment.find({ task: _req.params.id })
      .populate('author', 'name email avatar')
      .sort({ createdAt: 1 });
    res.json({ comments });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/tasks/:id/dependencies
router.post('/tasks/:id/dependencies', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { dependsOn, type = 'blocks' } = req.body;
    // Circular dependency check
    const existing = await TaskDependency.findOne({ task: dependsOn, dependsOn: req.params.id });
    if (existing) { res.status(400).json({ message: 'Circular dependency detected' }); return; }
    const dep = await TaskDependency.create({ task: req.params.id, dependsOn, type });
    await dep.populate('dependsOn', 'title status');
    res.status(201).json({ dependency: dep });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/tasks/:id/dependencies/:depId
router.delete('/tasks/:id/dependencies/:depId', authenticate, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    await TaskDependency.findByIdAndDelete(_req.params.depId);
    res.json({ message: 'Dependency removed' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/tasks/reorder
router.post('/tasks/reorder', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { tasks } = req.body; // [{id, status, order}]
    const ops = tasks.map((t: { id: string; status: string; order: number }) =>
      Task.findByIdAndUpdate(t.id, { status: t.status, order: t.order })
    );
    await Promise.all(ops);
    res.json({ message: 'Reordered' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
