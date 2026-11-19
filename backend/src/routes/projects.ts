import { Router, Response } from 'express';
import { z } from 'zod';
import { Project } from '../models/Project';
import { Task } from '../models/Task';
import { WorkspaceMember } from '../models/WorkspaceMember';
import { ActivityLog } from '../models/ActivityLog';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/workspaces/:workspaceId/projects
router.get('/workspaces/:workspaceId/projects', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const member = await WorkspaceMember.findOne({ workspace: req.params.workspaceId, user: req.user!.id });
    if (!member) { res.status(403).json({ message: 'Not a member' }); return; }
    const { status, search } = req.query;
    const filter: Record<string, unknown> = { workspace: req.params.workspaceId };
    if (status) filter.status = status;
    if (search) filter.name = { $regex: search, $options: 'i' };
    const projects = await Project.find(filter).populate('manager', 'name email avatar').populate('members', 'name email avatar').sort({ createdAt: -1 });
    res.json({ projects });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/workspaces/:workspaceId/projects
router.post('/workspaces/:workspaceId/projects', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const member = await WorkspaceMember.findOne({ workspace: req.params.workspaceId, user: req.user!.id });
    if (!member || !['owner', 'admin', 'project_manager'].includes(member.role)) {
      res.status(403).json({ message: 'Insufficient permissions' }); return;
    }
    const schema = z.object({
      name: z.string().min(1).max(100),
      description: z.string().optional(),
      status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']).optional(),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
      startDate: z.string().optional(),
      dueDate: z.string().optional(),
      manager: z.string().optional(),
      color: z.string().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ message: 'Validation error', errors: parsed.error.errors }); return; }
    const project = await Project.create({
      ...parsed.data,
      workspace: req.params.workspaceId,
      manager: parsed.data.manager || req.user!.id,
      members: [req.user!.id],
    });
    await ActivityLog.create({
      workspace: req.params.workspaceId,
      project: project._id,
      actor: req.user!.id,
      action: 'created_project',
      resourceType: 'Project',
      resourceId: project._id,
    });
    res.status(201).json({ project });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/projects/:id
router.get('/projects/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id).populate('manager', 'name email avatar').populate('members', 'name email avatar');
    if (!project) { res.status(404).json({ message: 'Project not found' }); return; }
    const member = await WorkspaceMember.findOne({ workspace: project.workspace, user: req.user!.id });
    if (!member) { res.status(403).json({ message: 'Not a member' }); return; }
    const taskStats = await Task.aggregate([
      { $match: { project: project._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    res.json({ project, taskStats });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/projects/:id
router.put('/projects/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) { res.status(404).json({ message: 'Not found' }); return; }
    const member = await WorkspaceMember.findOne({ workspace: project.workspace, user: req.user!.id });
    if (!member || !['owner', 'admin', 'project_manager'].includes(member.role)) {
      res.status(403).json({ message: 'Insufficient permissions' }); return;
    }
    const updated = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('manager', 'name email avatar').populate('members', 'name email avatar');
    res.json({ project: updated });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/projects/:id
router.delete('/projects/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) { res.status(404).json({ message: 'Not found' }); return; }
    const member = await WorkspaceMember.findOne({ workspace: project.workspace, user: req.user!.id });
    if (!member || !['owner', 'admin'].includes(member.role)) {
      res.status(403).json({ message: 'Insufficient permissions' }); return;
    }
    await Project.findByIdAndDelete(req.params.id);
    await Task.deleteMany({ project: req.params.id });
    res.json({ message: 'Project deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/projects/:id/stats
router.get('/projects/:id/stats', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) { res.status(404).json({ message: 'Not found' }); return; }
    const taskStats = await Task.aggregate([
      { $match: { project: project._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const totalTasks = taskStats.reduce((sum, s) => sum + s.count, 0);
    const doneTasks = taskStats.find((s) => s._id === 'done')?.count || 0;
    const blockedTasks = taskStats.find((s) => s._id === 'blocked')?.count || 0;
    const overdueTasks = await Task.countDocuments({ project: req.params.id, dueDate: { $lt: new Date() }, status: { $ne: 'done' } });
    res.json({ taskStats, totalTasks, doneTasks, blockedTasks, overdueTasks });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
