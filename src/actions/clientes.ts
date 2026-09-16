'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getRepositories } from '@/repositories/container';
import { EliminarCliente, GuardarCliente, RegistrarFiado, RegistrarPago } from '@/services';
import { exigirSesion } from '@/lib/supabase/server-utils';
import { conExito, estadoDeFallo, leerCampos, type EstadoFormulario } from '@/lib/formulario';

const CAMPOS_CLIENTE = ['nombre', 'telefono', 'direccion'] as const;

export async function crearCliente(_prev: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  await exigirSesion();
  const valores = leerCampos(form, CAMPOS_CLIENTE);
  const resultado = await new GuardarCliente(await getRepositories()).ejecutar(valores);
  if (!resultado.ok) return estadoDeFallo(resultado, valores);

  revalidatePath('/', 'layout');
  redirect(conExito(`/clientes/${resultado.data.id}`, 'cliente-creado'));
}

export async function actualizarCliente(
  clienteId: number,
  _prev: EstadoFormulario,
  form: FormData
): Promise<EstadoFormulario> {
  await exigirSesion();
  const valores = leerCampos(form, CAMPOS_CLIENTE);
  const resultado = await new GuardarCliente(await getRepositories()).ejecutar({ id: clienteId, ...valores });
  if (!resultado.ok) return estadoDeFallo(resultado, valores);

  revalidatePath('/', 'layout');
  redirect(conExito(`/clientes/${clienteId}`, 'cliente-actualizado'));
}

export async function eliminarCliente(
  clienteId: number,
  _prev?: EstadoFormulario,
  _form?: FormData
): Promise<EstadoFormulario> {
  await exigirSesion();
  const resultado = await new EliminarCliente(await getRepositories()).ejecutar(clienteId);
  if (!resultado.ok) return estadoDeFallo(resultado);

  revalidatePath('/', 'layout');
  redirect(conExito('/clientes', 'cliente-eliminado'));
}

export async function registrarFiado(
  clienteId: number,
  _prev: EstadoFormulario,
  form: FormData
): Promise<EstadoFormulario> {
  await exigirSesion();
  const valores = leerCampos(form, ['monto']);
  const resultado = await new RegistrarFiado(await getRepositories()).ejecutar({ clienteId, monto: valores.monto });
  if (!resultado.ok) return estadoDeFallo(resultado, valores);

  revalidatePath('/', 'layout');
  redirect(conExito(`/clientes/${clienteId}`, 'fiado-registrado'));
}

export async function registrarPago(
  clienteId: number,
  _prev: EstadoFormulario,
  form: FormData
): Promise<EstadoFormulario> {
  await exigirSesion();
  const valores = leerCampos(form, ['fiadoId', 'monto']);
  const resultado = await new RegistrarPago(await getRepositories()).ejecutar({ clienteId, ...valores });
  if (!resultado.ok) return estadoDeFallo(resultado, valores);

  revalidatePath('/', 'layout');
  redirect(conExito(`/clientes/${clienteId}`, 'pago-registrado'));
}
