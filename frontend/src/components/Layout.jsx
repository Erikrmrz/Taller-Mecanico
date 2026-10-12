import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ROL_ETIQUETA, ROLES } from '../lib/constants.js';

const ENLACES = [
  { to: '/', etiqueta: 'Inicio', roles: Object.values(ROLES), end: true },
  { to: '/clientes', etiqueta: 'Clientes y vehículos', roles: [ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA] },
  { to: '/usuarios', etiqueta: 'Usuarios', roles: [ROLES.ADMINISTRADOR] },
];

function Navegacion({ onNavigate }) {
  const { usuario } = useAuth();
  return (
    <nav aria-label="Principal" className="flex flex-col gap-1">
      {ENLACES.filter((e) => e.roles.includes(usuario.rol)).map((e) => (
        <NavLink
          key={e.to}
          to={e.to}
          end={e.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `rounded-md border-l-4 px-3 py-2.5 text-[15px] font-medium transition-colors ${
              isActive ? 'border-signal bg-white/10 text-white' : 'border-transparent text-petrol-100 hover:bg-white/5'
            }`
          }
        >
          {e.etiqueta}
        </NavLink>
      ))}
    </nav>
  );
}

function Sesion() {
  const { usuario, cerrarSesion } = useAuth();
  return (
    <div className="border-t border-white/10 pt-4">
      <p className="truncate text-[15px] font-semibold text-white">{usuario.nombre}</p>
      <p className="text-sm text-petrol-100">{ROL_ETIQUETA[usuario.rol]}</p>
      <button type="button" onClick={cerrarSesion} className="btn btn-secondary btn-sm mt-3 w-full">
        Cerrar sesión
      </button>
    </div>
  );
}

const Marca = () => <span className="font-display text-2xl font-bold tracking-wide text-white">Taller Mecánico</span>;

export default function Layout() {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="min-h-screen md:flex">
      {/* Escritorio y tableta */}
      <aside className="hidden w-64 shrink-0 flex-col justify-between bg-petrol-800 p-5 md:flex">
        <div className="space-y-8">
          <Marca />
          <Navegacion />
        </div>
        <Sesion />
      </aside>

      {/* Móvil */}
      <header className="sticky top-0 z-30 bg-petrol-800 md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Marca />
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            aria-expanded={abierto}
            aria-controls="menu-movil"
            onClick={() => setAbierto((v) => !v)}
          >
            {abierto ? 'Cerrar' : 'Menú'}
          </button>
        </div>
        {abierto && (
          <div id="menu-movil" className="space-y-4 border-t border-white/10 px-4 pb-4 pt-3">
            <Navegacion onNavigate={() => setAbierto(false)} />
            <Sesion />
          </div>
        )}
      </header>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <div className="mx-auto max-w-5xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
