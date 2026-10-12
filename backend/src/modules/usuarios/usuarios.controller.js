const asyncHandler = require('../../utils/asyncHandler');
const usuariosService = require('./usuarios.service');

module.exports = {
  listar: asyncHandler(async (req, res) => {
    res.json({ items: await usuariosService.listar() });
  }),
  obtener: asyncHandler(async (req, res) => {
    res.json(await usuariosService.obtener(Number(req.params.id)));
  }),
  crear: asyncHandler(async (req, res) => {
    res.status(201).json(await usuariosService.crear(req.body));
  }),
  actualizar: asyncHandler(async (req, res) => {
    res.json(await usuariosService.actualizar(Number(req.params.id), req.body));
  }),
  desactivar: asyncHandler(async (req, res) => {
    res.json(await usuariosService.desactivar(Number(req.params.id), req.user));
  }),
  reactivar: asyncHandler(async (req, res) => {
    res.json(await usuariosService.reactivar(Number(req.params.id)));
  }),
};
