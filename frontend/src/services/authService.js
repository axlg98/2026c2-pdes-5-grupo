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

export const loginService = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  } catch (error) {
    return Promise.reject(handleError(error, 'No se pudo iniciar sesión.'));
  }
};

export const listarUsuariosService = async () => {
  try {
    const response = await api.get('/auth/users');
    return response.data;
  } catch (error) {
    return Promise.reject(handleError(error, 'No se pudieron consultar los usuarios.'));
  }
};

export const obtenerUsuarioService = async (usuarioId) => {
  try {
    const response = await api.get(`/auth/users/${usuarioId}`);
    return response.data;
  } catch (error) {
    return Promise.reject(handleError(error, 'No se pudo consultar el usuario.'));
  }
};

export const crearUsuarioService = async (datos) => {
  try {
    const response = await api.post('/auth/users', datos);
    return response.data;
  } catch (error) {
    return Promise.reject(handleError(error, 'No se pudo crear el usuario.'));
  }
};

export const modificarUsuarioService = async (usuarioId, datos) => {
  try {
    const response = await api.put(`/auth/users/${usuarioId}`, datos);
    return response.data;
  } catch (error) {
    return Promise.reject(handleError(error, 'No se pudo modificar el usuario.'));
  }
};

export const desactivarUsuarioService = async (usuarioId) => {
  try {
    const response = await api.delete(`/auth/users/${usuarioId}`);
    return response.data;
  } catch (error) {
    return Promise.reject(handleError(error, 'No se pudo desactivar el usuario.'));
  }
};

export const obtenerMiPerfilService = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    return Promise.reject(handleError(error, 'No se pudo consultar el perfil.'));
  }
};

export const modificarMiPerfilService = async (datos) => {
  try {
    const response = await api.put('/auth/me', datos);
    return response.data;
  } catch (error) {
    return Promise.reject(handleError(error, 'No se pudo modificar el perfil.'));
  }
};
