import { Router } from 'express';
import { db } from '../db/connection.js';
import {createFavoritoController} from '../controllers/favoritoController.js';

const createFavoritoRouter = (database = db) => {
    const router = Router();
    const {guardarFavorito,obtenerPaquetes,modificarFavoritos,obtenerMisFavoritos,quitarFavorito} = createFavoritoController(database);

    router.post('/',guardarFavorito);
    router.get('/paquetes', obtenerPaquetes);
    router.get('/',obtenerMisFavoritos);
    router.put('/:favorito_id',modificarFavoritos);
    router.delete('/:favorito_id',quitarFavorito);

    return router;
}

export default createFavoritoRouter;