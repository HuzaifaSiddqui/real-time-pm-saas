import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Server as SocketServer } from 'socket.io';
import jwt from 'jsonwebtoken';

import { connectDB } from './config/db';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';

import authRouter from './routes/auth';
import workspacesRouter from './routes/workspaces';
import invitationsRouter from './routes/invitations';
import projectsRouter from './routes/projects';
import tasksRouter from './routes/tasks';
import sprintsRouter from './routes/sprints';
import timeTrackingRouter from './routes/timeTracking';
import notificationsRouter from './routes/notifications';
import analyticsRouter from './routes/analytics';
import activityRouter from './routes/activity';

const app = express();
const server = http.createServer(app);

// Socket.IO setup
export const io = new SocketServer(server, {
  cors: {
    origin: env.FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Socket.IO auth middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string; email: string; role: string };
    (socket as any).user = decoded;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

// Socket.IO events
io.on('connection', (socket) => {
  const user = (socket as any).user;
  console.log(`Socket connected: ${user?.email}`);

  socket.on('join:workspace', (workspaceId: string) => {
    socket.join(`workspace:${workspaceId}`);
  });

  socket.on('join:project', (projectId: string) => {
    socket.join(`project:${projectId}`);
  });

  socket.on('join:task', (taskId: string) => {
    socket.join(`task:${taskId}`);
  });

  socket.on('leave:workspace', (workspaceId: string) => {
    socket.leave(`workspace:${workspaceId}`);
  });

  socket.on('leave:project', (projectId: string) => {
    socket.leave(`project:${projectId}`);
  });

  socket.on('leave:task', (taskId: string) => {
    socket.leave(`task:${taskId}`);
  });

  socket.on('presence:join', (data: { workspaceId: string }) => {
    socket.to(`workspace:${data.workspaceId}`).emit('presence:join', {
      userId: user.id,
      email: user.email,
    });
  });

  socket.on('presence:leave', (data: { workspaceId: string }) => {
    socket.to(`workspace:${data.workspaceId}`).emit('presence:leave', {
      userId: user.id,
    });
  });

  socket.on('typing:start', (data: { taskId: string }) => {
    socket.to(`task:${data.taskId}`).emit('typing:start', {
      userId: user.id,
      email: user.email,
    });
  });

  socket.on('typing:stop', (data: { taskId: string }) => {
    socket.to(`task:${data.taskId}`).emit('typing:stop', {
      userId: user.id,
    });
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${user?.email}`);
  });
});

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRouter);
app.use('/api/workspaces', workspacesRouter);
app.use('/api/invitations', invitationsRouter);
app.use('/api', projectsRouter);
app.use('/api', tasksRouter);
app.use('/api', sprintsRouter);
app.use('/api', timeTrackingRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api', analyticsRouter);
app.use('/api', activityRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// Start server
const start = async () => {
  await connectDB();
  server.listen(env.PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${env.PORT}`);
    console.log(`📡 Socket.IO ready`);
  });
};

start().catch(console.error);
