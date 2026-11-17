import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../app.js";

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

test("POST /api/vuelos valida los datos obligatorios", async () => {
  const result = await response(createApp({ database: {} }), "/api/vuelos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ origen: "Buenos Aires" })
  });
  assert.equal(result.status, 400);
  assert.match((await result.json()).error, /obligatorios/);
});

test("POST /api/vuelos/:id/venta valida el pasajero", async () => {
  const result = await response(createApp({ database: {} }), "/api/vuelos/1/venta", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({})
  });
  assert.equal(result.status, 400);
  assert.match((await result.json()).error, /nombrePasajero/);
});
