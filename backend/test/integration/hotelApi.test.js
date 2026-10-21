import jwt from 'jsonwebtoken';
import assert from 'node:assert/strict';
import test, { after, before, describe } from 'node:test';
import { createApp } from '../../app.js';

process.env.JWT_SECRET ||= 'secreto-de-test';

const firmar = (payload) => jwt.sign(payload, process.env.JWT_SECRET);
const tokenAdmin = firmar({ id: 3, rol: 'admin' });
const tokenAgencia = firmar({ id: 5, rol: 'agencia' });

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

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

const request = (method, token, body) => ({
  method,
  headers: {
    ...(body && { 'Content-Type': 'application/json' }),
    ...(token && { Authorization: `Bearer ${token}` })
  },
  ...(body && { body: JSON.stringify(body) })
});

describe('API de Hotel.', () => {
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
    const response = await fetch(
      `${baseUrl}/api/hoteles`,
      request('POST', tokenAdmin, { nombre: 'Hotel Nuevo', destino: 'Cordoba' })
    );
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.hotel.nombre, 'Hotel Nuevo');
  });

  test('POST /api/hoteles responde 401 sin token', async () => {
    const response = await fetch(
      `${baseUrl}/api/hoteles`,
      request('POST', null, { nombre: 'Hotel Nuevo', destino: 'Cordoba' })
    );

    assert.equal(response.status, 401);
  });

  test('POST /api/hoteles responde 403 si el rol no es admin', async () => {
    const response = await fetch(
      `${baseUrl}/api/hoteles`,
      request('POST', tokenAgencia, { nombre: 'Hotel Nuevo', destino: 'Cordoba' })
    );

    assert.equal(response.status, 403);
  });
});