import {Routes, Route, BrowserRouter} from 'react-router-dom'
import './App.css'
import GestionHotel from './pages/Hotel/GestionHotel'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/hotel' element={<GestionHotel/>} />
      </Routes>
    </BrowserRouter>

    
  )
}

export default App
