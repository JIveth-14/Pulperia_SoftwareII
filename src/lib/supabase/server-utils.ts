/**
 * Helpers de sesión para Server Components y Server Actions.
 * No llevan 'use server' a nivel de módulo: eso los publicaría como
 * endpoints POST invocables desde cualquier cliente.
 */
import { redirect } from 'next/navigation';
import { createClient } from './server';
import type { User } from '@supabase/supabase-js';

export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

/**
 * Guardia para Server Actions: son endpoints POST públicos, así que cada una
 * debe verificar la sesión aunque la página ya esté protegida.
 */
export async function exigirSesion(): Promise<User> {
  const user = await getUser();
  if (!user) redirect('/login');
  return user;
}
