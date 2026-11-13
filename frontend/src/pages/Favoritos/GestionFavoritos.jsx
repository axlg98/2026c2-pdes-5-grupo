import { useEffect, useState } from 'react';
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
    cargarFavoritos();
    cargarPaquetes();
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
    <main>
      <h1>Mis favoritos</h1>

      {error && <p role="alert">{error}</p>}

      <label htmlFor="buscar-paquete">Buscar paquete por nombre</label>
        <input
          id="buscar-paquete"
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Nombre del paquete"
        />

      {busqueda.trim() && (
        loadingPaquetes ? (
          <p>Buscando paquetes...</p>
        ) : paquetesFiltrados.length === 0 ? (
          <p>No se encontraron paquetes con ese nombre.</p>
        ) : (
          <ul>
            {paquetesFiltrados.map((paquete) => {
              const yaEsFavorito = favoritosPaqueteIds.has(paquete.paquete_id);
              return (
                <li key={paquete.paquete_id}>
                  <h2>{paquete.nombre}</h2>
                  <p>{paquete.origen} - {paquete.destino} · ${paquete.precio}</p>
                  <button
                    type="button"
                    onClick={() => handleAgregarFavorito(paquete.paquete_id)}
                    disabled={yaEsFavorito}
                  >
                    {yaEsFavorito ? 'Ya está en favoritos' : 'Agregar a favoritos'}
                  </button>
                </li>
              );
            })}
          </ul>
        )
      )}

      {loading ? (
        <p>Cargando favoritos...</p>
      ) : favoritos.length === 0 ? (
        <p>Todavía no tenés favoritos.</p>
      ) : (
        <ul>
          {favoritos.map((favorito) => (
            <li key={favorito.favorito_id}>
              <h2>{favorito.nombre}</h2>
              <p>
                {favorito.origen} - {favorito.destino} · ${favorito.precio}
              </p>
              {favoritoEditando === favorito.favorito_id ? (
                <form onSubmit={(e) => handleModificarFavorito(e, favorito.favorito_id)}>
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
                    Comentario
                    <textarea
                      value={edicion.comentario}
                      onChange={(e) => setEdicion({ ...edicion, comentario: e.target.value })}
                    />
                  </label>
                  <button type="submit">Guardar cambios</button>
                  <button
                    type="button"
                    onClick={() => {
                      setFavoritoEditando(null);
                      setEdicion(EDICION_VACIA);
                    }}
                  >
                    Cancelar
                  </button>
                </form>
              ) : (
                <>
                  {favorito.puntaje != null && <p>Puntaje: {favorito.puntaje}/10</p>}
                  {favorito.comentario && <p>{favorito.comentario}</p>}
                  <button type="button" onClick={() => iniciarEdicion(favorito)}>
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuitarFavorito(favorito.favorito_id)}
                  >
                    Quitar de favoritos
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
};

export default GestionFavoritos;
