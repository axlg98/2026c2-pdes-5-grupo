import {api} from './api'
import {handleError} from './handleError'

//GET

export const obtenerMisFavoritosService = async(idUser) => {
    try{
        const res = await api.get('/paquete/', {params: {idUser}});
        return res.data;
    }catch(error){
        return Promise.reject(handleError(error));
    }
}

//POST

export const guardarFavoritosService = async(favoritoData) => {
    try{
        const res = await api.post('/paquete/', favoritoData);
        return res.data;
    }catch(error){
        return Promise.reject(handleError(error));
    }
}

//PUT

export const modificarFavoritosService = async(favoritoData, favoritoId) => {
    try{
            const res = await api.put(`/agencia/modificar/paquete/${favoritoId}`, favoritoData);
            return res.data;
        }catch(error){
            return Promise.reject(handleError(error));
        }
}

//DELETE

export const quitarFavoritoService = async(favoritoData, favoritoId) => {
    try{
        const res = await api.delete(`/baja/paquete/${favoritoId}`, {data: favoritoData});
        return res.data;
    }catch(error){
        return Promise.reject(handleError(error));
    }
}

