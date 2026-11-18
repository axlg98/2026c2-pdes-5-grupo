import { getToken } from './storage';

export const obtenerVuelosService = async () => {
  const baseUrl = (import.meta.env.VITE_FLIGHT_API_URL || 'http://localhost:3001').replace(/\/$/, '');
  const token = getToken();
  const authorization = token
    ? (token.startsWith('Bearer ') ? token : 'Bearer ' + token)
    : null;
  const response = await fetch(`${baseUrl}/api/vuelos`, {
    headers: authorization ? { Authorization: authorization } : {}
  });
  if (!response.ok) throw new Error('No se pudieron cargar los vuelos disponibles.');
  const data = await response.json();
  return data.vuelos ?? [];
};
