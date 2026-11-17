CREATE TABLE "aerolineas" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(120) NOT NULL,
	"pais" varchar(120) NOT NULL,
	CONSTRAINT "aerolineas_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "ventas_vuelos" (
	"id" serial PRIMARY KEY NOT NULL,
	"vuelo_id" integer NOT NULL,
	"nombre_pasajero" varchar(160) NOT NULL,
	"vendido_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vuelos" (
	"id" serial PRIMARY KEY NOT NULL,
	"aerolinea_id" integer NOT NULL,
	"codigo" varchar(20) NOT NULL,
	"fecha" date NOT NULL,
	"hora" time NOT NULL,
	"origen" varchar(120) NOT NULL,
	"destino" varchar(120) NOT NULL,
	"capacidad" integer NOT NULL,
	"disponibilidad" integer NOT NULL,
	CONSTRAINT "vuelos_codigo_unique" UNIQUE("codigo"),
	CONSTRAINT "vuelos_capacidad_positiva" CHECK ("vuelos"."capacidad" > 0),
	CONSTRAINT "vuelos_disponibilidad_valida" CHECK ("vuelos"."disponibilidad" >= 0 AND "vuelos"."disponibilidad" <= "vuelos"."capacidad")
);
--> statement-breakpoint
ALTER TABLE "ventas_vuelos" ADD CONSTRAINT "ventas_vuelos_vuelo_id_vuelos_id_fk" FOREIGN KEY ("vuelo_id") REFERENCES "public"."vuelos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vuelos" ADD CONSTRAINT "vuelos_aerolinea_id_aerolineas_id_fk" FOREIGN KEY ("aerolinea_id") REFERENCES "public"."aerolineas"("id") ON DELETE no action ON UPDATE no action;