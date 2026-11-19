import { expect, test } from '@playwright/test';

const adminEmail = process.env.E2E_ADMIN_EMAIL || 'admin';
const adminPassword = process.env.E2E_ADMIN_PASSWORD || '123456';

async function login(request, email, password) {
  const response = await request.post('/api/auth/login', {
    data: { email, password }
  });

  expect(response.status()).toBe(200);
  return (await response.json()).token;
}

test.describe('APi de Hotel en E2E', () => {
    test('el backend responde en /health', async ({ request }) => {
      const response = await request.get('/health');
      
      expect(response.status()).toBe(200);
      expect(await response.json()).toEqual({ status: 'ok' });
    });

    test('un admin puede crear un hotel', async ({ request }) => {
      const token = await login(request, adminEmail, adminPassword);
      const nombre = `Hotel E2E ${Date.now()}`;
    
      const response = await request.post('/api/hoteles', {
        headers: { Authorization: `Bearer ${token}` },
        data: { nombre, destino: 'Mendoza' }
      });
    
      expect(response.status()).toBe(201);
      expect((await response.json()).hotel.nombre).toBe(nombre);
    });

    test('crear un hotel sin token responde 401', async ({ request }) => {
      const response = await request.post('/api/hoteles', {
        data: { nombre: 'Hotel sin token', destino: 'Salta' }
      });
    
      expect(response.status()).toBe(401);
    });
})



