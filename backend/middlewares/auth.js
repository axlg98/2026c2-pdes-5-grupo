import jwt from 'jsonwebtoken'

export const auth = (req, res, next) => {
    const authorization = req.headers.authorization;
    const [scheme, token] = typeof authorization === 'string'
        ? authorization.split(' ')
        : [];

    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({error: 'No autenticado.'})
    }

    if (!process.env.JWT_SECRET) {
        return res.status(500).json({error: 'JWT_SECRET no está configurado.'})
    }

    try{
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next()
    }catch(err){
        res.status(401).json({error: 'Token inválido o vencido.'})
    }
}
