const asyncHandler = require('../../utils/asyncHandler');
const authService = require('./auth.service');

module.exports = {
  login: asyncHandler(async (req, res) => {
    const resultado = await authService.login(req.body, { ip: req.ip, userAgent: req.get('user-agent') });
    res.json(resultado);
  }),

  me: (req, res) => {
    res.json({ usuario: req.user });
  },
};
