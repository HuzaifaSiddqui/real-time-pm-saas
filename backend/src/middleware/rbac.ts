import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

type Role = 'owner' | 'admin' | 'project_manager' | 'member' | 'viewer';

export const requireRole = (...roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    if (!roles.includes(req.user.role as Role)) {
      res.status(403).json({ message: 'Forbidden: insufficient permissions' });
      return;
    }
    next();
  };
};
