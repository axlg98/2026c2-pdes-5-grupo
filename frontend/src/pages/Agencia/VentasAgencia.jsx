import { useEffect, useState } from 'react';
import { obtenerVentasAgenciaService } from '../../services/comprasService';

export default function VentasAgencia() {
  const [ventas, setVentas] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    obtenerVentasAgenciaService()
      .then((data) => setVentas(data.compras ?? []))
      .catch((requestError) => setError(requestError.message));
  }, []);

  return (
    <main className="sales-page">
      <h1>Historial de ventas</h1>
      {error && <p className="inline-error" role="alert">{error}</p>}
      {ventas.length === 0 ? <p>No hay ventas registradas.</p> : (
        <div className="sales-table-wrap">
          <table className="sales-table">
            <thead>
              <tr>
                <th>Compra</th><th>Cliente</th><th>Pasajero</th><th>Paquete</th>
                <th>Hotel</th><th>Vuelos</th><th>Precio</th><th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {ventas.map((venta) => (
                <tr key={venta.compra_id}>
                  <td>#{venta.compra_id}</td>
                  <td>Usuario #{venta.user_id}</td>
                  <td>{venta.nombre_pasajero}</td>
                  <td>#{venta.paquete_id}</td>
                  <td>#{venta.hotel_id}</td>
                  <td>#{venta.vuelo_ida_id} / #{venta.vuelo_vuelta_id}</td>
                  <td>${Number(venta.precio_pagado).toLocaleString('es-AR')}</td>
                  <td>{venta.estado ?? 'activa'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
