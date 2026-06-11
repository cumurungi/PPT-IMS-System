import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction): void {
  console.error(err);

  // Prisma errors
  if (err.code === 'P2002') {
    res.status(409).json({ error: 'Conflict', message: 'A record with this value already exists' });
    return;
  }
  if (err.code === 'P2025') {
    res.status(404).json({ error: 'Not Found', message: 'Record not found' });
    return;
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    res.status(422).json({ error: 'Validation Error', message: err.errors });
    return;
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'Something went wrong',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
