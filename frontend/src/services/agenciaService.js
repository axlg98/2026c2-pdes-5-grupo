import {api} from './api'
import {handleError} from './handleError'


//GET
export const obtenerMisPaquetesService = async() => {
    try{
        const res = await api.get('/agencia/paquetes');
        return res.data;
    }catch(error){
        return Promise.reject(handleError(error));
    }
}

//POST
export const altaPaqueteService = async(agencyData) => {
    try{
        const res = await api.post('/agencia/paquetes', agencyData);
        return res.data;
    }catch(error){
        return Promise.reject(handleError(error));
    }
}

//PUT
export const modificarPaqueteService = async(agencyData,paqueteId) => {
    try{
        const res = await api.put(`/agencia/paquetes/${paqueteId}`, agencyData);
        return res.data;
    }catch(error){
        return Promise.reject(handleError(error));
    }
}

//DELETE
export const bajaPaqueteService = async(_agencyData,paqueteId) => {
    try{
        const res = await api.delete(`/agencia/paquetes/${paqueteId}`);
        return res.data;
    }catch(error){
        return Promise.reject(handleError(error));
    }
}

