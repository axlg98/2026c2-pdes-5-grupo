export const setToke = (token) => {
    if (token) localStorage.setItem('authorization', token);
}

export const getToken = () => localStorage.getItem('authorization');

export const removeToken = () => localStorage.removeItem('authorization');