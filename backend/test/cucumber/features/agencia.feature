# language: es

Característica: Gestión de agencias

  Antecedentes:
    Dado Que la API de agencias está disponible

  Escenario: Consultar paquetes
    Cuando Consulto los paquetes
    Entonces la respuesta tiene estado 200
    Y la respuesta contiene el paquete "Paquete Cucumber"

  Escenario: Crear un paquete
    Cuando Creo un paquete llamado "Paquete Cucumber Nuevo" con destino "Bariloche"
    Entonces la respuesta tiene estado 201
    Y el paquete creado se llama "Paquete Cucumber Nuevo"

  Escenario: Rechazar un paquete incompleto
    Cuando Creo un paquete llamado "Paquete sin destino" con destino ""
    Entonces la respuesta tiene estado 400


