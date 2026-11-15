import {api} from './api'
import {handleError} from './handleError'

//GET

export const obtenerMisFavoritosService = async() => {
    try{
        const res = await api.get('/favoritos');
        return res.data;
    }catch(error){
        return Promise.reject(handleError(error));
    }
}

export const obtenerPaquetesService = async() => {
    try{
        const res = await api.get('/favoritos/paquetes');
        return res.data;
    }catch(error){
        return Promise.reject(handleError(error));
    }
}

//POST

export const guardarFavoritosService = async(favoritoData) => {
    try{
        const res = await api.post('/favoritos', favoritoData);
        return res.data;
    }catch(error){
        return Promise.reject(handleError(error));
    }
}

//PUT

export const modificarFavoritosService = async(favoritoData, favoritoId) => {
    try{
            const res = await api.put(`/favoritos/${favoritoId}`, favoritoData);
            return res.data;
        }catch(error){
            return Promise.reject(handleError(error));
        }
}

//DELETE

export const quitarFavoritoService = async(favoritoId) => {
    try{
        const res = await api.delete(`/favoritos/${favoritoId}`);
        return res.data;
    }catch(error){
        return Promise.reject(handleError(error));
    }
}
