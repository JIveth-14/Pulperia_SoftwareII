'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getRepositories } from '@/repositories/container';
import { EliminarProducto, GuardarProducto } from '@/services';
import { exigirSesion } from '@/lib/supabase/server-utils';
import { conExito, estadoDeFallo, leerCampos, type EstadoFormulario } from '@/lib/formulario';

const CAMPOS_PRODUCTO = ['nombre', 'precio', 'stock', 'stock_minimo'] as const;

export async function crearProducto(_prev: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  await exigirSesion();
  const valores = leerCampos(form, CAMPOS_PRODUCTO);
  const resultado = await new GuardarProducto(await getRepositories()).ejecutar(valores);
  if (!resultado.ok) return estadoDeFallo(resultado, valores);

  revalidatePath('/', 'layout');
  redirect(conExito('/productos', 'producto-creado'));
}

export async function actualizarProducto(
  productoId: number,
  _prev: EstadoFormulario,
  form: FormData
): Promise<EstadoFormulario> {
  await exigirSesion();
  const valores = leerCampos(form, CAMPOS_PRODUCTO);
  const resultado = await new GuardarProducto(await getRepositories()).ejecutar({ id: productoId, ...valores });
  if (!resultado.ok) return estadoDeFallo(resultado, valores);

  revalidatePath('/', 'layout');
  redirect(conExito('/productos', 'producto-actualizado'));
}

export async function eliminarProducto(
  productoId: number,
  _prev?: EstadoFormulario,
  _form?: FormData
): Promise<EstadoFormulario> {
  await exigirSesion();
  const resultado = await new EliminarProducto(await getRepositories()).ejecutar(productoId);
  if (!resultado.ok) return estadoDeFallo(resultado);

  revalidatePath('/', 'layout');
  redirect(conExito('/productos', 'producto-eliminado'));
}
