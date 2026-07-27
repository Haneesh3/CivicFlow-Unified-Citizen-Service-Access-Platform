import type { User } from '@supabase/supabase-js';

declare global {
  namespace Express {
    interface Request {
      context?: {
        user?: User & { id: string; user_metadata?: { role?: string } };
      };
    }
  }
}
