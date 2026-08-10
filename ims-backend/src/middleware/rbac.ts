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

/**
 * Media sub-module access control
 * Allows ADMIN or MEDIA department members to access media sub-modules
 * Only managers can change status in editing
 */
export function requireMediaSubModule(subModule: 'LIBRARY' | 'RECORDINGS' | 'EDITING') {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Admin has access to all modules
    if (req.user.role === 'ADMIN') {
      next();
      return;
    }

    // Only MEDIA department members can access media sub-modules
    if (req.user.department !== 'MEDIA') {
      res.status(403).json({ 
        error: 'Forbidden', 
        message: `Only Media department members and admins can access ${subModule}` 
      });
      return;
    }

    // For EDITING module, only managers can change status
    if (subModule === 'EDITING' && req.method === 'PATCH') {
      if (req.user.role !== 'MANAGER') {
        res.status(403).json({ 
          error: 'Forbidden', 
          message: 'Only Media managers can change editing status' 
        });
        return;
      }
    }

    next();
  };
}

/**
 * Check if user can manage editing tasks (change status)
 * Only Media department managers can do this
 */
export function requireEditingManager() {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Admin has access
    if (req.user.role === 'ADMIN') {
      next();
      return;
    }

    // Media manager required
    if (req.user.department === 'MEDIA' && req.user.role === 'MANAGER') {
      next();
      return;
    }

    res.status(403).json({ 
      error: 'Forbidden', 
      message: 'Only Media department managers can perform this action' 
    });
  };
}

/**
 * Check if user has a specific granular permission.
 * ADMINs always pass. For others, checks the permissions JSON array on the user.
 * Usage: requirePermission('tasks.create')
 */
export function requirePermission(...permissions: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Admins always have all permissions
    if (req.user.role === 'ADMIN') {
      next();
      return;
    }

    // Load permissions from DB if not already loaded
    if (req.user.permissions === null) {
      try {
        const prisma = require('../lib/prisma').default;
        const rows: any[] = await prisma.$queryRawUnsafe(
          `SELECT "permissions" FROM "User" WHERE id = $1 LIMIT 1`,
          req.user.id
        );
        req.user.permissions = rows[0]?.permissions || null;
      } catch {
        req.user.permissions = null;
      }
    }

    // Parse user permissions from JSON string
    const userPerms: string[] = req.user.permissions
      ? (typeof req.user.permissions === 'string' ? JSON.parse(req.user.permissions) : req.user.permissions)
      : [];

    // Check if user has at least one of the required permissions
    const hasPermission = permissions.some(p => userPerms.includes(p));
    if (!hasPermission) {
      res.status(403).json({ error: 'Forbidden', message: `Missing permission: ${permissions.join(' or ')}` });
      return;
    }

    next();
  };
}

/**
 * Helper to check permissions programmatically (non-middleware)
 */
export function userHasPermission(user: any, permission: string): boolean {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  const perms: string[] = user.permissions
    ? (typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions)
    : [];
  return perms.includes(permission);
}
