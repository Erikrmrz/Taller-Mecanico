import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ROL_ETIQUETA, ROLES } from '../lib/constants.js';

const ACCESOS = [
  { to: '/clientes', titulo: 'Clientes y vehículos', texto: 'Registra clientes, sus vehículos y busca por nombre, placa o VIN.', roles: [ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA] },
  { to: '/usuarios', titulo: 'Usuarios', texto: 'Crea cuentas, asigna roles y desactiva accesos.', roles: [ROLES.ADMINISTRADOR] },
];

export default function InicioPage() {
  const { usuario } = useAuth();
  const accesos = ACCESOS.filter((a) => a.roles.includes(usuario.rol));

  return (
    <div>
      <h1 className="text-4xl font-semibold text-petrol-800">Hola, {usuario.nombre.split(' ')[0]}</h1>
      <p className="mt-1 text-slate-700">Entró como {ROL_ETIQUETA[usuario.rol].toLowerCase()}.</p>

      {accesos.length === 0 ? (
        <div className="card mt-8 max-w-xl p-6">
          <p className="text-slate-700">Por ahora su cuenta no tiene pantallas asignadas. Las funciones para mecánicos se habilitarán en las próximas versiones del sistema.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {accesos.map((a) => (
            <Link key={a.to} to={a.to} className="card block p-5 transition-colors hover:border-petrol-600">
              <h2 className="text-2xl font-semibold text-petrol-800">{a.titulo}</h2>
              <p className="mt-1 text-[15px] text-slate-700">{a.texto}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
