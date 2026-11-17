import { sql } from "drizzle-orm";
import { check, integer, pgTable, serial, time, date, timestamp, varchar } from "drizzle-orm/pg-core";

export const aerolineas = pgTable("aerolineas", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre", { length: 120 }).notNull().unique(),
  pais: varchar("pais", { length: 120 }).notNull()
});

export const vuelos = pgTable("vuelos", {
  id: serial("id").primaryKey(),
  aerolineaId: integer("aerolinea_id")
    .notNull()
    .references(() => aerolineas.id),
  codigo: varchar("codigo", { length: 20 }).notNull().unique(),
  fecha: date("fecha").notNull(),
  hora: time("hora").notNull(),
  origen: varchar("origen", { length: 120 }).notNull(),
  destino: varchar("destino", { length: 120 }).notNull(),
  capacidad: integer("capacidad").notNull(),
  disponibilidad: integer("disponibilidad").notNull()
}, (table) => ({
  capacidadPositiva: check("vuelos_capacidad_positiva", sql`${table.capacidad} > 0`),
  disponibilidadValida: check(
    "vuelos_disponibilidad_valida",
    sql`${table.disponibilidad} >= 0 AND ${table.disponibilidad} <= ${table.capacidad}`
  )
}));

export const ventasVuelos = pgTable("ventas_vuelos", {
  id: serial("id").primaryKey(),
  vueloId: integer("vuelo_id")
    .notNull()
    .references(() => vuelos.id),
  nombrePasajero: varchar("nombre_pasajero", { length: 160 }).notNull(),
  vendidoEn: timestamp("vendido_en", { withTimezone: true }).defaultNow().notNull()
});