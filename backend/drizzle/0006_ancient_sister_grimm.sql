ALTER TABLE "compra" ADD COLUMN "estado" varchar(20) DEFAULT 'activa' NOT NULL;--> statement-breakpoint
ALTER TABLE "compra" ADD COLUMN "actualizado_en" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "compra" ADD COLUMN "cancelada_en" timestamp with time zone;