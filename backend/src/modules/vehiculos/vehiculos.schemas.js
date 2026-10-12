const { z } = require('zod');

const anioMaximo = new Date().getFullYear() + 1;

const vehiculoSchema = z.object({
  placa: z
    .string({ required_error: 'La placa es obligatoria' })
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{5,10}$/, 'La placa debe tener de 5 a 10 caracteres (letras, números o guion)'),
  vin: z
    .string({ required_error: 'El VIN es obligatorio' })
    .trim()
    .toUpperCase()
    .regex(/^[A-HJ-NPR-Z0-9]{17}$/, 'El VIN debe tener 17 caracteres alfanuméricos (sin las letras I, O ni Q)'),
  marca: z.string({ required_error: 'La marca es obligatoria' }).trim().min(1, 'La marca es obligatoria').max(60, 'La marca no puede exceder 60 caracteres'),
  modelo: z.string({ required_error: 'El modelo es obligatorio' }).trim().min(1, 'El modelo es obligatorio').max(60, 'El modelo no puede exceder 60 caracteres'),
  anio: z.coerce
    .number({ required_error: 'El año es obligatorio', invalid_type_error: 'El año debe ser un número' })
    .int('El año debe ser un número entero')
    .min(1950, 'El año no puede ser anterior a 1950')
    .max(anioMaximo, `El año no puede ser mayor a ${anioMaximo}`),
});

module.exports = { vehiculoSchema };
