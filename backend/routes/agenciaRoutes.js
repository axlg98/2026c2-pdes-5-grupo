import { createAgenciaController } from '../controllers/agenciaController.js';
import { Router } from 'express';
import { db } from '../db/connection.js';

const createAgenciaRouter = (database = db) => {
  const router = Router();
  const { altaPaquete, modificarPaquete, bajaPaquete } = createAgenciaController(database);

  router.post('/paquetes', altaPaquete);
  router.put('/paquetes/:paquete_id', modificarPaquete);
  router.delete('/paquetes/:paquete_id', bajaPaquete);

  return router;
};

export default createAgenciaRouter;