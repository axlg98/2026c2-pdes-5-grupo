import { Router } from 'express';
import { db } from '../db/connection.js';
import {createAuthController} from '../controllers/authController.js'

const createAuthRouter = (database = db) => {
  const router = Router();
  const { register, login } = createAuthController(database);

  router.post('/register', register);
  router.post('/login', login);

  return router;
};

export default createAuthRouter;


