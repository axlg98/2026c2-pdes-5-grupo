import pool, { db } from "./db/connection.js";
import { createApp } from "./app.js";
import { ensureAdmin } from "./controllers/authController.js";
import { seedDatabase } from "./db/seed.js";

const PORT = process.env.PORT || 3000;

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET no está configurado.");
  process.exit(1);
}

const app = createApp({ healthCheck: () => pool.query("SELECT 1") });

ensureAdmin()
  .then(() => seedDatabase(db))
  .then((seeded) => {
    console.log("CTV fixtures initialized", seeded);
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`CTV Backend running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('No se pudo inicializar el administrador:', error);
    process.exit(1);
  });