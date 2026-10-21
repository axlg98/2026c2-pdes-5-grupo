import { createHotelController } from '../controllers/hotelController.js';
import { Router } from 'express';
import { db } from '../db/connection.js';
import {auth} from '../middlewares/auth.js'
import { requireRol } from '../middlewares/requireRol.js'

const createHotelRouter = (database = db) => {
  const router = Router();
  const { crearHotel, obtenerHoteles } = createHotelController(database);

  router.get('/', obtenerHoteles);
  router.post('/',auth, requireRol('admin'), crearHotel);

  return router;
};

export default createHotelRouter;