import { expect, test } from '@playwright/test';
import { CREDENCIALES, reiniciarDatos } from './utilidades';

test.beforeEach(async () => {
  await reiniciarDatos();
});

test('sin sesión, las páginas privadas llevan al login', async ({ page }) => {
  for (const ruta of ['/dashboard', '/clientes/3', '/ventas/nueva']) {
    await page.goto(ruta);
    await expect(page).toHaveURL(/\/login$/);
  }
});

test('credenciales incorrectas muestran un error genérico', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill(CREDENCIALES.email);
  await page.getByLabel('Contraseña').fill('otra-clave-123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();

  await expect(page.getByRole('alert')).toHaveText('Email o contraseña incorrecta');
  await expect(page).toHaveURL(/\/login$/);
});

test('inicia sesión, navega y cierra sesión', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill(CREDENCIALES.email);
  await page.getByLabel('Contraseña').fill(CREDENCIALES.password);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();
  await expect(page.getByText(CREDENCIALES.email)).toBeVisible();

  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL(/\/login$/);
});
