CREATE TABLE "compra" (
	"compra_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"paquete_id" integer NOT NULL,
	"agencia_id" integer NOT NULL,
	"hotel_id" integer NOT NULL,
	"vuelo_ida_id" integer NOT NULL,
	"vuelo_vuelta_id" integer NOT NULL,
	"venta_vuelo_ida_id" integer NOT NULL,
	"venta_vuelo_vuelta_id" integer NOT NULL,
	"nombre_pasajero" varchar(160) NOT NULL,
	"fecha_compra" timestamp with time zone DEFAULT now() NOT NULL,
	"fecha_ida" date NOT NULL,
	"fecha_vuelta" date NOT NULL,
	"precio_pagado" numeric(12, 2) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "compra" ADD CONSTRAINT "compra_user_id_usuarios_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compra" ADD CONSTRAINT "compra_paquete_id_paquete_paquete_id_fk" FOREIGN KEY ("paquete_id") REFERENCES "public"."paquete"("paquete_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compra" ADD CONSTRAINT "compra_agencia_id_agencia_agencia_id_fk" FOREIGN KEY ("agencia_id") REFERENCES "public"."agencia"("agencia_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compra" ADD CONSTRAINT "compra_hotel_id_hotel_hotel_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotel"("hotel_id") ON DELETE no action ON UPDATE no action;