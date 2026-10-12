const { z } = require('zod');
const { vehiculoSchema } = require('../vehiculos/vehiculos.schemas');

const datosCliente = z.object({
  nombre: z.string({ required_error: 'El nombre es obligatorio' }).trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(120, 'El nombre no puede exceder 120 caracteres'),
  telefono: z
    .string({ required_error: 'El teléfono es obligatorio' })
    .trim()
    .regex(/^\+?[0-9\s\-()]{10,20}$/, 'El teléfono debe tener al menos 10 dígitos (solo números, espacios, guiones o paréntesis)'),
  email: z
    .string({ required_error: 'El correo electrónico es obligatorio' })
    .trim()
    .toLowerCase()
    .email('El correo electrónico no es válido')
    .max(120, 'El correo electrónico no puede exceder 120 caracteres'),
  domicilio: z
    .string()
    .trim()
    .max(250, 'El domicilio no puede exceder 250 caracteres')
    .nullish()
    .transform((v) => (v ? v : null)),
});

const MENSAJE_CONSENTIMIENTO = 'Debe confirmar el consentimiento del aviso de privacidad antes de guardar el cliente';

const crearClienteSchema = datosCliente
  .extend({
    // RD-001: sin consentimiento no se guarda el alta.
    consentimientoAvisoPrivacidad: z.literal(true, { errorMap: () => ({ message: MENSAJE_CONSENTIMIENTO }) }),
    vehiculos: z.array(vehiculoSchema).max(10, 'Solo se pueden registrar 10 vehículos en el alta').default([]),
  })
  .superRefine((data, ctx) => {
    const vistos = { placa: new Set(), vin: new Set() };
    data.vehiculos.forEach((v, i) => {
      ['placa', 'vin'].forEach((campo) => {
        if (vistos[campo].has(v[campo])) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['vehiculos', i, campo],
            message: `${campo === 'placa' ? 'La placa' : 'El VIN'} ${v[campo]} está repetido en la lista de vehículos`,
          });
        }
        vistos[campo].add(v[campo]);
      });
    });
  });

// PUT: reemplazo completo de los datos de contacto (el consentimiento no se modifica aquí).
const actualizarClienteSchema = datosCliente;

const listarClientesQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

module.exports = { crearClienteSchema, actualizarClienteSchema, listarClientesQuerySchema, MENSAJE_CONSENTIMIENTO };
