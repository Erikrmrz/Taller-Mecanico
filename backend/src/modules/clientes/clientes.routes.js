const router = require('express').Router();
const { authenticate, authorize } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { ROLES } = require('../../constants/roles');
const { idParamSchema } = require('../../utils/commonSchemas');
const { vehiculoSchema } = require('../vehiculos/vehiculos.schemas');
const controller = require('./clientes.controller');
const { crearClienteSchema, actualizarClienteSchema, listarClientesQuerySchema } = require('./clientes.schemas');

// RF-003: Recepcionista / Administrador. RD-001: datos personales solo para usuarios autenticados con rol.
router.use(authenticate, authorize(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA));

router.get('/', validate(listarClientesQuerySchema, 'query'), controller.listar);
router.post('/', validate(crearClienteSchema), controller.crear);
router.get('/:id', validate(idParamSchema, 'params'), controller.obtener);
router.put('/:id', validate(idParamSchema, 'params'), validate(actualizarClienteSchema), controller.actualizar);
router.post('/:id/vehiculos', validate(idParamSchema, 'params'), validate(vehiculoSchema), controller.agregarVehiculo);

module.exports = router;
