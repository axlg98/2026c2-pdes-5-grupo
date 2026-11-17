import { Router } from 'express';
import { createCompraController } from '../controllers/compraController.js';
import { auth } from '../middlewares/auth.js';
import { requireRol } from '../middlewares/requireRol.js';
import { ROLES } from '../constants/roles.js';

export default function createCompraRouter(database, options = {}) {
  const router = Router();
  const controller = createCompraController(database, options);
  router.post('/', auth, requireRol(ROLES.COMPRADOR), controller.comprar);
  router.get('/', auth, requireRol(ROLES.COMPRADOR, ROLES.ADMIN), controller.listarMisCompras);
  router.get('/:compra_id', auth, requireRol(ROLES.COMPRADOR, ROLES.ADMIN), controller.obtenerCompra);
  return router;
}
