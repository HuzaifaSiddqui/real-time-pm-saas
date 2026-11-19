import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Task } from '../models/Task';
import { Project } from '../models/Project';
import { Sprint } from '../models/Sprint';
import { WorkspaceMember } from '../models/WorkspaceMember';
import { TimeEntry } from '../models/TimeEntry';

const router = Router();

// GET /api/workspaces/:id/analytics
router.get('/workspaces/:id/analytics', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const workspaceId = req.params.id;
    const projects = await Project.find({ workspace: workspaceId });
    const projectIds = projects.map(p => p._id);

    const totalTasks = await Task.countDocuments({ workspace: workspaceId });
    const completedTasks = await Task.countDocuments({ workspace: workspaceId, status: 'done' });
    const overdueTasks = await Task.countDocuments({ workspace: workspaceId, dueDate: { $lt: new Date() }, status: { $ne: 'done' } });
    const activeTasks = await Task.countDocuments({ workspace: workspaceId, status: 'in_progress' });

    // Task completion trend - last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const completionTrend = await Task.aggregate([
      { $match: { workspace: { $in: [workspaceId] }, status: 'done', updatedAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Project status distribution
    const projectStatusDist = await Project.aggregate([
      { $match: { workspace: workspaceId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Task status distribution
    const taskStatusDist = await Task.aggregate([
      { $match: { workspace: workspaceId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Sprint velocity (last 5 completed)
    const sprints = await Sprint.find({ workspace: workspaceId, status: 'completed' }).sort({ updatedAt: -1 }).limit(5);
    const velocity = await Promise.all(sprints.map(async (s) => {
      const done = await Task.countDocuments({ sprint: s._id, status: 'done' });
      const pts = await Task.aggregate([{ $match: { sprint: s._id, status: 'done' } }, { $group: { _id: null, total: { $sum: '$storyPoints' } } }]);
      return { name: s.name, completed: done, storyPoints: pts[0]?.total || 0 };
    }));

    res.json({
      overview: {
        totalProjects: projects.length,
        activeProjects: projects.filter(p => p.status === 'active').length,
        completedProjects: projects.filter(p => p.status === 'completed').length,
        totalTasks, completedTasks, overdueTasks, activeTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
      completionTrend,
      projectStatusDist,
      taskStatusDist,
      velocity,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/projects/:id/analytics
router.get('/projects/:id/analytics', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id;
    const tasks = await Task.find({ project: projectId });
    const total = tasks.length;
    const done = tasks.filter(t => t.status === 'done').length;
    const blocked = tasks.filter(t => t.status === 'blocked').length;
    const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length;

    // Priority distribution
    const priorityDist: Record<string, number> = { low: 0, medium: 0, high: 0, urgent: 0 };
    tasks.forEach(t => { if (t.priority) priorityDist[t.priority]++; });

    res.json({
      total, done, blocked, overdue,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      todo: tasks.filter(t => t.status === 'todo').length,
      progress: total > 0 ? Math.round((done / total) * 100) : 0,
      priorityDist,
    });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/workspaces/:id/workload
router.get('/workspaces/:id/workload', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const workspaceId = req.params.id;
    const members = await WorkspaceMember.find({ workspace: workspaceId }).populate('user', 'name email avatar');

    const workload = await Promise.all(members.map(async (m) => {
      const userId = (m.user as any)._id;
      const tasks = await Task.find({ workspace: workspaceId, assignee: userId, status: { $ne: 'done' } });
      const estimatedHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
      const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date()).length;
      return {
        member: m.user,
        role: m.role,
        taskCount: tasks.length,
        estimatedHours,
        overdueTasks: overdue,
      };
    }));

    res.json({ workload });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
