import jwt from 'jsonwebtoken';
import assert from 'node:assert/strict';
import test, { after, before } from 'node:test';
import { createApp } from '../../app.js';
import { compra } from '../../db/schema.js';

process.env.JWT_SECRET ||= 'secreto-de-test';

const tokenComprador = jwt.sign(
  { id: 5, rol: 'comprador' },
  process.env.JWT_SECRET
);
const tokenAgencia = jwt.sign(
  { id: 7, rol: 'agencia' },
  process.env.JWT_SECRET
);

const createDatabase = () => ({
  select() {
    return {
      from(table) {
        const result = Promise.resolve(table === compra
          ? [{ compra_id: 44, user_id: 5, precio_pagado: '285000' }]
          : []);
        result.orderBy = async () => table === compra
          ? [{ compra_id: 44, user_id: 5, precio_pagado: '285000' }]
          : [];
        return {
          where: () => result,
          orderBy: async () => table === compra
            ? [{ compra_id: 44, user_id: 5, precio_pagado: '285000' }]
            : []
        };
      }
    };
  }
});

const app = createApp({
  database: createDatabase(),
  healthCheck: async () => {}
});
let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

const request = (method, token, body) => ({
  method,
  headers: {
    ...(body && { 'Content-Type': 'application/json' }),
    ...(token && { Authorization: `Bearer ${token}` })
  },
  ...(body && { body: JSON.stringify(body) })
});

test('POST /api/compras responde 401 sin autenticación', async () => {
  const response = await fetch(`${baseUrl}/api/compras`, request('POST', null, {
    paquete_id: 1,
    nombre_pasajero: 'Juan Perez'
  }));
  assert.equal(response.status, 401);
});

test('POST /api/compras responde 403 a una agencia', async () => {
  const response = await fetch(`${baseUrl}/api/compras`, request('POST', tokenAgencia, {
    paquete_id: 1,
    nombre_pasajero: 'Juan Perez'
  }));
  assert.equal(response.status, 403);
});

test('GET /api/compras devuelve el historial del comprador', async () => {
  const response = await fetch(`${baseUrl}/api/compras`, request('GET', tokenComprador));
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.compras[0].compra_id, 44);
  assert.equal(body.compras[0].precio_pagado, '285000');
});

test('PUT /api/compras/:id requiere pasajero', async () => {
  const response = await fetch(
    `${baseUrl}/api/compras/44`,
    request('PUT', tokenComprador, {})
  );
  assert.equal(response.status, 400);
});

test('DELETE /api/compras/:id exige comprador o administrador', async () => {
  const response = await fetch(
    `${baseUrl}/api/compras/44`,
    request('DELETE', tokenComprador)
  );
  assert.ok([200, 404, 502].includes(response.status));
});
