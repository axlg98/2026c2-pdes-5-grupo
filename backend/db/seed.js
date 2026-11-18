import { and, eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
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
  const usersByEmail = {};
  for (const fixture of fixtureUsers) {
    usersByEmail[fixture.email] = await upsertUser(database, fixture);
  }

  for (const hotelFixture of fixtureHotels) {
    const [exists] = await database.select({ id: hoteles.id })
      .from(hoteles)
      .where(eq(hoteles.nombre, hotelFixture.nombre));
    if (!exists) await database.insert(hoteles).values(hotelFixture);
  }

  const hotelRows = await database.select().from(hoteles);
  const hotelsByDestination = new Map(hotelRows.map((hotel) => [hotel.destino, hotel]));

  const agencyDefinitions = [
    {
      userEmail: 'agencia@ctv.com',
      nombre: 'Agencia Andes',
      email: 'ventas@agenciaandes.com',
      telefono: '+54 11 5555-1000'
    },
    {
      userEmail: 'patagonia@agencia.com',
      nombre: 'Viajes Patagonia',
      email: 'ventas@viajespatagonia.com',
      telefono: '+54 294 555-1100'
    },
    {
      userEmail: 'solymar@agencia.com',
      nombre: 'Sol & Mar',
      email: 'ventas@solymar.com',
      telefono: '+54 261 555-2200'
    }
  ];

  const agencies = {};
  for (const definition of agencyDefinitions) {
    const agencyUser = usersByEmail[definition.userEmail];
    if (!agencyUser) continue;
    await database.insert(agencia).values({
      user_id: agencyUser.id,
      nombre: definition.nombre,
      email: definition.email,
      telefono: definition.telefono
    }).onConflictDoNothing({ target: agencia.user_id });
    const [agencyRecord] = await database.select()
      .from(agencia)
      .where(eq(agencia.user_id, agencyUser.id));
    agencies[definition.nombre] = agencyRecord;
  }

  let flightRows = [];
  try {
    const headers = { Accept: 'application/json' };
    if (process.env.JWT_SECRET) {
      headers.Authorization = 'Bearer ' + jwt.sign({
        id: 'ctv-seed',
        rol: 'agencia',
        service: 'ctv-backend'
      }, process.env.JWT_SECRET, { expiresIn: '5m' });
    }
    const response = await fetchImpl(
      flightApiUrl.replace(/\/$/, '') + '/api/vuelos',
      { method: 'GET', headers }
    );
    if (response.ok) {
      const payload = await response.json();
      flightRows = payload.vuelos ?? [];
    } else {
      console.warn('No se pudieron consultar vuelos para los fixtures CTV:', response.status);
    }
  } catch (error) {
    console.warn('No se pudo consultar la API de vuelos para los fixtures CTV:', error.message);
  }

  const flightsByCode = new Map(flightRows.map((flight) => [flight.codigo, flight]));
  const barilocheHotel = hotelsByDestination.get('Bariloche');
  const mendozaHotel = hotelsByDestination.get('Mendoza');
  const idaBariloche = flightsByCode.get('AR1001');
  const vueltaBariloche = flightsByCode.get('AR1002');
  const idaMendoza = flightsByCode.get('LA4001');
  const vueltaMendoza = flightsByCode.get('LA4002');

  const packageFixtures = [];
  if (barilocheHotel && idaBariloche && vueltaBariloche) {
    packageFixtures.push(
      {
        agencyName: 'Agencia Andes',
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
      },
      {
        agencyName: 'Viajes Patagonia',
        hotel_id: barilocheHotel.id,
        vuelo_ida_id: idaBariloche.id,
        vuelo_vuelta_id: vueltaBariloche.id,
        fecha_ida: idaBariloche.fecha,
        fecha_vuelta: vueltaBariloche.fecha,
        nombre: 'Patagonia Premium',
        descripcion: 'Circuito premium con hotel y vuelos incluidos.',
        origen: idaBariloche.origen,
        destino: idaBariloche.destino,
        precio: '319000'
      }
    );
  }

  if (mendozaHotel && idaMendoza && vueltaMendoza) {
    packageFixtures.push(
      {
        agencyName: 'Agencia Andes',
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
      },
      {
        agencyName: 'Sol & Mar',
        hotel_id: mendozaHotel.id,
        vuelo_ida_id: idaMendoza.id,
        vuelo_vuelta_id: vueltaMendoza.id,
        fecha_ida: idaMendoza.fecha,
        fecha_vuelta: vueltaMendoza.fecha,
        nombre: 'Mendoza Deluxe',
        descripcion: 'Estadia elegante con traslado, hotel y vuelos.',
        origen: idaMendoza.origen,
        destino: idaMendoza.destino,
        precio: '245000'
      }
    );
  }

  if (barilocheHotel && idaBariloche && vueltaBariloche) {
    packageFixtures.push({
      agencyName: 'Sol & Mar',
      hotel_id: barilocheHotel.id,
      vuelo_ida_id: idaBariloche.id,
      vuelo_vuelta_id: vueltaBariloche.id,
      fecha_ida: idaBariloche.fecha,
      fecha_vuelta: vueltaBariloche.fecha,
      nombre: 'Nieve y montaña',
      descripcion: 'Viaje económico a la montaña para toda la familia.',
      origen: idaBariloche.origen,
      destino: idaBariloche.destino,
      precio: '215000'
    });
  }

  if (mendozaHotel && idaMendoza && vueltaMendoza) {
    packageFixtures.push({
      agencyName: 'Viajes Patagonia',
      hotel_id: mendozaHotel.id,
      vuelo_ida_id: idaMendoza.id,
      vuelo_vuelta_id: vueltaMendoza.id,
      fecha_ida: idaMendoza.fecha,
      fecha_vuelta: vueltaMendoza.fecha,
      nombre: 'Sabores de Mendoza',
      descripcion: 'Ruta gastronómica y hotel en el corazón de Mendoza.',
      origen: idaMendoza.origen,
      destino: idaMendoza.destino,
      precio: '225000'
    });
  }

  const createdPackages = {};
  for (const packageFixture of packageFixtures) {
    const agencyRecord = agencies[packageFixture.agencyName];
    if (!agencyRecord) continue;
    const { agencyName, ...values } = packageFixture;
    const [exists] = await database.select({ paquete_id: paquete.paquete_id })
      .from(paquete)
      .where(and(
        eq(paquete.agencia_id, agencyRecord.agencia_id),
        eq(paquete.nombre, values.nombre)
      ));
    if (!exists) {
      const [created] = await database.insert(paquete).values({
        ...values,
        agencia_id: agencyRecord.agencia_id
      }).returning();
      createdPackages[values.nombre] = created;
    } else {
      createdPackages[values.nombre] = exists;
    }
  }

  const buyerFixtures = [
    { email: 'comprador@ctv.com', packageName: 'Bariloche de ensueño', puntaje: 9, comentario: 'Excelente opción para vacaciones.' },
    { email: 'lucia@comprador.com', packageName: 'Mendoza y sus vinos', puntaje: 10, comentario: 'Los vinos y el hotel fueron increíbles.' },
    { email: 'martin@comprador.com', packageName: 'Patagonia Premium', puntaje: 8, comentario: 'Muy buena atención y organización.' },
    { email: 'sofia@comprador.com', packageName: 'Mendoza Deluxe', puntaje: 9, comentario: 'Viaje cómodo y destino hermoso.' }
  ];

  for (const buyerFixture of buyerFixtures) {
    const buyer = usersByEmail[buyerFixture.email];
    const selectedPackage = createdPackages[buyerFixture.packageName];
    if (!buyer || !selectedPackage) continue;

    await database.insert(favorito).values({
      user_id: buyer.id,
      paquete_id: selectedPackage.paquete_id,
      puntaje: buyerFixture.puntaje,
      comentario: buyerFixture.comentario
    }).onConflictDoNothing();

    const [existingPurchase] = await database.select({ compra_id: compra.compra_id })
      .from(compra)
      .where(and(
        eq(compra.user_id, buyer.id),
        eq(compra.paquete_id, selectedPackage.paquete_id)
      ));
    if (!existingPurchase) {
      await database.insert(compra).values({
        user_id: buyer.id,
        paquete_id: selectedPackage.paquete_id,
        agencia_id: selectedPackage.agencia_id,
        hotel_id: selectedPackage.hotel_id,
        vuelo_ida_id: selectedPackage.vuelo_ida_id,
        vuelo_vuelta_id: selectedPackage.vuelo_vuelta_id,
        venta_vuelo_ida_id: selectedPackage.vuelo_ida_id,
        venta_vuelo_vuelta_id: selectedPackage.vuelo_vuelta_id,
        nombre_pasajero: buyer.nombre,
        fecha_ida: selectedPackage.fecha_ida,
        fecha_vuelta: selectedPackage.fecha_vuelta,
        precio_pagado: selectedPackage.precio,
        estado: 'activa'
      });
    }
  }

  return {
    usuarios: Object.keys(usersByEmail).length,
    compradores: 4,
    hoteles: hotelRows.length,
    agencias: Object.keys(agencies).length,
    paquetes: Object.keys(createdPackages).length,
    vuelos: flightRows.length
  };
};
