const asyncHandler = require('../../utils/asyncHandler');
const clientesService = require('./clientes.service');
const vehiculosService = require('../vehiculos/vehiculos.service');

module.exports = {
  listar: asyncHandler(async (req, res) => {
    res.json(await clientesService.listar(req.query));
  }),
  obtener: asyncHandler(async (req, res) => {
    res.json(await clientesService.obtener(Number(req.params.id)));
  }),
  crear: asyncHandler(async (req, res) => {
    res.status(201).json(await clientesService.crear(req.body, req.user));
  }),
  actualizar: asyncHandler(async (req, res) => {
    res.json(await clientesService.actualizar(Number(req.params.id), req.body));
  }),
  agregarVehiculo: asyncHandler(async (req, res) => {
    res.status(201).json(await vehiculosService.agregarACliente(Number(req.params.id), req.body));
  }),
};
