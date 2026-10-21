import jwt from 'jsonwebtoken'

export const auth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if(!token){
        return res.status(401).json({error: 'No autenticado.'})
    }
    
    try{
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next()
    }catch(err){
        res.status(401).json({error: 'Token inválido o vencido.'})
    }
}

