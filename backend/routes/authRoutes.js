import { Router } from 'express';
import { db } from '../db/connection.js';
import {createAuthController} from '../controllers/authController.js'
import { auth } from '../middlewares/auth.js';
import { requireRol } from '../middlewares/requireRol.js';
import { ROLES } from '../constants/roles.js';

const createAuthRouter = (database = db) => {
  const router = Router();
  const { register, createUser, login } = createAuthController(database);

  router.post('/register', register);
  router.post('/users', auth, requireRol(ROLES.ADMIN), createUser);
  router.post('/login', login);

  return router;
};

export default createAuthRouter;


