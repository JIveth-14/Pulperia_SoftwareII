import { expect, test } from '@playwright/test';
import { iniciarSesion, plano, reiniciarDatos } from './utilidades';

test.beforeEach(async ({ context }) => {
  await reiniciarDatos();
  await iniciarSesion(context);
});

test('venta al crédito desde la ficha del cliente', async ({ page }) => {
  await page.goto('/clientes/1');
  await page.getByRole('link', { name: 'Venta al crédito' }).click();

  await expect(page.getByRole('radio', { name: 'Al crédito' })).toBeChecked();
  await expect(page.getByLabel('Cliente')).toHaveValue('1');

  await page.getByRole('button', { name: 'Agregar Coca-Cola 600ml' }).click();
  await page.getByRole('button', { name: 'Agregar uno de Coca-Cola 600ml' }).click();
  await page.getByPlaceholder('Buscar producto…').fill('arroz');
  await page.keyboard.press('Enter');

  const total = page.locator('span.text-2xl');
  await expect.poll(async () => plano(await total.textContent())).toBe('L 51.00');

  await page.getByRole('button', { name: 'Registrar venta' }).click();

  await expect(page).toHaveURL(/\/ventas\/3$/);
  await expect(page.getByText('Venta registrada')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ana García' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Coca-Cola 600ml' })).toBeVisible();

  await page.goto('/clientes/1');
  await expect(page.getByRole('heading', { level: 1, name: 'Ana García' })).toBeVisible();
  expect(plano(await page.getByText(/^L 51\.00$/).first().textContent())).toBe('L 51.00');
});

test('stock insuficiente muestra el nombre y conserva el carrito', async ({ page }) => {
  await page.goto('/ventas/nueva');
  // Café tiene stock 2: se venden 2 y otra pestaña deja el stock en 0 antes de registrar.
  await page.getByRole('button', { name: 'Agregar Café 250g' }).click();
  await page.getByRole('button', { name: 'Agregar uno de Café 250g' }).click();

  await fetch('http://localhost:54329/rest/v1/productos?id=eq.3', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stock: 1 }),
  });

  await page.getByRole('button', { name: 'Registrar venta' }).click();

  await expect(page.getByRole('alert')).toHaveText('Stock insuficiente para "Café 250g" (disponible: 1)');
  await expect(page.getByLabel('Cantidad de Café 250g')).toHaveValue('2');
  await expect(page).toHaveURL(/\/ventas\/nueva$/);
});

test('productos: crear, editar y no borrar uno con ventas', async ({ page }) => {
  await page.goto('/productos/nuevo');
  await page.getByLabel('Nombre').fill('Frijoles 1lb');
  await page.getByLabel('Precio (L)').fill('20');
  await page.getByLabel('Stock', { exact: true }).fill('3');
  await page.getByLabel('Precio (L)').press('Enter');

  await expect(page).toHaveURL(/\/productos$/);
  await expect(page.getByText('Producto registrado')).toBeVisible();
  await expect(page.getByRole('row', { name: /Frijoles 1lb/ }).getByText('Bajo')).toBeVisible();

  await page.goto('/productos/1/editar');
  await page.getByRole('button', { name: 'Eliminar producto' }).click();
  await page.getByRole('button', { name: 'Sí, eliminar' }).click();
  await expect(page.getByRole('alert')).toContainText('tiene ventas registradas');
});
