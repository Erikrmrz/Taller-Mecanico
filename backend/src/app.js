const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const env = require('./config/env');
const { errorHandler, notFound } = require('./middlewares/errorHandler');

const authRoutes = require('./modules/auth/auth.routes');
const usuariosRoutes = require('./modules/usuarios/usuarios.routes');
const clientesRoutes = require('./modules/clientes/clientes.routes');
const vehiculosRoutes = require('./modules/vehiculos/vehiculos.routes');

const app = express();

if (env.trustProxy) app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/vehiculos', vehiculosRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
