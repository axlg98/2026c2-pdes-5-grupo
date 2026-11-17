import assert from 'node:assert/strict';
import test, { after, before } from 'node:test';
import { createApp } from '../../app.js';

const paquetes = [
  {
    paquete_id: 1,
    nombre: 'Bariloche de ensueño',
    descripcion: 'Patagonia',
    origen: 'Buenos Aires',
    destino: 'Bariloche',
    precio: '285000',
    hotel_id: 1,
    hotel: 'Hotel Catedral',
    hotelFoto: 'hotel.jpg',
    vuelo_ida_id: 1,
    vuelo_vuelta_id: 2,
    fecha_ida: '2027-01-15',
    fecha_vuelta: '2027-01-22',
    agencia: 'Agencia Andes'
  },
  {
    paquete_id: 2,
    nombre: 'Mendoza y sus vinos',
    descripcion: 'Vinos',
    origen: 'Buenos Aires',
    destino: 'Mendoza',
    precio: '198000',
    hotel_id: 2,
    hotel: 'Hotel Mendoza Plaza',
    hotelFoto: null,
    vuelo_ida_id: 3,
    vuelo_vuelta_id: 4,
    fecha_ida: '2027-02-10',
    fecha_vuelta: '2027-02-17',
    agencia: 'Agencia Andes'
  }
];

const createDatabase = () => ({
  select() {
    return {
      from() {
        const chain = {
          innerJoin() { return chain; },
          where() { return Promise.resolve(paquetes); }
        };
        return chain;
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
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test('GET /api/paquetes lista paquetes sin autenticación', async () => {
  const response = await fetch(`${baseUrl}/api/paquetes`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.paquetes.length, 2);
  assert.equal(body.paquetes[0].vuelo_ida_id, 3);
  assert.equal(body.paquetes[0].vuelo_vuelta_id, 4);
});

test('GET /api/paquetes aplica el rango de precios', async () => {
  const response = await fetch(`${baseUrl}/api/paquetes?precioMin=200000&precioMax=300000`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.deepEqual(body.paquetes.map((item) => item.nombre), ['Bariloche de ensueño']);
});
