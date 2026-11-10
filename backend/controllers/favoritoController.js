import { db } from '../db/connection.js';
import { favorito, paquete } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

export const createFavoritoController = (database = db) => {
    const guardarFavorito = async(req,res) => {
        try{
            const paqueteId = Number(req.body.paquete_id);
            
            if (!Number.isInteger(paqueteId) || paqueteId <= 0){
                return res.status(400).json({error: "el paquete_id es obligatorio."});
            }

            const [nuevo] = await database.insert(favorito).values({user_id: req.user.id, paquete_id: paqueteId}).returning();

            res.status(201).json({mensaje: 'Paquete guardado en favoritos.',favorito:nuevo})

        }catch(err){
            if (err.code?? err.cause?.code === '23505'){
                return res.status(409).json({error: 'El paquete ya esa en tus favoritos.'})
            }

            if(err.code?? err.cause?.code === '23505'){
                return res.status(404).json({error:'El paquete no existe.'})
            }
            res.status(500).json({error:err.message});
        }
    };

    const obtenerMisFavoritos = async (req,res) => {
        try{
            const favoritos = await database.select({
                favorito_id: favorito.favorito_id,
                puntaje: favorito.puntaje,
                paquete_id: favorito.paquete_id,
                comentario: favorito.comentario,
                nombre: paquete.nombre,
                origen: paquete.origen,
                destino: paquete.destino,
                precio: paquete.precio
            }).from(favorito).innerJoin(paquete, eq(favorito.paquete_id,paquete.paquete_id))
              .where(eq(favorito.user_id,req.user.id));
            
              res.status(200).json({favoritos});
        }catch(err){
            res.status(500).json({error: err.message});
        }
    }

    const modificarFavoritos = async (req,res) => {
        try{
            const favoritoId = Number(req.params.favorito_id);
            const {puntaje, comentario} = req.body;

            if(puntaje === undefined && comentario === undefined){
                return res.status(400).json({error: 'Envie un puntaje o un comentario.'});
            }

            if(!puntaje >= 0 && !puntaje <= 10){
                return res.status(400).json({error: 'El puntaje no está dentro del rango permitido, debe ser de 0 a 10.'})
            }

            const cambios = {
                ...({puntaje: Number(puntaje),comentario:comentario})
            }

            const [actualizado] = await database.update(favorito).set(cambios)
                                                .where(and(eq(favorito.favorito_id, favoritoId), 
                                                           eq(favorito.user_id,req.user.id)))
                                                .returning();

            if(!actualizado){
                return res.status(404).json({error: 'Favorito no encontrado.'});
            }
            
            res.status(200).json({mensaje:'Favorito modificado con éxito.',favorito: actualizado});
        }catch(err){
            res.status(500).json({error: err.message});
        }
    };

    const quitarFavorito = async (req,res) => {
        try{
            const favDelete = Number(req.params.favorito_id);
            const [baja] = await database.delete(favorito)
                                 .where(
                                        and(
                                            eq(favorito.favorito_id,favDelete),
                                            eq(favorito.user_id,req.user.id)
                                        )
                                 ).returning({favorito_id:favorito.favorito_id});
            
            if(!baja){
                return res.status(404).json({error: 'Favorito no encontrado.'})
            }

            res.status(200).json({mensaje:'Favorito eliminado éxitosamente.',favorito:baja});

        }catch(err){
            res.status(500).json({error: err.message});
        }
    };
    return {guardarFavorito, obtenerMisFavoritos, modificarFavoritos, quitarFavorito};
}

