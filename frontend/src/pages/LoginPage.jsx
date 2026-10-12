import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert } from '../components/ui.jsx';

export default function LoginPage() {
  const { usuario, iniciarSesion } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrar, setMostrar] = useState(false);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to={location.state?.desde || '/'} replace />;

  async function enviar(e) {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Escriba su correo electrónico y su contraseña');
      return;
    }
    setEnviando(true);
    try {
      await iniciarSesion(email.trim(), password);
    } catch (err) {
      setError(err.message);
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen md:grid md:grid-cols-[1.1fr_1fr]">
      <section className="flex flex-col justify-end bg-petrol-800 px-6 py-10 md:px-12 md:py-16">
        <h1 className="font-display text-5xl font-bold leading-none text-white sm:text-6xl md:text-7xl">Taller Mecánico</h1>
        <p className="mt-4 max-w-sm text-lg text-petrol-100">Clientes, vehículos y usuarios del taller en un solo sistema.</p>
      </section>

      <section className="flex items-center px-6 py-10 md:px-12">
        <form onSubmit={enviar} className="mx-auto w-full max-w-sm space-y-5" noValidate>
          <h2 className="text-3xl font-semibold text-petrol-800">Iniciar sesión</h2>

          {error && <Alert>{error}</Alert>}

          <div>
            <label htmlFor="email" className="label">
              Correo electrónico
            </label>
            <input id="email" type="email" autoComplete="username" className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
          </div>

          <div>
            <label htmlFor="password" className="label">
              Contraseña
            </label>
            <div className="flex gap-2">
              <input
                id="password"
                type={mostrar ? 'text' : 'password'}
                autoComplete="current-password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" className="btn btn-secondary shrink-0" onClick={() => setMostrar((v) => !v)} aria-pressed={mostrar}>
                {mostrar ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={enviando}>
            {enviando ? 'Entrando…' : 'Iniciar sesión'}
          </button>
        </form>
      </section>
    </div>
  );
}
