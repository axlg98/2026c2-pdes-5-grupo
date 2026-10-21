import { api } from './api';
import { handleError } from './handleError';

export const registerService = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    return Promise.reject(handleError(error, 'No se pudo completar el registro.'));
  }
};
