import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginService } from '../../services/authService';
import { setToken, setUser } from '../../services/storage';
import './Registro.css';

const initialForm = {
  email: '',
  password: ''
};

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setEnviando(true);

    try {
      const { token, usuario } = await loginService({
        email: form.email.trim(),
        password: form.password
      });

      setToken(token);
      setUser(usuario);
      navigate(usuario.rol === 'agencia' ? '/agencia' : '/hotel', { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="register-page">
      <section className="register-intro" aria-labelledby="login-title">
        <p className="register-kicker">CTV / Bienvenido de nuevo</p>
        <h1 id="login-title">Tu próximo destino empieza acá.</h1>
        <p className="register-description">
          Iniciá sesión para continuar organizando tus viajes y reservas.
        </p>
      </section>

      <section className="register-panel" aria-label="Formulario de inicio de sesión">
        <div className="register-panel-heading">
          <span className="register-step">02</span>
          <div>
            <h2>Iniciar sesión</h2>
            <p>Usá las credenciales de tu cuenta.</p>
          </div>
        </div>

        <form className="register-form" onSubmit={handleSubmit}>
          <label htmlFor="login-email">
            Email
            <input
              id="login-email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              placeholder="nombre@ejemplo.com"
              required
            />
          </label>

          <label htmlFor="login-password">
            Contraseña
            <input
              id="login-password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
              placeholder="Tu contraseña"
              required
            />
          </label>

          {error && <p className="register-message register-message-error" role="alert">{error}</p>}

          <button className="register-submit" type="submit" disabled={enviando}>
            {enviando ? 'Ingresando...' : 'Ingresar'}
            <span aria-hidden="true">-&gt;</span>
          </button>
        </form>

        <p className="auth-switch">
          ¿Todavía no tenés cuenta? <Link to="/registro">Crear una cuenta</Link>
        </p>
      </section>
    </main>
  );
}

export default Login;
