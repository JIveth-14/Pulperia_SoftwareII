// Sanea las variables de entorno de Supabase: al pegarlas en Vercel es fácil
// arrastrar espacios, saltos de línea, comillas o una barra final, y eso hace
// que el edge de Supabase responda "Invalid path specified in request URL".
const clean = (value: string | undefined) =>
  (value ?? '').trim().replace(/^['"]+|['"]+$/g, '');

export function getSupabaseEnv() {
  const url = clean(process.env.NEXT_PUBLIC_SUPABASE_URL).replace(/\/+$/, '');
  const anonKey = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!url || !anonKey) {
    throw new Error(
      'Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en las variables de entorno'
    );
  }

  return { url, anonKey };
}
