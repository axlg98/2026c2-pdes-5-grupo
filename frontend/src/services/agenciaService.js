import { api } from './api';
import { handleError } from './handleError';

const request = async (callback, fallbackMessage) => {
  try {
    return await callback();
  } catch (error) {
    return Promise.reject(handleError(error, fallbackMessage));
  }
};

export const obtenerMisPaquetesService = () => request(async () => {
  const response = await api.get('/agencia/paquetes');
  return response.data;
}, 'No se pudieron cargar los paquetes.');

export const altaPaqueteService = (agencyData) => request(async () => {
  const response = await api.post('/agencia/paquetes', agencyData);
  return response.data;
}, 'No se pudo crear el paquete.');

export const modificarPaqueteService = (agencyData, paqueteId) => request(async () => {
  const response = await api.put(`/agencia/paquetes/${paqueteId}`, agencyData);
  return response.data;
}, 'No se pudo modificar el paquete.');

export const bajaPaqueteService = (_agencyData, paqueteId) => request(async () => {
  const response = await api.delete(`/agencia/paquetes/${paqueteId}`);
  return response.data;
}, 'No se pudo eliminar el paquete.');

export const listarAgenciasService = () => request(async () => {
  const response = await api.get('/agencia/lista');
  return response.data;
}, 'No se pudieron cargar las agencias.');

export const obtenerAgenciaService = (agenciaId) => request(async () => {
  const response = await api.get(`/agencia/${agenciaId}`);
  return response.data;
}, 'No se pudo cargar la agencia.');

export const obtenerMiAgenciaService = () => request(async () => {
  const response = await api.get('/agencia/mia');
  return response.data;
}, 'No se pudo cargar tu agencia.');

export const listarUsuariosAgenciaService = () => request(async () => {
  const response = await api.get('/agencia/usuarios');
  return response.data;
}, 'No se pudieron cargar los usuarios agencia.');

export const crearAgenciaService = (datos) => request(async () => {
  const response = await api.post('/agencia', datos);
  return response.data;
}, 'No se pudo crear la agencia.');

export const modificarAgenciaService = (agenciaId, datos) => request(async () => {
  const response = await api.put(`/agencia/${agenciaId}`, datos);
  return response.data;
}, 'No se pudo modificar la agencia.');

export const modificarMiAgenciaService = (datos) => request(async () => {
  const response = await api.put('/agencia/mia', datos);
  return response.data;
}, 'No se pudo modificar tu agencia.');

export const eliminarAgenciaService = (agenciaId) => request(async () => {
  const response = await api.delete(`/agencia/${agenciaId}`);
  return response.data;
}, 'No se pudo eliminar la agencia.');
