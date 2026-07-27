import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../utils/supabaseClient.js';

const getAccessToken = (req: Request) => {
  const authHeader = req.headers.authorization;
  return authHeader?.replace('Bearer ', '');
};

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const token = getAccessToken(req);
  if (!token) return res.status(401).json({ error: 'Missing auth token' });

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  req.context = { user: data.user };
  next();
};
