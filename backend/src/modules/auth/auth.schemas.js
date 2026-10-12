const { z } = require('zod');

const loginSchema = z.object({
  email: z
    .string({ required_error: 'El correo electrónico es obligatorio' })
    .trim()
    .toLowerCase()
    .email('El correo electrónico no es válido'),
  password: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(1, 'La contraseña es obligatoria')
    .max(128, 'La contraseña es demasiado larga'),
});

module.exports = { loginSchema };
