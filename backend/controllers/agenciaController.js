import { db } from '../db/connection.js';
import { agencia, hoteles, paquete } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { createFlightApiClient, FlightApiError } from '../services/flightApiClient.js';

const obtenerAgenciaDeUsuario = async (database, idUsuario) => {
  const [agenciaUsuario] = await database
    .select()
    .from(agencia)
    .where(eq(agencia.user_id, idUsuario));

  return agenciaUsuario;
};

const normalizarTexto = (value) => typeof value === 'string'
  ? value.trim().toLocaleLowerCase('es')
  : '';

const parsePositiveInteger = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const validarFecha = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const fecha = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === value;
};

const validarPaqueteCompleto = async ({
  database,
  flightApiClient,
  body
}) => {
  const {
    nombre, destino, origen, descripcion, precio, hotel_id,
    vuelo_ida_id, vuelo_vuelta_id, fecha_ida, fecha_vuelta
  } = body ?? {};

  if (!nombre || !destino || !origen || !descripcion || !precio ||
      !hotel_id || !vuelo_ida_id || !vuelo_vuelta_id || !fecha_ida || !fecha_vuelta) {
    return { status: 400, error: "Faltan datos obligatorios del paquete" };
  }

  const precioNumerico = Number(precio);
  if (!Number.isFinite(precioNumerico) || precioNumerico <= 0) {
    return { status: 400, error: "El precio debe ser mayor a 0" };
  }

  const hotelId = parsePositiveInteger(hotel_id);
  const vueloIdaId = parsePositiveInteger(vuelo_ida_id);
  const vueloVueltaId = parsePositiveInteger(vuelo_vuelta_id);
  if (!hotelId || !vueloIdaId || !vueloVueltaId) {
    return {
      status: 400,
      error: "hotel_id, vuelo_ida_id y vuelo_vuelta_id deben ser identificadores positivos."
    };
  }
  if (vueloIdaId === vueloVueltaId) {
    return { status: 400, error: "El vuelo de ida y el vuelo de vuelta deben ser diferentes." };
  }
  if (!validarFecha(fecha_ida) || !validarFecha(fecha_vuelta)) {
    return { status: 400, error: "Las fechas deben tener formato YYYY-MM-DD." };
  }
  if (fecha_vuelta < fecha_ida) {
    return { status: 400, error: "La fecha de vuelta no puede ser anterior a la fecha de ida." };
  }

  const [hotel] = await database.select().from(hoteles).where(eq(hoteles.id, hotelId));
  if (!hotel) return { status: 404, error: "El hotel no existe." };
  if (normalizarTexto(hotel.destino) !== normalizarTexto(destino)) {
    return { status: 400, error: "El hotel debe pertenecer al destino del paquete." };
  }

  let vueloIda;
  let vueloVuelta;
  try {
    [vueloIda, vueloVuelta] = await Promise.all([
      flightApiClient.getFlight(vueloIdaId),
      flightApiClient.getFlight(vueloVueltaId)
    ]);
  } catch (error) {
    if (error instanceof FlightApiError) {
      return { status: error.status, error: error.message };
    }
    throw error;
  }

  if (normalizarTexto(vueloIda.origen) !== normalizarTexto(origen) ||
      normalizarTexto(vueloIda.destino) !== normalizarTexto(destino)) {
    return { status: 400, error: "El vuelo de ida no coincide con el origen y destino del paquete." };
  }
  if (normalizarTexto(vueloVuelta.origen) !== normalizarTexto(destino) ||
      normalizarTexto(vueloVuelta.destino) !== normalizarTexto(origen)) {
    return { status: 400, error: "El vuelo de vuelta no coincide con el trayecto del paquete." };
  }
  if (vueloIda.fecha !== fecha_ida || vueloVuelta.fecha !== fecha_vuelta) {
    return { status: 400, error: "Las fechas del paquete deben coincidir con las fechas de los vuelos." };
  }
  if (Number(vueloIda.disponibilidad) < 1 || Number(vueloVuelta.disponibilidad) < 1) {
    return { status: 409, error: "Los vuelos seleccionados no tienen disponibilidad." };
  }

  return {
    values: {
      hotel_id: hotelId,
      vuelo_ida_id: vueloIdaId,
      vuelo_vuelta_id: vueloVueltaId,
      fecha_ida,
      fecha_vuelta,
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      origen: origen.trim(),
      destino: destino.trim(),
      precio: String(precioNumerico)
    }
  };
};

