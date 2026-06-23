import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me';

export interface JwtPayload {
  id: string;
  role: string;
  department: string | null;
  email: string;
  name?: string;
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.cookies?.token;

  if (!token) {
    res.status(401).json({ error: 'Unauthorized', message: 'No token provided' });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = {
      id: payload.id,
      name: payload.name || '',
      role: payload.role as any,
      department: payload.department as any,
      email: payload.email,
      permissions: null, // loaded on demand by requirePermission middleware
    };
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token' });
  }
}
