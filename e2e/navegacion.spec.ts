import { expect, test } from '@playwright/test';
import { iniciarSesion, navegacion, reiniciarDatos } from './utilidades';

test.beforeEach(async ({ context }) => {
  await reiniciarDatos();
  await iniciarSesion(context);
});

test.describe('navegación con tablas', () => {
  // Regresión: el enlace "estirado" de la última fila cubría toda la página y
  // cualquier clic (p. ej. en "Productos") abría el último cliente.
  for (const [origen, destino, titulo] of [
    ['/clientes', 'Productos', 'Productos'],
    ['/clientes', 'Ventas', 'Ventas'],
    ['/ventas', 'Clientes', 'Clientes'],
    ['/dashboard', 'Productos', 'Productos'],
  ] as const) {
    test(`desde ${origen} el menú "${destino}" abre ${destino}`, async ({ page }) => {
      await page.goto(origen);
      await navegacion(page).getByRole('link', { name: destino, exact: true }).click();

      await expect(page).toHaveURL(new RegExp(`/${destino.toLowerCase()}$`));
      await expect(page.getByRole('heading', { level: 1, name: titulo })).toBeVisible();
    });
  }

  test('los botones y el buscador de la lista no abren un cliente', async ({ page }) => {
    await page.goto('/clientes');

    await page.getByRole('searchbox').click();
    await expect(page).toHaveURL(/\/clientes$/);

    await page.getByRole('link', { name: 'Nuevo cliente' }).click();
    await expect(page).toHaveURL(/\/clientes\/nuevo$/);
  });

  test('un clic en cualquier parte de la fila abre ese cliente (no otro)', async ({ page }) => {
    await page.goto('/clientes');

    await page.getByRole('row', { name: /Carlos Reyes/ }).getByText('Río San Gaspar').click();
    await expect(page).toHaveURL(/\/clientes\/2$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Carlos Reyes' })).toBeVisible();

    await page.goBack();
    await page.getByRole('link', { name: 'Ana García' }).click();
    await expect(page).toHaveURL(/\/clientes\/1$/);
  });

  test('con teclado se llega al cliente y se abre con Enter', async ({ page }) => {
    await page.goto('/clientes');
    await page.getByRole('link', { name: 'María López' }).focus();
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/clientes\/3$/);
  });

  test('las filas de ventas y del dashboard abren la venta correcta', async ({ page }) => {
    await page.goto('/ventas');
    await page.getByRole('row', { name: /Venta #2/ }).getByText('María López').click();
    await expect(page).toHaveURL(/\/ventas\/2$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Venta #2' })).toBeVisible();

    await page.goto('/dashboard');
    await page.getByRole('row', { name: /Venta #1/ }).getByText('Contado').click();
    await expect(page).toHaveURL(/\/ventas\/1$/);
  });

  test('marca la sección activa', async ({ page }) => {
    await page.goto('/clientes/3');
    await expect(navegacion(page).getByRole('link', { name: 'Clientes', exact: true })).toHaveAttribute('aria-current', 'page');
    await expect(navegacion(page).getByRole('link', { name: 'Productos', exact: true })).not.toHaveAttribute('aria-current');
  });
});

test('@movil el menú móvil abre secciones y se cierra al navegar', async ({ page }) => {
  await page.goto('/clientes');
  await page.getByRole('button', { name: 'Menú' }).click();
  await page.getByRole('link', { name: 'Productos', exact: true }).click();

  await expect(page).toHaveURL(/\/productos$/);
  await expect(page.getByRole('button', { name: 'Menú' })).toHaveAttribute('aria-expanded', 'false');
});
