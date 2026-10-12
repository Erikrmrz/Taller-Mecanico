import { TextField } from './ui.jsx';

/** Campos de un vehículo; se reutiliza en el alta de cliente y en el modal de vehículo. */
export default function VehiculoFields({ valor, onChange, errores = {} }) {
  const set = (campo) => (v) => onChange({ ...valor, [campo]: v });
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <TextField label="Placa" value={valor.placa} onChange={set('placa')} error={errores.placa} autoComplete="off" maxLength={10} placeholder="ABC-123" />
      <TextField label="VIN" value={valor.vin} onChange={set('vin')} error={errores.vin} autoComplete="off" maxLength={17} hint="17 caracteres, sin las letras I, O ni Q" />
      <TextField label="Marca" value={valor.marca} onChange={set('marca')} error={errores.marca} maxLength={60} />
      <TextField label="Modelo" value={valor.modelo} onChange={set('modelo')} error={errores.modelo} maxLength={60} />
      <TextField label="Año" value={valor.anio} onChange={set('anio')} error={errores.anio} inputMode="numeric" maxLength={4} />
    </div>
  );
}
