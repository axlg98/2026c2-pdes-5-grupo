import { useEffect, useState } from 'react';
import './GestionFavoritos.css';
import {
  obtenerMisFavoritosService,
  obtenerPaquetesService,
  guardarFavoritosService,
  modificarFavoritosService,
  quitarFavoritoService
} from '../../services/favoritosService';

const EDICION_VACIA = {
  puntaje: '',
  comentario: ''
};

const GestionFavoritos = () => {
  const [favoritos, setFavoritos] = useState([]);
  const [paquetes, setPaquetes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingPaquetes, setLoadingPaquetes] = useState(true);
  const [error, setError] = useState(null);
  const [favoritoEditando, setFavoritoEditando] = useState(null);
  const [edicion, setEdicion] = useState(EDICION_VACIA);

  const cargarFavoritos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await obtenerMisFavoritosService();
      setFavoritos(data.favoritos ?? []);
    } catch (err) {
      setError(err.message ?? 'Error al cargar los favoritos.');
    } finally {
      setLoading(false);
    }
  };

  const cargarPaquetes = async () => {
    setLoadingPaquetes(true);
    setError(null);
    try {
      const data = await obtenerPaquetesService();
      setPaquetes(data.paquetes ?? []);
    } catch (err) {
      setError(err.message ?? 'Error al cargar los paquetes.');
    } finally {
      setLoadingPaquetes(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      cargarFavoritos();
      cargarPaquetes();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const handleAgregarFavorito = async (paqueteId) => {
    setError(null);
    try {
      await guardarFavoritosService({ paquete_id: paqueteId });
      setBusqueda('');
      await cargarFavoritos();
    } catch (err) {
      setError(err.message ?? 'Error al guardar el favorito.');
    }
  };

  const handleQuitarFavorito = async (favoritoId) => {
    setError(null);
    try {
      await quitarFavoritoService(favoritoId);
      await cargarFavoritos();
    } catch (err) {
      setError(err.message ?? 'Error al quitar el favorito.');
    }
  };

  const iniciarEdicion = (favorito) => {
    setFavoritoEditando(favorito.favorito_id);
    setEdicion({
      puntaje: favorito.puntaje ?? '',
      comentario: favorito.comentario ?? ''
    });
  };

  const handleModificarFavorito = async (e, favoritoId) => {
    e.preventDefault();
    setError(null);

    const cambios = {};
    if (edicion.puntaje !== '') {
      cambios.puntaje = Number(edicion.puntaje);
    }
    if (edicion.comentario !== '') {
      cambios.comentario = edicion.comentario;
    }
    if (Object.keys(cambios).length === 0) {
      setError('Ingresá un puntaje o un comentario para guardar los cambios.');
      return;
    }
    if (
      cambios.puntaje !== undefined &&
      (!Number.isFinite(cambios.puntaje) || cambios.puntaje < 0 || cambios.puntaje > 10)
    ) {
      setError('El puntaje debe estar entre 0 y 10.');
      return;
    }

    try {
      await modificarFavoritosService(cambios, favoritoId);
      setFavoritoEditando(null);
      setEdicion(EDICION_VACIA);
      await cargarFavoritos();
    } catch (err) {
      setError(err.message ?? 'Error al modificar el favorito.');
    }
  };

  const paquetesFiltrados = paquetes.filter((paquete) =>
    (paquete.nombre ?? '').toLocaleLowerCase().includes(busqueda.trim().toLocaleLowerCase())
  );
  const favoritosPaqueteIds = new Set(favoritos.map((favorito) => favorito.paquete_id));

  return (
    <main className="favorites-page">
      <header className="favorites-heading">
        <p className="eyebrow">Tus próximos destinos</p>
        <div className="favorites-title-row">
          <div>
            <h1>Mis favoritos</h1>
            <p>Guardá los viajes que te gustan y sumales tu propia reseña.</p>
          </div>
          {!loading && (
            <span className="favorites-count">
              {favoritos.length} {favoritos.length === 1 ? 'paquete' : 'paquetes'}
            </span>
          )}
        </div>
      </header>

      {error && <p className="inline-error favorites-error" role="alert">{error}</p>}

      <section className="favorites-search" aria-labelledby="favorites-search-title">
        <div className="favorites-search-copy">
          <h2 id="favorites-search-title">Encontrá otro viaje</h2>
          <p>Buscá un paquete para agregarlo a tu lista.</p>
        </div>
        <label htmlFor="buscar-paquete">Nombre del paquete</label>
        <input
          id="buscar-paquete"
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Ej.: escapada a Mendoza"
        />
      </section>

      {busqueda.trim() && (
        loadingPaquetes ? (
          <p className="favorites-status" role="status">Buscando paquetes...</p>
        ) : paquetesFiltrados.length === 0 ? (
          <p className="favorites-status">No se encontraron paquetes con ese nombre.</p>
        ) : (
          <section className="favorites-results" aria-label="Resultados de búsqueda">
            {paquetesFiltrados.map((paquete) => {
              const yaEsFavorito = favoritosPaqueteIds.has(paquete.paquete_id);
              return (
                <article className="favorite-result-card" key={paquete.paquete_id}>
                  <div>
                    <h3>{paquete.nombre}</h3>
                    <p className="favorite-route">{paquete.origen} <span aria-hidden="true">→</span> {paquete.destino}</p>
                  </div>
                  <div className="favorite-result-footer">
                    <strong>${Number(paquete.precio).toLocaleString('es-AR')}</strong>
                  <button
                    type="button"
                    className="favorite-button"
                    onClick={() => handleAgregarFavorito(paquete.paquete_id)}
                    disabled={yaEsFavorito}
                  >
                    {yaEsFavorito ? 'Ya está en favoritos' : 'Agregar a favoritos'}
                  </button>
                  </div>
                </article>
              );
            })}
          </section>
        )
      )}

      <section className="favorites-list-section" aria-labelledby="favorites-list-title" aria-busy={loading}>
        <div className="favorites-list-heading">
          <h2 id="favorites-list-title">Tu lista</h2>
          {!loading && favoritos.length > 0 && <span>{favoritos.length} guardados</span>}
        </div>

        {loading ? (
          <p className="favorites-status" role="status">Cargando tus favoritos...</p>
        ) : favoritos.length === 0 ? (
          <div className="favorites-empty">
            <span className="favorites-empty-icon" aria-hidden="true">♡</span>
            <h3>Tu lista está esperando su primer viaje</h3>
            <p>Usá el buscador de arriba para encontrar un paquete y guardarlo acá.</p>
          </div>
        ) : (
          <div className="favorites-grid">
          {favoritos.map((favorito) => (
            <article className="favorite-card" key={favorito.favorito_id}>
              <div className="favorite-card-heading">
                <div>
                  <p className="favorite-card-label">Paquete guardado</p>
                  <h3>{favorito.nombre}</h3>
                </div>
                <span className="favorite-heart" aria-hidden="true">♥</span>
              </div>
              <p className="favorite-route">{favorito.origen} <span aria-hidden="true">→</span> {favorito.destino}</p>
              <p className="favorite-price">${Number(favorito.precio).toLocaleString('es-AR')}</p>
              {favoritoEditando === favorito.favorito_id ? (
                <form className="favorite-edit-form" onSubmit={(e) => handleModificarFavorito(e, favorito.favorito_id)}>
                  <label>
                    Puntaje (0 a 10)
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="any"
                      value={edicion.puntaje}
                      onChange={(e) => setEdicion({ ...edicion, puntaje: e.target.value })}
                    />
                  </label>
                  <label>
                    Comentario (opcional)
                    <textarea
                      rows="3"
                      value={edicion.comentario}
                      onChange={(e) => setEdicion({ ...edicion, comentario: e.target.value })}
                    />
                  </label>
                  <div className="favorite-actions">
                    <button type="submit" className="favorite-button">Guardar cambios</button>
                    <button
                      type="button"
                      className="favorite-button favorite-button-secondary"
                      onClick={() => {
                        setFavoritoEditando(null);
                        setEdicion(EDICION_VACIA);
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="favorite-review">
                    {favorito.puntaje != null && (
                      <p className="favorite-rating"><span aria-hidden="true">★</span> {favorito.puntaje}<span>/10</span></p>
                    )}
                    {favorito.comentario && <p className="favorite-comment">{favorito.comentario}</p>}
                    {favorito.puntaje == null && !favorito.comentario && (
                      <p className="favorite-no-review">Todavía no agregaste una reseña.</p>
                    )}
                  </div>
                  <div className="favorite-actions">
                    <button type="button" className="favorite-button" onClick={() => iniciarEdicion(favorito)}>
                      {favorito.puntaje != null || favorito.comentario ? 'Editar reseña' : 'Agregar reseña'}
                    </button>
                    <button
                      type="button"
                      className="favorite-button favorite-button-remove"
                      aria-label={`Quitar ${favorito.nombre} de favoritos`}
                      onClick={() => handleQuitarFavorito(favorito.favorito_id)}
                    >
                      Quitar
                    </button>
                  </div>
                </>
              )}
            </article>
          ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default GestionFavoritos;
