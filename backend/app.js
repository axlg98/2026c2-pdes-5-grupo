import cors from 'cors';
import express from 'express';
import pool, { db } from './db/connection.js';
import createHotelRouter from './routes/hotelRoutes.js';
import createAgenciaRouter from './routes/agenciaRoutes.js';
import createAuthRouter from './routes/authRoutes.js';
import {auth} from './middlewares/auth.js'
import { requireRol } from './middlewares/requireRol.js'

export const createApp = ({ database = db, healthCheck = () => pool.query('SELECT 1') } = {}) => {
  const app = express();

  app.use(cors());
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
  app.use('/api/agencia',auth, requireRol('agencia'), createAgenciaRouter(database));
  app.use('/api/auth', createAuthRouter(database))


  return app;
};
