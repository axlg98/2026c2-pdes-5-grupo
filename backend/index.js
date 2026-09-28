import pool from "./db/connection.js";
import { createApp } from "./app.js";

const PORT = process.env.PORT || 3000;
const app = createApp({ healthCheck: () => pool.query("SELECT 1") });

app.listen(PORT, () => {
  console.log(`CTV Backend running on port ${PORT}`);
});