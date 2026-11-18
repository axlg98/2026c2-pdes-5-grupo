import { useCallback, useEffect, useState } from 'react';
import {
  obtenerMisPaquetesService,
  altaPaqueteService,
  modificarPaqueteService,
  bajaPaqueteService,
  obtenerMiAgenciaService,
  modificarMiAgenciaService
} from '../../services/agenciaService';
import { getUser } from '../../services/storage';
import { obtenerHotelesService } from '../../services/hotelService';
import { obtenerVuelosService } from '../../services/vuelosService';

const paqueteVacio = {
  nombre: '',
  origen: '',
  destino: '',
  descripcion: '',
  precio: '',
  hotel_id: '',
  vuelo_ida_id: '',
  vuelo_vuelta_id: '',
  fecha_ida: '',
  fecha_vuelta: ''
};

export default function GestionAgencia() {
  const [paquetes, setPaquetes] = useState([]);
  const [hoteles, setHoteles] = useState([]);
  const [vuelos, setVuelos] = useState([]);
  const [form, setForm] = useState(paqueteVacio);
  const [editandoId, setEditandoId] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [perfil, setPerfil] = useState({ nombre: '', email: '', telefono: '' });
  const user = getUser();

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const [paquetesData, hotelesData, vuelosData] = await Promise.all([
        obtenerMisPaquetesService(),
        obtenerHotelesService(),
        obtenerVuelosService()
      ]);
      setPaquetes(paquetesData.paquetes ?? []);
      setHoteles(hotelesData);
      setVuelos(vuelosData);
      if (user?.rol === 'agencia') {
        try {
          const perfilData = await obtenerMiAgenciaService();
          setPerfil({
            nombre: perfilData.agencia?.nombre ?? '',
            email: perfilData.agencia?.email ?? '',
            telefono: perfilData.agencia?.telefono ?? ''
          });
        } catch (requestError) {
          setError(requestError.message);
        }
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setCargando(false);
    }
  }, [user?.rol]);

  useEffect(() => {
    const timer = window.setTimeout(() => cargar(), 0);
    return () => window.clearTimeout(timer);
  }, [cargar]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const guardar = async (event) => {
    event.preventDefault();
    setError('');
    setMensaje('');
    try {
      if (editandoId) {
        await modificarPaqueteService(form, editandoId);
      } else {
        await altaPaqueteService(form);
      }
      setForm(paqueteVacio);
      setEditandoId(null);
      setMensaje('Paquete guardado correctamente.');
      await cargar();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const editar = (paquete) => {
    setForm({
      nombre: paquete.nombre ?? '',
      origen: paquete.origen ?? '',
      destino: paquete.destino ?? '',
      descripcion: paquete.descripcion ?? '',
      precio: paquete.precio ?? '',
      hotel_id: paquete.hotel_id ?? '',
      vuelo_ida_id: paquete.vuelo_ida_id ?? '',
      vuelo_vuelta_id: paquete.vuelo_vuelta_id ?? '',
      fecha_ida: paquete.fecha_ida ?? '',
      fecha_vuelta: paquete.fecha_vuelta ?? ''
    });
    setEditandoId(paquete.paquete_id);
  };

  const eliminar = async (paqueteId) => {
    if (!window.confirm('¿Eliminar este paquete?')) return;
    setError('');
    try {
      await bajaPaqueteService(null, paqueteId);
      setMensaje('Paquete eliminado.');
      await cargar();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const cambiarPerfil = (event) => {
    setPerfil((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const guardarPerfil = async (event) => {
    event.preventDefault();
    setError('');
    setMensaje('');
    try {
      await modificarMiAgenciaService(perfil);
      setMensaje('Perfil de agencia actualizado.');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const vuelosIda = vuelos.filter((vuelo) => !form.destino || vuelo.destino.toLowerCase().includes(form.destino.toLowerCase()));
  const vuelosVuelta = vuelos.filter((vuelo) => !form.origen || vuelo.destino.toLowerCase().includes(form.origen.toLowerCase()));

  return (
    <main className="agency-page">
      <h1>Administración de paquetes</h1>
      {error && <p className="inline-error" role="alert">{error}</p>}
      {mensaje && <p className="inline-success" role="status">{mensaje}</p>}

      {user?.rol === 'agencia' && (
        <section className="agency-profile">
          <h2>Mi agencia</h2>
          <form onSubmit={guardarPerfil} className="agency-profile-form">
            <label>Nombre<input name="nombre" value={perfil.nombre} onChange={cambiarPerfil} required /></label>
            <label>Email<input name="email" type="email" value={perfil.email} onChange={cambiarPerfil} required /></label>
            <label>Teléfono<input name="telefono" value={perfil.telefono} onChange={cambiarPerfil} /></label>
            <button type="submit" className="primary-button">Guardar perfil</button>
          </form>
        </section>
      )}

      <form className="agency-form" onSubmit={guardar}>
        <label>Nombre<input name="nombre" value={form.nombre} onChange={handleChange} required /></label>
        <label>Origen<input name="origen" value={form.origen} onChange={handleChange} required /></label>
        <label>Destino<input name="destino" value={form.destino} onChange={handleChange} required /></label>
        <label>Descripción<textarea name="descripcion" value={form.descripcion} onChange={handleChange} required /></label>
        <label>Precio<input name="precio" type="number" min="1" value={form.precio} onChange={handleChange} required /></label>
        <label>
          Hotel
          <select name="hotel_id" value={form.hotel_id} onChange={handleChange} required>
            <option value="">Seleccionar hotel</option>
            {hoteles.map((hotel) => <option key={hotel.id} value={hotel.id}>{hotel.nombre} - {hotel.destino}</option>)}
          </select>
        </label>
        <label>
          Vuelo de ida
          <select name="vuelo_ida_id" value={form.vuelo_ida_id} onChange={handleChange} required>
            <option value="">Seleccionar vuelo</option>
            {vuelosIda.map((vuelo) => (
              <option key={vuelo.id} value={vuelo.id}>{vuelo.codigo}: {vuelo.origen} → {vuelo.destino} ({vuelo.fecha})</option>
            ))}
          </select>
        </label>
        <label>
          Vuelo de vuelta
          <select name="vuelo_vuelta_id" value={form.vuelo_vuelta_id} onChange={handleChange} required>
            <option value="">Seleccionar vuelo</option>
            {vuelosVuelta.map((vuelo) => (
              <option key={vuelo.id} value={vuelo.id}>{vuelo.codigo}: {vuelo.origen} → {vuelo.destino} ({vuelo.fecha})</option>
            ))}
          </select>
        </label>
        <label>Fecha ida<input name="fecha_ida" type="date" value={form.fecha_ida} onChange={handleChange} required /></label>
        <label>Fecha vuelta<input name="fecha_vuelta" type="date" value={form.fecha_vuelta} onChange={handleChange} required /></label>
        <button type="submit" className="primary-button">{editandoId ? 'Guardar cambios' : 'Crear paquete'}</button>
        {editandoId && (
          <button type="button" onClick={() => { setEditandoId(null); setForm(paqueteVacio); }}>Cancelar</button>
        )}
      </form>

      {cargando ? <p>Cargando paquetes...</p> : (
        <section className="agency-list">
          {paquetes.map((paquete) => (
            <article key={paquete.paquete_id}>
              <h2>{paquete.nombre}</h2>
              <p>{paquete.origen} → {paquete.destino} · ${paquete.precio}</p>
              <p>Vuelos #{paquete.vuelo_ida_id} / #{paquete.vuelo_vuelta_id}</p>
              <p>{paquete.fecha_ida} / {paquete.fecha_vuelta}</p>
              <button type="button" onClick={() => editar(paquete)}>Editar</button>
              <button type="button" onClick={() => eliminar(paquete.paquete_id)}>Eliminar</button>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
