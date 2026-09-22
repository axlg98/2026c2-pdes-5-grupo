import axios from 'axios'

export const api = axios.create({
    baseURL: 'http://localhost:300',
    headers:{
        'Content-Type': 'application/json'
    },
})

api.interceptors.request.use(
    (config) => {
        const token = getToken('authorization');
        if (token){
            config.headers['authorization'] = token
        }
        return config;
    },
    (error) => Promise.reject(error)
)



