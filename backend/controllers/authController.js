import jwt from 'jsonwebtoken';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { agencia, compra, favorito, usuarios } from '../db/schema.js';
import { ROLES, ROLES_ASIGNABLES } from '../constants/roles.js';

const esMailDuplicado = (err) => {
    return err.code === '23505';
}

export const createAuthController = (database = db) => ({
    listarUsuarios: async(req, res) => {
        try {
            const lista = await database.select({
                id: usuarios.id,
                nombre: usuarios.nombre,
                email: usuarios.email,
                rol: usuarios.rol,
                activo: usuarios.activo,
                actualizado_en: usuarios.actualizado_en
            }).from(usuarios).orderBy(asc(usuarios.nombre));
            return res.status(200).json({ usuarios: lista });
        } catch (error) {
            return res.status(500).json({ error: 'No se pudieron consultar los usuarios.' });
        }
    },
    obtenerUsuario: async(req, res) => {
        const usuarioId = Number(req.params.usuario_id);
        if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
            return res.status(400).json({ error: 'usuario_id debe ser positivo.' });
        }
        try {
            const [usuario] = await database.select({
                id: usuarios.id,
                nombre: usuarios.nombre,
                email: usuarios.email,
                rol: usuarios.rol,
                activo: usuarios.activo,
                actualizado_en: usuarios.actualizado_en
            }).from(usuarios).where(eq(usuarios.id, usuarioId));
            if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });
            return res.status(200).json({ usuario });
        } catch (error) {
            return res.status(500).json({ error: 'No se pudo consultar el usuario.' });
        }
    },
    ensureAdmin: async() => {
        const email = process.env.ADMIN_EMAIL;
        const password = process.env.ADMIN_PASSWORD;
        const nombre = process.env.ADMIN_NAME || 'Administrador';

        if (!email || !password) return null;

        const [existente] = await database.select({ id: usuarios.id })
            .from(usuarios)
            .where(eq(usuarios.rol, ROLES.ADMIN));

        if (existente) {
            const [actualizado] = await database.update(usuarios)
                .set({ nombre, email, password, rol: ROLES.ADMIN, activo: true, actualizado_en: new Date() })
                .where(eq(usuarios.id, existente.id))
                .returning({ id: usuarios.id, email: usuarios.email, rol: usuarios.rol });
            return actualizado;
        }

        const [admin] = await database.insert(usuarios)
            .values({ nombre, email, password, rol: ROLES.ADMIN, activo: true })
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
    modificarUsuario: async(req, res) => {
        const usuarioId = Number(req.params.usuario_id);
        if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
            return res.status(400).json({ error: 'usuario_id debe ser positivo.' });
        }
        const { nombre, email, password, rol, activo } = req.body ?? {};
        if (!nombre?.trim() || !email?.trim()) {
            return res.status(400).json({ error: 'Nombre y email son obligatorios.' });
        }
        if (rol !== undefined && !ROLES_ASIGNABLES.includes(rol)) {
            return res.status(400).json({ error: 'Rol inválido.' });
        }
        if (password !== undefined && password !== '' && password.length < 6) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
        }
        if (usuarioId === req.user.id && rol !== undefined && rol !== req.user.rol) {
            return res.status(409).json({ error: 'No podés cambiar tu propio rol.' });
        }

        const cambios = {
            nombre: nombre.trim(),
            email: email.trim(),
            actualizado_en: new Date()
        };
        if (password) cambios.password = password;
        if (rol !== undefined) cambios.rol = rol;
        if (activo !== undefined) cambios.activo = Boolean(activo);

        try {
            const [actual] = await database.select({ id: usuarios.id, rol: usuarios.rol })
                .from(usuarios).where(eq(usuarios.id, usuarioId));
            if (!actual) return res.status(404).json({ error: 'Usuario no encontrado.' });
            if (usuarioId === req.user.id && activo === false) {
                return res.status(409).json({ error: 'No podés desactivar tu propia cuenta.' });
            }
            if (actual.rol === ROLES.ADMIN && usuarioId !== req.user.id) {
                return res.status(409).json({ error: 'No podés modificar otro administrador.' });
            }

            const [actualizado] = await database.update(usuarios)
                .set(cambios)
                .where(eq(usuarios.id, usuarioId))
                .returning({
                    id: usuarios.id,
                    nombre: usuarios.nombre,
                    email: usuarios.email,
                    rol: usuarios.rol,
                    activo: usuarios.activo,
                    actualizado_en: usuarios.actualizado_en
                });
            return res.status(200).json({
                mensaje: 'Usuario modificado correctamente.',
                usuario: actualizado
            });
        } catch (error) {
            if (esMailDuplicado(error)) {
                return res.status(409).json({ error: 'El email ya está registrado.' });
            }
            return res.status(500).json({ error: 'No se pudo modificar el usuario.' });
        }
    },
    obtenerMiPerfil: async(req, res) => {
        try {
            const [usuario] = await database.select({
                id: usuarios.id,
                nombre: usuarios.nombre,
                email: usuarios.email,
                rol: usuarios.rol,
                activo: usuarios.activo,
                actualizado_en: usuarios.actualizado_en
            }).from(usuarios).where(eq(usuarios.id, req.user.id));
            if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });
            return res.status(200).json({ usuario });
        } catch (error) {
            return res.status(500).json({ error: 'No se pudo consultar el perfil.' });
        }
    },
    modificarMiPerfil: async(req, res) => {
        const { nombre, email, password } = req.body ?? {};
        if (!nombre?.trim() || !email?.trim()) {
            return res.status(400).json({ error: 'Nombre y email son obligatorios.' });
        }
        if (password !== undefined && password !== '' && password.length < 6) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
        }
        const cambios = {
            nombre: nombre.trim(),
            email: email.trim(),
            actualizado_en: new Date()
        };
        if (password) cambios.password = password;
        try {
            const [actualizado] = await database.update(usuarios)
                .set(cambios)
                .where(eq(usuarios.id, req.user.id))
                .returning({
                    id: usuarios.id,
                    nombre: usuarios.nombre,
                    email: usuarios.email,
                    rol: usuarios.rol,
                    activo: usuarios.activo,
                    actualizado_en: usuarios.actualizado_en
                });
            return res.status(200).json({
                mensaje: 'Perfil modificado correctamente.',
                usuario: actualizado
            });
        } catch (error) {
            if (esMailDuplicado(error)) {
                return res.status(409).json({ error: 'El email ya está registrado.' });
            }
            return res.status(500).json({ error: 'No se pudo modificar el perfil.' });
        }
    },
    eliminarUsuario: async(req, res) => {
        const usuarioId = Number(req.params.usuario_id);
        if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
            return res.status(400).json({ error: 'usuario_id debe ser positivo.' });
        }
        if (usuarioId === req.user.id) {
            return res.status(409).json({ error: 'No podés eliminar tu propia cuenta.' });
        }
        try {
            const [usuario] = await database.select({ id: usuarios.id, rol: usuarios.rol })
                .from(usuarios).where(eq(usuarios.id, usuarioId));
            if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });
            if (usuario.rol === ROLES.ADMIN) {
                return res.status(409).json({ error: 'No se puede eliminar otro administrador.' });
            }
            const [agenciaAsociada] = await database.select({ agencia_id: agencia.agencia_id })
                .from(agencia).where(eq(agencia.user_id, usuarioId));
            if (agenciaAsociada) {
                return res.status(409).json({
                    error: 'No se puede eliminar un usuario asociado a una agencia.'
                });
            }
            const [desactivado] = await database.update(usuarios)
                .set({ activo: false, actualizado_en: new Date() })
                .where(eq(usuarios.id, usuarioId))
                .returning({
                    id: usuarios.id,
                    nombre: usuarios.nombre,
                    email: usuarios.email,
                    rol: usuarios.rol,
                    activo: usuarios.activo
                });
            return res.status(200).json({
                mensaje: 'Usuario desactivado correctamente.',
                usuario: desactivado
            });
        } catch (error) {
            return res.status(500).json({ error: 'No se pudo desactivar el usuario.' });
        }
    },
    login: async(req, res) => {
        try{
            const {email, password} = req.body;

            if(!email || !password) {
                return res.status(400).json({error: 'email y password son obligatorios para el inicio de sesión!.'});
            }
            if (!process.env.JWT_SECRET) {
                return res.status(500).json({error: 'JWT_SECRET no está configurado.'});
            }

            const [usuario] = await database.select().from(usuarios)
                                             .where(and(
                                               eq(usuarios.email, email),
                                               eq(usuarios.password, password),
                                               eq(usuarios.activo, true)
                                             ));
            
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
export const listarUsuarios = authController.listarUsuarios;
export const obtenerUsuario = authController.obtenerUsuario;
export const modificarUsuario = authController.modificarUsuario;
export const eliminarUsuario = authController.eliminarUsuario;
export const obtenerMiPerfil = authController.obtenerMiPerfil;
export const modificarMiPerfil = authController.modificarMiPerfil;
