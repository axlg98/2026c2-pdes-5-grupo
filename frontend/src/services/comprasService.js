import { api } from './api';
import { handleError } from './handleError';

export const comprarPaqueteService = async (paqueteId, nombrePasajero) => {
  try {
    const response = await api.post('/compras', {
      paquete_id: paqueteId,
      nombre_pasajero: nombrePasajero
    });
    return response.data;
  } catch (error) {
    return Promise.reject(handleError(error, 'No se pudo completar la compra.'));
  }
};

export const obtenerMisComprasService = async () => {
  try {
    const response = await api.get('/compras');
    return response.data;
  } catch (error) {
    return Promise.reject(handleError(error, 'No se pudo consultar el historial.'));
  }
};

export const obtenerCompraService = async (compraId) => {
  try {
    const response = await api.get(`/compras/${compraId}`);
    return response.data;
  } catch (error) {
    return Promise.reject(handleError(error, 'No se pudo consultar la compra.'));
  }
};

export const modificarCompraService = async (compraId, nombrePasajero) => {
  try {
    const response = await api.put(`/compras/${compraId}`, {
      nombre_pasajero: nombrePasajero
    });
    return response.data;
  } catch (error) {
    return Promise.reject(handleError(error, 'No se pudo modificar la compra.'));
  }
};

export const cancelarCompraService = async (compraId) => {
  try {
    const response = await api.delete(`/compras/${compraId}`);
    return response.data;
  } catch (error) {
    return Promise.reject(handleError(error, 'No se pudo cancelar la compra.'));
  }
};

export const obtenerVentasAgenciaService = async () => {
  try {
    const response = await api.get('/agencia/compras');
    return response.data;
  } catch (error) {
    return Promise.reject(handleError(error, 'No se pudieron consultar las ventas.'));
  }
};
