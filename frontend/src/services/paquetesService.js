import { api } from './api';
import { handleError } from './handleError';

export const obtenerPaquetesService = async (filtros = {}) => {
  try {
    const params = {};
    if (filtros.palabraClave) params.palabraClave = filtros.palabraClave;
    if (filtros.destino) params.destino = filtros.destino;
    if (filtros.origen) params.origen = filtros.origen;
    if (filtros.precioMin) params.precioMin = filtros.precioMin;
    if (filtros.precioMax) params.precioMax = filtros.precioMax;
    const response = await api.get('/paquetes', { params });
    return response.data;
  } catch (error) {
    return Promise.reject(handleError(error, 'No se pudieron cargar los paquetes.'));
  }
};
