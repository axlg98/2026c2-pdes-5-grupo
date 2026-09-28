import { Router } from "express";
import { db } from "../db/connection.js";
import { createHotelController } from "../controllers/hotelController.js";

/**
 * @openapi
 * /api/hoteles:
 *   get:
 *     summary: Lista hoteles
 *     tags: [Hoteles]
 *     parameters:
 *       - in: query
 *         name: destino
 *         schema:
 *           type: string
 *         description: Filtra hoteles por destino exacto
 *     responses:
 *       200:
 *         description: Lista de hoteles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Hotel'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   post:
 *     summary: Crea un hotel
 *     tags: [Hoteles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/HotelInput'
 *     responses:
 *       201:
 *         description: Hotel creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                 hotel:
 *                   $ref: '#/components/schemas/Hotel'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
const createHotelRouter = (database = db) => {
  const router = Router();
  const { crearHotel, obtenerHoteles } = createHotelController(database);

  router.get("/", obtenerHoteles);
  router.post("/", crearHotel);

  return router;
};

export default createHotelRouter;