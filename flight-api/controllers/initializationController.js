import { db } from "../db/connection.js";
import { aerolineas, vuelos } from "../db/schema.js";
import { fixtureAirlines, fixtureFlights } from "../fixtures.js";

export const createInitializationController = (database = db) => ({
  initialize: async (_req, res) => {
    try {
      const airlines = await database.insert(aerolineas)
        .values(fixtureAirlines)
        .onConflictDoNothing({ target: aerolineas.nombre })
        .returning();
      const airlineRows = await database.select().from(aerolineas);
      const airlinesByName = new Map(airlineRows.map((airline) => [airline.nombre, airline.id]));

      const flightValues = fixtureFlights.map(({ airline, ...flight }) => ({
        ...flight,
        aerolineaId: airlinesByName.get(airline),
        disponibilidad: flight.capacidad
      }));
      const flights = await database.insert(vuelos)
        .values(flightValues)
        .onConflictDoNothing({ target: vuelos.codigo })
        .returning();

      return res.status(200).json({
        mensaje: "Datos de vuelos inicializados correctamente.",
        aerolineasCreadas: airlines.length,
        vuelosCreados: flights.length
      });
    } catch (error) {
      console.error("Error initializing flight data:", error);
      return res.status(500).json({ error: "No se pudieron inicializar los datos de vuelos." });
    }
  }
});
