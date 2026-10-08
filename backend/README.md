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

    Esto levanta 2 servicios:
    
    - **Flight Api** : La api en el puerto 3001
    - **ctv-backend** : postgresql en el puerto 3000 