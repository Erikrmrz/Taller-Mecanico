const router = require('express').Router();
const { authenticate, authorize } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { ROLES } = require('../../constants/roles');
const { idParamSchema } = require('../../utils/commonSchemas');
const controller = require('./vehiculos.controller');
const { vehiculoSchema } = require('./vehiculos.schemas');

// RF-003: Recepcionista / Administrador. (El alta de un vehículo vive en /api/clientes/:id/vehiculos)
router.use(authenticate, authorize(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA));

router.get('/:id', validate(idParamSchema, 'params'), controller.obtener);
router.put('/:id', validate(idParamSchema, 'params'), validate(vehiculoSchema), controller.actualizar);

module.exports = router;
