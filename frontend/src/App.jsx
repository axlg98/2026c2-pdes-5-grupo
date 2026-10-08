import {Routes, Route, BrowserRouter} from 'react-router-dom'
import './App.css'
import GestionHotel from './pages/Hotel/GestionHotel'
import GestionAgencia from './pages/Agencia/GestionAgencia'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/hotel' element={<GestionHotel/>} />
        <Route path='/agencia' element={<GestionAgencia/>} />
      </Routes>
    </BrowserRouter>

    
  )
}

export default App
