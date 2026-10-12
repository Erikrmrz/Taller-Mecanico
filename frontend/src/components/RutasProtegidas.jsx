import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Cargando } from './ui.jsx';

/** Exige sesión iniciada; si no, manda al login. */
export function RutaPrivada() {
  const { usuario, cargando } = useAuth();
  const location = useLocation();
  if (cargando) return <Cargando texto="Verificando sesión…" />;
  if (!usuario) return <Navigate to="/login" replace state={{ desde: location.pathname }} />;
  return <Outlet />;
}

/** RF-002: muestra «acceso denegado» si el rol del usuario no tiene la pantalla asignada. */
export function RutaPorRol({ roles }) {
  const { usuario } = useAuth();
  if (!roles.includes(usuario.rol)) {
    return (
      <div className="card mx-auto mt-10 max-w-lg p-8 text-center" role="alert">
        <h1 className="text-3xl font-semibold text-danger">Acceso denegado</h1>
        <p className="mt-3 text-slate-700">Su rol no tiene permiso para ver esta pantalla. Si necesita acceso, pídaselo al administrador.</p>
        <Link to="/" className="btn btn-primary mt-6">
          Volver al inicio
        </Link>
      </div>
    );
  }
  return <Outlet />;
}