export const createAgenciaController = (
  database = db,
  { flightApiClient = createFlightApiClient() } = {}
) => ({
  altaAgencia: async (req, res) => {
    try {
      const { nombre, email, telefono } = req.body ?? {};

      if (typeof nombre !== 'string' || !nombre.trim() ||
          typeof email !== 'string' || !email.trim()) {
        return res.status(400).json({ error: 'El nombre y el email son obligatorios' });
      }

      const [nuevaAgencia] = await database
        .insert(agencia)
        .values({
          user_id: req.user.id,
          nombre: nombre.trim(),
          email: email.trim(),
          telefono: typeof telefono === 'string' && telefono.trim() ? telefono.trim() : null
        })
        .returning();

      return res.status(201).json({
        mensaje: 'La agencia se creó con éxito',
        agencia: nuevaAgencia
      });
    } catch (error) {
      if (error.code === '23505' || error.cause?.code === '23505') {
        return res.status(409).json({
          error: 'El usuario ya tiene una agencia o el email ya está registrado'
        });
      }
      return res.status(500).json({ error: error.message });
    }
  },
  obtenerMisPaquetes: async (req, res) => {
    try{
      const agenciaUser = await obtenerAgenciaDeUsuario(database, req.user.id);
      if (!agenciaUser){
        return res.status(403).json({ error: "El usuario no tiene una agencia" });
      }
      const paquetes = await database.select().from(paquete).where(eq(paquete.agencia_id, agenciaUser.agencia_id));
      res.status(200).json({ paquetes });
    }catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  altaPaquete: async (req, res) => {
    try {
      const agenciaUsuario = await obtenerAgenciaDeUsuario(database, req.user.id);
      if (!agenciaUsuario) {
        return res.status(403).json({ error: "El usuario no tiene una agencia" });
      }

      const validacion = await validarPaqueteCompleto({ database, flightApiClient, body: req.body });
      if (validacion.error) return res.status(validacion.status).json({ error: validacion.error });

      const [nuevoPaquete] = await database
        .insert(paquete)
        .values({
          agencia_id: agenciaUsuario.agencia_id,
          ...validacion.values
        })
        .returning();

      res.status(201).json({
        mensaje: "El paquete ha sido creado con éxito",
        paquete: nuevoPaquete
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  modificarPaquete: async (req, res) => {
    try {
      const agenciaUsuario = await obtenerAgenciaDeUsuario(database, req.user.id);
      if (!agenciaUsuario) {
        return res.status(403).json({ error: "El usuario no tiene una agencia" });
      }

      const paqueteId = Number(req.params.paquete_id);
      const validacion = await validarPaqueteCompleto({ database, flightApiClient, body: req.body });

      if (!paqueteId) {
        return res.status(400).json({ error: "Falta el id del paquete" });
      }
      if (validacion.error) return res.status(validacion.status).json({ error: validacion.error });

      const [paqueteActualizado] = await database
        .update(paquete)
        .set(validacion.values)
        .where(
          and(
            eq(paquete.paquete_id, paqueteId),
            eq(paquete.agencia_id, agenciaUsuario.agencia_id)
          )
        )
        .returning();

      if (!paqueteActualizado) {
        return res.status(404).json({
          error: "Paquete no encontrado o no pertenece a la agencia"
        });
      }

      res.status(200).json({
        mensaje: "Paquete actualizado con éxito",
        paquete: paqueteActualizado
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  bajaPaquete: async (req, res) => {
    try {
      const agenciaUsuario = await obtenerAgenciaDeUsuario(database, req.user.id);
      if (!agenciaUsuario) {
        return res.status(403).json({ error: "El usuario no tiene una agencia asociada." });
      }

      const paqueteId = Number(req.params.paquete_id);

      const [baja] = await database
        .delete(paquete)
        .where(
          and(
            eq(paquete.paquete_id, paqueteId),
            eq(paquete.agencia_id, agenciaUsuario.agencia_id)
          )
        )
        .returning({ paquete_id: paquete.paquete_id });

      if (!baja) {
        return res.status(404).json({ error: "Paquete no encontrado." });
      }

      res.status(200).json({
        mensaje: "Paquete eliminado con éxito",
        paquete: baja
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
});

const agenciaController = createAgenciaController();

export const altaAgencia = agenciaController.altaAgencia;
export const obtenerPaquetes = agenciaController.obtenerMisPaquetes;
export const altaPaquete = agenciaController.altaPaquete;
export const modificarPaquete = agenciaController.modificarPaquete;
export const bajaPaquete = agenciaController.bajaPaquete;
