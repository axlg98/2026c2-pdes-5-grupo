import assert from 'node:assert/strict';
import test, { before } from 'node:test';

const baseUrl = process.env.E2E_BASE_URL;
const options = baseUrl ? {} : { skip: 'E2E_BASE_URL no está configurada' };

const adminEmail = process.env.E2E_ADMIN_EMAIL ?? 'admin@ctv.com';
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? 'admin1234';

const postJson = (path, body, token) =>
  fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    },
    body: JSON.stringify(body)
  });

let tokenAdmin;

before(async () => {
  if (!baseUrl) return; // si el E2E está salteado, no hay nada que preparar
  const response = await postJson('/api/auth/login', { email: adminEmail, password: adminPassword });
  const body = await response.json();
  assert.equal(response.status, 200, `No se pudo loguear el admin: ${JSON.stringify(body)}`);
  tokenAdmin = body.token;
});

test('E2E: el backend responde en /health', options, async () => {
  const response = await fetch(`${baseUrl}/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body, { status: 'ok' });
});

test('E2E: se puede crear y consultar un hotel', options, async () => {
  const hotel = {
    nombre: `Hotel E2E ${Date.now()}`,
    destino: 'Mendoza'
  };
  const createResponse = await postJson('/api/hoteles', hotel, tokenAdmin);
  const created = await createResponse.json();

  assert.equal(createResponse.status, 201);
  assert.equal(created.hotel.nombre, hotel.nombre);

  const listResponse = await fetch(`${baseUrl}/api/hoteles?destino=Mendoza`);
  const hotels = await listResponse.json();

  assert.equal(listResponse.status, 200);
  assert.ok(hotels.some((item) => item.id === created.hotel.id));
});

test('E2E: crear un hotel sin token responde 401', options, async () => {
  const response = await postJson('/api/hoteles', { nombre: 'Hotel sin token', destino: 'Salta' });
  assert.equal(response.status, 401);
});

test('E2E: un comprador registrado no puede crear hoteles (403)', options, async () => {
  const credenciales = {
    nombre: 'Comprador E2E',
    email: `comprador-${Date.now()}@test.com`,
    password: 'comprador123'
  };

  const registro = await postJson('/api/auth/register', credenciales);
  assert.equal(registro.status, 201);

  const login = await postJson('/api/auth/login', {
    email: credenciales.email,
    password: credenciales.password
  });
  const { token } = await login.json();

  const response = await postJson('/api/hoteles', { nombre: 'Hotel prohibido', destino: 'Salta' }, token);
  assert.equal(response.status, 403);
});