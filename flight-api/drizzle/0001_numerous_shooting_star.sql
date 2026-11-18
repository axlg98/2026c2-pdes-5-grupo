ALTER TABLE "ventas_vuelos" ADD COLUMN "reembolsado" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "ventas_vuelos" ADD COLUMN "reembolsado_en" timestamp with time zone;