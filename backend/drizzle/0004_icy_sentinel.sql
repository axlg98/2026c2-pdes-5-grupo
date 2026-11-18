ALTER TABLE "agencia" ALTER COLUMN "user_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "paquete" ALTER COLUMN "agencia_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "paquete" ALTER COLUMN "hotel_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "paquete" ADD COLUMN "vuelo_ida_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "paquete" ADD COLUMN "vuelo_vuelta_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "paquete" ADD COLUMN "fecha_ida" date NOT NULL;--> statement-breakpoint
ALTER TABLE "paquete" ADD COLUMN "fecha_vuelta" date NOT NULL;