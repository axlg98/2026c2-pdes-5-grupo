import assert from 'node:assert/strict';
import test, { after, before } from 'node:test';
import { createApp } from '../../app.js';

const createDatabase = () => ({
  select() {
    return {
      from() {
        const query = Promise.resolve([{ id: 1, nombre: 'Hotel Central', destino: 'Buenos Aires' }]);
        query.where = () => Promise.resolve([{ id: 2, nombre: 'Hotel Norte', destino: 'Salta' }]);
        return query;
      }
    };
  },
  insert() {
    return {
      values(values) {
        return {
          returning: () => Promise.resolve([{ id: 3, ...values }])
        };
      }
    };
  }
});

const app = createApp({ database: createDatabase(), healthCheck: async () => {} });
let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

test('GET /health responde correctamente', async () => {
  const response = await fetch(`${baseUrl}/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body, { status: 'ok' });
});

test('GET /api/hoteles devuelve hoteles', async () => {
  const response = await fetch(`${baseUrl}/api/hoteles`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body[0].nombre, 'Hotel Central');
});

test('POST /api/hoteles crea un hotel', async () => {
  const response = await fetch(`${baseUrl}/api/hoteles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre: 'Hotel Nuevo', destino: 'Cordoba' })
  });
  const body = await response.json();

  assert.equal(response.status, 201);
  assert.equal(body.hotel.nombre, 'Hotel Nuevo');
});
