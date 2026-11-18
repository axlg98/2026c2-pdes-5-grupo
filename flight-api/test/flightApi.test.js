import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../app.js";
import jwt from "jsonwebtoken";

process.env.JWT_SECRET ||= "secreto-de-test";
const token = jwt.sign({ id: 1, rol: "agencia" }, process.env.JWT_SECRET);

const response = async (app, path, options = {}) => {
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const url = `http://127.0.0.1:${server.address().port}${path}`;
  try {
    return await fetch(url, options);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
};

test("GET /health responde el estado de la API", async () => {
  const database = {
    execute: async () => []
  };
  const result = await response(createApp({ database }), "/health");
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), { status: "ok" });
});

test("GET /api/vuelos rechaza solicitudes sin JWT", async () => {
  const result = await response(createApp({ database: {} }), "/api/vuelos");
  assert.equal(result.status, 401);
  assert.match((await result.json()).error, /No autenticado/);
});

test("POST /api/vuelos valida los datos obligatorios", async () => {
  const result = await response(createApp({ database: {} }), "/api/vuelos", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ origen: "Buenos Aires" })
  });
  assert.equal(result.status, 400);
  assert.match((await result.json()).error, /obligatorios/);
});

test("POST /api/vuelos/:id/venta valida el pasajero", async () => {
  const result = await response(createApp({ database: {} }), "/api/vuelos/1/venta", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({})
  });

  test("POST /api/vuelos/:id/reembolso valida la venta", async () => {
    const result = await response(createApp({ database: {} }), "/api/vuelos/1/reembolso", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({})
    });
    assert.equal(result.status, 400);
    assert.match((await result.json()).error, /ventaId/);
  });
  assert.equal(result.status, 400);
  assert.match((await result.json()).error, /nombrePasajero/);
});
