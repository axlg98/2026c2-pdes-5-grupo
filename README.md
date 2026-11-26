# 2026c2-pdes-grupo-5-

---

### Diagrama de Entidad de Relación

```mermaid
erDiagram
    USUARIO ||--o| AGENCIA : "tiene"
    AGENCIA ||--o{ PAQUETE : "ofrece"

    USUARIO ||--o{ FAVORITO : "guarda"
    PAQUETE ||--o{ FAVORITO : "es de interes"

    USUARIO ||--o{ COMPRA : "realiza"
    PAQUETE ||--o{ COMPRA : "corresponde"

    HOTEL ||--o{ PAQUETE : "incluye"

    AEROLINEA ||--o{ VUELO : "publica"
    PAQUETE }o--|| VUELO : "contiene"


    USUARIO {
        int id_usuario PK
        string username
        string nombre
        string apellido
        string email
        string password
        string type_profile
    }

    AGENCIA {
        int id_agencia PK
        int id_usuario FK
        string nombre
        string email
        string telefono
    }

    PAQUETE {
        int id_paquete PK
        int id_agencia FK
        int id_vuelo_ida FK
        int id_vuelo_vuelta FK
        int id_hotel FK
        string nombre
        string descripcion
        decimal precio
        string origen
        string destino
        date fecha
    }

    HOTEL {
        int id_hotel PK
        string nombre
        string destino
        string foto
    }

    FAVORITO {
        int id_favorito PK
        int id_usuario FK
        int id_paquete FK
        int puntaje
        string comentario
    }

    COMPRA {
        int id_compra PK
        int id_usuario FK
        int id_paquete FK
        date fecha_compra
        decimal precio_pagado
    }

    AEROLINEA {
        int id_aerolinea PK
        string nombre
        string pais
    }

    VUELO {
        int id_vuelo PK
        int id_aerolinea FK
        date fecha
        time hora
        string origen
        string destino
        int capacidad
        int disponibilidad
    }
```
---
## Variables de configuración


| Variable | Por defecto | Descripción |
|---|---|---|
| `POSTGRES_DB` | `ctv` | Base de datos del backend principal. |
| `POSTGRES_USER` | `ctv_user` | Usuario de la base principal. |
| `POSTGRES_PASSWORD` | `ctv_password` | Contraseña de la base principal |
| `POSTGRES_PORT` | `5432` | Puerto de la base principal publicado en el host. |
| `FLIGHTS_POSTGRES_DB` | `flights` | Base de datos del servicio de vuelos. |
| `FLIGHTS_POSTGRES_USER` | `flights_user` | Usuario de la base de vuelos. |
| `FLIGHTS_POSTGRES_PASSWORD` | `flights_password` | Contraseña de la base de vuelos. |
| `FLIGHTS_POSTGRES_PORT` | `5433` | Puerto de la base de vuelos publicado en el host. |
| `JWT_SECRET` | `replace-this-secret` | Clave compartida para firmar y verificar JWT.|
| `ADMIN_NAME` | `Admin` | Nombre de la cuenta admin|
| `ADMIN_EMAIL` | `admin` | Usuario/email de la cuenta admin. |
| `ADMIN_PASSWORD` | `123456` | Contraseña inicial del administrador. |
| `FLIGHT_API_URL` | `http://flights-api:3001` | URL interna de Flight API usada por el backend. |
| `VITE_API_URL` | `http://localhost:3000/api` | URL del backend. |
| `VITE_FLIGHT_API_URL` | `http://localhost:3001` | URL de Flight API que usa el frontend en el navegador. |

---
# Usuarios creados por defecto

| Usuario | Email | Password |
|---|---|---|
| `Comprador`	| `comprador@ctv.com`	    | `comprador123` |
| `Comprador`	| `lucia@comprador.com`	    | `comprador123` |
| `Comprador`	| `martin@comprador.com`	| `comprador123` |
| `Comprador`	| `sofia@comprador.com`	    | `comprador123` |
| `Agencia`	    | `agencia@ctv.com`	        | `agencia123` |
| `Agencia`	    | `patagonia@agencia.com`	| `agencia123` |
| `Agencia`	    | `solymar@agencia.com`	    | `agencia123` |

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

### bajar los contenedores

1. Para Windows:
   
```
            docker compose down -v
```
2. Para Linux:

```
            sudo docker compose down -v
```

---
# URL
 ### REGISTRAR
```bash
    http://localhost:5173/registro
```
 ### LOGIN
```bash
    http://localhost:5173/login
```
 ### INICIO -> una vez logueado
1. comprador
   
```bash
    http://localhost:5173/paquetes
```
2. agencia
   
```bash
    http://localhost:5173/agencia
```

3.admin

```bash
    http://localhost:5173/admin/agencias
```

---

### Integrantes

- Manchali, Damian
- Quaglia, Sebastian
- García, Axel
