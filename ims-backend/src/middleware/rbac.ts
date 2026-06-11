import { Request, Response, NextFunction } from 'express';

type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    if (!roles.includes(req.user.role as Role)) {
      res.status(403).json({ error: 'Forbidden', message: 'Insufficient permissions' });
      return;
    }
    next();
  };
}

export function requireDepartment(...departments: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    // Admin has access to all departments
    if (req.user.role === 'ADMIN') {
      next();
      return;
    }
    if (!req.user.department || !departments.includes(req.user.department)) {
      res.status(403).json({ error: 'Forbidden', message: 'Department access denied' });
      return;
    }
    next();
  };
}
