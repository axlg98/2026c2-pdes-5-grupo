import pool, { db } from "./db/connection.js";
import { createApp } from "./app.js";
import { aerolineas, vuelos } from "./db/schema.js";
import { fixtureAirlines, fixtureFlights } from "./fixtures.js";

const PORT = process.env.PORT || 3001;
const app = createApp({ database: db });

const initializeFixtures = async () => {
  await db.insert(aerolineas)
    .values(fixtureAirlines)
    .onConflictDoNothing({ target: aerolineas.nombre });

  const airlineRows = await db.select().from(aerolineas);
  const airlinesByName = new Map(airlineRows.map((airline) => [airline.nombre, airline.id]));
  await db.insert(vuelos)
    .values(fixtureFlights.map(({ airline, ...flight }) => ({
      ...flight,
      aerolineaId: airlinesByName.get(airline),
      disponibilidad: flight.capacidad
    })))
    .onConflictDoNothing({ target: vuelos.codigo });
};

initializeFixtures()
  .then(() => console.log("Flight API fixtures initialized"))
  .catch((error) => {
    console.error("Could not initialize Flight API fixtures:", error);
  });

app.listen(PORT, () => {
  console.log(`Flight API running on port ${PORT}`);
});

process.on("SIGTERM", async () => {
  await pool.end();
  process.exit(0);
});
