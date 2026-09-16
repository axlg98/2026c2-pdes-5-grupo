import { pgTable, serial, text } from "drizzle-orm/pg-core";

export const usuarios = pgTable('usuarios', {
    id: serial('id').primaryKey(),
    nombre: varchar('nombre', {length:100}).notNull(),
    email: varchar('email', {length:255}).notNull().unique(),
    password: text('password').notNull(),
    rol: varchar('rol', {length:50}).notNull().default('user'), // user?
});

export const hoteles = pgTable('hoteles',{
    id: serial('id').primaryKey(),
    nombre: varchar('nombre', {length:255}).notNull(),
    destino: varchar('destino', {length:100}).notNull(),
    foto: text('foto')
})