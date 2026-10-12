const asyncHandler = require('../../utils/asyncHandler');
const vehiculosService = require('./vehiculos.service');

module.exports = {
  obtener: asyncHandler(async (req, res) => {
    res.json(await vehiculosService.obtener(Number(req.params.id)));
  }),
  actualizar: asyncHandler(async (req, res) => {
    res.json(await vehiculosService.actualizar(Number(req.params.id), req.body));
  }),
};
