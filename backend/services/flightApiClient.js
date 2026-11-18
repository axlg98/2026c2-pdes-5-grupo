import jwt from 'jsonwebtoken';

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

  const createServiceToken = () => {
    if (!process.env.JWT_SECRET) {
      throw new FlightApiError('JWT_SECRET no esta configurado.');
    }
    return jwt.sign({
      id: 'ctv-backend',
      rol: 'agencia',
      service: 'ctv-backend'
    }, process.env.JWT_SECRET, { expiresIn: '5m' });
  };

  const request = async (path, options = {}) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const serviceToken = createServiceToken();
      const response = await fetchImpl(normalizedBaseUrl + path, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: 'Bearer ' + serviceToken
        },
        signal: controller.signal
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new FlightApiError(
          payload?.error || 'La API de vuelos no esta disponible.',
          response.status
        );
      }
      return payload;
    } catch (error) {
      if (error instanceof FlightApiError) throw error;
      if (error?.name === 'AbortError') {
        throw new FlightApiError('La API de vuelos excedio el tiempo de espera.');
      }
      throw new FlightApiError('No se pudo conectar con la API de vuelos.');
    } finally {
      clearTimeout(timeout);
    }
  };

  return {
    async getFlight(id) {
      const payload = await request('/api/vuelos/' + id, {
        method: 'GET',
        headers: { Accept: 'application/json' }
      });
      if (!payload?.vuelo) {
        throw new FlightApiError('La API de vuelos respondio con datos invalidos.');
      }
      return payload.vuelo;
    },

    async sellFlight(id, nombrePasajero) {
      const payload = await request('/api/vuelos/' + id + '/venta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ nombrePasajero })
      });
      if (!payload?.venta?.id) {
        throw new FlightApiError('La API de vuelos no confirmo la venta.');
      }
      return payload.venta;
    },

    async refundFlight(id, ventaId) {
      return request('/api/vuelos/' + id + '/reembolso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ventaId })
      });
    }
  };
};
