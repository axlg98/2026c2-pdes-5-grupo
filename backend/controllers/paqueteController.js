import { and, ilike, eq } from 'drizzle-orm';
import { agencia, hoteles, paquete } from '../db/schema.js';

export const createPaqueteController = (database) => ({
  listarPublico: async (req, res) => {
    try {
      const filters = [];
      const { palabraClave, destino, origen, precioMin, precioMax } = req.query;

      if (palabraClave) filters.push(ilike(paquete.nombre, `%${palabraClave}%`));
      if (destino) filters.push(ilike(paquete.destino, `%${destino}%`));
      if (origen) filters.push(ilike(paquete.origen, `%${origen}%`));
      const paquetesEncontrados = await database
        .select({
          paquete_id: paquete.paquete_id,
          nombre: paquete.nombre,
          descripcion: paquete.descripcion,
          origen: paquete.origen,
          destino: paquete.destino,
          precio: paquete.precio,
          hotel_id: paquete.hotel_id,
          hotel: hoteles.nombre,
          hotelFoto: hoteles.foto,
          vuelo_ida_id: paquete.vuelo_ida_id,
          vuelo_vuelta_id: paquete.vuelo_vuelta_id,
          fecha_ida: paquete.fecha_ida,
          fecha_vuelta: paquete.fecha_vuelta,
          agencia: agencia.nombre
        })
        .from(paquete)
        .innerJoin(hoteles, eq(paquete.hotel_id, hoteles.id))
        .innerJoin(agencia, eq(paquete.agencia_id, agencia.agencia_id))
        .where(filters.length ? and(...filters) : undefined);

      const min = precioMin !== undefined && precioMin !== '' ? Number(precioMin) : null;
      const max = precioMax !== undefined && precioMax !== '' ? Number(precioMax) : null;
      const paquetes = paquetesEncontrados
        .filter((item) => min === null || Number(item.precio) >= min)
        .filter((item) => max === null || Number(item.precio) <= max)
        .sort((left, right) => Number(left.precio) - Number(right.precio));

      return res.status(200).json({ paquetes });
    } catch (error) {
      console.error('Error listing public packages:', error);
      return res.status(500).json({ error: 'No se pudieron consultar los paquetes.' });
    }
  }
});
