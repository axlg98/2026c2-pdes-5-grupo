# language: es
Característica: Gestión de hoteles

  Antecedentes:
    Dado que la API de hoteles está disponible

  Escenario: Consultar hoteles
    Cuando consulto los hoteles
    Entonces la respuesta tiene estado 200
    Y la respuesta contiene el hotel "Hotel Cucumber"

  Escenario: Crear un hotel
    Cuando creo un hotel llamado "Hotel Cucumber Nuevo" en "Bariloche"
    Entonces la respuesta tiene estado 201
    Y el hotel creado se llama "Hotel Cucumber Nuevo"

  Escenario: Rechazar un hotel incompleto
    Cuando creo un hotel llamado "Hotel sin destino" en ""
    Entonces la respuesta tiene estado 400
