import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clientesApi } from '../api/index.js';
import ClienteFormModal from '../components/ClienteFormModal.jsx';
import { Alert, Cargando, Paginacion, Placa, useDebounce } from '../components/ui.jsx';

const POR_PAGINA = 10;

export default function ClientesPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [datos, setDatos] = useState({ items: [], total: 0 });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [nuevo, setNuevo] = useState(false);
  const busqueda = useDebounce(q.trim(), 300);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    clientesApi
      .listar({ q: busqueda, page, pageSize: POR_PAGINA })
      .then((r) => {
        if (!vigente) return;
        setDatos(r);
        setError('');
      })
      .catch((err) => vigente && setError(err.message))
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, [busqueda, page]);

  const cambiarBusqueda = (valor) => {
    setQ(valor);
    setPage(1);
  };

  const vehiculosDe = (c) =>
    c.vehiculos.length === 0 ? (
      <span className="text-sm text-slate-500">Sin vehículos</span>
    ) : (
      <span className="flex flex-wrap gap-1.5">
        {c.vehiculos.map((v) => (
          <Placa key={v.id} valor={v.placa} />
        ))}
      </span>
    );

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-4xl font-semibold text-petrol-800">Clientes y vehículos</h1>
          <p className="text-slate-700">Busque por nombre, teléfono, correo, placa o VIN.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setNuevo(true)}>
          Nuevo cliente
        </button>
      </div>

      <div className="mt-5">
        <label htmlFor="busqueda" className="sr-only">
          Buscar cliente o vehículo
        </label>
        <input id="busqueda" type="search" className="input max-w-md" placeholder="Buscar…" value={q} onChange={(e) => cambiarBusqueda(e.target.value)} />
      </div>

      {error && (
        <div className="mt-4">
          <Alert>{error}</Alert>
        </div>
      )}

      {cargando ? (
        <Cargando />
      ) : datos.items.length === 0 ? (
        <div className="card mt-5 p-8 text-center">
          <p className="text-lg font-medium text-petrol-800">{busqueda ? `Ningún cliente coincide con «${busqueda}»` : 'Aún no hay clientes registrados'}</p>
          <p className="mt-1 text-slate-700">{busqueda ? 'Revise la ortografía o busque por otro dato.' : 'Registre al primero con «Nuevo cliente».'}</p>
        </div>
      ) : (
        <>
          <div className="card mt-5 hidden overflow-x-auto md:block">
            <table className="w-full text-left text-[15px]">
              <thead className="border-b border-slate-200 bg-petrol-50 text-petrol-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Cliente</th>
                  <th className="px-4 py-3 font-semibold">Contacto</th>
                  <th className="px-4 py-3 font-semibold">Vehículos</th>
                  <th className="px-4 py-3 font-semibold">
                    <span className="sr-only">Ver</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {datos.items.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-3 font-medium">{c.nombre}</td>
                    <td className="px-4 py-3 text-slate-700">
                      <div>{c.telefono}</div>
                      <div className="text-sm">{c.email}</div>
                    </td>
                    <td className="px-4 py-3">{vehiculosDe(c)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/clientes/${c.id}`} className="btn btn-secondary btn-sm">
                        Ver ficha
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="mt-5 space-y-3 md:hidden">
            {datos.items.map((c) => (
              <li key={c.id}>
                <Link to={`/clientes/${c.id}`} className="card block p-4">
                  <p className="font-semibold">{c.nombre}</p>
                  <p className="text-sm text-slate-700">{c.telefono}</p>
                  <p className="break-all text-sm text-slate-700">{c.email}</p>
                  <div className="mt-2">{vehiculosDe(c)}</div>
                </Link>
              </li>
            ))}
          </ul>

          <Paginacion page={page} pageSize={POR_PAGINA} total={datos.total} onChange={setPage} />
        </>
      )}

      {nuevo && (
        <ClienteFormModal
          onClose={() => setNuevo(false)}
          onGuardado={(creado, aviso) => navigate(`/clientes/${creado.id}`, { state: { aviso } })}
        />
      )}
    </div>
  );
}
