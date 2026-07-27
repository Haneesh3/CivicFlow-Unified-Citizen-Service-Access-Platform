import { Request, Response } from 'express';
import { supabaseAdmin } from '../utils/supabaseClient.js';
import { updateProfileSchema } from '../utils/validators.js';
import { logger } from '../utils/logger.js';

export const getProfile = async (req: Request, res: Response) => {
  const userId = (req.context?.user as any)?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    logger.error('Profile fetch failed', { error });
    return res.status(500).json({ error: error.message });
  }

  return res.json({ profile: data });
};

export const updateProfile = async (req: Request, res: Response) => {
  const userId = (req.context?.user as any)?.id;
  const { error, value } = updateProfileSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });

  const { data, error: updateError } = await supabaseAdmin
    .from('profiles')
    .update(value)
    .eq('id', userId)
    .select()
    .single();

  if (updateError) {
    logger.error('Profile update failed', { error: updateError });
    return res.status(500).json({ error: updateError.message });
  }

  return res.json({ profile: data });
};

export const deleteProfile = async (req: Request, res: Response) => {
  const userId = (req.context?.user as any)?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { error } = await supabaseAdmin.from('profiles').delete().eq('id', userId);
  if (error) {
    logger.error('Profile delete failed', { error });
    return res.status(500).json({ error: error.message });
  }

  return res.json({ message: 'Profile deleted' });
};
