// Las mismas reglas que valida el backend; así el usuario ve el error antes de enviar.
const RE_TELEFONO = /^\+?[0-9\s\-()]{10,20}$/;
const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RE_PLACA = /^[A-Z0-9-]{5,10}$/;
const RE_VIN = /^[A-HJ-NPR-Z0-9]{17}$/;

export const ANIO_MAXIMO = new Date().getFullYear() + 1;

export function validarCliente(c) {
  const e = {};
  const nombre = c.nombre.trim();
  if (nombre.length < 2) e.nombre = 'El nombre debe tener al menos 2 caracteres';
  if (!RE_TELEFONO.test(c.telefono.trim())) e.telefono = 'El teléfono debe tener al menos 10 dígitos';
  if (!RE_EMAIL.test(c.email.trim())) e.email = 'Escriba un correo electrónico válido';
  if (c.domicilio.trim().length > 250) e.domicilio = 'El domicilio no puede exceder 250 caracteres';
  return e;
}

export function validarVehiculo(v) {
  const e = {};
  if (!RE_PLACA.test(v.placa.trim().toUpperCase())) e.placa = 'La placa debe tener de 5 a 10 caracteres (letras, números o guion)';
  if (!RE_VIN.test(v.vin.trim().toUpperCase())) e.vin = 'El VIN debe tener 17 caracteres (sin las letras I, O ni Q)';
  if (!v.marca.trim()) e.marca = 'La marca es obligatoria';
  if (!v.modelo.trim()) e.modelo = 'El modelo es obligatorio';
  const anio = Number(v.anio);
  if (!Number.isInteger(anio) || anio < 1950 || anio > ANIO_MAXIMO) e.anio = `El año debe estar entre 1950 y ${ANIO_MAXIMO}`;
  return e;
}

export const vehiculoVacio = () => ({ placa: '', vin: '', marca: '', modelo: '', anio: '' });

export const vehiculoAPayload = (v) => ({
  placa: v.placa.trim().toUpperCase(),
  vin: v.vin.trim().toUpperCase(),
  marca: v.marca.trim(),
  modelo: v.modelo.trim(),
  anio: Number(v.anio),
});

/** Convierte los `details` del backend ({campo, mensaje}) en un objeto { campo: mensaje }. */
export function detallesAErrores(details) {
  const errores = {};
  (details || []).forEach((d) => {
    if (d.campo && !errores[d.campo]) errores[d.campo] = d.mensaje;
  });
  return errores;
}

export const formatearFecha = (iso) =>
  new Date(iso).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
