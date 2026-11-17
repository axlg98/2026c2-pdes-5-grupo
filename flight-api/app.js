import cors from "cors";
import express from "express";
import { createRoutes } from "./routes.js";

export const createApp = ({ database } = {}) => {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(createRoutes(database));
  app.use((error, _req, res, _next) => {
    console.error("Unhandled Flight API error:", error);
    res.status(500).json({ error: "Error interno de la API de vuelos." });
  });
  return app;
};
