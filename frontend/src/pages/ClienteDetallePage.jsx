import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { clientesApi } from '../api/index.js';
import ClienteFormModal from '../components/ClienteFormModal.jsx';
import VehiculoModal from '../components/VehiculoModal.jsx';
import { Alert, Cargando, Placa, useAviso } from '../components/ui.jsx';
import { formatearFecha } from '../lib/validation.js';

function Dato({ etiqueta, children }) {
  return (
    <div>
      <dt className="text-sm text-slate-600">{etiqueta}</dt>
      <dd className="break-words font-medium">{children || <span className="font-normal text-slate-500">Sin registrar</span>}</dd>
    </div>
  );
}

export default function ClienteDetallePage() {
  const { id } = useParams();
  const location = useLocation();
  const [cliente, setCliente] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [editando, setEditando] = useState(false);
  const [vehiculoModal, setVehiculoModal] = useState(null); // { vehiculo } | null
  const [aviso, setAviso] = useAviso();

  const cargar = useCallback(async () => {
    try {
      setCliente(await clientesApi.obtener(id));
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    setCargando(true);
    cargar();
  }, [cargar]);

  // Mensaje enviado desde el alta («Cliente registrado»)
  useEffect(() => {
    if (location.state?.aviso) setAviso(location.state.aviso);
  }, [location.state, setAviso]);

  const volver = (
    <Link to="/clientes" className="text-sm font-medium text-petrol-700 underline">
      Volver a clientes
    </Link>
  );

  if (cargando) return <Cargando />;
  if (!cliente) {
    return (
      <div className="space-y-4">
        {volver}
        <Alert>{error || 'No se encontró el cliente'}</Alert>
      </div>
    );
  }

  return (
    <div>
      {volver}
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-4xl font-semibold text-petrol-800">{cliente.nombre}</h1>
        <button type="button" className="btn btn-secondary" onClick={() => setEditando(true)}>
          Editar datos
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {aviso && <Alert tipo="exito">{aviso}</Alert>}
        {error && <Alert>{error}</Alert>}
      </div>

      <section className="card mt-5 p-5">
        <h2 className="text-2xl font-semibold text-petrol-800">Datos de contacto</h2>
        <dl className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Dato etiqueta="Teléfono">{cliente.telefono}</Dato>
          <Dato etiqueta="Correo electrónico">{cliente.email}</Dato>
          <Dato etiqueta="Domicilio">{cliente.domicilio}</Dato>
          <Dato etiqueta="Aviso de privacidad">
            Aceptado el {formatearFecha(cliente.fechaConsentimiento)}
            {cliente.registradoPor && <span className="block text-sm font-normal text-slate-600">Registrado por {cliente.registradoPor.nombre}</span>}
          </Dato>
        </dl>
      </section>

      <section className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold text-petrol-800">Vehículos ({cliente.vehiculos.length})</h2>
          <button type="button" className="btn btn-primary" onClick={() => setVehiculoModal({ vehiculo: null })}>
            Agregar vehículo
          </button>
        </div>

        {cliente.vehiculos.length === 0 ? (
          <div className="card mt-3 p-6 text-center text-slate-700">Este cliente aún no tiene vehículos. Agregue el primero con «Agregar vehículo».</div>
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {cliente.vehiculos.map((v) => (
              <li key={v.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <Placa valor={v.placa} />
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setVehiculoModal({ vehiculo: v })}>
                    Editar
                  </button>
                </div>
                <p className="mt-3 text-lg font-semibold">
                  {v.marca} {v.modelo} {v.anio}
                </p>
                <p className="break-all text-sm text-slate-700">VIN {v.vin}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {editando && (
        <ClienteFormModal
          cliente={cliente}
          onClose={() => setEditando(false)}
          onGuardado={(_actualizado, mensaje) => {
            setEditando(false);
            setAviso(mensaje);
            cargar();
          }}
        />
      )}

      {vehiculoModal && (
        <VehiculoModal
          clienteId={cliente.id}
          vehiculo={vehiculoModal.vehiculo}
          onClose={() => setVehiculoModal(null)}
          onGuardado={(mensaje) => {
            setVehiculoModal(null);
            setAviso(mensaje);
            cargar();
          }}
        />
      )}
    </div>
  );
}
