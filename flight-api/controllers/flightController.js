import { and, asc, eq, gte, ilike, lte, sql } from "drizzle-orm";
import { db } from "../db/connection.js";
import { aerolineas, ventasVuelos, vuelos } from "../db/schema.js";

const parsePositiveInteger = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const buildFlightFilters = (query) => {
  const filters = [];
  if (query.origen) filters.push(ilike(vuelos.origen, `%${query.origen}%`));
  if (query.destino) filters.push(ilike(vuelos.destino, `%${query.destino}%`));
  if (query.fechaDesde) filters.push(gte(vuelos.fecha, query.fechaDesde));
  if (query.fechaHasta) filters.push(lte(vuelos.fecha, query.fechaHasta));
  if (query.soloDisponibles === "true") filters.push(gte(vuelos.disponibilidad, 1));
  if (query.aerolineaId) {
    const aerolineaId = parsePositiveInteger(query.aerolineaId);
    if (aerolineaId) filters.push(eq(vuelos.aerolineaId, aerolineaId));
  }
  return filters;
};

export const createFlightController = (database = db) => ({
  health: async (_req, res) => {
    try {
      await database.execute(sql`select 1`);
      return res.status(200).json({ status: "ok" });
    } catch (error) {
      console.error("Flight API database connection error:", error);
      return res.status(503).json({ status: "error" });
    }
  },

  listAirlines: async (_req, res) => {
    const result = await database.select().from(aerolineas).orderBy(asc(aerolineas.nombre));
    return res.status(200).json({ aerolineas: result });
  },

  createAirline: async (req, res) => {
    const { nombre, pais } = req.body ?? {};
    if (typeof nombre !== "string" || !nombre.trim() || typeof pais !== "string" || !pais.trim()) {
      return res.status(400).json({ error: "nombre y pais son obligatorios." });
    }

    try {
      const [airline] = await database.insert(aerolineas).values({
        nombre: nombre.trim(),
        pais: pais.trim()
      }).returning();
      return res.status(201).json({ aerolinea: airline });
    } catch (error) {
      if (error.code === "23505") return res.status(409).json({ error: "La aerolinea ya existe." });
      console.error("Error creating airline:", error);
      return res.status(500).json({ error: "No se pudo crear la aerolinea." });
    }
  },

  listFlights: async (req, res) => {
    const filters = buildFlightFilters(req.query);
    const result = await database
      .select({
        id: vuelos.id,
        codigo: vuelos.codigo,
        fecha: vuelos.fecha,
        hora: vuelos.hora,
        origen: vuelos.origen,
        destino: vuelos.destino,
        capacidad: vuelos.capacidad,
        disponibilidad: vuelos.disponibilidad,
        aerolinea: aerolineas.nombre,
        aerolineaId: aerolineas.id
      })
      .from(vuelos)
      .innerJoin(aerolineas, eq(vuelos.aerolineaId, aerolineas.id))
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(asc(vuelos.fecha), asc(vuelos.hora));

    return res.status(200).json({ vuelos: result });
  },

  getFlight: async (req, res) => {
    const flightId = parsePositiveInteger(req.params.id);
    if (!flightId) return res.status(400).json({ error: "El id del vuelo debe ser positivo." });

    const [flight] = await database
      .select({
        id: vuelos.id,
        codigo: vuelos.codigo,
        fecha: vuelos.fecha,
        hora: vuelos.hora,
        origen: vuelos.origen,
        destino: vuelos.destino,
        capacidad: vuelos.capacidad,
        disponibilidad: vuelos.disponibilidad,
        aerolinea: aerolineas.nombre,
        aerolineaId: aerolineas.id
      })
      .from(vuelos)
      .innerJoin(aerolineas, eq(vuelos.aerolineaId, aerolineas.id))
      .where(eq(vuelos.id, flightId));

    if (!flight) return res.status(404).json({ error: "El vuelo no existe." });
    return res.status(200).json({ vuelo: flight });
  },

  createFlight: async (req, res) => {
    const { aerolineaId, codigo, fecha, hora, origen, destino, capacidad } = req.body ?? {};
    const parsedAirlineId = parsePositiveInteger(aerolineaId);
    const parsedCapacity = parsePositiveInteger(capacidad);

    if (!parsedAirlineId || !parsedCapacity || !codigo || !fecha || !hora ||
        typeof origen !== "string" || !origen.trim() ||
        typeof destino !== "string" || !destino.trim()) {
      return res.status(400).json({
        error: "aerolineaId, codigo, fecha, hora, origen, destino y capacidad son obligatorios."
      });
    }

    try {
      const [flight] = await database.insert(vuelos).values({
        aerolineaId: parsedAirlineId,
        codigo: String(codigo).trim(),
        fecha,
        hora,
        origen: origen.trim(),
        destino: destino.trim(),
        capacidad: parsedCapacity,
        disponibilidad: parsedCapacity
      }).returning();
      return res.status(201).json({ vuelo: flight });
    } catch (error) {
      if (error.code === "23505") return res.status(409).json({ error: "El codigo de vuelo ya existe." });
      if (error.code === "23503") return res.status(404).json({ error: "La aerolinea no existe." });
      console.error("Error creating flight:", error);
      return res.status(500).json({ error: "No se pudo crear el vuelo." });
    }
  },

  sellFlight: async (req, res) => {
    const flightId = parsePositiveInteger(req.params.id);
    const { nombrePasajero } = req.body ?? {};
    if (!flightId || typeof nombrePasajero !== "string" || !nombrePasajero.trim()) {
      return res.status(400).json({ error: "El id del vuelo y nombrePasajero son obligatorios." });
    }

    try {
      const sale = await database.transaction(async (tx) => {
        const [updatedFlight] = await tx.update(vuelos)
          .set({ disponibilidad: sql`${vuelos.disponibilidad} - 1` })
          .where(and(eq(vuelos.id, flightId), gte(vuelos.disponibilidad, 1)))
          .returning();

        if (!updatedFlight) return null;

        const [registeredSale] = await tx.insert(ventasVuelos).values({
          vueloId: flightId,
          nombrePasajero: nombrePasajero.trim()
        }).returning();

        return { venta: registeredSale, vuelo: updatedFlight };
      });

      if (!sale) {
        const [flight] = await database.select({ id: vuelos.id }).from(vuelos).where(eq(vuelos.id, flightId));
        return res.status(flight ? 409 : 404).json({
          error: flight ? "El vuelo no tiene disponibilidad." : "El vuelo no existe."
        });
      }

      return res.status(201).json({
        mensaje: "La venta del vuelo se registro correctamente.",
        ...sale
      });
    } catch (error) {
      if (error.code === "23503") return res.status(404).json({ error: "El vuelo no existe." });
      console.error("Error selling flight:", error);
      return res.status(500).json({ error: "No se pudo registrar la venta del vuelo." });
    }
  },

  refundFlight: async (req, res) => {
    const flightId = parsePositiveInteger(req.params.id);
    const saleId = parsePositiveInteger(req.body?.ventaId);
    if (!flightId || !saleId) {
      return res.status(400).json({ error: "El id del vuelo y ventaId son obligatorios." });
    }

    try {
      const refund = await database.transaction(async (tx) => {
        const [sale] = await tx.select()
          .from(ventasVuelos)
          .where(and(
            eq(ventasVuelos.id, saleId),
            eq(ventasVuelos.vueloId, flightId),
            eq(ventasVuelos.reembolsado, false)
          ));
        if (!sale) return null;

        const [flight] = await tx.update(vuelos)
          .set({ disponibilidad: sql`${vuelos.disponibilidad} + 1` })
          .where(and(
            eq(vuelos.id, flightId),
            sql`${vuelos.disponibilidad} < ${vuelos.capacidad}`
          ))
          .returning();
        if (!flight) return null;

        const [refundedSale] = await tx.update(ventasVuelos)
          .set({ reembolsado: true, reembolsadoEn: new Date() })
          .where(eq(ventasVuelos.id, saleId))
          .returning();
        return { venta: refundedSale, vuelo: flight };
      });

      if (!refund) {
        return res.status(404).json({ error: "La venta no existe o ya fue reembolsada." });
      }
      return res.status(200).json({
        mensaje: "La venta fue reembolsada y se restableció la disponibilidad.",
        ...refund
      });
    } catch (error) {
      console.error("Error refunding flight:", error);
      return res.status(500).json({ error: "No se pudo reembolsar la venta del vuelo." });
    }
  },

  listSales: async (req, res) => {
    const flightId = req.query.vueloId ? parsePositiveInteger(req.query.vueloId) : null;
    const filters = flightId ? [eq(ventasVuelos.vueloId, flightId)] : [];
    const result = await database.select({
      id: ventasVuelos.id,
      vueloId: ventasVuelos.vueloId,
      nombrePasajero: ventasVuelos.nombrePasajero,
      vendidoEn: ventasVuelos.vendidoEn,
      codigo: vuelos.codigo
    }).from(ventasVuelos)
      .innerJoin(vuelos, eq(ventasVuelos.vueloId, vuelos.id))
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(asc(ventasVuelos.vendidoEn));

    return res.status(200).json({ ventas: result });
  }
});
