import { expect, test } from '@playwright/test';

const agenciaEmail = process.env.E2E_AGENCIA_EMAIL || 'agencia@ctv.com';
const agenciaPassword = process.env.E2E_AGENCIA_PASSWORD || 'agencia123';

async function login(request, email, password) {
  const response = await request.post('/api/auth/login', {
    data: { email, password }
  });

  expect(response.status()).toBe(200);
  return (await response.json()).token;
}

test.describe('API de Agencia', () => {
  test('una agencia puede consultar sus propios datos', async ({ request }) => {
    const token = await login(request, agenciaEmail, agenciaPassword);
    const response = await request.get('/api/agencia/mia', {
      headers: { Authorization: `Bearer ${token}` }
    });

    expect(response.status()).toBe(200);
    const { agencia } = await response.json();
    expect(agencia.nombre).toBeTruthy();
  });

  test('una agencia no puede listar todas las agencias', async ({ request }) => {
    const token = await login(request, agenciaEmail, agenciaPassword);
    const response = await request.get('/api/agencia/lista', {
      headers: { Authorization: `Bearer ${token}` }
    });

    expect(response.status()).toBe(403);
  });

    test('Una agencia puede consultar sus compras.', async({request}) =>{
        const token = await login(request, agenciaEmail, agenciaPassword);
        const response = await request.get('/api/agencia/compras', {
        headers: { Authorization:  `Bearer ${token}` }
        });
    
        expect(response.status()).toBe(200);
    
        const body = await response.json();
        expect(Array.isArray(body.compras)).toBe(true);
    })
});
