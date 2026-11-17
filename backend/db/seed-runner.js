import pool, { db } from './connection.js';
import { ensureAdmin } from '../controllers/authController.js';
import { seedDatabase } from './seed.js';

await ensureAdmin();
await seedDatabase(db);
await pool.end();
