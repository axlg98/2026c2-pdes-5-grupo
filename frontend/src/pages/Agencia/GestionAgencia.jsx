import { useEffect, useState } from 'react';
import {
  obtenerMisPaquetesService,
  altaPaqueteService,
  modificarPaqueteService,
  bajaPaqueteService
} from '../../services/agenciaService';

const ID_USUARIO = 1; //Lo dejo hasta que esté el auth, por ahora dejé el que está a mano ahora.

const paqueteVacio = {
  nombre: '',
  origen: '',
  destino: '',
  descripcion: '',
  precio: '',
  hotel_id: ''
};

export function GestionAgencia() {
  const [paquetes, setPaquetes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(paqueteVacio);
  const [editandoId, setEditandoId] = useState(null);

  const cargarPaquetes = async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await obtenerMisPaquetesService(ID_USUARIO);
      setPaquetes(data.paquetes ?? []);
    } catch (err) {
      setError(err.message ?? 'Error al cargar los paquetes');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPaquetes();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const payload = { ...form, idUsuario: ID_USUARIO };
      if (editandoId) {
        await modificarPaqueteService(payload, editandoId);
      } else {
        await altaPaqueteService(payload);
      }
      setForm(paqueteVacio);
      setEditandoId(null);
      await cargarPaquetes();
    } catch (err) {
      setError(err.message ?? 'Error al guardar el paquete');
    }
  };

  const handleEditar = (paquete) => {
    setForm({
      nombre: paquete.nombre,
      origen: paquete.origen,
      destino: paquete.destino,
      descripcion: paquete.descripcion,
      precio: paquete.precio,
      hotel_id: paquete.hotel_id
    });
    setEditandoId(paquete.paquete_id);
  };

  const handleCancelarEdicion = () => {
    setForm(paqueteVacio);
    setEditandoId(null);
  };

  const handleBaja = async (paqueteId) => {
    if (!confirm('¿Dar de baja este paquete?')) return;
    setError(null);
    try {
      await bajaPaqueteService(ID_USUARIO, paqueteId);
      await cargarPaquetes();
    } catch (err) {
      setError(err.message ?? 'Error al eliminar el paquete');
    }
  };
  //A lo últimos le pongo style y se mejora
  return (
    <div>
      <h2>Mis paquetes</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <input name="nombre" 
         placeholder="Nombre" 
         value={form.nombre} 
         onChange={handleChange} required 
        />
        <input name="origen" 
         placeholder="Origen" 
         value={form.origen} 
         onChange={handleChange} required 
        />
        <input name="destino" 
          placeholder="Destino" 
          value={form.destino} 
          onChange={handleChange} required 
        />
        <input name="descripcion" 
         placeholder="Descripción" 
         value={form.descripcion} 
         onChange={handleChange} required 
        />
        <input name="precio" 
         type="number" 
         placeholder="Precio" 
         value={form.precio} 
         onChange={handleChange} required 
        />
        <input name="hotel_id" 
         type="number" 
         placeholder="ID Hotel" 
         value={form.hotel_id} 
         onChange={handleChange} required 
        />
        <button type="submit">{editandoId ? 'Guardar cambios' : 'Crear paquete'}</button>
        {editandoId && <button type="button" onClick={handleCancelarEdicion}>Cancelar</button>}
      </form>

      {cargando ? (
        <p>Cargando...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nombre</th><th>Origen</th><th>Destino</th><th>Precio</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paquetes.map((p) => (
              <tr key={p.paquete_id}>
                <td>{p.nombre}</td>
                <td>{p.origen}</td>
                <td>{p.destino}</td>
                <td>{p.precio}</td>
                <td>
                  <button onClick={() => handleEditar(p)}>Editar</button>
                  <button onClick={() => handleBaja(p.paquete_id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default GestionAgencia;