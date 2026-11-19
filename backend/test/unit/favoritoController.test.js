import assert from 'node:assert/strict';
import test, { describe, beforeEach } from 'node:test';
import { createFavoritoController } from '../../controllers/favoritoController.js';

const createResponse = () => ({
  statusCode: 200,
  body: undefined,
  status(code) { this.statusCode = code; return this; },
  json(payload) { this.body = payload; return this; }
});


const createDatabase = ({
  rows = [], insertResult = [], updateResult = [], deleteResult = [], error = null
} = {}) => {
  const llamadas = {};
  const fallar = () => { if (error) throw error; };

  const consulta = {
    then: (resolve, reject) => (error ? reject(error) : resolve(rows))
  };
  for (const metodo of ['from', 'innerJoin', 'where']) {
    consulta[metodo] = () => consulta;
  }

  return {
    llamadas,
    select: () => consulta,
    insert: () => ({
      values: (values) => {
        llamadas.insert = values;
        return { returning: async () => { fallar(); return insertResult; } };
      }
    }),
    update: () => ({
      set: (values) => {
        llamadas.update = values;
        return { where: () => ({ returning: async () => { fallar(); return updateResult; } }) };
      }
    }),
    delete: () => ({
      where: () => ({ returning: async () => { fallar(); return deleteResult; } })
    })
  };
};

const user = { id: 5, rol: 'comprador' };
const errorPg = (code) => Object.assign(new Error('error de base'), { cause: { code } });

describe('obtenerPaquetes', () => {
  let res;
  beforeEach(() => { res = createResponse(); });

  test('200 con los paquetes', async () => {
    const paquetes = [{ paquete_id: 1, nombre: 'Sur', origen: 'Buenos Aires', destino: 'Bariloche', precio: '850000' }];
    const { obtenerPaquetes } = createFavoritoController(createDatabase({ rows: paquetes }));

    await obtenerPaquetes({ user }, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { paquetes });
  });

  test('500 si falla la base', async () => {
    const { obtenerPaquetes } = createFavoritoController(createDatabase({ error: new Error('caída') }));

    await obtenerPaquetes({ user }, res);

    assert.equal(res.statusCode, 500);
  });
});

describe('guardarFavorito', () => {
  let res;
  beforeEach(() => { res = createResponse(); });

  for (const valor of [undefined, 'abc', 0, -3, 1.5]) {
    test(`400 si el paquete_id no es un entero positivo (${String(valor)})`, async () => {
      const { guardarFavorito } = createFavoritoController(createDatabase());

      await guardarFavorito({ user, body: { paquete_id: valor } }, res);

      assert.equal(res.statusCode, 400);
    });
  }

  test('400 si la request no trae body', async () => {
    const { guardarFavorito } = createFavoritoController(createDatabase());

    await guardarFavorito({ user }, res);

    assert.equal(res.statusCode, 400);
  });

  test('201 y guarda el favorito con el usuario del token', async () => {
    const creado = { favorito_id: 1, user_id: 5, paquete_id: 4 };
    const database = createDatabase({ insertResult: [creado] });
    const { guardarFavorito } = createFavoritoController(database);

    await guardarFavorito({ user, body: { paquete_id: 4, user_id: 999 } }, res);

    assert.equal(res.statusCode, 201);
    assert.deepEqual(res.body.favorito, creado);
    assert.deepEqual(database.llamadas.insert, { user_id: 5, paquete_id: 4 });
  });

  test('409 si el paquete ya está en favoritos', async () => {
    const { guardarFavorito } = createFavoritoController(createDatabase({ error: errorPg('23505') }));

    await guardarFavorito({ user, body: { paquete_id: 4 } }, res);

    assert.equal(res.statusCode, 409);
  });

  test('404 si el paquete no existe', async () => {
    const { guardarFavorito } = createFavoritoController(createDatabase({ error: errorPg('23503') }));

    await guardarFavorito({ user, body: { paquete_id: 999 } }, res);

    assert.equal(res.statusCode, 404);
  });

  test('500 con un mensaje genérico si falla la base', async (t) => {
    t.mock.method(console, 'error', () => {});
    const { guardarFavorito } = createFavoritoController(createDatabase({ error: new Error('detalle interno') }));

    await guardarFavorito({ user, body: { paquete_id: 4 } }, res);

    assert.equal(res.statusCode, 500);
    assert.equal(res.body.error, 'No se pudo guardar el favorito.');
  });
});

