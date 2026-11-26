

## Paso a paso en Windows / PowerShell

Desde la raíz del repositorio:

1. Levantá la aplicación:

   ```powershell
   docker compose up --build -d
   ```
2. ir cambiando /scripts/smoke.js a load.js luego stress.js
   ```
   docker run --rm -v "$($PWD.Path)\load-tests:/scripts" -w /scripts grafana/k6 run --env      BACKEND_URL=http://host.docker.internal:3000 --env FLIGHT_API_URL=http://host.docker.internal:3001 --env FRONTEND_URL=http://host.docker.internal:5173 /scripts/smoke.js


   ```

3. Cuando termines, detené los servicios sin borrar los datos persistidos:

   ```powershell
   docker compose down
   ```

No uses `docker compose down -v` salvo que quieras eliminar deliberadamente las
bases locales y todos sus datos.

### Ejecutar k6 con Docker, sin instalarlo

Con los servicios de Compose levantados, podés usar la imagen oficial de k6.
Este comando obtiene el nombre real de la red de Compose y ejecuta el smoke test:

```powershell
docker run --rm -v "$($PWD.Path)\load-tests:/scripts" -w /scripts grafana/k6 run --env BACKEND_URL=http://host.docker.internal:3000 --env FLIGHT_API_URL=http://host.docker.internal:3001 --env FRONTEND_URL=http://host.docker.internal:5173 /scripts/smoke.js
```

Para correr otro escenario con este método, reemplazá `/scripts/smoke.js` por
`/scripts/load.js` o `/scripts/stress.js`.

## Escenarios y resultados esperados

| Comando | Qué ejecuta | Resultado esperado |
|---|---|---|
| `npm run k6:smoke` | Un recorrido completo con un usuario virtual y una iteración. | Todos los checks pasan (`checks` cerca de 100 %), sin solicitudes fallidas y con HTTP 200 en salud, frontend, login y consultas. |
| `npm run k6:load` | Sube gradualmente a 5, 10 y 20 usuarios virtuales; tarda 3 minutos. | Menos de 1 % de solicitudes fallidas, más de 99 % de checks correctos y p95 menor a 1 segundo. |
| `npm run k6:stress` | Sube en etapas hasta 80 usuarios, mantiene esa carga 2 minutos y luego baja. | Busca el límite del sistema: objetivo de menos de 5 % de errores, más de 95 % de checks correctos y p95 menor a 2 segundos. Puede fallar umbrales si se alcanza la saturación; eso es un resultado de capacidad que hay que investigar. tarda 4 minutos|

Cada recorrido comprueba:

- Frontend React (`GET /`).
- Backend (`GET /health`), paquetes, hoteles y documentación Swagger.
- Login y perfil del comprador, favoritos y compras.
- Login de agencia, datos de su agencia, paquetes y ventas.
- Login de administrador y listado de usuarios.
- Salud de Flight API, aerolíneas, vuelos, filtro por disponibilidad y detalle
  de un vuelo.

Los checks de respuesta confirman HTTP 200 y la forma básica del JSON esperado.
Si falta un fixture, falla el login o no hay vuelos disponibles, el smoke test
lo informa como check fallido en vez de contar la ejecución como exitosa.


