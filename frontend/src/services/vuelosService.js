export const obtenerVuelosService = async () => {
  const baseUrl = (import.meta.env.VITE_FLIGHT_API_URL || 'http://localhost:3001').replace(/\/$/, '');
  const response = await fetch(`${baseUrl}/api/vuelos`);
  if (!response.ok) throw new Error('No se pudieron cargar los vuelos disponibles.');
  const data = await response.json();
  return data.vuelos ?? [];
};
