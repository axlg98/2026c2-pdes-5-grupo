import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { usuarios } from '../db/schema.js';
import { ROLES, ROLES_ASIGNABLES } from '../constants/roles.js';

const esMailDuplicado = (err) => {
    return err.code === '23505';
}

export const createAuthController = (database = db) => ({
    ensureAdmin: async() => {
        const email = process.env.ADMIN_EMAIL;
        const password = process.env.ADMIN_PASSWORD;
        const nombre = process.env.ADMIN_NAME || 'Administrador';

        if (!email || !password) return null;

        const [existente] = await database.select({ id: usuarios.id })
            .from(usuarios)
            .where(eq(usuarios.email, email));

        if (existente) return existente;

        const [admin] = await database.insert(usuarios)
            .values({ nombre, email, password, rol: ROLES.ADMIN })
            .returning({ id: usuarios.id, email: usuarios.email, rol: usuarios.rol });

        return admin;
    },
    register: async(req,res) =>{
        try {
            const {nombre, email, password} = req.body;
            if(!nombre || !email || !password) {
                return res.status(400).json({error: 'Faltan campos requeridos.'});
            }
            if(password.length < 6) {
                return res.status(400).json({error: 'La contraseña debe ser mayor a 6 carácteres.'});
            }
            const [nuevo] = await database.insert(usuarios)
                                          .values({nombre,email,password,rol: ROLES.COMPRADOR})
                                          .returning({
                                            id: usuarios.id,
                                            nombre: usuarios.nombre,
                                            email: usuarios.email,
                                            rol: usuarios.rol
                                          });
                            res.status(201).json({mensaje: 'Usuario registrado exitosamente.', usuario: nuevo});
        }catch(err){
            if(esMailDuplicado(err)){
                return res.status(409).json({error: 'El email ya está registrado anteriormente.'})
            }
            return res.status(500).json({error: 'Error al registrar el usuario.'})
        }
    },
    createUser: async(req, res) => {
        try {
            const { nombre, email, password, rol } = req.body;

            if (!nombre || !email || !password || !rol) {
                return res.status(400).json({ error: 'Nombre, email, password y rol son obligatorios.' });
            }
            if (password.length < 6) {
                return res.status(400).json({ error: 'La contraseña debe ser mayor a 6 carácteres.' });
            }
            if (!ROLES_ASIGNABLES.includes(rol)) {
                return res.status(400).json({ error: 'Rol inválido.' });
            }

            const [nuevo] = await database.insert(usuarios)
                .values({ nombre, email, password, rol })
                .returning({
                    id: usuarios.id,
                    nombre: usuarios.nombre,
                    email: usuarios.email,
                    rol: usuarios.rol
                });

            return res.status(201).json({ mensaje: 'Usuario creado exitosamente.', usuario: nuevo });
        } catch (err) {
            if (esMailDuplicado(err)) {
                return res.status(409).json({ error: 'El email ya está registrado anteriormente.' });
            }
            return res.status(500).json({ error: 'Error al crear el usuario.' });
        }
    },
    login: async(req, res) => {
        try{
            const {email, password} = req.body;

            if(!email || !password) {
                return res.status(400).json({error: 'email y password son obligatorios para el inicio de sesión!.'});
            }

            const [usuario] = await database.select().from(usuarios)
                                             .where(eq(usuarios.email, email), eq(usuarios.password, password));
            
            if(!usuario){
                return res.status(401).json({error: 'Credenciales inválidas.'});
            }
            
            const token = jwt.sign({id:usuario.id, email: usuario.email,
                                    rol: usuario.rol}, process.env.JWT_SECRET,{expiresIn: '8h'}
            )

            res.status(200).json({
                token,
                usuario:{
                    id: usuario.id,
                    email: usuario.email,
                    rol: usuario.rol,
                    nombre: usuario.nombre
                }
            });

        }catch (err){
            res.status(500).json({error: err.message || 'Error al iniciar sesión.'});
        }
    }
})

const authController = createAuthController(db);

export const register = authController.register;
export const createUser = authController.createUser;
export const login = authController.login;
export const ensureAdmin = authController.ensureAdmin;

