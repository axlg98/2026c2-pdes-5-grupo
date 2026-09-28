import { createHotelController } from '../controllers/hotelController.js';
import { Router } from 'express';
import { db } from '../db/connection.js';

const createHotelRouter = (database = db) => {
  const router = Router();
  const { crearHotel, obtenerHoteles } = createHotelController(database);

  router.get('/', obtenerHoteles);
  router.post('/', crearHotel);

  return router;
};

export default createHotelRouter;