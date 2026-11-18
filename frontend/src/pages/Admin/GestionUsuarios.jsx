import { useEffect, useState } from 'react';
import {
  crearUsuarioService,
  desactivarUsuarioService,
  listarUsuariosService,
  modificarUsuarioService
} from '../../services/authService';

const vacio = { nombre: '', email: '', password: '', rol: 'comprador', activo: true };

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState(vacio);
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const cargar = async () => {
    setError('');
    try {
      const data = await listarUsuariosService();
      setUsuarios(data.usuarios ?? []);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  useEffect(() => { cargar(); }, []);

  const cambiar = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const enviar = async (event) => {
    event.preventDefault();
    setError('');
    setMensaje('');
    try {
      if (editandoId) {
        await modificarUsuarioService(editandoId, {
          nombre: form.nombre,
          email: form.email,
          rol: form.rol,
          activo: form.activo,
          ...(form.password ? { password: form.password } : {})
        });
        setMensaje('Usuario modificado correctamente.');
      } else {
        await crearUsuarioService(form);
        setMensaje('Usuario creado correctamente.');
      }
      setForm(vacio);
      setEditandoId(null);
      await cargar();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const editar = (usuario) => {
    setForm({
      nombre: usuario.nombre,
      email: usuario.email,
      password: '',
      rol: usuario.rol,
      activo: usuario.activo !== false
    });
    setEditandoId(usuario.id);
  };

  const desactivar = async (usuario) => {
    if (!window.confirm(`¿Desactivar al usuario ${usuario.nombre}?`)) return;
    setError('');
    setMensaje('');
    try {
      await desactivarUsuarioService(usuario.id);
      setMensaje('Usuario desactivado.');
      await cargar();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <main className="users-admin-page">
      <h1>ABM de usuarios</h1>
      {error && <p className="inline-error" role="alert">{error}</p>}
      {mensaje && <p className="inline-success" role="status">{mensaje}</p>}

      <form className="users-admin-form" onSubmit={enviar}>
        <label>Nombre<input name="nombre" value={form.nombre} onChange={cambiar} required /></label>
        <label>Email<input name="email" type="email" value={form.email} onChange={cambiar} required /></label>
        <label>
          Contraseña
          <input name="password" type="password" value={form.password} onChange={cambiar} minLength="6" required={!editandoId} />
        </label>
        <label>
          Rol
          <select name="rol" value={form.rol} onChange={cambiar}>
            <option value="comprador">Comprador</option>
            <option value="agencia">Agencia</option>
            <option value="admin">Administrador</option>
          </select>
        </label>
        {editandoId && (
          <label className="checkbox-label">
            <input name="activo" type="checkbox" checked={form.activo} onChange={cambiar} />
            Usuario activo
          </label>
        )}
        <button type="submit" className="primary-button">{editandoId ? 'Guardar cambios' : 'Crear usuario'}</button>
        {editandoId && <button type="button" onClick={() => { setEditandoId(null); setForm(vacio); }}>Cancelar</button>}
      </form>

      <div className="users-admin-table-wrap">
        <table className="users-admin-table">
          <thead>
            <tr><th>ID</th><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => (
              <tr key={usuario.id}>
                <td>{usuario.id}</td>
                <td>{usuario.nombre}</td>
                <td>{usuario.email}</td>
                <td>{usuario.rol}</td>
                <td>{usuario.activo === false ? 'Inactivo' : 'Activo'}</td>
                <td>
                  <button type="button" onClick={() => editar(usuario)}>Editar</button>
                  {usuario.activo !== false && (
                    <button type="button" className="danger-button" onClick={() => desactivar(usuario)}>Desactivar</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
