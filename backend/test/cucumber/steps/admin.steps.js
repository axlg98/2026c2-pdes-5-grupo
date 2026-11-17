import assert from 'node:assert/strict';
import { Before, Given, Then, When } from '@cucumber/cucumber';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { createApp } from '../../../app.js';

process.env.JWT_SECRET ||= 'secreto-de-test';

const createDatabase = () => ({
  insert() {
    return {
      values(values) {
        return {
          returning: async () => [{
            id: 2,
            nombre: values.nombre,
            email: values.email,
            rol: values.rol
          }]
        };
      }
    };
  }
});

Before({ tags: '@admin' }, function () {
  this.adminApp = createApp({
    database: createDatabase(),
    healthCheck: async () => {}
  });
});

Given('que estoy autenticado con el rol {string}', function (rol) {
  this.adminToken = jwt.sign({ id: 1, rol }, process.env.JWT_SECRET);
});

When(
  'solicito crear una cuenta para {string} con el correo {string}, la contraseña {string} y el rol {string}',
  async function (nombre, email, password, rol) {
    this.response = await request(this.adminApp)
      .post('/api/auth/users')
      .set('Authorization', `Bearer ${this.adminToken}`)
      .send({ nombre, email, password, rol });
  }
);

Then(
  'el sistema confirma que se creó la cuenta de {string} con el rol {string}',
  function (nombre, rol) {
    assert.equal(this.response.body.mensaje, 'Usuario creado exitosamente.');
    assert.equal(this.response.body.usuario.nombre, nombre);
    assert.equal(this.response.body.usuario.rol, rol);
    assert.equal('password' in this.response.body.usuario, false);
  }
);

Then('el sistema explica el error {string}', function (mensaje) {
  assert.equal(this.response.body.error, mensaje);
});
