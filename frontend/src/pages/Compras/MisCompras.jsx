import { useEffect, useState } from 'react';
import {
  cancelarCompraService,
  modificarCompraService,
  obtenerMisComprasService
} from '../../services/comprasService';

export default function MisCompras() {
  const [compras, setCompras] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [editando, setEditando] = useState(null);
  const [nombrePasajero, setNombrePasajero] = useState('');

  const cargar = async () => {
    setCargando(true);
    setError('');
    try {
      const data = await obtenerMisComprasService();
      setCompras(data.compras ?? []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const guardar = async (event) => {
    event.preventDefault();
    setError('');
    setMensaje('');
    try {
      await modificarCompraService(editando.compra_id, nombrePasajero);
      setEditando(null);
      setMensaje('Pasajero actualizado.');
      await cargar();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const cancelar = async (compraId) => {
    if (!window.confirm('¿Cancelar esta compra y reembolsar ambos vuelos?')) return;
    setError('');
    setMensaje('');
    try {
      await cancelarCompraService(compraId);
      setMensaje('Compra cancelada y vuelos reembolsados.');
      await cargar();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <main className="purchases-page">
      <h1>Mis compras</h1>
      {error && <p className="inline-error" role="alert">{error}</p>}
      {mensaje && <p className="inline-success" role="status">{mensaje}</p>}

      {cargando ? (
        <p>Cargando compras...</p>
      ) : compras.length === 0 ? (
        <p>Todavía no realizaste compras.</p>
      ) : (
        <section className="purchase-grid">
          {compras.map((compra) => (
            <article className="purchase-card" key={compra.compra_id}>
              <div className="purchase-card-header">
                <strong>Compra #{compra.compra_id}</strong>
                <span className={`purchase-status ${compra.estado ?? 'activa'}`}>
                  {(compra.estado ?? 'activa').toUpperCase()}
                </span>
              </div>
              <dl>
                <div><dt>Pasajero</dt><dd>{compra.nombre_pasajero}</dd></div>
                <div><dt>Paquete</dt><dd>#{compra.paquete_id}</dd></div>
                <div><dt>Hotel</dt><dd>#{compra.hotel_id}</dd></div>
                <div><dt>Salida</dt><dd>{compra.fecha_ida}</dd></div>
                <div><dt>Regreso</dt><dd>{compra.fecha_vuelta}</dd></div>
                <div><dt>Precio pagado</dt><dd>${Number(compra.precio_pagado).toLocaleString('es-AR')}</dd></div>
                <div><dt>Fecha de compra</dt><dd>{compra.fecha_compra ? new Date(compra.fecha_compra).toLocaleString('es-AR') : '-'}</dd></div>
                <div><dt>Vuelos</dt><dd>#{compra.vuelo_ida_id} / #{compra.vuelo_vuelta_id}</dd></div>
              </dl>

              {(compra.estado ?? 'activa') === 'activa' && (
                editando?.compra_id === compra.compra_id ? (
                  <form onSubmit={guardar} className="purchase-edit">
                    <label>
                      Nombre del pasajero
                      <input value={nombrePasajero} onChange={(event) => setNombrePasajero(event.target.value)} required />
                    </label>
                    <button type="submit" className="primary-button">Guardar</button>
                    <button type="button" onClick={() => setEditando(null)}>Cancelar edición</button>
                  </form>
                ) : (
                  <div className="purchase-actions">
                    <button type="button" onClick={() => {
                      setEditando(compra);
                      setNombrePasajero(compra.nombre_pasajero);
                    }}>Modificar pasajero</button>
                    <button type="button" className="danger-button" onClick={() => cancelar(compra.compra_id)}>Cancelar compra</button>
                  </div>
                )
              )}
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
