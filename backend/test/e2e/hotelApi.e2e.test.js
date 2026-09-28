import assert from 'node:assert/strict';
import test from 'node:test';

const baseUrl = process.env.E2E_BASE_URL;
const options = baseUrl ? {} : { skip: 'E2E_BASE_URL no está configurada' };

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
  const createResponse = await fetch(`${baseUrl}/api/hoteles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(hotel)
  });
  const created = await createResponse.json();

  assert.equal(createResponse.status, 201);
  assert.equal(created.hotel.nombre, hotel.nombre);

  const listResponse = await fetch(`${baseUrl}/api/hoteles?destino=Mendoza`);
  const hotels = await listResponse.json();

  assert.equal(listResponse.status, 200);
  assert.ok(hotels.some((item) => item.id === created.hotel.id));
});
