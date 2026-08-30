'use server';

import { createClient } from './server';
import type { User } from '@supabase/supabase-js';

export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getUserOrRedirect() {
  const user = await getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }
  return user;
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
