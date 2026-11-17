import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { obtenerPaquetesService } from '../../services/paquetesService';
import { guardarFavoritosService } from '../../services/favoritosService';
import { getUser } from '../../services/storage';

const filtrosIniciales = {
  palabraClave: '',
  destino: '',
  origen: '',
  precioMin: '',
  precioMax: ''
};

export default function CatalogoPaquetes() {
  const [paquetes, setPaquetes] = useState([]);
  const [filtros, setFiltros] = useState(filtrosIniciales);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const user = getUser();

  const cargar = async (values = filtros) => {
    setCargando(true);
    setError('');
    try {
      const data = await obtenerPaquetesService(values);
      setPaquetes(data.paquetes ?? []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar(filtrosIniciales);
  }, []);

  const handleChange = (event) => {
    setFiltros((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const buscar = (event) => {
    event.preventDefault();
    cargar(filtros);
  };

  const guardarFavorito = async (paqueteId) => {
    if (!user) {
      setError('Iniciá sesión para guardar paquetes como favoritos.');
      return;
    }
    try {
      await guardarFavoritosService({ paquete_id: paqueteId });
      setError('');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <main className="catalog-page">
      <section className="catalog-heading">
        <p className="eyebrow">Compra tu Viaje</p>
        <h1>Encontrá tu próxima aventura</h1>
        <p>Paquetes reales con hotel y vuelos de ida y vuelta publicados por nuestras agencias.</p>
      </section>

      <form className="package-search" onSubmit={buscar}>
        <label>
          Palabra clave
          <input name="palabraClave" value={filtros.palabraClave} onChange={handleChange} placeholder="Bariloche, playa..." />
        </label>
        <label>
          Origen
          <input name="origen" value={filtros.origen} onChange={handleChange} placeholder="Buenos Aires" />
        </label>
        <label>
          Destino
          <input name="destino" value={filtros.destino} onChange={handleChange} placeholder="Mendoza" />
        </label>
        <label>
          Precio mínimo
          <input name="precioMin" type="number" min="0" value={filtros.precioMin} onChange={handleChange} />
        </label>
        <label>
          Precio máximo
          <input name="precioMax" type="number" min="0" value={filtros.precioMax} onChange={handleChange} />
        </label>
        <button type="submit" className="primary-button">Buscar</button>
      </form>

      {error && <p className="inline-error" role="alert">{error}</p>}

      {cargando ? (
        <p className="catalog-status">Cargando paquetes...</p>
      ) : paquetes.length === 0 ? (
        <p className="catalog-status">No se encontraron paquetes.</p>
      ) : (
        <section className="package-grid" aria-label="Paquetes disponibles">
          {paquetes.map((paquete) => (
            <article className="package-card" key={paquete.paquete_id}>
              {paquete.hotelFoto && (
                <img src={paquete.hotelFoto} alt={paquete.hotel} className="package-image" />
              )}
              <div className="package-card-body">
                <p className="package-agency">{paquete.agencia}</p>
                <h2>{paquete.nombre}</h2>
                <p>{paquete.descripcion}</p>
                <dl>
                  <div><dt>Ruta</dt><dd>{paquete.origen} → {paquete.destino}</dd></div>
                  <div><dt>Hotel</dt><dd>{paquete.hotel}</dd></div>
                  <div><dt>Salida</dt><dd>{paquete.fecha_ida}</dd></div>
                  <div><dt>Regreso</dt><dd>{paquete.fecha_vuelta}</dd></div>
                  <div><dt>Vuelos</dt><dd>#{paquete.vuelo_ida_id} / #{paquete.vuelo_vuelta_id}</dd></div>
                </dl>
                <div className="package-card-footer">
                  <strong>${Number(paquete.precio).toLocaleString('es-AR')}</strong>
                  {user?.rol === 'comprador' ? (
                    <button type="button" onClick={() => guardarFavorito(paquete.paquete_id)}>
                      Guardar
                    </button>
                  ) : (
                    <Link to="/login">Iniciar sesión</Link>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
