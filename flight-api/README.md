# API de vuelos

Servicio HTTP que administra aerolíneas, vuelos y ventas de vuelos para CTV.

## Endpoints

- `GET /health`: estado de la API y su base de datos.
- `POST /api/inicializacion` (alias: `/api/initialize`): carga fixtures idempotentes.
- `GET /api/aerolineas`: lista aerolíneas.
- `POST /api/aerolineas`: crea una aerolínea (`nombre`, `pais`).
- `GET /api/vuelos`: lista vuelos. Filtros opcionales: `origen`, `destino`,
  `fechaDesde`, `fechaHasta`, `aerolineaId` y `soloDisponibles=true`.
- `GET /api/vuelos/:id`: consulta un vuelo.
- `POST /api/vuelos`: crea un vuelo. Requiere `aerolineaId`, `codigo`, `fecha`,
  `hora`, `origen`, `destino` y `capacidad`.
- `POST /api/vuelos/:id/venta`: registra una venta con `{ "nombrePasajero": "..." }`.
  La disponibilidad se decrementa dentro de una transacción y no se permiten
  ventas cuando llega a cero.
- `GET /api/ventas`: lista ventas; acepta `vueloId` como filtro.
- `POST /api/vuelos/:id/reembolso`: recibe `{ "ventaId": 1 }`, marca la venta
  como reembolsada y restaura una unidad de disponibilidad.

La disponibilidad no se puede modificar directamente: al crear un vuelo comienza
igual a la capacidad y sólo disminuye al registrar una venta.

## Ejecución local

Desde la raíz del proyecto:

```powershell
docker compose up --build
```

Inicializar datos demo:

```powershell
Invoke-RestMethod -Method Post http://localhost:3001/api/inicializacion
```

Consultar vuelos:

```powershell
Invoke-RestMethod http://localhost:3001/api/vuelos
```

Registrar una venta:

```powershell
Invoke-RestMethod -Method Post `
  -Uri http://localhost:3001/api/vuelos/1/venta `
  -ContentType 'application/json' `
  -Body '{"nombrePasajero":"Pasajero Demo"}'
```

Eliminar los contenedores y sus volúmenes:

```powershell
docker compose down -v
```
