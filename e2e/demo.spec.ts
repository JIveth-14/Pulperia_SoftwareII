import { expect, test } from '@playwright/test';
import { navegacion } from './utilidades';

test('la demo entra con credenciales, navega sin perder la sesión y sale', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Ver demo' }).click();
  await page.getByLabel('Correo electrónico').fill('demo@app.com');
  await page.getByLabel('Contraseña').fill('Demo2026!');
  await page.getByRole('button', { name: 'Entrar a la demo' }).click();

  await expect(page).toHaveURL(/\/demo$/);
  for (const seccion of ['Clientes', 'Productos', 'Ventas', 'Dashboard']) {
    await navegacion(page).getByRole('link', { name: seccion, exact: true }).click();
    await expect(page.getByRole('heading', { level: 1, name: seccion })).toBeVisible();
  }

  await navegacion(page).getByRole('link', { name: 'Clientes', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Nuevo cliente' })).toBeDisabled();
  await expect(page.getByText(/Solo lectura/)).toBeVisible();

  await navegacion(page).getByRole('link', { name: 'Salir' }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto('/demo/clientes');
  await expect(page).toHaveURL(/\/demo\/login$/);
});

test('credenciales demo incorrectas', async ({ page }) => {
  await page.goto('/demo/login');
  await page.getByLabel('Correo electrónico').fill('demo@app.com');
  await page.getByLabel('Contraseña').fill('mala');
  await page.getByRole('button', { name: 'Entrar a la demo' }).click();

  await expect(page.getByRole('alert')).toContainText('Credenciales demo incorrectas');
});
