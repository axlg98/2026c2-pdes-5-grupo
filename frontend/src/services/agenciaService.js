import {api} from './api'
import {handleError} from './handleError'


//GET
export const obtenerMisPaquetesService = async(idUsuario) => {
    try{
        const res = await api.get('/agencia/paquetes', {params: {idUsuario}});
        return res.data;
    }catch(error){
        return Promise.reject(handleError(error));
    }
}

//POST
export const altaPaqueteService = async(agencyData) => {
    try{
        const res = await api.post('/agencia/paquete', agencyData);
        return res.data;
    }catch(error){
        return Promise.reject(handleError(error));
    }
}

//PUT
export const modificarPaqueteService = async(agencyData,paqueteId) => {
    try{
        const res = await api.put(`/agencia/modificar/paquete/${paqueteId}`, agencyData);
        return res.data;
    }catch(error){
        return Promise.reject(handleError(error));
    }
}

//DELETE
export const bajaPaqueteService = async(agencyData,paqueteId) => {
    try{
        const res = await api.delete(`/agencia/baja/paquete/${paqueteId}`, {data: agencyData});
        return res.data;
    }catch(error){
        return Promise.reject(handleError(error));
    }
}


