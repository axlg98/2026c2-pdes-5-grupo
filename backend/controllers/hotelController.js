import  pool  from '../db/connection.js';
import { hoteles } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export const obtenerHoteles = async (req, res) => {
  try {
    console.log("Intentando consultar los hoteles en la base de datos...")
    const { destino } = req.query;
    let listaHoteles;
    
    if (destino) {
      listaHoteles = await pool.select().from(hoteles).where(eq(hoteles.destino, destino));
    } else {
      listaHoteles = await pool.select().from(hoteles);
    }
    
    res.status(200).json(listaHoteles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const crearHotel = async (req, res) => {
  try {
    const { nombre, destino, foto } = req.body;
    if (!nombre || !destino) {
      return res.status(400).json({ error: 'El nombre y el destino son obligatorios.' });
    }
    
    const [nuevoHotel] = await pool.insert(hoteles).values({
      nombre, destino, foto
    }).returning();
    
    res.status(201).json({ mensaje: 'El hotel ha sido creado con éxito.', hotel: nuevoHotel });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};