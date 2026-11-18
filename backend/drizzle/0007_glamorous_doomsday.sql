ALTER TABLE "usuarios" ADD COLUMN "activo" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "actualizado_en" timestamp with time zone DEFAULT now() NOT NULL;