import { Router } from 'express';
import { createPaqueteController } from '../controllers/paqueteController.js';

export default function createPaqueteRouter(database) {
  const router = Router();
  const controller = createPaqueteController(database);
  router.get('/', controller.listarPublico);
  return router;
}
