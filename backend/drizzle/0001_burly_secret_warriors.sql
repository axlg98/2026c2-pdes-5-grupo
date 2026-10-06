CREATE TABLE "agencia" (
	"agencia_id" serial PRIMARY KEY NOT NULL,
	"user_id" serial NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"telefono" text,
	CONSTRAINT "agencia_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "agencia_email_unique" UNIQUE("email")
);

CREATE TABLE "paquete" (
	"paquete_id" serial PRIMARY KEY NOT NULL,
	"agencia_id" serial NOT NULL,
	"hotel_id" serial NOT NULL,
	"precio" text NOT NULL,
	"descripcion" text NOT NULL,
	"nombre" varchar(100),
	"origen" varchar(100) NOT NULL,
	"destino" varchar(100) NOT NULL
);

ALTER TABLE "agencia" ADD CONSTRAINT "agencia_user_id_usuarios_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "paquete" ADD CONSTRAINT "paquete_agencia_id_agencia_agencia_id_fk" FOREIGN KEY ("agencia_id") REFERENCES "public"."agencia"("agencia_id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "paquete" ADD CONSTRAINT "paquete_hotel_id_hotel_hotel_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotel"("hotel_id") ON DELETE no action ON UPDATE no action;