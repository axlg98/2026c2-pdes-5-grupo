export const requireRol = (...roles) => (req, res, next) => {
    if (roles.includes(req.user?.rol)) return next();
    res.status(403).json({ error: 'No tenés permisos para esta acción.' });
};