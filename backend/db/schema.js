import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core";

export const hoteles = pgTable("hotel", {
	id: serial("hotel_id").primaryKey(),
	nombre: varchar("nombre", { length: 255 }).notNull(),
	destino: varchar("destino", { length: 100 }).notNull(),
	foto: text("foto")
});
