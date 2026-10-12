const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const env = require('../../config/env');
const { authenticate } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const controller = require('./auth.controller');
const { loginSchema } = require('./auth.schemas');

// Frena la adivinación de contraseñas: solo cuentan los intentos fallidos.
const limitadorLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.nodeEnv === 'test',
  message: { message: 'Demasiados intentos fallidos. Espere 15 minutos e intente de nuevo', code: 'DEMASIADOS_INTENTOS' },
});

router.post('/login', limitadorLogin, validate(loginSchema), controller.login);
router.get('/me', authenticate, controller.me);

module.exports = router;
