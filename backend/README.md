# Stack Tecnologico

- Node Js
- JavaScript
  
### Base de datos:

- PostgreSQL
- Drizzle
  
--- 

## Cómo levantar el proyecto.

### Levantar los contenedores

1. Para Windows:
   
            ```
            docker compose up --build
            ```
2. Para Linux:

            ```
            sudo docker compose up --build
            ```

    Esto levanta el backend CTV y sus dependencias configuradas en Docker Compose:

    - **Flight Api** : La api en el puerto 3001
    - **ctv-backend** : backend en el puerto 3000
    - **ctv-postgres** : base CTV en el puerto 5432
    - **flights-postgres** : base de vuelos en el puerto 5433

## Paquetes con vuelos

Los paquetes de agencia requieren un hotel y dos vuelos publicados por la API
externa de vuelos:

- `vuelo_ida_id`: identificador del vuelo de ida.
- `vuelo_vuelta_id`: identificador del vuelo de vuelta.
- `fecha_ida`: fecha del vuelo de ida, con formato `YYYY-MM-DD`.
- `fecha_vuelta`: fecha del vuelo de vuelta, con formato `YYYY-MM-DD`.
- `hotel_id`: identificador de un hotel cuyo destino coincide con el paquete.

Al crear o modificar un paquete, el backend consulta
`GET http://flights-api:3001/api/vuelos/:id` y valida:

- Que ambos vuelos existan.
- Que tengan disponibilidad.
- Que el origen y destino de ida coincidan con el paquete.
- Que el origen y destino de vuelta sean inversos.
- Que las fechas coincidan con los vuelos.
- Que el hotel pertenezca al destino del paquete.

Ejemplo de alta:

```json
{
  "nombre": "Escapada a Bariloche",
  "origen": "Buenos Aires",
  "destino": "Bariloche",
  "descripcion": "Vuelo ida y vuelta con estadia",
  "precio": 250000,
  "hotel_id": 1,
  "vuelo_ida_id": 1,
  "vuelo_vuelta_id": 2,
  "fecha_ida": "2027-01-15",
  "fecha_vuelta": "2027-01-22"
}
```