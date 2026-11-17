import { and, asc, eq } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { agencia, compra, paquete } from '../db/schema.js';
import { createFlightApiClient, FlightApiError } from '../services/flightApiClient.js';

const parsePositiveInteger = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

export const createCompraController = (
  database = db,
  { flightApiClient = createFlightApiClient() } = {}
) => ({
  comprar: async (req, res) => {
    const paqueteId = parsePositiveInteger(req.body?.paquete_id);
    const nombrePasajero = typeof req.body?.nombre_pasajero === 'string'
      ? req.body.nombre_pasajero.trim()
      : '';

    if (!paqueteId) {
      return res.status(400).json({ error: 'paquete_id debe ser un identificador positivo.' });
    }
    if (!nombrePasajero) {
      return res.status(400).json({ error: 'nombre_pasajero es obligatorio.' });
    }

    let paqueteSeleccionado;
    try {
      [paqueteSeleccionado] = await database.select()
        .from(paquete)
        .where(eq(paquete.paquete_id, paqueteId));
    } catch (error) {
      console.error('Error loading package for purchase:', error);
      return res.status(500).json({ error: 'No se pudo consultar el paquete.' });
    }
    if (!paqueteSeleccionado) {
      return res.status(404).json({ error: 'El paquete no existe.' });
    }

    let ventaIda;
    let ventaVuelta;
    try {
      ventaIda = await flightApiClient.sellFlight(
        paqueteSeleccionado.vuelo_ida_id,
        nombrePasajero
      );
    } catch (error) {
      if (error instanceof FlightApiError) {
        return res.status(error.status).json({ error: error.message });
      }
      console.error('Could not sell outbound flight:', error);
      return res.status(500).json({ error: 'No se pudo registrar la venta del vuelo de ida.' });
    }

    try {
      ventaVuelta = await flightApiClient.sellFlight(
        paqueteSeleccionado.vuelo_vuelta_id,
        nombrePasajero
      );
    } catch (error) {
      await flightApiClient.refundFlight(
        paqueteSeleccionado.vuelo_ida_id,
        ventaIda.id
      ).catch((refundError) => {
        console.error('Could not compensate outbound flight sale:', refundError);
      });
      if (error instanceof FlightApiError) {
        return res.status(error.status).json({ error: error.message });
      }
      console.error('Could not sell return flight:', error);
      return res.status(500).json({ error: 'No se pudo registrar la venta del vuelo de vuelta.' });
    }

    try {
      const [nuevaCompra] = await database.transaction(async (tx) => {
        return tx.insert(compra).values({
          user_id: req.user.id,
          paquete_id: paqueteSeleccionado.paquete_id,
          agencia_id: paqueteSeleccionado.agencia_id,
          hotel_id: paqueteSeleccionado.hotel_id,
          vuelo_ida_id: paqueteSeleccionado.vuelo_ida_id,
          vuelo_vuelta_id: paqueteSeleccionado.vuelo_vuelta_id,
          venta_vuelo_ida_id: ventaIda.id,
          venta_vuelo_vuelta_id: ventaVuelta.id,
          nombre_pasajero: nombrePasajero,
          fecha_ida: paqueteSeleccionado.fecha_ida,
          fecha_vuelta: paqueteSeleccionado.fecha_vuelta,
          precio_pagado: String(paqueteSeleccionado.precio)
        }).returning();
      });

      return res.status(201).json({
        mensaje: 'Compra registrada correctamente.',
        compra: nuevaCompra
      });
    } catch (error) {
      await Promise.allSettled([
        flightApiClient.refundFlight(paqueteSeleccionado.vuelo_ida_id, ventaIda.id),
        flightApiClient.refundFlight(paqueteSeleccionado.vuelo_vuelta_id, ventaVuelta.id)
      ]);
      console.error('Could not persist purchase:', error);
      return res.status(500).json({ error: 'No se pudo registrar la compra.' });
    }
  },

  listarMisCompras: async (req, res) => {
    try {
      let compras;
      if (req.user.rol === 'admin') {
        compras = await database.select()
          .from(compra)
          .orderBy(asc(compra.fecha_compra));
      } else {
        compras = await database.select()
          .from(compra)
          .where(eq(compra.user_id, req.user.id))
          .orderBy(asc(compra.fecha_compra));
      }
      return res.status(200).json({ compras });
    } catch (error) {
      console.error('Error listing purchases:', error);
      return res.status(500).json({ error: 'No se pudieron consultar las compras.' });
    }
  },

  obtenerCompra: async (req, res) => {
    const compraId = parsePositiveInteger(req.params.compra_id);
    if (!compraId) {
      return res.status(400).json({ error: 'compra_id debe ser positivo.' });
    }
    try {
      const [registro] = await database.select()
        .from(compra)
        .where(req.user.rol === 'admin'
          ? eq(compra.compra_id, compraId)
          : and(eq(compra.compra_id, compraId), eq(compra.user_id, req.user.id)));
      if (!registro) return res.status(404).json({ error: 'Compra no encontrada.' });
      return res.status(200).json({ compra: registro });
    } catch (error) {
      console.error('Error loading purchase:', error);
      return res.status(500).json({ error: 'No se pudo consultar la compra.' });
    }
  },

  listarComprasAgencia: async (req, res) => {
    try {
      const [agenciaUsuario] = await database.select()
        .from(agencia)
        .where(eq(agencia.user_id, req.user.id));
      if (!agenciaUsuario) {
        return res.status(403).json({ error: 'El usuario no tiene una agencia.' });
      }
      const compras = await database.select()
        .from(compra)
        .where(eq(compra.agencia_id, agenciaUsuario.agencia_id))
        .orderBy(asc(compra.fecha_compra));
      return res.status(200).json({ compras });
    } catch (error) {
      console.error('Error listing agency purchases:', error);
      return res.status(500).json({ error: 'No se pudieron consultar las ventas.' });
    }
  }
});
