import { Request, Response } from 'express';
import { supabaseAdmin } from '../utils/supabaseClient.js';
import { signUpSchema, signInSchema } from '../utils/validators.js';
import { logger } from '../utils/logger.js';

export const signUp = async (req: Request, res: Response) => {
  const { error, value } = signUpSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });

  const { email, password, fullName } = value;
  const { data, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    user_metadata: { fullName, role: 'user' },
    email_confirm: true,
  });

  if (signUpError) {
    logger.error('SignUp error', { error: signUpError });
    return res.status(400).json({ error: signUpError.message });
  }

  await supabaseAdmin.from('profiles').insert({
    id: data.user!.id,
    email,
    full_name: fullName,
    role: 'user',
  });

  const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    logger.error('SignUp signIn error', { error: signInError });
    return res.status(201).json({ user: data.user });
  }

  return res.status(201).json({ session: signInData.session, user: data.user });
};

export const signIn = async (req: Request, res: Response) => {
  const { error, value } = signInSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });

  const { email, password } = value;
  const { data, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    logger.error('SignIn error', { error: signInError });
    return res.status(401).json({ error: signInError.message });
  }

  return res.status(200).json({ session: data.session, user: data.user });
};

export const signOut = async (_req: Request, res: Response) => {
  return res.status(200).json({ message: 'Signed out' });
};
