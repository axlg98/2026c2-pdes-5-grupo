import swaggerJSDoc from "swagger-jsdoc";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const backendDirectory = dirname(fileURLToPath(import.meta.url));

const swaggerDefinition = {
  openapi: "3.0.3",
  info: {
    title: "CTV Hotel API",
    version: "1.0.0",
    description: "API para consultar y crear hoteles."
  },
  servers: [{ url: "http://localhost:3000" }],
  components: {
    schemas: {
      Hotel: {
        type: "object",
        required: ["id", "nombre", "destino"],
        properties: {
          id: { type: "integer", example: 1 },
          nombre: { type: "string", example: "Hotel Central" },
          destino: { type: "string", example: "Buenos Aires" },
          foto: { type: "string", nullable: true, example: "https://example.com/hotel.jpg" }
        }
      },
      HotelInput: {
        type: "object",
        required: ["nombre", "destino"],
        properties: {
          nombre: { type: "string", example: "Hotel Central" },
          destino: { type: "string", example: "Buenos Aires" },
          foto: { type: "string", nullable: true, example: "https://example.com/hotel.jpg" }
        }
      },
      Error: {
        type: "object",
        properties: { error: { type: "string", example: "El nombre y el destino son obligatorios." } }
      }
    },
    responses: {
      ValidationError: {
        description: "Datos requeridos ausentes",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } }
      },
      InternalServerError: {
        description: "Error interno del servidor",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } }
      }
    }
  }
};

export const swaggerSpec = swaggerJSDoc({
  definition: swaggerDefinition,
  apis: [join(backendDirectory, "routes", "*.js").replaceAll("\\", "/")]
});