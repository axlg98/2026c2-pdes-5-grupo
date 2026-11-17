import { Navigate, Routes, Route, BrowserRouter, Link } from 'react-router-dom'
import './App.css'
import GestionHotel from './pages/Hotel/GestionHotel'
import GestionAgencia from './pages/Agencia/GestionAgencia'
import Registro from './pages/Auth/Registro'
import Login from './pages/Auth/Login'
import GestionFavoritos from './pages/Favoritos/GestionFavoritos'
import CatalogoPaquetes from './pages/Paquetes/CatalogoPaquetes'
import { getUser, removeToken } from './services/storage'

const Layout = ({ children }) => {
  const user = getUser();
  const cerrarSesion = () => {
    removeToken();
    localStorage.removeItem('user');
    window.location.assign('/login');
  };
  return (
    <>
      <nav className="main-nav">
        <LinkNav to="/paquetes">CTV</LinkNav>
        <div>
          <LinkNav to="/paquetes">Paquetes</LinkNav>
          {user?.rol === 'comprador' && <LinkNav to="/favoritos">Favoritos</LinkNav>}
          {(user?.rol === 'agencia' || user?.rol === 'admin') && <LinkNav to="/agencia">Agencia</LinkNav>}
          {user?.rol === 'admin' && <LinkNav to="/hotel">Hoteles</LinkNav>}
          {!user ? <LinkNav to="/login">Ingresar</LinkNav> : <button type="button" onClick={cerrarSesion}>Salir</button>}
        </div>
      </nav>
      {children}
    </>
  );
};

const LinkNav = ({ to, children }) => <Link to={to}>{children}</Link>;

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Navigate to='/paquetes' replace />} />
        <Route path='/registro' element={<Layout><Registro /></Layout>} />
        <Route path='/login' element={<Layout><Login /></Layout>} />
        <Route path='/paquetes' element={<Layout><CatalogoPaquetes /></Layout>} />
        <Route path='/hotel' element={<Layout><GestionHotel/></Layout>} />
        <Route path='/agencia' element={<Layout><GestionAgencia/></Layout>} />
        <Route path='/favoritos' element={<Layout><GestionFavoritos/></Layout>}/>
      </Routes>
    </BrowserRouter>

    
  )
}

export default App
