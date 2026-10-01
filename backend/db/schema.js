import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core";

export const usuarios = pgTable('usuarios', {
    id: serial('id').primaryKey(),
    nombre: varchar('nombre', {length:100}).notNull(),
    email: varchar('email', {length:255}).notNull().unique(),
    password: text('password').notNull(),
    rol: varchar('rol', {length:50}).notNull().default('user'), // user?
});

export const hoteles = pgTable('hotel',{
    id: serial('hotel_id').primaryKey(),
    nombre: varchar('nombre', {length:255}).notNull(),
    destino: varchar('destino', {length:100}).notNull(),
    foto: text('foto')
})

export const agencia = pgTable('agencia', {
    agencia_id: serial('agencia_id').primaryKey(),
    user_id: serial('user_id').notNull().unique().references(() => usuarios.id),
    nombre:varchar('nombre',{length:100}).notNull(),
    email: varchar('email', {length:255}).notNull().unique(),
    telefono: text('telefono')
})

export const paquete = pgTable('paquete', {
    paquete_id: serial('paquete_id').primaryKey(),
    agencia_id: serial('agencia_id').notNull().references(() => agencia.agencia_id),
    hotel_id: serial('hotel_id').notNull().references(() => hoteles.id),
    precio: text('precio').notNull(),
    descripcion: text('descripcion').notNull(),
    nombre: varchar('nombre', {length:100}),
    origen: varchar('origen', {length:100}).notNull(),
    destino: varchar('destino', {length:100}).notNull(),
})




