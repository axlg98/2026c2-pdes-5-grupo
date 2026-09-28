import axios from 'axios'
import { getToken } from './storage'

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/hoteles',
    headers:{
        'Content-Type': 'application/json'
    },
})

api.interceptors.request.use(
    (config) => {
        const token = getToken();
        if (token){
            config.headers['authorization'] = token
        }
        return config;
    },
    (error) => Promise.reject(error)
)



