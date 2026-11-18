import { useEffect, useState } from 'react';
import {
  crearAgenciaService,
  eliminarAgenciaService,
  listarAgenciasService,
  listarUsuariosAgenciaService,
  modificarAgenciaService
} from '../../services/agenciaService';

const vacia = { nombre: '', email: '', telefono: '', user_id: '' };

export default function GestionAgencias() {
  const [agencias, setAgencias] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState(vacia);
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const cargar = async () => {
    setError('');
    try {
      const [agenciasData, usuariosData] = await Promise.all([
        listarAgenciasService(),
        listarUsuariosAgenciaService()
      ]);
      setAgencias(agenciasData.agencias ?? []);
      setUsuarios(usuariosData.usuarios ?? []);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => cargar(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const cambiar = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const guardar = async (event) => {
    event.preventDefault();
    setError('');
    setMensaje('');
    try {
      if (editandoId) {
        await modificarAgenciaService(editandoId, form);
      } else {
        await crearAgenciaService({ ...form, user_id: Number(form.user_id) });
      }
      setForm(vacia);
      setEditandoId(null);
      setMensaje('Agencia guardada correctamente.');
      await cargar();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const editar = (agencia) => {
    setForm({
      nombre: agencia.nombre,
      email: agencia.email,
      telefono: agencia.telefono ?? '',
      user_id: String(agencia.user_id)
    });
    setEditandoId(agencia.agencia_id);
  };

  const eliminar = async (agenciaId) => {
    if (!window.confirm('¿Eliminar esta agencia?')) return;
    setError('');
    try {
      await eliminarAgenciaService(agenciaId);
      setMensaje('Agencia eliminada.');
      await cargar();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <main className="agency-admin-page">
      <h1>ABM de agencias</h1>
      {error && <p className="inline-error" role="alert">{error}</p>}
      {mensaje && <p className="inline-success" role="status">{mensaje}</p>}

      <form className="agency-admin-form" onSubmit={guardar}>
        <label>Nombre<input name="nombre" value={form.nombre} onChange={cambiar} required /></label>
        <label>Email<input name="email" type="email" value={form.email} onChange={cambiar} required /></label>
        <label>Teléfono<input name="telefono" value={form.telefono} onChange={cambiar} /></label>
        <label>
          Usuario agencia
          <select name="user_id" value={form.user_id} onChange={cambiar} required>
            <option value="">Seleccionar usuario</option>
            {usuarios.map((usuario) => (
              <option key={usuario.id} value={usuario.id}>{usuario.nombre} ({usuario.email})</option>
            ))}
          </select>
        </label>
        <button type="submit" className="primary-button">{editandoId ? 'Guardar cambios' : 'Crear agencia'}</button>
        {editandoId && <button type="button" onClick={() => { setEditandoId(null); setForm(vacia); }}>Cancelar</button>}
      </form>

      <div className="agency-admin-grid">
        {agencias.map((agencia) => (
          <article key={agencia.agencia_id} className="agency-admin-card">
            <h2>{agencia.nombre}</h2>
            <p>{agencia.email}</p>
            <p>{agencia.telefono || 'Sin teléfono'}</p>
            <p>Usuario #{agencia.user_id}</p>
            <button type="button" onClick={() => editar(agencia)}>Editar</button>
            <button type="button" className="danger-button" onClick={() => eliminar(agencia.agencia_id)}>Eliminar</button>
          </article>
        ))}
      </div>
    </main>
  );
}
