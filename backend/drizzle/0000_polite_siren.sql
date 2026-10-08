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

