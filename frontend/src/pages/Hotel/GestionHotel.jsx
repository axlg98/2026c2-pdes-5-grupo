import { obtenerHotelesService, crearHotelService } from "../../services/hotelService";
import { useState, useEffect } from "react";
import './GestionHotel.css';

const GestionHotel = () =>{
    const [hoteles,setHoteles] = useState([]);
    const [nombre, setNombre] = useState('');
    const [destino, setDestino] = useState('');
    const [foto, setFoto] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');

    const cargarHoteles = async() => {
        try{
            const data = await obtenerHotelesService();
            setHoteles(data);
        }catch(error){
            console.error('Error al obtener los hoteles: ', error)
        }
    }
    useEffect(() => {
        let mounted = true;

        obtenerHotelesService()
            .then((data) => {
                if (mounted) setHoteles(data);
            })
            .catch((error) => {
                console.error('Error al obtener los hoteles: ', error);
            });

        return () => {
            mounted = false;
        };
    }, []);

    const handleSubmit = async(e) => {
        e.preventDefault();
        setMensaje('');
        setError('');
        try{
            await crearHotelService({nombre,destino,foto});
            setNombre('');
            setDestino('');
            setFoto('');
            await cargarHoteles();
            setMensaje('Hotel creado correctamente.');
        } catch (error) {
            setError(error.message);
            console.error('Error al crear el hotel:', error);
        }
    }

    return(
        <main className="hotel-page">
            <header className="hotel-heading">
                <p className="eyebrow">Administración</p>
                <h1>Gestión de hoteles</h1>
                <p>Administrá los hoteles y destinos disponibles en los paquetes.</p>
            </header>

            <form onSubmit={handleSubmit} className="hotel-form">
                <label htmlFor="hotel-nombre">
                    Nombre del hotel
                    <input
                       id="hotel-nombre"
                       type="text"
                       placeholder="Ej.: Hotel del Lago"
                       value={nombre}
                       onChange={(e) => setNombre(e.target.value)}
                       required
                    />
                </label>
                <label htmlFor="hotel-destino">
                    Destino
                    <input
                       id="hotel-destino"
                       type="text"
                       placeholder="Ej.: Bariloche"
                       value={destino}
                       onChange={(e) => setDestino(e.target.value)}
                       required
                    />
                </label>
                <label htmlFor="hotel-foto">
                    Foto (opcional)
                    <input
                       id="hotel-foto"
                       type="text"
                       placeholder="https://..."
                       value={foto}
                       onChange={(e) => setFoto(e.target.value)}
                    />
                </label>
                <button className="primary-button" type="submit">Crear hotel</button>
            </form>

            {mensaje && <p className="inline-success hotel-notice" role="status">{mensaje}</p>}
            {error && <p className="inline-error hotel-notice" role="alert">{error}</p>}

            <section className="hotel-list-section" aria-labelledby="hotel-list-title">
                <div className="hotel-list-heading">
                    <h2 id="hotel-list-title">Hoteles registrados</h2>
                    <span>{hoteles.length} {hoteles.length === 1 ? 'hotel' : 'hoteles'}</span>
                </div>

                {hoteles.length === 0 ? (
                    <div className="hotel-empty">
                        <h3>Todavía no hay hoteles</h3>
                        <p>Creá el primero con el formulario de arriba.</p>
                    </div>
                ) : (
                    <div className="hotel-grid">
                        {hoteles.map((hotel) => (
                            <article className="hotel-card" key={hotel.id}>
                                {hotel.foto ? (
                                    <img className="hotel-image" src={hotel.foto} alt={`Hotel ${hotel.nombre}`} loading="lazy" />
                                ) : (
                                    <div className="hotel-image-placeholder" aria-hidden="true">Hotel</div>
                                )}
                                <div className="hotel-card-body">
                                    <h3>{hotel.nombre}</h3>
                                    <p><span aria-hidden="true">⌖</span> {hotel.destino}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    )

}



export default GestionHotel