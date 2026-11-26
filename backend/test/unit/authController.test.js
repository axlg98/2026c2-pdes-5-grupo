import assert from 'node:assert/strict';
import test, { describe, beforeEach, after } from 'node:test';
import jwt from 'jsonwebtoken';
import { createAuthController } from '../../controllers/authController.js';
import { usuarios } from '../../db/schema.js';

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

const createDatabase = ({
  selectResult = [],
  insertResult = [],
  selectError = null,
  insertError = null
} = {}) => ({
  select() {
    return {
      from(table) {
        assert.equal(table, usuarios);
        return {
          where: async () => {
            if (selectError) throw selectError;
            return selectResult;
          }
        };
      }
    };
  },
  insert() {
    return {
      values: (values) => {
        assert.ok(values);
        return {
          returning: async () => {
            if (insertError) throw insertError;
            return insertResult;
          }
        };
      }
    };
  }
});

describe('register', () => {
  let res;

  beforeEach(() => {
    res = createResponse();
  });

  test('400 si faltan campos requeridos', async () => {
    const controller = createAuthController(createDatabase());

    await controller.register({ body: { nombre: 'Ana' } }, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error, 'Faltan campos requeridos.');
  });

  test('400 si la contraseña tiene menos de 6 caracteres', async () => {
    const controller = createAuthController(createDatabase());

    await controller.register({
      body: { nombre: 'Ana', email: 'ana@test.com', password: '123' }
    }, res);

    assert.equal(res.statusCode, 400);
  });

  test('201 y devuelve el usuario registrado', async () => {
    const nuevo = {
      id: 8,
      nombre: 'Ana',
      email: 'ana@test.com',
      rol: 'comprador'
    };
    const controller = createAuthController(createDatabase({ insertResult: [nuevo] }));

    await controller.register({
      body: { nombre: 'Ana', email: 'ana@test.com', password: 'clave123' }
    }, res);

    assert.equal(res.statusCode, 201);
    assert.deepEqual(res.body.usuario, nuevo);
  });

  test('409 si el email ya existe', async () => {
    const error = Object.assign(new Error('email duplicado'), { code: '23505' });
    const controller = createAuthController(createDatabase({ insertError: error }));

    await controller.register({
      body: { nombre: 'Ana', email: 'ana@test.com', password: 'clave123' }
    }, res);

    assert.equal(res.statusCode, 409);
  });

  test('500 si falla la base de datos', async () => {
    const controller = createAuthController(createDatabase({
      insertError: new Error('base caída')
    }));

    await controller.register({
      body: { nombre: 'Ana', email: 'ana@test.com', password: 'clave123' }
    }, res);

    assert.equal(res.statusCode, 500);
  });
});

describe('login', () => {
  let res;
  let secretAnterior;

  beforeEach(() => {
    res = createResponse();
    secretAnterior = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'secreto-de-test';
  });

  after(() => {
    if (secretAnterior === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = secretAnterior;
  });

  test('400 si faltan email o password', async () => {
    const controller = createAuthController(createDatabase());

    await controller.login({ body: { email: 'ana@test.com' } }, res);

    assert.equal(res.statusCode, 400);
  });

  test('500 si JWT_SECRET no está configurado', async () => {
    delete process.env.JWT_SECRET;
    const controller = createAuthController(createDatabase());

    await controller.login({
      body: { email: 'ana@test.com', password: 'clave123' }
    }, res);

    assert.equal(res.statusCode, 500);
  });

  test('401 si las credenciales son inválidas', async () => {
    const controller = createAuthController(createDatabase({ selectResult: [] }));

    await controller.login({
      body: { email: 'ana@test.com', password: 'incorrecta' }
    }, res);

    assert.equal(res.statusCode, 401);
  });

  test('200 y devuelve token y usuario válido', async () => {
    const usuario = {
      id: 8,
      nombre: 'Ana',
      email: 'ana@test.com',
      rol: 'comprador',
      activo: true
    };
    const controller = createAuthController(createDatabase({ selectResult: [usuario] }));

    await controller.login({
      body: { email: 'ana@test.com', password: 'clave123' }
    }, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.usuario.id, usuario.id);
    assert.equal(res.body.usuario.email, usuario.email);
    assert.equal(res.body.usuario.rol, usuario.rol);
    assert.ok(res.body.token);

    const payload = jwt.verify(res.body.token, process.env.JWT_SECRET);
    assert.equal(payload.id, usuario.id);
  });

  test('500 si falla la base de datos', async () => {
    const controller = createAuthController(createDatabase({
      selectError: new Error('base caída')
    }));

    await controller.login({
      body: { email: 'ana@test.com', password: 'clave123' }
    }, res);

    assert.equal(res.statusCode, 500);
  });
});