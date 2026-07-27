import { Request, Response } from 'express';
import { supabaseAdmin } from '../utils/supabaseClient.js';
import { logger } from '../utils/logger.js';

export const getUsers = async (_req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin.from('profiles').select('id, full_name, email, role, created_at');

  if (error) {
    logger.error('Admin fetch users failed', { error });
    return res.status(500).json({ error: error.message });
  }

  return res.json({ users: data });
};

export const getDashboardStats = async (_req: Request, res: Response) => {
  const [{ count: totalUsers }, { count: adminCount }] = await Promise.all([
    supabaseAdmin.from('profiles').select('id', { count: 'exact' }).maybeSingle(),
    supabaseAdmin.from('profiles').select('id', { count: 'exact' }).eq('role', 'admin').maybeSingle(),
  ]);

  return res.json({ totalUsers: totalUsers ?? 0, adminCount: adminCount ?? 0 });
};
