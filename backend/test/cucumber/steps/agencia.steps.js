import { Given, When, Then, Before } from '@cucumber/cucumber';
import assert from 'node:assert';
import request from 'supertest';
import { createApp } from '../../../app.js';

const createDatabase = () => ({
  select() {
    return {
      from() {
        const query = Promise.resolve([
          { id: 1, nombre: 'Paquete Cucumber', destino: 'Buenos Aires' }
        ]);
        query.where = () => Promise.resolve([]);
        return query;
      }
    };
  },
  insert() {
    return {
      values(values) {
        return {
          returning: () => Promise.resolve([{ id: 2, ...values }])
        };
      }
    };
  }
});

let app;

Before(function () {
  app = createApp({ database: createDatabase(), healthCheck: async () => {} });
  this.response = null;
});

Given('Que la API de agencias está disponible', async function () {
  const res = await request(app).get('/health');
  assert.strictEqual(res.status, 200);
});

When('Consulto los paquetes', async function () {
  this.response = await request(app).get('/api/agencia/paquetes');
});

When('Creo un paquete llamado {string} con destino {string}', async function (nombre, destino) {
  this.response = await request(app)
    .post('/api/agencia/paquetes')
    .send({
      nombre, destino,
      origen: 'Buenos Aires',
      descripcion: 'Paquete de prueba',
      precio: 10500,
      hotel_id: 1,
      idUsuario: 1
    });
});


Then('la respuesta contiene el paquete {string}', function (nombre) {
  const nombres = this.response.body.map(p => p.nombre);
  assert.ok(nombres.includes(nombre), `No se encontró "${nombre}" entre: ${JSON.stringify(nombres)}`);
});

Then('el paquete creado se llama {string}', function (nombre) {
  assert.strictEqual(this.response.body.paquete.nombre, nombre);
});