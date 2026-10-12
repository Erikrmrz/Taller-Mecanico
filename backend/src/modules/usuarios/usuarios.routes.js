const router = require('express').Router();
const { authenticate, authorize } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { ROLES } = require('../../constants/roles');
const controller = require('./usuarios.controller');
const { idParamSchema } = require('../../utils/commonSchemas');
const { crearUsuarioSchema, actualizarUsuarioSchema } = require('./usuarios.schemas');

// RF-002: toda la gestión de cuentas es exclusiva del administrador.
router.use(authenticate, authorize(ROLES.ADMINISTRADOR));

router.get('/', controller.listar);
router.post('/', validate(crearUsuarioSchema), controller.crear);
router.get('/:id', validate(idParamSchema, 'params'), controller.obtener);
router.put('/:id', validate(idParamSchema, 'params'), validate(actualizarUsuarioSchema), controller.actualizar);
router.patch('/:id/desactivar', validate(idParamSchema, 'params'), controller.desactivar);
router.patch('/:id/reactivar', validate(idParamSchema, 'params'), controller.reactivar);

module.exports = router;
