import {api} from './api'
import {handleError} from './handleError'


//GET
export const obtenerHotelesService = async() => {
    try{
        const res = await api.get('/');
        return res.data;
    }catch(error){
        return Promise.reject(handleError(error));
    }
}

//POST
export const crearHotelService = async(hotelData) => {
    try{
        const res = await api.post('/', hotelData);
        return res.data;
    }catch(error){
        return Promise.reject(handleError(error));
    }
}


