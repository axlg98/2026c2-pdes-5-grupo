import jwt from 'jsonwebtoken';
import assert from 'node:assert/strict';
import test, { after, before, describe } from 'node:test';
import { createApp } from '../../app.js';
import { agencia } from '../../db/schema.js';

process.env.JWT_SECRET ||= 'secreto-de-test';

const firmar = (payload) => jwt.sign(payload, process.env.JWT_SECRET);
const tokenAgencia = firmar({ id: 3, rol: 'agencia' });
const tokenComprador = firmar({ id: 5, rol: 'comprador' });

const createDatabase = ({
  agencyRecord = { agencia_id: 7, user_id: 3 },
  packages = [{ paquete_id: 4, agencia_id: 7, nombre: 'Sur', precio: '1200' }]
} = {}) => ({
  select() {
    return {
      from(table) {
        return {
          where: async () => table === agencia
            ? (agencyRecord ? [agencyRecord] : [])
            : packages
        };
      }
    };
  },
  insert() {
    return {
      values(values) {
        return {
          returning: async () => [{ paquete_id: 8, ...values }]
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
              returning: async () => [{ paquete_id: 4, agencia_id: 7, ...values }]
            };
          }
        };
      }
    };
  },
  delete() {
    return {
      where() {
        return {
          returning: async () => [{ paquete_id: 4 }]
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

describe('API de agencia', () => {
  describe('autenticación y autorización', () => {
    test('responde 401 si no se envía token', async () => {
      const response = await fetch(`${baseUrl}/api/agencia/paquetes`, request('GET'));
      assert.equal(response.status, 401);
    });

    test('responde 401 si el token es inválido', async () => {
      const response = await fetch(`${baseUrl}/api/agencia/paquetes`, request('GET', 'token-falso'));
      assert.equal(response.status, 401);
    });

    test('responde 403 si el rol no es agencia', async () => {
      const response = await fetch(`${baseUrl}/api/agencia/paquetes`, request('GET', tokenComprador));
      assert.equal(response.status, 403);
    });
  });

  test('GET /api/agencia/paquetes => Devuelve los paquetes de la agencia', async () => {
    const response = await fetch(`${baseUrl}/api/agencia/paquetes`, request('GET', tokenAgencia));
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, {
      paquetes: [{ paquete_id: 4, agencia_id: 7, nombre: 'Sur', precio: '1200' }]
    });
  });

  test('GET /api/agencia/paquetes responde 403 si el usuario no tiene agencia', async () => {
    const appWithoutAgency = createApp({
      database: createDatabase({ agencyRecord: null }),
      healthCheck: async () => {}
    });
    const temporaryServer = appWithoutAgency.listen(0);
    await new Promise((resolve) => temporaryServer.once('listening', resolve));
    const urlTemporary = `http://127.0.0.1:${temporaryServer.address().port}`;
    try {
      const response = await fetch(`${urlTemporary}/api/agencia/paquetes`, request('GET', tokenAgencia));
      const body = await response.json();
      assert.equal(response.status, 403);
      assert.deepEqual(body, { error: 'El usuario no tiene una agencia' });
    } finally {
      await new Promise((resolve, reject) => {
        temporaryServer.close((err) => (err ? reject(err) : resolve()));
      });
    }
  });

  test('POST /api/agencia/paquetes crea un paquete', async () => {
    const paquete = {
      nombre: 'Escapada al Sur',
      destino: 'Tierra del Fuego',
      origen: 'Buenos Aires',
      descripcion: 'Viaje de fin de semana',
      precio: 2500
    };
    const response = await fetch(
      `${baseUrl}/api/agencia/paquetes`,
      request('POST', tokenAgencia, paquete)
    );
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.paquete.nombre, paquete.nombre);
    assert.equal(body.paquete.agencia_id, 7);
  });

  test('POST /api/agencia/paquetes => Responde 400 si faltan datos obligatorios', async () => {
    const response = await fetch(
      `${baseUrl}/api/agencia/paquetes`,
      request('POST', tokenAgencia, { nombre: 'Paquete Incompleto' })
    );
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(body, { error: 'Faltan datos obligatorios del paquete' });
  });

  test('PUT /api/agencia/paquetes/:paquete_id => Actualiza un paquete', async () => {
    const cambios = {
      nombre: 'Nuevo Sur',
      destino: 'Bariloche',
      origen: 'Corrientes',
      descripcion: 'Se actualizó el nuevo viaje',
      precio: 2000
    };
    const resp = await fetch(
      `${baseUrl}/api/agencia/paquetes/4`,
      request('PUT', tokenAgencia, cambios)
    );
    const body = await resp.json();

    assert.equal(resp.status, 200);
    assert.equal(body.paquete.nombre, cambios.nombre);
    assert.equal(body.paquete.destino, cambios.destino);
  });

  test('DELETE /api/agencia/paquetes/:paquete_id => Elimina un paquete', async () => {
    const resp = await fetch(
      `${baseUrl}/api/agencia/paquetes/4`,
      request('DELETE', tokenAgencia)
    );
    const body = await resp.json();

    assert.equal(resp.status, 200);
    assert.deepEqual(body.paquete, { paquete_id: 4 });
  });
});