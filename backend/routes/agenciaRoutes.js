import { createAgenciaController } from '../controllers/agenciaController.js';
import { Router } from 'express';
import { db } from '../db/connection.js';
import { createCompraController } from '../controllers/compraController.js';
import { auth } from '../middlewares/auth.js';
import { requireRol } from '../middlewares/requireRol.js';
import { ROLES } from '../constants/roles.js';

const createAgenciaRouter = (database = db, options = {}) => {
  const router = Router();
  const {
    altaAgencia,
    listarAgencias,
    obtenerAgencia,
    obtenerMiAgencia,
    listarUsuariosAgencia,
    modificarAgencia,
    modificarMiAgencia,
    bajaAgencia,
    altaPaquete,
    modificarPaquete,
    bajaPaquete,
    obtenerMisPaquetes
  } =
    createAgenciaController(database, options);
  const compraController = createCompraController(database, options);

  router.use(auth);

  router.get('/usuarios', requireRol(ROLES.ADMIN), listarUsuariosAgencia);
  router.get('/lista', requireRol(ROLES.ADMIN), listarAgencias);
  router.get('/mia', requireRol(ROLES.AGENCIA), obtenerMiAgencia);
  router.put('/mia', requireRol(ROLES.AGENCIA), modificarMiAgencia);
  router.post('/paquetes', requireRol(ROLES.AGENCIA), altaPaquete);
  router.get('/paquetes', requireRol(ROLES.AGENCIA), obtenerMisPaquetes);
  router.put('/paquetes/:paquete_id', requireRol(ROLES.AGENCIA), modificarPaquete);
  router.delete('/paquetes/:paquete_id', requireRol(ROLES.AGENCIA), bajaPaquete);
  router.get('/compras', requireRol(ROLES.AGENCIA), compraController.listarComprasAgencia);
  router.post('/', requireRol(ROLES.ADMIN), altaAgencia);
  router.get('/:agencia_id', requireRol(ROLES.ADMIN), obtenerAgencia);
  router.put('/:agencia_id', requireRol(ROLES.ADMIN), modificarAgencia);
  router.delete('/:agencia_id', requireRol(ROLES.ADMIN), bajaAgencia);

  return router;
};

export default createAgenciaRouter;