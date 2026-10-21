import { Navigate, Routes, Route, BrowserRouter } from 'react-router-dom'
import './App.css'
import GestionHotel from './pages/Hotel/GestionHotel'
import GestionAgencia from './pages/Agencia/GestionAgencia'
import Registro from './pages/Auth/Registro'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Navigate to='/registro' replace />} />
        <Route path='/registro' element={<Registro />} />
        <Route path='/hotel' element={<GestionHotel/>} />
        <Route path='/agencia' element={<GestionAgencia/>} />
      </Routes>
    </BrowserRouter>

    
  )
}

export default App
