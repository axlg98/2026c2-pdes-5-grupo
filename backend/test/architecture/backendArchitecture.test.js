import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readSource = (file) => readFile(new URL(`../../${file}`, import.meta.url), 'utf8');

test('la aplicación está separada del arranque del servidor', async () => {
  const appSource = await readSource('app.js');
  const indexSource = await readSource('index.js');

  assert.doesNotMatch(appSource, /\.listen\s*\(/);
  assert.match(indexSource, /createApp/);
  assert.match(indexSource, /\.listen\s*\(/);
});

test('las rutas no contienen lógica de persistencia', async () => {
  const routesSource = await readSource('routes/hotelRoutes.js');

  assert.doesNotMatch(routesSource, /\.select\s*\(|\.insert\s*\(|pool/);
  assert.match(routesSource, /createHotelController/);
});

test('el controlador usa la abstracción de base inyectada', async () => {
  const controllerSource = await readSource('controllers/hotelController.js');

  assert.match(controllerSource, /createHotelController/);
  assert.match(controllerSource, /database\s*\.select/);
  assert.match(controllerSource, /database\s*\.insert/);
});
