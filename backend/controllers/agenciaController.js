import { db } from '../db/connection.js';
import { agencia, hoteles, paquete, usuarios } from '../db/schema.js';
import { eq, and, asc } from 'drizzle-orm';
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
  listarAgencias: async (req, res) => {
    try {
      const agencias = await database.select({
        agencia_id: agencia.agencia_id,
        user_id: agencia.user_id,
        nombre: agencia.nombre,
        email: agencia.email,
        telefono: agencia.telefono
      }).from(agencia);
      return res.status(200).json({ agencias });
    } catch (error) {
      return res.status(500).json({ error: 'No se pudieron consultar las agencias.' });
    }
  },
  obtenerAgencia: async (req, res) => {
    const agenciaId = parsePositiveInteger(req.params.agencia_id);
    if (!agenciaId) return res.status(400).json({ error: 'agencia_id debe ser positivo.' });
    try {
      const [resultado] = await database.select()
        .from(agencia)
        .where(eq(agencia.agencia_id, agenciaId));
      if (!resultado) return res.status(404).json({ error: 'Agencia no encontrada.' });
      return res.status(200).json({ agencia: resultado });
    } catch (error) {
      return res.status(500).json({ error: 'No se pudo consultar la agencia.' });
    }
  },
  obtenerMiAgencia: async (req, res) => {
    try {
      const resultado = await obtenerAgenciaDeUsuario(database, req.user.id);
      if (!resultado) return res.status(404).json({ error: 'El usuario no tiene una agencia asociada.' });
      return res.status(200).json({ agencia: resultado });
    } catch (error) {
      return res.status(500).json({ error: 'No se pudo consultar la agencia.' });
    }
  },
  listarUsuariosAgencia: async (_req, res) => {
    try {
      const usuariosAgencia = await database.select({
        id: usuarios.id,
        nombre: usuarios.nombre,
        email: usuarios.email,
        rol: usuarios.rol
      }).from(usuarios).where(eq(usuarios.rol, 'agencia')).orderBy(asc(usuarios.nombre));
      return res.status(200).json({ usuarios: usuariosAgencia });
    } catch (error) {
      return res.status(500).json({ error: 'No se pudieron consultar los usuarios agencia.' });
    }
  },
  altaAgencia: async (req, res) => {
    try {
      const { nombre, email, telefono, user_id } = req.body ?? {};
      const userId = parsePositiveInteger(user_id);

      if (typeof nombre !== 'string' || !nombre.trim() ||
          typeof email !== 'string' || !email.trim()) {
        return res.status(400).json({ error: 'El nombre y el email son obligatorios' });
      }
      if (!userId) {
        return res.status(400).json({ error: 'user_id debe ser un usuario agencia válido.' });
      }
      const [usuario] = await database.select({ id: usuarios.id, rol: usuarios.rol })
        .from(usuarios)
        .where(eq(usuarios.id, userId));
      if (!usuario) return res.status(404).json({ error: 'El usuario no existe.' });
      if (usuario.rol !== 'agencia') {
        return res.status(400).json({ error: 'El usuario seleccionado debe tener rol agencia.' });
      }

      const [nuevaAgencia] = await database
        .insert(agencia)
        .values({
          user_id: userId,
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
  modificarAgencia: async (req, res) => {
    const agenciaId = parsePositiveInteger(req.params.agencia_id);
    if (!agenciaId) return res.status(400).json({ error: 'agencia_id debe ser positivo.' });
    const { nombre, email, telefono, user_id } = req.body ?? {};
    if (!nombre?.trim() || !email?.trim()) {
      return res.status(400).json({ error: 'Nombre y email son obligatorios.' });
    }
    try {
      const cambios = {
        nombre: nombre.trim(),
        email: email.trim(),
        telefono: typeof telefono === 'string' && telefono.trim() ? telefono.trim() : null
      };
      if (user_id !== undefined) {
        const userId = parsePositiveInteger(user_id);
        if (!userId) return res.status(400).json({ error: 'user_id debe ser positivo.' });
        const [usuario] = await database.select({ rol: usuarios.rol })
          .from(usuarios).where(eq(usuarios.id, userId));
        if (!usuario || usuario.rol !== 'agencia') {
          return res.status(400).json({ error: 'El usuario seleccionado debe tener rol agencia.' });
        }
        cambios.user_id = userId;
      }
      const [actualizada] = await database.update(agencia)
        .set(cambios)
        .where(eq(agencia.agencia_id, agenciaId))
        .returning();
      if (!actualizada) return res.status(404).json({ error: 'Agencia no encontrada.' });
      return res.status(200).json({ mensaje: 'Agencia modificada correctamente.', agencia: actualizada });
    } catch (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'El usuario o email ya están asociados.' });
      return res.status(500).json({ error: 'No se pudo modificar la agencia.' });
    }
  },
  modificarMiAgencia: async (req, res) => {
    try {
      const actual = await obtenerAgenciaDeUsuario(database, req.user.id);
      if (!actual) return res.status(404).json({ error: 'El usuario no tiene una agencia asociada.' });
      const { nombre, email, telefono } = req.body ?? {};
      if (!nombre?.trim() || !email?.trim()) {
        return res.status(400).json({ error: 'Nombre y email son obligatorios.' });
      }
      const [actualizada] = await database.update(agencia).set({
        nombre: nombre.trim(),
        email: email.trim(),
        telefono: typeof telefono === 'string' && telefono.trim() ? telefono.trim() : null
      }).where(eq(agencia.agencia_id, actual.agencia_id)).returning();
      return res.status(200).json({ mensaje: 'Agencia modificada correctamente.', agencia: actualizada });
    } catch (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'El email ya está registrado.' });
      return res.status(500).json({ error: 'No se pudo modificar la agencia.' });
    }
  },
  bajaAgencia: async (req, res) => {
    const agenciaId = parsePositiveInteger(req.params.agencia_id);
    if (!agenciaId) return res.status(400).json({ error: 'agencia_id debe ser positivo.' });
    try {
      const [paquetes] = await database.select({ cantidad: paquete.paquete_id })
        .from(paquete).where(eq(paquete.agencia_id, agenciaId));
      if (paquetes) {
        return res.status(409).json({ error: 'No se puede eliminar una agencia con paquetes asociados.' });
      }
      const [baja] = await database.delete(agencia)
        .where(eq(agencia.agencia_id, agenciaId))
        .returning({ agencia_id: agencia.agencia_id });
      if (!baja) return res.status(404).json({ error: 'Agencia no encontrada.' });
      return res.status(200).json({ mensaje: 'Agencia eliminada correctamente.', agencia: baja });
    } catch (error) {
      return res.status(500).json({ error: 'No se pudo eliminar la agencia.' });
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
