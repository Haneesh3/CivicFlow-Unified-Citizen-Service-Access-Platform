import { Request, Response, NextFunction } from 'express';

export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const role = (req.context?.user as any)?.user_metadata?.role;
  if (role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  next();
};
