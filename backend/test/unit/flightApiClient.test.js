import test from 'node:test';
import assert from 'node:assert/strict';
import { createFlightApiClient } from '../../services/flightApiClient.js';

process.env.JWT_SECRET ||= 'secreto-de-test';

test('CTV envia un JWT Bearer a la API de vuelos', async () => {
  let authorization;
  const client = createFlightApiClient({
    baseUrl: 'http://flights-api:3001',
    fetchImpl: async (_url, options) => {
      authorization = options.headers.Authorization;
      return {
        ok: true,
        json: async () => ({
          vuelo: { id: 10, disponibilidad: 100 }
        })
      };
    }
  });

  const flight = await client.getFlight(10);

  assert.equal(flight.id, 10);
  assert.match(authorization, /^Bearer [^.]+\.[^.]+\.[^.]+$/);
});
