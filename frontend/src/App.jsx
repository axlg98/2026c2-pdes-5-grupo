import { Navigate, Routes, Route, BrowserRouter, Link } from 'react-router-dom'
import './App.css'
import GestionHotel from './pages/Hotel/GestionHotel'
import GestionAgencia from './pages/Agencia/GestionAgencia'
import Registro from './pages/Auth/Registro'
import Login from './pages/Auth/Login'
import GestionFavoritos from './pages/Favoritos/GestionFavoritos'
import CatalogoPaquetes from './pages/Paquetes/CatalogoPaquetes'
import MisCompras from './pages/Compras/MisCompras'
import VentasAgencia from './pages/Agencia/VentasAgencia'
import GestionAgencias from './pages/Admin/GestionAgencias'
import GestionUsuarios from './pages/Admin/GestionUsuarios'
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
          {user?.rol === 'comprador' && <LinkNav to="/compras">Mis compras</LinkNav>}
          {(user?.rol === 'agencia' || user?.rol === 'admin') && <LinkNav to="/agencia">Agencia</LinkNav>}
          {(user?.rol === 'agencia' || user?.rol === 'admin') && <LinkNav to="/agencia/ventas">Ventas</LinkNav>}
          {user?.rol === 'admin' && <LinkNav to="/hotel">Hoteles</LinkNav>}
          {user?.rol === 'admin' && <LinkNav to="/admin/agencias">Agencias</LinkNav>}
          {user?.rol === 'admin' && <LinkNav to="/admin/usuarios">Usuarios</LinkNav>}
          {!user ? <LinkNav to="/login">Ingresar</LinkNav> : <button type="button" onClick={cerrarSesion}>Salir</button>}
        </div>
      </nav>
      {children}
    </>
  );
};

const LinkNav = ({ to, children }) => <Link to={to}>{children}</Link>;

const RoleRoute = ({ children, roles }) => {
  const user = getUser();
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.rol)) return <Navigate to="/paquetes" replace />;
  return children;
};

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Navigate to='/paquetes' replace />} />
        <Route path='/registro' element={<Layout><Registro /></Layout>} />
        <Route path='/login' element={<Layout><Login /></Layout>} />
        <Route path='/paquetes' element={<Layout><CatalogoPaquetes /></Layout>} />
        <Route path='/hotel' element={<RoleRoute roles={['admin']}><Layout><GestionHotel/></Layout></RoleRoute>} />
        <Route path='/agencia' element={<RoleRoute roles={['agencia', 'admin']}><Layout><GestionAgencia/></Layout></RoleRoute>} />
        <Route path='/agencia/ventas' element={<RoleRoute roles={['agencia', 'admin']}><Layout><VentasAgencia/></Layout></RoleRoute>} />
        <Route path='/admin/agencias' element={<RoleRoute roles={['admin']}><Layout><GestionAgencias/></Layout></RoleRoute>} />
        <Route path='/admin/usuarios' element={<RoleRoute roles={['admin']}><Layout><GestionUsuarios/></Layout></RoleRoute>} />
        <Route path='/compras' element={<RoleRoute roles={['comprador']}><Layout><MisCompras/></Layout></RoleRoute>} />
        <Route path='/favoritos' element={<RoleRoute roles={['comprador']}><Layout><GestionFavoritos/></Layout></RoleRoute>}/>
      </Routes>
    </BrowserRouter>

    
  )
}

export default App
