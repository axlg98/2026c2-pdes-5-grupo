import { useState } from 'react';
import { Link } from 'react-router-dom';
import { registerService } from '../../services/authService';
import './Registro.css';

const initialForm = {
  nombre: '',
  email: '',
  password: '',
  confirmPassword: ''
};

function Registro() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [enviando, setEnviando] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setEnviando(true);

    try {
      await registerService({
        nombre: form.nombre.trim(),
        email: form.email.trim(),
        password: form.password
      });
      setForm(initialForm);
      setSuccess('Cuenta creada correctamente. Ya podés iniciar sesión.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="register-page">
      <section className="register-intro" aria-labelledby="register-title">
        <p className="register-kicker">CTV / Cuenta nueva</p>
        <h1 id="register-title">Entrá a tu próxima aventura.</h1>
        <p className="register-description">
          Creá tu cuenta para explorar hoteles y preparar tus próximos viajes.
        </p>
      </section>

      <section className="register-panel" aria-label="Formulario de registro">
        <div className="register-panel-heading">
          <span className="register-step">01</span>
          <div>
            <h2>Crear cuenta</h2>
            <p>Completá tus datos para comenzar.</p>
          </div>
        </div>

        <form className="register-form" onSubmit={handleSubmit}>
          <label htmlFor="nombre">
            Nombre completo
            <input
              id="nombre"
              name="nombre"
              type="text"
              value={form.nombre}
              onChange={handleChange}
              autoComplete="name"
              placeholder="Tu nombre"
              required
            />
          </label>

          <label htmlFor="email">
            Email
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              placeholder="nombre@ejemplo.com"
              required
            />
          </label>

          <div className="register-password-grid">
            <label htmlFor="password">
              Contraseña
              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
                minLength="6"
                required
              />
            </label>

            <label htmlFor="confirmPassword">
              Repetir contraseña
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                placeholder="Repetí tu contraseña"
                required
              />
            </label>
          </div>

          {error && <p className="register-message register-message-error" role="alert">{error}</p>}
          {success && <p className="register-message register-message-success" role="status">{success}</p>}

          <button className="register-submit" type="submit" disabled={enviando}>
            {enviando ? 'Creando cuenta...' : 'Crear mi cuenta'}
            <span aria-hidden="true">-&gt;</span>
          </button>
        </form>

        <p className="auth-switch">
          ¿Ya tenés cuenta? <Link to="/login">Iniciar sesión</Link>
        </p>
      </section>
    </main>
  );
}

export default Registro;
