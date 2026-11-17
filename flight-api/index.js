import pool, { db } from "./db/connection.js";
import { createApp } from "./app.js";

const PORT = process.env.PORT || 3001;
const app = createApp({ database: db });

app.listen(PORT, () => {
  console.log(`Flight API running on port ${PORT}`);
});

process.on("SIGTERM", async () => {
  await pool.end();
  process.exit(0);
});
