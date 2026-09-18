import express from "express";
import pool from "./db/connection.js";
import createHotelRouter from './routes/hotelRoutes.js'
import cors from 'cors'

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.status(200).json({
      status: "ok"
    });
  } catch (error) {
    console.error("Database connection error:", error);

    res.status(500).json({
      status: "error"
    });
  }
});

app.use('/api/hoteles', createHotelRouter());

app.listen(PORT, () => {
  console.log(`CTV Backend running on port ${PORT}`);
});