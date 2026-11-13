CREATE TABLE "favoritos" (
	"favorito_id" serial PRIMARY KEY NOT NULL,
	"user_id" serial NOT NULL,
	"paquete_id" serial NOT NULL,
	"puntaje" integer,
	"comentario" varchar(255),
	CONSTRAINT "favoritos_user_id_paquete_id_unique" UNIQUE("user_id","paquete_id"),
	CONSTRAINT "puntaje_0_a_10" CHECK ("favoritos"."puntaje" BETWEEN 0 AND 10)
);
--> statement-breakpoint
ALTER TABLE "favoritos" ADD CONSTRAINT "favoritos_user_id_usuarios_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favoritos" ADD CONSTRAINT "favoritos_paquete_id_paquete_paquete_id_fk" FOREIGN KEY ("paquete_id") REFERENCES "public"."paquete"("paquete_id") ON DELETE no action ON UPDATE no action;