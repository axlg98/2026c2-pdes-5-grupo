import { Router } from "express";
import { createFlightController } from "./controllers/flightController.js";
import { createInitializationController } from "./controllers/initializationController.js";

export const createRoutes = (database) => {
  const router = Router();
  const flights = createFlightController(database);
  const initialization = createInitializationController(database);

  router.get("/health", flights.health);
  router.post("/api/inicializacion", initialization.initialize);
  router.post("/api/initialize", initialization.initialize);
  router.get("/api/aerolineas", flights.listAirlines);
  router.post("/api/aerolineas", flights.createAirline);
  router.get("/api/vuelos", flights.listFlights);
  router.post("/api/vuelos", flights.createFlight);
  router.get("/api/vuelos/:id", flights.getFlight);
  router.post("/api/vuelos/:id/venta", flights.sellFlight);
  router.post("/api/vuelos/:id/ventas", flights.sellFlight);
  router.get("/api/ventas", flights.listSales);

  return router;
};
