import assert from 'node:assert/strict';
import test from 'node:test';
import { createHotelController } from '../controllers/hotelController.js';

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

const createDatabase = ({ hotels = [], filteredHotels = hotels, createdHotel } = {}) => ({
  select() {
    return {
      from() {
        const query = Promise.resolve(hotels);
        query.where = () => Promise.resolve(filteredHotels);
        return query;
      }
    };
  },
  insert() {
    return {
      values() {
        return {
          returning: () => Promise.resolve([createdHotel])
        };
      }
    };
  }
});

test('obtiene todos los hoteles', async () => {
  const hotels = [{ id: 1, nombre: 'Hotel Central', destino: 'Buenos Aires' }];
  const controller = createHotelController(createDatabase({ hotels }));
  const response = createResponse();

  await controller.obtenerHoteles({ query: {} }, response);

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, hotels);
});

test('filtra hoteles por destino', async () => {
  const filteredHotels = [{ id: 2, nombre: 'Hotel Norte', destino: 'Salta' }];
  const controller = createHotelController(createDatabase({ filteredHotels }));
  const response = createResponse();

  await controller.obtenerHoteles({ query: { destino: 'Salta' } }, response);

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, filteredHotels);
});

test('rechaza un hotel sin nombre o destino', async () => {
  const controller = createHotelController(createDatabase());
  const response = createResponse();

  await controller.crearHotel({ body: { nombre: 'Hotel incompleto' } }, response);

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body, {
    error: 'El nombre y el destino son obligatorios.'
  });
});

test('crea un hotel válido', async () => {
  const createdHotel = {
    id: 3,
    nombre: 'Hotel Centro',
    destino: 'Cordoba',
    foto: null
  };
  const controller = createHotelController(createDatabase({ createdHotel }));
  const response = createResponse();

  await controller.crearHotel({
    body: { nombre: 'Hotel Centro', destino: 'Cordoba', foto: null }
  }, response);

  assert.equal(response.statusCode, 201);
  assert.deepEqual(response.body.hotel, createdHotel);
});

test('devuelve error 500 si falla la consulta', async () => {
  const database = {
    select: () => ({
      from: async () => {
        throw new Error('database unavailable');
      }
    })
  };
  const controller = createHotelController(database);
  const response = createResponse();

  await controller.obtenerHoteles({ query: {} }, response);

  assert.equal(response.statusCode, 500);
  assert.deepEqual(response.body, { error: 'database unavailable' });
});
