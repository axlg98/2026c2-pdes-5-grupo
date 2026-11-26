import cors from 'cors';
import express from 'express';
import pool, { db } from './db/connection.js';
import createHotelRouter from './routes/hotelRoutes.js';
import createAgenciaRouter from './routes/agenciaRoutes.js';
import createAuthRouter from './routes/authRoutes.js';
import createFavoritoRouter from './routes/favoritoRoutes.js';
import createPaqueteRouter from './routes/paqueteRoutes.js';
import createCompraRouter from './routes/compraRoutes.js';
import {auth} from './middlewares/auth.js'
import { requireRol } from './middlewares/requireRol.js'
import { ROLES } from './constants/roles.js';
import swaggerUI from 'swagger-ui-express';
import specs from './docs/swagger.js';


export const createApp = ({
  database = db,
  healthCheck = () => pool.query('SELECT 1'),
  flightApiClient
} = {}) => {
  const app = express();

  app.use(cors());
  app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(specs));
  app.use(express.json());

  app.get('/health', async (req, res) => {
    try {
      await healthCheck();
      res.status(200).json({ status: 'ok' });
    } catch (error) {
      console.error('Database connection error:', error);
      res.status(500).json({ status: 'error' });
    }
  });

  app.use('/api/hoteles', createHotelRouter(database));
  app.use('/api/paquetes', createPaqueteRouter(database));
  app.use('/api/compras', createCompraRouter(
    database,
    flightApiClient ? { flightApiClient } : {}
  ));
  app.use('/api/agencia', createAgenciaRouter(
    database,
    flightApiClient ? { flightApiClient } : {}
  ));
  app.use('/api/auth', createAuthRouter(database));
  app.use('/api/favoritos',auth, requireRol(ROLES.COMPRADOR), createFavoritoRouter(database))

  return app;
};
