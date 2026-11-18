import jwt from "jsonwebtoken";

export const auth = (req, res, next) => {
  const authorization = req.headers.authorization;
  const [scheme, token] = typeof authorization === "string"
    ? authorization.split(" ")
    : [];

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "No autenticado." });
  }
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ error: "JWT_SECRET no está configurado." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload || !["agencia", "admin"].includes(payload.rol)) {
      return res.status(403).json({ error: "No tenés permisos para consultar la API de vuelos." });
    }
    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({ error: "Token inválido o vencido." });
  }
};
