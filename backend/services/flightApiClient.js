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

  const request = async (path, options = {}) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(`${normalizedBaseUrl}${path}`, {
        ...options,
        signal: controller.signal
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new FlightApiError(
          payload?.error || 'La API de vuelos no está disponible.',
          response.status
        );
      }
      return payload;
    } catch (error) {
      if (error instanceof FlightApiError) throw error;
      if (error?.name === 'AbortError') {
        throw new FlightApiError('La API de vuelos excedió el tiempo de espera.');
      }
      throw new FlightApiError('No se pudo conectar con la API de vuelos.');
    } finally {
      clearTimeout(timeout);
    }
  };

  return {
    async getFlight(id) {
      const payload = await request(`/api/vuelos/${id}`, {
        method: 'GET',
        headers: { Accept: 'application/json' }
      });
      if (!payload?.vuelo) {
        throw new FlightApiError('La API de vuelos respondió con datos inválidos.');
      }
      return payload.vuelo;
    },

    async sellFlight(id, nombrePasajero) {
      const payload = await request(`/api/vuelos/${id}/venta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ nombrePasajero })
      });
      if (!payload?.venta?.id) {
        throw new FlightApiError('La API de vuelos no confirmó la venta.');
      }
      return payload.venta;
    },

    async refundFlight(id, ventaId) {
      return request(`/api/vuelos/${id}/reembolso`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ventaId })
      });
    }
  };
};
