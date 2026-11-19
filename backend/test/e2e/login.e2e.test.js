import { expect, test } from '@playwright/test';

test.use({ baseURL: 'http://localhost:5173' });

test('un comprador inicia sesión y abre Mis compras', async ({ page }) => {
  await page.route('**/api/auth/login', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        token: 'token-de-prueba',
        usuario: {
          usuario_id: 7,
          email: 'comprador@ctv.com',
          rol: 'comprador'
        }
      })
    })
  );

  await page.route('**/api/paquetes', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ paquetes: [] })
    })
  );

  await page.route('**/api/compras', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ compras: [] })
    })
  );

  await page.goto('/login');
  await page.getByLabel('Usuario o email').fill('comprador@ctv.com');
  await page.getByLabel('Contraseña').fill('clave-de-prueba');
  await page.getByRole('button', { name: 'Ingresar' }).click();

  await expect(page).toHaveURL(/paquetes$/);
  await page.getByRole('link', { name: 'Mis compras' }).click();

  await expect(page).toHaveURL(/compras$/);
  await expect(page.getByRole('heading', { name: 'Mis compras' })).toBeVisible();
  await expect(page.getByText('Todavía no realizaste compras.')).toBeVisible();
});