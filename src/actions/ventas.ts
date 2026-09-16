'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getRepositories } from '@/repositories/container';
import { RegistrarVenta } from '@/services';
import { exigirSesion } from '@/lib/supabase/server-utils';
import { conExito, estadoDeFallo, leerCampos, type EstadoFormulario } from '@/lib/formulario';

export async function registrarVenta(_prev: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  await exigirSesion();
  const valores = leerCampos(form, ['lineas', 'tipoPago', 'clienteId']);

  let lineas: unknown;
  try {
    lineas = JSON.parse(valores.lineas || '[]');
  } catch {
    return { error: 'No se pudo leer el carrito. Recarga la página.', valores };
  }

  const resultado = await new RegistrarVenta(await getRepositories()).ejecutar({
    lineas: Array.isArray(lineas) ? lineas : [],
    tipoPago: valores.tipoPago,
    clienteId: valores.clienteId,
  });
  if (!resultado.ok) return estadoDeFallo(resultado, valores);

  revalidatePath('/', 'layout');
  redirect(conExito(`/ventas/${resultado.data.id}`, 'venta-registrada'));
}
