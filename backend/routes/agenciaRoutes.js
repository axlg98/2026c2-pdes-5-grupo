import { createAgenciaController } from '../controllers/agenciaController.js';
import { Router } from 'express';
import { db } from '../db/connection.js';
import { createCompraController } from '../controllers/compraController.js';

const createAgenciaRouter = (database = db, options = {}) => {
  const router = Router();
  const { altaAgencia, altaPaquete, modificarPaquete, bajaPaquete, obtenerMisPaquetes } =
    createAgenciaController(database, options);
  const compraController = createCompraController(database, options);

  router.post('/', altaAgencia);
  router.post('/paquetes', altaPaquete);
  router.get('/paquetes', obtenerMisPaquetes);
  router.put('/paquetes/:paquete_id', modificarPaquete);
  router.delete('/paquetes/:paquete_id', bajaPaquete);
  router.get('/compras', compraController.listarComprasAgencia);

  return router;
};

export default createAgenciaRouter;