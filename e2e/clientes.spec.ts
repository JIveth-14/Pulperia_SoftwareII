import { expect, test } from '@playwright/test';
import { iniciarSesion, plano, reiniciarDatos } from './utilidades';

test.beforeEach(async ({ context }) => {
  await reiniciarDatos();
  await iniciarSesion(context);
});

test('lista con resumen y búsqueda sin acentos', async ({ page }) => {
  await page.goto('/clientes');
  await expect(page.getByText('4 clientes · 2 con deuda')).toBeVisible();

  await page.getByRole('searchbox').fill('maria');
  await page.keyboard.press('Enter');

  await expect(page).toHaveURL(/q=maria/);
  await expect(page.getByRole('row')).toHaveCount(2); // encabezado + María López
  await expect(page.getByRole('link', { name: 'María López' })).toBeVisible();
});

test('crear cliente: valida, conserva lo escrito y confirma con aviso', async ({ page }) => {
  await page.goto('/clientes/nuevo');
  await page.getByLabel('Nombre').fill('Pedro Álvarez');
  await page.getByLabel('Teléfono').fill('12');
  await page.getByLabel('Dirección (opcional)').fill('Barrio Abajo');
  await page.getByRole('button', { name: 'Registrar cliente' }).click();

  await expect(page.getByText('Teléfono debe tener entre 6 y 15 dígitos')).toBeVisible();
  await expect(page.getByLabel('Nombre')).toHaveValue('Pedro Álvarez');
  await expect(page.getByLabel('Dirección (opcional)')).toHaveValue('Barrio Abajo');

  await page.getByLabel('Teléfono').fill('+504 9911 2233');
  await page.getByRole('button', { name: 'Registrar cliente' }).click();

  await expect(page).toHaveURL(/\/clientes\/5$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Pedro Álvarez' })).toBeVisible();
  await expect(page.getByText('9911-2233 · Barrio Abajo')).toBeVisible();
  await expect(page.getByText('Cliente registrado')).toBeVisible();
});

test('registrar pago con "Saldar" deja al cliente al día', async ({ page }) => {
  await page.goto('/clientes/2');
  await page.getByRole('link', { name: 'Registrar pago' }).click();

  await page.getByRole('button', { name: 'Saldar' }).click();
  await expect(page.getByLabel('Monto del pago (L)')).toHaveValue('60.00');
  await page.getByRole('button', { name: 'Registrar pago' }).click();

  await expect(page).toHaveURL(/\/clientes\/2$/);
  await expect(page.getByText('Pago registrado')).toBeVisible();
  await expect(page.getByText('Sin deudas pendientes')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Registrar pago' })).toHaveCount(0);
});

test('un pago mayor al saldo se rechaza sin perder el monto', async ({ page }) => {
  await page.goto('/clientes/3/pagos/nuevo');
  await page.getByLabel('Monto del pago (L)').fill('500');
  await page.getByLabel('Monto del pago (L)').press('Enter');

  await expect(page.getByRole('alert')).toContainText('supera el saldo pendiente');
  expect(plano(await page.getByRole('alert').textContent())).toContain('L 500.00');
  await expect(page.getByLabel('Monto del pago (L)')).toHaveValue('500');
});

test('no deja eliminar un cliente con deuda y sí uno al día', async ({ page }) => {
  await page.goto('/clientes/3/editar');
  await page.getByRole('button', { name: 'Eliminar cliente' }).click();
  await page.getByRole('button', { name: 'Sí, eliminar' }).click();
  await expect(page.getByRole('alert')).toContainText('pendientes de pago');

  await page.goto('/clientes/4/editar');
  await page.getByRole('button', { name: 'Eliminar cliente' }).click();
  await page.getByRole('button', { name: 'Sí, eliminar' }).click();

  await expect(page).toHaveURL(/\/clientes$/);
  await expect(page.getByText('Cliente eliminado')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Rosa Mendoza' })).toHaveCount(0);
});

test('un cliente inexistente muestra 404', async ({ page }) => {
  await page.goto('/clientes/999');
  await expect(page.getByRole('heading', { name: 'No encontramos lo que buscas' })).toBeVisible();
});
