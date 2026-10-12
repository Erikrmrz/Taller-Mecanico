import { useState } from 'react';
import { clientesApi } from '../api/index.js';
import { AVISO_PRIVACIDAD } from '../lib/constants.js';
import { detallesAErrores, validarCliente, validarVehiculo, vehiculoAPayload, vehiculoVacio } from '../lib/validation.js';
import { Alert, Modal, TextField } from './ui.jsx';
import VehiculoFields from './VehiculoFields.jsx';

/**
 * Alta de cliente (con aviso de privacidad y vehículos opcionales) o edición de sus datos de contacto.
 * Si recibe `cliente`, funciona en modo edición.
 */
export default function ClienteFormModal({ cliente, onClose, onGuardado }) {
  const esNuevo = !cliente;
  const [f, setF] = useState({
    nombre: cliente?.nombre ?? '',
    telefono: cliente?.telefono ?? '',
    email: cliente?.email ?? '',
    domicilio: cliente?.domicilio ?? '',
  });
  const [vehiculos, setVehiculos] = useState([]);
  const [consentimiento, setConsentimiento] = useState(false);
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const set = (campo) => (v) => setF((prev) => ({ ...prev, [campo]: v }));

  const cambiarVehiculo = (i, nuevo) => setVehiculos((lista) => lista.map((v, j) => (j === i ? nuevo : v)));

  async function enviar(e) {
    e.preventDefault();
    setError('');

    const errs = validarCliente(f);
    vehiculos.forEach((v, i) => {
      Object.entries(validarVehiculo(v)).forEach(([campo, msg]) => {
        errs[`vehiculos.${i}.${campo}`] = msg;
      });
    });
    if (esNuevo && !consentimiento) {
      errs.consentimientoAvisoPrivacidad = 'Debe confirmar el consentimiento del aviso de privacidad antes de guardar el cliente';
    }
    setErrores(errs);
    if (Object.keys(errs).length) return;

    const datos = { nombre: f.nombre.trim(), telefono: f.telefono.trim(), email: f.email.trim(), domicilio: f.domicilio.trim() };
    setEnviando(true);
    try {
      if (esNuevo) {
        const creado = await clientesApi.crear({ ...datos, consentimientoAvisoPrivacidad: true, vehiculos: vehiculos.map(vehiculoAPayload) });
        onGuardado(creado, 'Cliente registrado');
      } else {
        const actualizado = await clientesApi.actualizar(cliente.id, datos);
        onGuardado(actualizado, 'Datos del cliente actualizados');
      }
    } catch (err) {
      const deServidor = detallesAErrores(err.details);
      if (Object.keys(deServidor).length) setErrores(deServidor);
      else setError(err.message);
      setEnviando(false);
    }
  }

  return (
    <Modal titulo={esNuevo ? 'Nuevo cliente' : 'Editar datos del cliente'} onClose={onClose} ancho="max-w-2xl">
      <form onSubmit={enviar} className="space-y-5" noValidate>
        {error && <Alert>{error}</Alert>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <TextField label="Nombre completo" value={f.nombre} onChange={set('nombre')} error={errores.nombre} maxLength={120} autoFocus />
          </div>
          <TextField label="Teléfono" type="tel" value={f.telefono} onChange={set('telefono')} error={errores.telefono} maxLength={20} />
          <TextField label="Correo electrónico" type="email" value={f.email} onChange={set('email')} error={errores.email} maxLength={120} />
          <div className="sm:col-span-2">
            <TextField label="Domicilio (opcional)" value={f.domicilio} onChange={set('domicilio')} error={errores.domicilio} maxLength={250} />
          </div>
        </div>

        {esNuevo && (
          <>
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl font-semibold text-petrol-800">Vehículos</h3>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setVehiculos((l) => [...l, vehiculoVacio()])}>
                  Agregar vehículo
                </button>
              </div>
              {vehiculos.length === 0 && <p className="text-sm text-slate-600">Puede registrar los vehículos ahora o después, desde la ficha del cliente.</p>}
              {vehiculos.map((v, i) => {
                const erroresVehiculo = Object.fromEntries(Object.entries(errores).filter(([k]) => k.startsWith(`vehiculos.${i}.`)).map(([k, m]) => [k.split('.')[2], m]));
                return (
                  <div key={i} className="rounded-md border border-slate-200 bg-canvas/50 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="font-medium">Vehículo {i + 1}</p>
                      <button type="button" className="text-sm font-medium text-danger underline" onClick={() => setVehiculos((l) => l.filter((_, j) => j !== i))}>
                        Quitar
                      </button>
                    </div>
                    <VehiculoFields valor={v} onChange={(nuevo) => cambiarVehiculo(i, nuevo)} errores={erroresVehiculo} />
                  </div>
                );
              })}
            </section>

            <section className="rounded-md border border-petrol-100 bg-petrol-50 p-4">
              <h3 className="text-xl font-semibold text-petrol-800">Aviso de privacidad</h3>
              <p className="mt-2 text-sm text-slate-800">{AVISO_PRIVACIDAD}</p>
              <label className="mt-4 flex cursor-pointer items-start gap-3">
                <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-petrol-700" checked={consentimiento} onChange={(e) => setConsentimiento(e.target.checked)} aria-describedby="err-consentimiento" />
                <span className="text-[15px] font-medium">El cliente leyó el aviso de privacidad y da su consentimiento para el tratamiento de sus datos.</span>
              </label>
              {errores.consentimientoAvisoPrivacidad && (
                <p id="err-consentimiento" className="mt-2 text-sm font-medium text-danger" role="alert">
                  {errores.consentimientoAvisoPrivacidad}
                </p>
              )}
            </section>
          </>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={enviando}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={enviando}>
            {enviando ? 'Guardando…' : esNuevo ? 'Registrar cliente' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
