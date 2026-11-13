import { sql } from "drizzle-orm";
import { pgTable, serial, integer, text, varchar, unique, check } from "drizzle-orm/pg-core";

export const usuarios = pgTable('usuarios', {
    id: serial('id').primaryKey(),
    nombre: varchar('nombre', {length:100}).notNull(),
    email: varchar('email', {length:255}).notNull().unique(),
    password: text('password').notNull(),
    rol: varchar('rol', {length:50}).notNull().default('comprador'),
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