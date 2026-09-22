export const handleError = (error, defaultMesssage = ' Error desconocido') => {
    return new Error(error.response?.data?.error || defaultMesssage);
};

