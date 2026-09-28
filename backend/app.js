import express from "express";
import swaggerUi from "swagger-ui-express";
import pool, { db } from "./db/connection.js";
import createHotelRouter from "./routes/hotelRoutes.js";
import { swaggerSpec } from "./swagger.js";

export const createApp = ({ database = db, healthCheck = () => pool.query("SELECT 1") } = {}) => {
  const app = express();

  app.use(express.json());
  app.get("/api-docs.json", (req, res) => res.json(swaggerSpec));
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.get("/health", async (req, res) => {
    try {
      await healthCheck();
      res.status(200).json({ status: "ok" });
    } catch (error) {
      console.error("Database connection error:", error);
      res.status(500).json({ status: "error" });
    }
  });

  app.use("/api/hoteles", createHotelRouter(database));

  return app;
};