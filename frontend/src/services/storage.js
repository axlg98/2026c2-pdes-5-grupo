export const setToken = (token) => {
    if (token) localStorage.setItem('authorization', token);
}

export const getToken = () => localStorage.getItem('authorization');

export const removeToken = () => localStorage.removeItem('authorization');

export const setUser = (user) => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
}

export const getUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}