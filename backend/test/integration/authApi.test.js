import jwt from 'jsonwebtoken';
import assert from 'node:assert/strict';
import test, { after, before } from 'node:test';
import { createApp } from '../../app.js';
import { usuarios } from '../../db/schema.js';

process.env.JWT_SECRET ||= 'secreto-de-test';
const tokenAdmin = jwt.sign({ id: 1, rol: 'admin' }, process.env.JWT_SECRET);
const tokenComprador = jwt.sign({ id: 5, rol: 'comprador' }, process.env.JWT_SECRET);

const createDatabase = () => ({
  select() {
    return {
      from(table) {
        const chain = {
          where: async () => table === usuarios
            ? [{ id: 5, nombre: 'Comprador Demo', email: 'comprador@ctv.com', rol: 'comprador', activo: true }]
            : [],
          orderBy: async () => table === usuarios
            ? [
                { id: 1, nombre: 'Admin', email: 'admin', rol: 'admin', activo: true },
                { id: 5, nombre: 'Comprador Demo', email: 'comprador@ctv.com', rol: 'comprador', activo: true }
              ]
            : []
        };
        return chain;
      }
    };
  },
  insert() {
    return {
      values(values) {
        return {
          returning: async () => [{
            id: 8,
            nombre: values.nombre,
            email: values.email,
            rol: values.rol,
            activo: true
          }]
        };
      }
    };
  },
  update() {
    return {
      set(values) {
        return {
          where() {
            return {
              returning: async () => [{
                id: 5,
                nombre: values.nombre ?? 'Comprador Demo',
                email: values.email ?? 'comprador@ctv.com',
                rol: values.rol ?? 'comprador',
                activo: values.activo ?? true
              }]
            };
          }
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

test('GET /api/auth/users requiere administrador', async () => {
  const denied = await fetch(`${baseUrl}/api/auth/users`, request('GET', tokenComprador));
  assert.equal(denied.status, 403);

  const allowed = await fetch(`${baseUrl}/api/auth/users`, request('GET', tokenAdmin));
  const body = await allowed.json();
  assert.equal(allowed.status, 200);
  assert.equal(body.usuarios.length, 2);
});

test('GET /api/auth/users/:id devuelve un usuario', async () => {
  const response = await fetch(`${baseUrl}/api/auth/users/5`, request('GET', tokenAdmin));
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.usuario.id, 5);
});

test('POST /api/auth/users crea un usuario', async () => {
  const response = await fetch(`${baseUrl}/api/auth/users`, request('POST', tokenAdmin, {
    nombre: 'Nueva Agencia',
    email: 'nueva@agencia.com',
    password: 'clave123',
    rol: 'agencia'
  }));
  const body = await response.json();
  assert.equal(response.status, 201);
  assert.equal(body.usuario.rol, 'agencia');
});

test('PUT /api/auth/users/:id modifica un usuario', async () => {
  const response = await fetch(`${baseUrl}/api/auth/users/5`, request('PUT', tokenAdmin, {
    nombre: 'Comprador Editado',
    email: 'comprador@ctv.com',
    rol: 'comprador',
    activo: true
  }));
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.usuario.nombre, 'Comprador Editado');
});

test('DELETE /api/auth/users/:id desactiva un usuario', async () => {
  const response = await fetch(`${baseUrl}/api/auth/users/5`, request('DELETE', tokenAdmin));
  assert.ok([200, 409].includes(response.status));
});
