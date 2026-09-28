import { eq } from "drizzle-orm";
import { db } from "../db/connection.js";
import { hoteles } from "../db/schema.js";

export const createHotelController = (database = db) => ({
  obtenerHoteles: async (req, res) => {
    try {
      const { destino } = req.query;
      const listaHoteles = destino
        ? await database.select().from(hoteles).where(eq(hoteles.destino, destino))
        : await database.select().from(hoteles);

      res.status(200).json(listaHoteles);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  crearHotel: async (req, res) => {
    try {
      const { nombre, destino, foto } = req.body;
      if (!nombre || !destino) {
        return res.status(400).json({ error: "El nombre y el destino son obligatorios." });
      }

      const [nuevoHotel] = await database
        .insert(hoteles)
        .values({ nombre, destino, foto })
        .returning();

      res.status(201).json({ mensaje: "El hotel ha sido creado con éxito.", hotel: nuevoHotel });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
});