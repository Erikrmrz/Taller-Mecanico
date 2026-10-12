const { z } = require('zod');

const idParamSchema = z.object({
  id: z.coerce.number({ invalid_type_error: 'El id no es válido' }).int('El id no es válido').positive('El id no es válido'),
});

module.exports = { idParamSchema };
