import { Router } from 'express';
import { db } from '../db/connection.js';
import {createAuthController} from '../controllers/authController.js'
import { auth } from '../middlewares/auth.js';
import { requireRol } from '../middlewares/requireRol.js';
import { ROLES } from '../constants/roles.js';

const createAuthRouter = (database = db) => {
  const router = Router();
  const {
    register,
    createUser,
    login,
    listarUsuarios,
    obtenerUsuario,
    modificarUsuario,
    eliminarUsuario,
    obtenerMiPerfil,
    modificarMiPerfil
  } = createAuthController(database);

  router.post('/register', register);
  router.get('/me', auth, obtenerMiPerfil);
  router.put('/me', auth, modificarMiPerfil);
  router.get('/users', auth, requireRol(ROLES.ADMIN), listarUsuarios);
  router.get('/users/:usuario_id', auth, requireRol(ROLES.ADMIN), obtenerUsuario);
  router.put('/users/:usuario_id', auth, requireRol(ROLES.ADMIN), modificarUsuario);
  router.delete('/users/:usuario_id', auth, requireRol(ROLES.ADMIN), eliminarUsuario);
  router.post('/users', auth, requireRol(ROLES.ADMIN), createUser);
  router.post('/login', login);

  return router;
};

export default createAuthRouter;

