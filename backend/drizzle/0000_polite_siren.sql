CREATE TABLE "hotel" (
	"hotel_id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"destino" varchar(100) NOT NULL,
	"foto" text
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" text NOT NULL,
	"rol" varchar(50) DEFAULT 'user' NOT NULL,
	CONSTRAINT "usuarios_email_unique" UNIQUE("email")
);

CREATE TABLE "agencia" (
    "agencia_id" serial PRIMARY KEY NOT NULL,
    "user_id" serial NOT NULL REFERENCES "usuarios" ("id"),
    "nombre" varchar(100) NOT NULL,
    "email" varchar(255) NOT NULL,
    "telefono" text,
    CONSTRAINT "agencia_email_unique" UNIQUE("email"),
    CONSTRAINT "agencia_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "usuarios" ("id")
);

CREATE TABLE "paquete" (
    "paquete_id" serial PRIMARY KEY NOT NULL,
    "agencia_id" integer NOT NULL,
    "hotel_id" integer NOT NULL,
    "precio" text NOT NULL,
    "descripcion" text NOT NULL,
    "nombre" varchar(100),
    "origen" varchar(100) NOT NULL,
    "destino" varchar(100) NOT NULL,
    CONSTRAINT "paquete_agencia_id_fk" FOREIGN KEY ("agencia_id") REFERENCES "agencia" ("agencia_id"),
    CONSTRAINT "paquete_hotel_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "hotel" ("hotel_id")
);