describe('obtenerMisFavoritos', () => {
  let res;
  beforeEach(() => { res = createResponse(); });

  test('200 con los favoritos del comprador', async () => {
    const favoritos = [{ favorito_id: 1, nombre: 'Sur', destino: 'Bariloche', puntaje: 8, comentario: 'Lindo' }];
    const { obtenerMisFavoritos } = createFavoritoController(createDatabase({ rows: favoritos }));

    await obtenerMisFavoritos({ user }, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { favoritos });
  });

  test('500 si falla la base', async () => {
    const { obtenerMisFavoritos } = createFavoritoController(createDatabase({ error: new Error('caída') }));

    await obtenerMisFavoritos({ user }, res);

    assert.equal(res.statusCode, 500);
  });
});

describe('modificarFavoritos', () => {
  let res;
  beforeEach(() => { res = createResponse(); });
  const params = { favorito_id: '1' };

  test('400 si no se envía puntaje ni comentario', async () => {
    const { modificarFavoritos } = createFavoritoController(createDatabase());

    await modificarFavoritos({ user, params, body: {} }, res);

    assert.equal(res.statusCode, 400);
  });

  test('400 si la request no trae body', async () => {
    const { modificarFavoritos } = createFavoritoController(createDatabase());

    await modificarFavoritos({ user, params }, res);

    assert.equal(res.statusCode, 400);
  });

  for (const puntaje of [-1, 11, 'abc']) {
    test(`400 si el puntaje no está entre 0 y 10 (${puntaje})`, async () => {
      const { modificarFavoritos } = createFavoritoController(createDatabase());

      await modificarFavoritos({ user, params, body: { puntaje } }, res);

      assert.equal(res.statusCode, 400);
    });
  }

  for (const puntaje of [0, 10]) {
    test(`200 con puntaje ${puntaje} (valor límite válido)`, async () => {
      const database = createDatabase({ updateResult: [{ favorito_id: 1, puntaje }] });
      const { modificarFavoritos } = createFavoritoController(database);

      await modificarFavoritos({ user, params, body: { puntaje } }, res);

      assert.equal(res.statusCode, 200);
      assert.deepEqual(database.llamadas.update, { puntaje });
    });
  }

  test('200 con solo comentario, sin tocar el puntaje', async () => {
    const database = createDatabase({ updateResult: [{ favorito_id: 1, comentario: 'Muy bueno' }] });
    const { modificarFavoritos } = createFavoritoController(database);

    await modificarFavoritos({ user, params, body: { comentario: 'Muy bueno' } }, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(database.llamadas.update, { comentario: 'Muy bueno' });
  });

  test('200 con puntaje y comentario', async () => {
    const actualizado = { favorito_id: 1, puntaje: 9, comentario: 'Excelente' };
    const database = createDatabase({ updateResult: [actualizado] });
    const { modificarFavoritos } = createFavoritoController(database);

    await modificarFavoritos({ user, params, body: { puntaje: '9', comentario: 'Excelente' } }, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body.favorito, actualizado);
    assert.deepEqual(database.llamadas.update, { puntaje: 9, comentario: 'Excelente' });
  });

  test('404 si el favorito no existe o es de otro usuario', async () => {
    const { modificarFavoritos } = createFavoritoController(createDatabase({ updateResult: [] }));

    await modificarFavoritos({ user, params, body: { puntaje: 7 } }, res);

    assert.equal(res.statusCode, 404);
  });

  test('500 si falla la base', async () => {
    const { modificarFavoritos } = createFavoritoController(createDatabase({ error: new Error('caída') }));

    await modificarFavoritos({ user, params, body: { puntaje: 7 } }, res);

    assert.equal(res.statusCode, 500);
  });
});

describe('quitarFavorito', () => {
  let res;
  beforeEach(() => { res = createResponse(); });

  test('200 si se elimina', async () => {
    const { quitarFavorito } = createFavoritoController(createDatabase({ deleteResult: [{ favorito_id: 1 }] }));

    await quitarFavorito({ user, params: { favorito_id: '1' } }, res);

    assert.equal(res.statusCode, 200);
  });

  test('404 si no existe o es de otro usuario', async () => {
    const { quitarFavorito } = createFavoritoController(createDatabase({ deleteResult: [] }));

    await quitarFavorito({ user, params: { favorito_id: '999' } }, res);

    assert.equal(res.statusCode, 404);
  });

  test('500 si falla la base', async () => {
    const { quitarFavorito } = createFavoritoController(createDatabase({ error: new Error('caída') }));

    await quitarFavorito({ user, params: { favorito_id: '1' } }, res);

    assert.equal(res.statusCode, 500);
  });
});