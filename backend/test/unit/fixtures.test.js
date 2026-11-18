import test from 'node:test';
import assert from 'node:assert/strict';
import { fixtureHotels, fixtureUsers } from '../../fixtures.js';

test('fixtures incluyen varios compradores y agencias', () => {
  const buyers = fixtureUsers.filter((user) => user.rol === 'comprador');
  const agencies = fixtureUsers.filter((user) => user.rol === 'agencia');

  assert.ok(buyers.length >= 4);
  assert.ok(agencies.length >= 3);
});

test('fixtures incluyen hoteles reutilizables', () => {
  assert.ok(fixtureHotels.length >= 3);
  assert.ok(fixtureHotels.every((hotel) => hotel.nombre && hotel.destino));
});
