import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { createCompraController } from '../../controllers/compraController.js';
import { compra, paquete } from '../../db/schema.js';

const createResponse = () => ({
  statusCode: 200,
  body: undefined,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; }
});

const paqueteDemo = {
  paquete_id: 1,
  agencia_id: 7,
  hotel_id: 3,
  vuelo_ida_id: 10,
  vuelo_vuelta_id: 11,
  fecha_ida: '2027-01-15',
  fecha_vuelta: '2027-01-22',
  precio: '285000'
};

const createDatabase = ({
  persistError = null,
  purchases = [],
  purchaseRecord = null
} = {}) => ({
  select() {
    return {
      from(table) {
        if (table === paquete) {
          return { where: async () => [paqueteDemo] };
        }
        return {
          where: async () => purchaseRecord ? [purchaseRecord] : purchases,
          orderBy: async () => purchases
        };
      }
    };
  },
  transaction: async (callback) => {
    if (persistError) throw persistError;
    return callback({
      insert(table) {
        assert.equal(table, compra);
        return {
          values(values) {
            return {
              returning: async () => [{
                compra_id: 44,
                ...values
              }]
            };
          }
        };
      }
    });
  },
  update(table) {
    return {
      set(values) {
        return {
          where() {
            return {
              returning: async () => [{
                compra_id: purchaseRecord?.compra_id ?? 44,
                user_id: 5,
                estado: 'activa',
                ...values
              }]
            };
          }
        };
      }
    };
  }
});

describe('Compras', () => {
  test('compra ambos vuelos y registra el precio histórico', async () => {
    const sold = [];
    const refunded = [];
    const controller = createCompraController(createDatabase(), {
      flightApiClient: {
        sellFlight: async (id) => {
          sold.push(id);
          return { id: id === 10 ? 101 : 102 };
        },
        refundFlight: async (id, ventaId) => refunded.push({ id, ventaId })
      }
    });
    const res = createResponse();
    await controller.comprar({
      user: { id: 5, rol: 'comprador' },
      body: { paquete_id: 1, nombre_pasajero: 'Juan Perez' }
    }, res);

    assert.equal(res.statusCode, 201);
    assert.deepEqual(sold, [10, 11]);
    assert.deepEqual(refunded, []);
    assert.equal(res.body.compra.precio_pagado, '285000');
    assert.equal(res.body.compra.venta_vuelo_ida_id, 101);
    assert.equal(res.body.compra.venta_vuelo_vuelta_id, 102);
  });

  test('revierte la venta de ida si falla la venta de vuelta', async () => {
    const refunded = [];
    const controller = createCompraController(createDatabase(), {
      flightApiClient: {
        sellFlight: async (id) => {
          if (id === 11) {
            const error = new Error('Sin disponibilidad');
            error.status = 409;
            throw error;
          }
          return { id: 101 };
        },
        refundFlight: async (id, ventaId) => refunded.push({ id, ventaId })
      }
    });
    const res = createResponse();
    await controller.comprar({
      user: { id: 5 },
      body: { paquete_id: 1, nombre_pasajero: 'Juan Perez' }
    }, res);

    assert.equal(res.statusCode, 500);
    assert.deepEqual(refunded, [{ id: 10, ventaId: 101 }]);
  });

  test('reembolsa ambos vuelos si falla la persistencia de la compra', async () => {
    const refunded = [];
    const controller = createCompraController(createDatabase({ persistError: new Error('DB') }), {
      flightApiClient: {
        sellFlight: async (id) => ({ id: id === 10 ? 101 : 102 }),
        refundFlight: async (id, ventaId) => refunded.push({ id, ventaId })
      }
    });
    const res = createResponse();
    await controller.comprar({
      user: { id: 5 },
      body: { paquete_id: 1, nombre_pasajero: 'Juan Perez' }
    }, res);

    assert.equal(res.statusCode, 500);
    assert.deepEqual(refunded, [
      { id: 10, ventaId: 101 },
      { id: 11, ventaId: 102 }
    ]);
  });

  test('rechaza una compra sin pasajero', async () => {
    const controller = createCompraController(createDatabase());
    const res = createResponse();
    await controller.comprar({
      user: { id: 5 },
      body: { paquete_id: 1 }
    }, res);

    assert.equal(res.statusCode, 400);
  });

  test('devuelve el historial del comprador', async () => {
    const controller = createCompraController({
      select() {
        return {
          from() {
            return {
              where() {
                return {
                  orderBy: async () => [{
                    compra_id: 44,
                    user_id: 5,
                    precio_pagado: '285000'
                  }]
                };
              },
              orderBy: async () => [{
                compra_id: 44,
                user_id: 5,
                precio_pagado: '285000'
              }]
            };
          }
        };
      }
    });
    const res = createResponse();
    await controller.listarMisCompras({
      user: { id: 5, rol: 'comprador' }
    }, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.compras.length, 1);
    assert.equal(res.body.compras[0].precio_pagado, '285000');
  });

  test('modifica el nombre del pasajero de una compra activa', async () => {
    const controller = createCompraController(createDatabase({
      purchaseRecord: {
        compra_id: 44,
        user_id: 5,
        estado: 'activa',
        nombre_pasajero: 'Juan Perez'
      }
    }));
    const res = createResponse();
    await controller.modificarCompra({
      user: { id: 5, rol: 'comprador' },
      params: { compra_id: '44' },
      body: { nombre_pasajero: 'Juan Carlos Perez' }
    }, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.compra.nombre_pasajero, 'Juan Carlos Perez');
  });

  test('impide modificar una compra cancelada', async () => {
    const controller = createCompraController(createDatabase({
      purchaseRecord: {
        compra_id: 44,
        user_id: 5,
        estado: 'cancelada'
      }
    }));
    const res = createResponse();
    await controller.modificarCompra({
      user: { id: 5, rol: 'comprador' },
      params: { compra_id: '44' },
      body: { nombre_pasajero: 'Juan Perez' }
    }, res);

    assert.equal(res.statusCode, 409);
  });

  test('cancela una compra y reembolsa ambos vuelos', async () => {
    const refunded = [];
    const controller = createCompraController(createDatabase({
      purchaseRecord: {
        compra_id: 44,
        user_id: 5,
        estado: 'activa',
        vuelo_ida_id: 10,
        vuelo_vuelta_id: 11,
        venta_vuelo_ida_id: 101,
        venta_vuelo_vuelta_id: 102
      }
    }), {
      flightApiClient: {
        refundFlight: async (flightId, saleId) => refunded.push({ flightId, saleId })
      }
    });
    const res = createResponse();
    await controller.cancelarCompra({
      user: { id: 5, rol: 'comprador' },
      params: { compra_id: '44' }
    }, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(refunded, [
      { flightId: 10, saleId: 101 },
      { flightId: 11, saleId: 102 }
    ]);
  });
});
