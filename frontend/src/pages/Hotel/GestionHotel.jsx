import { obtenerHotelesService, crearHotelService } from "../../services/hotelService";
import { useState, useEffect } from "react";

const GestionHotel = () =>{
    const [hoteles,setHoteles] = useState([]);
    const [nombre, setNombre] = useState('');
    const [destino, setDestino] = useState('');
    const [foto, setFoto] = useState('');

    const cargarHoteles = async() => {
        try{
            const data = await obtenerHotelesService();
            setHoteles(data);
        }catch(error){
            console.error('Error al obtener los hoteles: ', error)
        }
    }
    useEffect(() => {
        cargarHoteles();
    }, []);

    const handleSubmit = async(e) => {
        e.preventDefault();
        try{
            await crearHotelService({nombre,destino,foto});
            // Limpiar formulario y recargar lista
            setNombre('');
            setDestino('');
            setFoto('');
            cargarHoteles(); 
        } catch (error) {
            console.error('Error al crear el hotel:', error);
        }
    }

    return(
        <>
            <h1>Gestión de Hoteles</h1>
            <form onSubmit={handleSubmit} className="hotelSubmit">
                <input 
                   type="text" 
                   placeholder="Nombre del hotel"
                   value={nombre}
                   onChange={(e) => setNombre(e.target.value)}
                   required
                />
                <input type="text" 
                   placeholder="Destino"
                   value={destino}
                   onChange={(e) => setDestino(e.target.value)}
                   required
                />
                <input type="text" 
                   placeholder="url de la foto"
                   value={foto}
                   onChange={(e) => setFoto(e.target.value)}
                />
                <button type="submit">Crear Hotel</button>
            </form>
            
            <ul>
                {
                    hoteles.map((hotel) => (
                        <li key={hotel.hotel_id}>

                        </li>
                    ))
                }
            </ul>
        </>
    )

}



export default GestionHotel