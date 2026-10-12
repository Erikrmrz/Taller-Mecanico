import { useState } from 'react';
import { clientesApi, vehiculosApi } from '../api/index.js';
import { detallesAErrores, validarVehiculo, vehiculoAPayload, vehiculoVacio } from '../lib/validation.js';
import { Alert, Modal } from './ui.jsx';
import VehiculoFields from './VehiculoFields.jsx';

/** Agrega un vehículo a un cliente o edita uno existente (si recibe `vehiculo`). */
export default function VehiculoModal({ clienteId, vehiculo, onClose, onGuardado }) {
  const esNuevo = !vehiculo;
  const [v, setV] = useState(vehiculo ? { ...vehiculo, anio: String(vehiculo.anio) } : vehiculoVacio());
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setError('');
    const errs = validarVehiculo(v);
    setErrores(errs);
    if (Object.keys(errs).length) return;

    setEnviando(true);
    try {
      const payload = vehiculoAPayload(v);
      if (esNuevo) await clientesApi.agregarVehiculo(clienteId, payload);
      else await vehiculosApi.actualizar(vehiculo.id, payload);
      onGuardado(esNuevo ? 'Vehículo agregado' : 'Vehículo actualizado');
    } catch (err) {
      const deServidor = detallesAErrores(err.details);
      if (Object.keys(deServidor).length) setErrores(deServidor);
      else if (err.code === 'PLACA_DUPLICADA') setErrores({ placa: err.message });
      else if (err.code === 'VIN_DUPLICADO') setErrores({ vin: err.message });
      else setError(err.message);
      setEnviando(false);
    }
  }

  return (
    <Modal titulo={esNuevo ? 'Agregar vehículo' : 'Editar vehículo'} onClose={onClose}>
      <form onSubmit={enviar} className="space-y-5" noValidate>
        {error && <Alert>{error}</Alert>}
        <VehiculoFields valor={v} onChange={setV} errores={errores} />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={enviando}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={enviando}>
            {enviando ? 'Guardando…' : esNuevo ? 'Agregar vehículo' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
