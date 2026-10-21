import pool from "./db/connection.js";
import { createApp } from "./app.js";
import { ensureAdmin } from "./controllers/authController.js";

const PORT = process.env.PORT || 3000;

const app = createApp({ healthCheck: () => pool.query("SELECT 1") });

ensureAdmin()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`CTV Backend running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('No se pudo inicializar el administrador:', error);
    process.exit(1);
  });