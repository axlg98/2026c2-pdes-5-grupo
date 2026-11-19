import assert from 'node:assert/strict';
import test, { describe, beforeEach } from 'node:test';
import { createPaqueteController } from '../../controllers/paqueteController.js';

const createResponse = () => ({
  statusCode: 200,
  body: undefined,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    this.body = payload;
    return this;
  }
});

const createDatabase = ({ paquetes = [], error = null } = {}) => ({
  select() {
    return {
      from() {
        const chain = {
          innerJoin() {
            return chain;
          },
          where: async () => {
            if (error) throw error;
            return paquetes;
          }
        };
        return chain;
      }
    };
  }
});

describe('listar Paquetes', () => {
  let res;

  beforeEach(() => {
    res = createResponse();
  });

  test('200 devuelve todos los paquetes ordenados por precio', async () => {
    const paquetes = [
      { paquete_id: 2, nombre: 'Mendoza', precio: '198000' },
      { paquete_id: 1, nombre: 'Bariloche', precio: '285000' }
    ];
    const controller = createPaqueteController(createDatabase({ paquetes }));

    await controller.listarPublico({ query: {} }, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(
      res.body.paquetes.map((paquete) => paquete.paquete_id),
      [2, 1]
    );
  });

  test('aplica min precio y max precio', async () => {
    const paquetes = [
      { paquete_id: 1, nombre: 'Barato', precio: '100000' },
      { paquete_id: 2, nombre: 'Medio', precio: '200000' },
      { paquete_id: 3, nombre: 'Caro', precio: '300000' }
    ];
    const controller = createPaqueteController(createDatabase({ paquetes }));

    await controller.listarPublico({
      query: { precioMin: '150000', precioMax: '250000' }
    }, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(
      res.body.paquetes.map((paquete) => paquete.paquete_id),
      [2]
    );
  });

  test('conserva los límites de precio inclusivos', async () => {
    const paquetes = [
      { paquete_id: 1, nombre: 'Mínimo', precio: '100000' },
      { paquete_id: 2, nombre: 'Máximo', precio: '300000' }
    ];
    const controller = createPaqueteController(createDatabase({ paquetes }));

    await controller.listarPublico({
      query: { precioMin: '100000', precioMax: '300000' }
    }, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.paquetes.length, 2);
  });

  test('500 si falla la consulta', async (context) => {
    context.mock.method(console, 'error', () => {});
    const controller = createPaqueteController(createDatabase({
      error: new Error('base caída')
    }));

    await controller.listarPublico({ query: {} }, res);

    assert.equal(res.statusCode, 500);
    assert.equal(res.body.error, 'No se pudieron consultar los paquetes.');
  });
});