import { sql } from "drizzle-orm";
import { pgTable, serial, integer, text, varchar, unique, check, date, numeric, timestamp, boolean } from "drizzle-orm/pg-core";

export const usuarios = pgTable('usuarios', {
    id: serial('id').primaryKey(),
    nombre: varchar('nombre', {length:100}).notNull(),
    email: varchar('email', {length:255}).notNull().unique(),
    password: text('password').notNull(),
    rol: varchar('rol', {length:50}).notNull().default('comprador'),
    activo: boolean('activo').notNull().default(true),
    actualizado_en: timestamp('actualizado_en', {withTimezone:true}).defaultNow().notNull()
});

export const hoteles = pgTable('hotel',{
    id: serial('hotel_id').primaryKey(),
    nombre: varchar('nombre', {length:255}).notNull(),
    destino: varchar('destino', {length:100}).notNull(),
    foto: text('foto')
})

export const agencia = pgTable('agencia', {
    agencia_id: serial('agencia_id').primaryKey(),
    user_id: integer('user_id').notNull().unique().references(() => usuarios.id),
    nombre:varchar('nombre',{length:100}).notNull(),
    email: varchar('email', {length:255}).notNull().unique(),
    telefono: text('telefono')
})

export const paquete = pgTable('paquete', {
    paquete_id: serial('paquete_id').primaryKey(),
    agencia_id: integer('agencia_id').notNull().references(() => agencia.agencia_id),
    hotel_id: integer('hotel_id').notNull().references(() => hoteles.id),
    vuelo_ida_id: integer('vuelo_ida_id').notNull(),
    vuelo_vuelta_id: integer('vuelo_vuelta_id').notNull(),
    fecha_ida: date('fecha_ida').notNull(),
    fecha_vuelta: date('fecha_vuelta').notNull(),
    precio: text('precio').notNull(),
    descripcion: text('descripcion').notNull(),
    nombre: varchar('nombre', {length:100}),
    origen: varchar('origen', {length:100}).notNull(),
    destino: varchar('destino', {length:100}).notNull(),
})

export const favorito = pgTable('favoritos', {
    favorito_id: serial('favorito_id').primaryKey(),
    user_id: serial('user_id').notNull().references(() => usuarios.id),
    paquete_id: serial('paquete_id').notNull().references(() => paquete.paquete_id),
    puntaje: integer('puntaje'),
    comentario: varchar('comentario',{length:255}),
}, (t) => ({
    unicoPorUsuario: unique().on(t.user_id, t.paquete_id),
    puntajeEnRango: check('puntaje_0_a_10', sql`${t.puntaje} BETWEEN 0 AND 10`)
}))

export const compra = pgTable('compra', {
    compra_id: serial('compra_id').primaryKey(),
    user_id: integer('user_id').notNull().references(() => usuarios.id),
    paquete_id: integer('paquete_id').notNull().references(() => paquete.paquete_id),
    agencia_id: integer('agencia_id').notNull().references(() => agencia.agencia_id),
    hotel_id: integer('hotel_id').notNull().references(() => hoteles.id),
    vuelo_ida_id: integer('vuelo_ida_id').notNull(),
    vuelo_vuelta_id: integer('vuelo_vuelta_id').notNull(),
    venta_vuelo_ida_id: integer('venta_vuelo_ida_id').notNull(),
    venta_vuelo_vuelta_id: integer('venta_vuelo_vuelta_id').notNull(),
    nombre_pasajero: varchar('nombre_pasajero', {length:160}).notNull(),
    fecha_compra: timestamp('fecha_compra', {withTimezone:true}).defaultNow().notNull(),
    fecha_ida: date('fecha_ida').notNull(),
    fecha_vuelta: date('fecha_vuelta').notNull(),
    precio_pagado: numeric('precio_pagado', {precision:12, scale:2}).notNull(),
    estado: varchar('estado', {length:20}).notNull().default('activa'),
    actualizado_en: timestamp('actualizado_en', {withTimezone:true}).defaultNow().notNull(),
    cancelada_en: timestamp('cancelada_en', {withTimezone:true})
})