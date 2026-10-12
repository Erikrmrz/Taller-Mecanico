const { z } = require('zod');
const { ROLES_VALIDOS } = require('../../constants/roles');

const nombre = z.string({ required_error: 'El nombre es obligatorio' }).trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'El nombre no puede exceder 100 caracteres');

const email = z
  .string({ required_error: 'El correo electrónico es obligatorio' })
  .trim()
  .toLowerCase()
  .email('El correo electrónico no es válido')
  .max(120, 'El correo electrónico no puede exceder 120 caracteres');

const password = z
  .string({ required_error: 'La contraseña es obligatoria' })
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(72, 'La contraseña no puede exceder 72 caracteres')
  .regex(/[A-Za-z]/, 'La contraseña debe incluir al menos una letra')
  .regex(/[0-9]/, 'La contraseña debe incluir al menos un número');

const rol = z.enum(ROLES_VALIDOS, {
  errorMap: () => ({ message: 'El rol debe ser administrador, recepcionista o mecánico' }),
});

const crearUsuarioSchema = z.object({ nombre, email, password, rol });

// PUT: reemplazo completo; la contraseña solo se envía si se quiere cambiar.
const actualizarUsuarioSchema = z.object({
  nombre,
  email,
  rol,
  password: password.optional(),
});

module.exports = { crearUsuarioSchema, actualizarUsuarioSchema };
