import { crearHotel, obtenerHoteles } from '../controllers/hotelController.js';
import { Router } from 'express';

const createHotelRouter = () => {
  const router = Router();

  router.get('/', obtenerHoteles);
  router.post('/', crearHotel);

  return router;
};

export default createHotelRouter;