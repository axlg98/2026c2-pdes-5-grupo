export class FlightApiError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.name = 'FlightApiError';
    this.status = status;
  }
}

export const createFlightApiClient = ({
  baseUrl = process.env.FLIGHT_API_URL || 'http://localhost:3001',
  timeoutMs = 5000,
  fetchImpl = globalThis.fetch
} = {}) => {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');

  return {
    async getFlight(id) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetchImpl(`${normalizedBaseUrl}/api/vuelos/${id}`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: controller.signal
        });

        let payload = null;
        try {
          payload = await response.json();
        } catch {
          payload = null;
        }

        if (response.status === 404) {
          throw new FlightApiError('El vuelo no existe en la API de vuelos.', 404);
        }
        if (!response.ok) {
          throw new FlightApiError(
            payload?.error || 'La API de vuelos no está disponible.',
            response.status
          );
        }
        if (!payload?.vuelo) {
          throw new FlightApiError('La API de vuelos respondió con datos inválidos.');
        }

        return payload.vuelo;
      } catch (error) {
        if (error instanceof FlightApiError) throw error;
        if (error?.name === 'AbortError') {
          throw new FlightApiError('La API de vuelos excedió el tiempo de espera.');
        }
        throw new FlightApiError('No se pudo conectar con la API de vuelos.');
      } finally {
        clearTimeout(timeout);
      }
    }
  };
};
