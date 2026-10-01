import { db } from '../db/connection.js';
import { agencia, paquete } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

const obtenerAgenciaDeUsuario = async (database, idUsuario) => {
  const [agenciaUsuario] = await database
    .select()
    .from(agencia)
    .where(eq(agencia.user_id, idUsuario));

  return agenciaUsuario;
};

export const createAgenciaController = (database = db) => ({
  obtenerMisPaquetes: async (req, res) => {
    try{
      const agenciaUser = await obtenerAgenciaDeUsuario(database, req.query.idUsuario);
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
      const agenciaUsuario = await obtenerAgenciaDeUsuario(database, req.body.idUsuario);
      if (!agenciaUsuario) {
        return res.status(403).json({ error: "El usuario no tiene una agencia" });
      }

      const { nombre, destino, origen, descripcion, precio } = req.body;

      if (!nombre || !destino || !origen || !descripcion || !precio) {
        return res.status(400).json({ error: "Faltan datos obligatorios del paquete" });
      }

      if (Number(precio) <= 0) {
        return res.status(400).json({ error: "El precio debe ser mayor a 0" });
      }

      const [nuevoPaquete] = await database
        .insert(paquete)
        .values({
          agencia_id: agenciaUsuario.agencia_id,
          nombre,
          descripcion,
          origen,
          destino,
          precio: String(precio)
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
      const agenciaUsuario = await obtenerAgenciaDeUsuario(database, req.body.idUsuario);
      if (!agenciaUsuario) {
        return res.status(403).json({ error: "El usuario no tiene una agencia" });
      }

      const paqueteId = Number(req.params.paquete_id);
      const { nombre, destino, origen, descripcion, precio } = req.body;

      if (!paqueteId) {
        return res.status(400).json({ error: "Falta el id del paquete" });
      }

      if (!nombre || !destino || !origen || !descripcion || !precio) {
        return res.status(400).json({ error: "Faltan datos obligatorios del paquete" });
      }

      if (Number(precio) <= 0) {
        return res.status(400).json({ error: "El precio debe ser mayor a 0" });
      }

      const [paqueteActualizado] = await database
        .update(paquete)
        .set({
          nombre,
          destino,
          origen,
          descripcion,
          precio: String(precio)
        })
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
      const agenciaUsuario = await obtenerAgenciaDeUsuario(database, req.body.idUsuario);
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

export const obtenerPaquetes = agenciaController.obtenerMisPaquetes;
export const altaPaquete = agenciaController.altaPaquete;
export const modificarPaquete = agenciaController.modificarPaquete;
export const bajaPaquete = agenciaController.bajaPaquete;
