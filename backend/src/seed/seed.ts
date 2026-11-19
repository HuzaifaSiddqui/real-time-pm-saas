import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { User } from '../models/User';
import { Workspace } from '../models/Workspace';
import { WorkspaceMember } from '../models/WorkspaceMember';
import { Project } from '../models/Project';
import { Task } from '../models/Task';
import { TaskComment } from '../models/TaskComment';
import { Sprint } from '../models/Sprint';
import { Milestone } from '../models/Milestone';
import { ActivityLog } from '../models/ActivityLog';
import { Notification } from '../models/Notification';
import { TimeEntry } from '../models/TimeEntry';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pm-saas';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // Clear all collections
  await Promise.all([
    User.deleteMany({}), Workspace.deleteMany({}), WorkspaceMember.deleteMany({}),
    Project.deleteMany({}), Task.deleteMany({}), TaskComment.deleteMany({}),
    Sprint.deleteMany({}), Milestone.deleteMany({}), ActivityLog.deleteMany({}),
    Notification.deleteMany({}), TimeEntry.deleteMany({}),
  ]);
  console.log('Cleared all collections');

  // Create users
  const owner = await User.create({ name: 'Alex Owner', email: 'owner@demo.com', password: 'Demo1234!', bio: 'Workspace owner & founder' });
  const admin = await User.create({ name: 'Sam Admin', email: 'admin@demo.com', password: 'Demo1234!', bio: 'Platform administrator' });
  const pm = await User.create({ name: 'Jordan PM', email: 'pm@demo.com', password: 'Demo1234!', bio: 'Senior Project Manager' });
  const dev = await User.create({ name: 'Riley Dev', email: 'dev@demo.com', password: 'Demo1234!', bio: 'Full-stack developer' });
  const viewer = await User.create({ name: 'Casey Viewer', email: 'viewer@demo.com', password: 'Demo1234!', bio: 'Stakeholder viewer' });
  console.log('Created users');

  // Create workspace
  const workspace = await Workspace.create({ name: 'Acme Corp', description: 'Main product workspace for Acme Corp', slug: 'acme-corp', owner: owner._id });
  const wsId = workspace._id;

  // Create members
  await WorkspaceMember.create([
    { workspace: wsId, user: owner._id, role: 'owner' },
    { workspace: wsId, user: admin._id, role: 'admin' },
    { workspace: wsId, user: pm._id, role: 'project_manager' },
    { workspace: wsId, user: dev._id, role: 'member' },
    { workspace: wsId, user: viewer._id, role: 'viewer' },
  ]);
  console.log('Created workspace and members');

  // Create projects
  const p1 = await Project.create({
    workspace: wsId, name: 'Website Redesign', description: 'Complete redesign of the company website with modern UI/UX',
    status: 'active', priority: 'high', startDate: new Date('2024-01-01'), dueDate: new Date('2024-06-30'),
    manager: pm._id, members: [owner._id, pm._id, dev._id], progress: 45, health: 'at_risk', color: '#6366f1',
  });
  const p2 = await Project.create({
    workspace: wsId, name: 'Mobile App v2', description: 'Next generation mobile application with real-time features',
    status: 'active', priority: 'urgent', startDate: new Date('2024-02-01'), dueDate: new Date('2024-09-30'),
    manager: pm._id, members: [pm._id, dev._id], progress: 25, health: 'on_track', color: '#10b981',
  });
  const p3 = await Project.create({
    workspace: wsId, name: 'Backend API Refactor', description: 'Microservices migration and performance optimization',
    status: 'planning', priority: 'medium', startDate: new Date('2024-03-01'), dueDate: new Date('2024-12-31'),
    manager: owner._id, members: [owner._id, admin._id, dev._id], progress: 10, health: 'on_track', color: '#f59e0b',
  });
  console.log('Created projects');

  // Create sprints
  const sprint1 = await Sprint.create({
    project: p1._id, workspace: wsId, name: 'Sprint 1 - Foundation',
    goal: 'Set up design system and core components', status: 'completed',
    startDate: new Date('2024-01-15'), endDate: new Date('2024-01-29'), velocity: 23,
  });
  const sprint2 = await Sprint.create({
    project: p1._id, workspace: wsId, name: 'Sprint 2 - Core Pages',
    goal: 'Build homepage, about, and product pages', status: 'active',
    startDate: new Date('2024-01-30'), endDate: new Date('2024-02-13'), velocity: 0,
  });
  const sprint3 = await Sprint.create({
    project: p2._id, workspace: wsId, name: 'Mobile Sprint 1 - Setup',
    goal: 'React Native setup, navigation, auth screens', status: 'active',
    startDate: new Date('2024-02-01'), endDate: new Date('2024-02-15'), velocity: 0,
  });
  console.log('Created sprints');

  // Create tasks for Website Redesign
  const tasks1 = await Task.create([
    { project: p1._id, workspace: wsId, title: 'Set up design system tokens', description: 'Configure colors, typography, spacing, and shadows in Figma and code', status: 'done', priority: 'high', assignee: dev._id, reporter: pm._id, sprint: sprint1._id, estimatedHours: 8, actualHours: 7, storyPoints: 5, labels: ['design', 'setup'], order: 0, dueDate: new Date('2024-01-20') },
    { project: p1._id, workspace: wsId, title: 'Create component library', description: 'Build reusable Button, Input, Card, and Modal components', status: 'done', priority: 'high', assignee: dev._id, reporter: pm._id, sprint: sprint1._id, estimatedHours: 16, actualHours: 18, storyPoints: 8, labels: ['frontend'], order: 1, dueDate: new Date('2024-01-25') },
    { project: p1._id, workspace: wsId, title: 'Design homepage wireframes', description: 'Create low and high fidelity wireframes for the new homepage', status: 'done', priority: 'high', assignee: pm._id, reporter: owner._id, sprint: sprint1._id, estimatedHours: 6, actualHours: 5, storyPoints: 3, labels: ['design'], order: 2, dueDate: new Date('2024-01-22') },
    { project: p1._id, workspace: wsId, title: 'Implement homepage hero section', description: 'Build animated hero with CTA, headline, and background', status: 'in_progress', priority: 'high', assignee: dev._id, reporter: pm._id, sprint: sprint2._id, estimatedHours: 10, storyPoints: 5, labels: ['frontend'], order: 0, dueDate: new Date('2024-02-05') },
    { project: p1._id, workspace: wsId, title: 'Build navigation component', description: 'Responsive navbar with mega menu and mobile hamburger', status: 'in_progress', priority: 'medium', assignee: dev._id, reporter: pm._id, sprint: sprint2._id, estimatedHours: 8, storyPoints: 3, labels: ['frontend'], order: 1, dueDate: new Date('2024-02-07') },
    { project: p1._id, workspace: wsId, title: 'Write product page copy', description: 'Compelling copy for all product feature sections', status: 'todo', priority: 'medium', assignee: pm._id, reporter: owner._id, sprint: sprint2._id, estimatedHours: 4, storyPoints: 2, labels: ['content'], order: 2, dueDate: new Date('2024-02-10') },
    { project: p1._id, workspace: wsId, title: 'Set up CI/CD pipeline', description: 'GitHub Actions for auto deploy to staging and production', status: 'blocked', priority: 'high', assignee: dev._id, reporter: owner._id, sprint: sprint2._id, estimatedHours: 6, storyPoints: 3, labels: ['devops'], order: 3, dueDate: new Date('2024-02-08') },
    { project: p1._id, workspace: wsId, title: 'SEO optimization', description: 'Meta tags, sitemap, structured data, and performance audit', status: 'backlog', priority: 'low', assignee: dev._id, reporter: pm._id, estimatedHours: 8, storyPoints: 3, labels: ['seo'], order: 4, dueDate: new Date('2024-06-01') },
  ]);

  // Create tasks for Mobile App
  const tasks2 = await Task.create([
    { project: p2._id, workspace: wsId, title: 'React Native project setup', description: 'Initialize expo project with TypeScript and navigation', status: 'done', priority: 'urgent', assignee: dev._id, reporter: pm._id, sprint: sprint3._id, estimatedHours: 4, actualHours: 3, storyPoints: 2, labels: ['setup'], order: 0, dueDate: new Date('2024-02-03') },
    { project: p2._id, workspace: wsId, title: 'Auth screens UI', description: 'Login, register, forgot password screens with animations', status: 'in_progress', priority: 'high', assignee: dev._id, reporter: pm._id, sprint: sprint3._id, estimatedHours: 12, storyPoints: 5, labels: ['mobile', 'auth'], order: 1, dueDate: new Date('2024-02-12') },
    { project: p2._id, workspace: wsId, title: 'Push notification setup', description: 'Firebase Cloud Messaging integration', status: 'todo', priority: 'high', assignee: dev._id, reporter: pm._id, sprint: sprint3._id, estimatedHours: 8, storyPoints: 4, labels: ['mobile', 'notifications'], order: 2, dueDate: new Date('2024-02-14') },
    { project: p2._id, workspace: wsId, title: 'Offline data sync', description: 'Redux persist + background sync when connection restored', status: 'backlog', priority: 'medium', assignee: dev._id, reporter: owner._id, estimatedHours: 20, storyPoints: 8, labels: ['mobile', 'sync'], order: 3, dueDate: new Date('2024-04-01') },
  ]);

  // Create tasks for Backend refactor
  const tasks3 = await Task.create([
    { project: p3._id, workspace: wsId, title: 'Architecture planning', description: 'Define microservice boundaries and communication patterns', status: 'done', priority: 'urgent', assignee: owner._id, reporter: admin._id, estimatedHours: 16, actualHours: 14, storyPoints: 8, labels: ['architecture'], order: 0, dueDate: new Date('2024-03-10') },
    { project: p3._id, workspace: wsId, title: 'Auth service extraction', description: 'Extract authentication into standalone service', status: 'in_progress', priority: 'high', assignee: dev._id, reporter: owner._id, estimatedHours: 24, storyPoints: 13, labels: ['backend', 'auth'], order: 1, dueDate: new Date('2024-04-15') },
    { project: p3._id, workspace: wsId, title: 'API gateway setup', description: 'Set up Kong or AWS API Gateway for routing', status: 'todo', priority: 'high', assignee: admin._id, reporter: owner._id, estimatedHours: 16, storyPoints: 8, labels: ['backend', 'infra'], order: 2, dueDate: new Date('2024-05-01') },
  ]);

  const allTasks = [...tasks1, ...tasks2, ...tasks3];
  console.log('Created tasks');

  // Create comments
  await TaskComment.create([
    { task: tasks1[3]._id, author: pm._id, content: 'Looking great! The animation timing feels a bit slow, can we speed it up by 20%?' },
    { task: tasks1[3]._id, author: dev._id, content: 'Good catch! Updating the duration from 800ms to 600ms. Will push to staging shortly.' },
    { task: tasks1[6]._id, author: dev._id, content: 'Blocked waiting for DevOps to grant GitHub Actions permissions. @admin can you help?' },
    { task: tasks1[6]._id, author: admin._id, content: "On it! I'll set up the OIDC credentials today." },
    { task: tasks2[1]._id, author: pm._id, content: 'Auth screens look polished! One thing — can we add biometric login option?' },
    { task: tasks3[1]._id, author: owner._id, content: 'Make sure to maintain backward compatibility with the existing JWT tokens during migration.' },
  ]);

  // Create milestones
  await Milestone.create([
    { project: p1._id, name: 'Design System Complete', description: 'All design tokens and base components shipped', dueDate: new Date('2024-01-29'), status: 'completed', completedAt: new Date('2024-01-28') },
    { project: p1._id, name: 'Public Beta Launch', description: 'Website live for beta users', dueDate: new Date('2024-04-01'), status: 'pending' },
    { project: p2._id, name: 'App Store Submission', description: 'Submit v2 to App Store and Play Store', dueDate: new Date('2024-07-01'), status: 'pending' },
    { project: p3._id, name: 'First Service Live', description: 'Auth microservice deployed to production', dueDate: new Date('2024-05-01'), status: 'pending' },
  ]);

  // Create time entries
  await TimeEntry.create([
    { task: tasks1[0]._id, user: dev._id, startTime: new Date('2024-01-15T09:00:00'), endTime: new Date('2024-01-15T13:00:00'), duration: 240, description: 'Color tokens and typography setup', isRunning: false },
    { task: tasks1[1]._id, user: dev._id, startTime: new Date('2024-01-18T09:00:00'), endTime: new Date('2024-01-18T17:00:00'), duration: 480, description: 'Button and Input components', isRunning: false },
    { task: tasks1[3]._id, user: dev._id, startTime: new Date('2024-01-30T10:00:00'), endTime: new Date('2024-01-30T14:30:00'), duration: 270, description: 'Hero animation implementation', isRunning: false },
    { task: tasks2[0]._id, user: dev._id, startTime: new Date('2024-02-01T09:00:00'), endTime: new Date('2024-02-01T12:00:00'), duration: 180, description: 'Expo setup and config', isRunning: false },
    { task: tasks3[0]._id, user: owner._id, startTime: new Date('2024-03-05T09:00:00'), endTime: new Date('2024-03-05T17:00:00'), duration: 480, description: 'Architecture diagrams and documentation', isRunning: false },
  ]);

  // Create activity logs
  await ActivityLog.create([
    { workspace: wsId, project: p1._id, actor: pm._id, action: 'project_created', resourceType: 'project', resourceId: p1._id, metadata: { name: 'Website Redesign' } },
    { workspace: wsId, project: p1._id, task: tasks1[3]._id, actor: pm._id, action: 'task_created', resourceType: 'task', resourceId: tasks1[3]._id, metadata: { title: tasks1[3].title } },
    { workspace: wsId, project: p1._id, task: tasks1[3]._id, actor: dev._id, action: 'task_updated', resourceType: 'task', resourceId: tasks1[3]._id, metadata: { status: 'in_progress' } },
    { workspace: wsId, project: p2._id, actor: pm._id, action: 'sprint_created', resourceType: 'sprint', resourceId: sprint3._id, metadata: { name: sprint3.name } },
    { workspace: wsId, actor: owner._id, action: 'member_invited', resourceType: 'workspace', resourceId: wsId, metadata: { email: 'dev@demo.com', role: 'member' } },
  ]);

  // Create notifications
  await Notification.create([
    { user: dev._id, type: 'task_assigned', title: 'New task assigned to you', message: 'You were assigned: Implement homepage hero section', read: false, link: `/projects/${p1._id}`, metadata: { taskId: tasks1[3]._id } },
    { user: dev._id, type: 'comment', title: 'New comment on your task', message: 'Jordan PM commented: "Looking great! The animation timing feels a bit slow..."', read: false, link: `/projects/${p1._id}`, metadata: { taskId: tasks1[3]._id } },
    { user: pm._id, type: 'status_change', title: 'Task status updated', message: 'React Native project setup is now Done', read: true, link: `/projects/${p2._id}`, metadata: { taskId: tasks2[0]._id } },
    { user: owner._id, type: 'deadline', title: 'Upcoming deadline', message: 'Public Beta Launch milestone is due in 7 days', read: false, link: `/projects/${p1._id}` },
    { user: dev._id, type: 'mention', title: 'You were mentioned', message: 'admin@demo.com mentioned you in: CI/CD pipeline task', read: false, link: `/projects/${p1._id}`, metadata: { taskId: tasks1[6]._id } },
  ]);

  console.log('\n✅ Seed complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Demo Credentials:');
  console.log('  Owner:          owner@demo.com   / Demo1234!');
  console.log('  Admin:          admin@demo.com   / Demo1234!');
  console.log('  Project Manager: pm@demo.com     / Demo1234!');
  console.log('  Developer:      dev@demo.com     / Demo1234!');
  console.log('  Viewer:         viewer@demo.com  / Demo1234!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  await mongoose.disconnect();
}

seed().catch((err) => { console.error('Seed failed:', err); process.exit(1); });
