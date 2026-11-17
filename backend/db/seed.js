import { eq } from 'drizzle-orm';
import { agencia, compra, favorito, hoteles, paquete, usuarios } from './schema.js';
import { fixtureHotels, fixtureUsers } from '../fixtures.js';

const upsertUser = async (database, fixture) => {
  await database.insert(usuarios)
    .values(fixture)
    .onConflictDoNothing({ target: usuarios.email });
  const [user] = await database.select().from(usuarios).where(eq(usuarios.email, fixture.email));
  return user;
};

export const seedDatabase = async (
  database,
  { flightApiUrl = process.env.FLIGHT_API_URL || 'http://localhost:3001', fetchImpl = globalThis.fetch } = {}
) => {
  const users = {};
  for (const fixture of fixtureUsers) {
    users[fixture.rol] = await upsertUser(database, fixture);
  }

  await database.insert(hoteles)
    .values(fixtureHotels)
    .onConflictDoNothing();

  const hotelRows = await database.select().from(hoteles);
  const hotelsByDestination = new Map(hotelRows.map((hotel) => [hotel.destino, hotel]));

  let agency;
  if (users.agencia) {
    await database.insert(agencia).values({
      user_id: users.agencia.id,
      nombre: 'Agencia Andes',
      email: 'ventas@agenciaandes.com',
      telefono: '+54 11 5555-1000'
    }).onConflictDoNothing({ target: agencia.user_id });

    [agency] = await database.select().from(agencia).where(eq(agencia.user_id, users.agencia.id));
  }

  let flightRows = [];
  try {
    const response = await fetchImpl(`${flightApiUrl.replace(/\/$/, '')}/api/vuelos`);
    if (response.ok) {
      const payload = await response.json();
      flightRows = payload.vuelos ?? [];
    }
  } catch (error) {
    console.warn('No se pudo consultar la API de vuelos para los fixtures CTV:', error.message);
  }

  const flightsByCode = new Map(flightRows.map((flight) => [flight.codigo, flight]));
  if (agency) {
    const barilocheHotel = hotelsByDestination.get('Bariloche');
    const mendozaHotel = hotelsByDestination.get('Mendoza');
    const idaBariloche = flightsByCode.get('AR1001');
    const vueltaBariloche = flightsByCode.get('AR1002');
    const idaMendoza = flightsByCode.get('LA4001');
    const vueltaMendoza = flightsByCode.get('LA4002');

    const packageFixtures = [
      barilocheHotel && idaBariloche && vueltaBariloche ? {
        agencia_id: agency.agencia_id,
        hotel_id: barilocheHotel.id,
        vuelo_ida_id: idaBariloche.id,
        vuelo_vuelta_id: vueltaBariloche.id,
        fecha_ida: idaBariloche.fecha,
        fecha_vuelta: vueltaBariloche.fecha,
        nombre: 'Bariloche de ensueño',
        descripcion: 'Una semana en la Patagonia con vuelos ida y vuelta.',
        origen: idaBariloche.origen,
        destino: idaBariloche.destino,
        precio: '285000'
      } : null,
      mendozaHotel && idaMendoza && vueltaMendoza ? {
        agencia_id: agency.agencia_id,
        hotel_id: mendozaHotel.id,
        vuelo_ida_id: idaMendoza.id,
        vuelo_vuelta_id: vueltaMendoza.id,
        fecha_ida: idaMendoza.fecha,
        fecha_vuelta: vueltaMendoza.fecha,
        nombre: 'Mendoza y sus vinos',
        descripcion: 'Escapada de fin de semana con vuelo ida y vuelta.',
        origen: idaMendoza.origen,
        destino: idaMendoza.destino,
        precio: '198000'
      } : null
    ].filter(Boolean);

    for (const fixture of packageFixtures) {
      const [exists] = await database.select({ paquete_id: paquete.paquete_id })
        .from(paquete)
        .where(eq(paquete.nombre, fixture.nombre));
      if (!exists) {
        await database.insert(paquete).values(fixture);
      }
    }
  }

  if (users.comprador) {
    const [barilochePackage] = await database.select({ paquete_id: paquete.paquete_id })
      .from(paquete)
      .where(eq(paquete.nombre, 'Bariloche de ensueño'));

    if (barilochePackage) {
      await database.insert(favorito).values({
        user_id: users.comprador.id,
        paquete_id: barilochePackage.paquete_id,
        puntaje: 9,
        comentario: 'Excelente opción para vacaciones.'
      }).onConflictDoNothing();

      const [existingPurchase] = await database.select({ compra_id: compra.compra_id })
        .from(compra)
        .where(eq(compra.user_id, users.comprador.id));
      if (!existingPurchase) {
        await database.insert(compra).values({
          user_id: users.comprador.id,
          paquete_id: barilochePackage.paquete_id,
          agencia_id: agency?.agencia_id ?? 1,
          hotel_id: hotelsByDestination.get('Bariloche')?.id ?? 1,
          vuelo_ida_id: flightsByCode.get('AR1001')?.id ?? 1,
          vuelo_vuelta_id: flightsByCode.get('AR1002')?.id ?? 2,
          venta_vuelo_ida_id: 1,
          venta_vuelo_vuelta_id: 2,
          nombre_pasajero: 'Comprador Demo',
          fecha_ida: '2027-01-15',
          fecha_vuelta: '2027-01-22',
          precio_pagado: '285000'
        });
      }
    }
  }

  return {
    usuarios: Object.values(users).filter(Boolean).length,
    hoteles: hotelRows.length,
    agencias: agency ? 1 : 0,
    vuelos: flightRows.length
  };
};
