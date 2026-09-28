import assert from 'node:assert/strict';
import { After, Before, Given, Then, When } from '@cucumber/cucumber';
import { createApp } from '../../../app.js';

const createDatabase = () => ({
  select() {
    return {
      from() {
        const query = Promise.resolve([
          { id: 1, nombre: 'Hotel Cucumber', destino: 'Buenos Aires' }
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

Given('que la API de hoteles está disponible', function () {
  assert.ok(this.baseUrl);
});

Before(async function () {
  this.app = createApp({ database: createDatabase(), healthCheck: async () => {} });
  this.server = this.app.listen(0);
  await new Promise((resolve) => this.server.once('listening', resolve));
  this.baseUrl = `http://127.0.0.1:${this.server.address().port}`;
});

After(function () {
  this.server.close();
});

When('consulto los hoteles', async function () {
  this.response = await fetch(`${this.baseUrl}/api/hoteles`);
  this.responseBody = await this.response.json();
});

When('creo un hotel llamado {string} en {string}', async function (nombre, destino) {
  this.response = await fetch(`${this.baseUrl}/api/hoteles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, destino })
  });
  this.responseBody = await this.response.json();
});

Then('la respuesta tiene estado {int}', function (status) {
  assert.equal(this.response.status, status);
});

Then('la respuesta contiene el hotel {string}', function (nombre) {
  assert.ok(this.responseBody.some((hotel) => hotel.nombre === nombre));
});

Then('el hotel creado se llama {string}', function (nombre) {
  assert.equal(this.responseBody.hotel.nombre, nombre);
});
