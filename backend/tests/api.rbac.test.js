// RF-001 / RF-002 / RF-003 de punta a punta sobre HTTP (repositorios simulados)
jest.mock('../src/modules/usuarios/usuarios.repository', () => ({
  findById: jest.fn(),
  findByEmail: jest.fn(),
  list: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  countAdministradoresActivos: jest.fn(),
}));
jest.mock('../src/modules/auth/bitacora.repository', () => ({ registrar: jest.fn() }));
jest.mock('../src/modules/clientes/clientes.repository', () => ({
  list: jest.fn(),
  findById: jest.fn(),
  createConVehiculos: jest.fn(),
  update: jest.fn(),
}));
jest.mock('../src/modules/vehiculos/vehiculos.repository', () => ({
  findById: jest.fn(),
  findByPlaca: jest.fn(),
  findByVin: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
}));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const usuariosRepo = require('../src/modules/usuarios/usuarios.repository');
const clientesRepo = require('../src/modules/clientes/clientes.repository');
const vehiculosRepo = require('../src/modules/vehiculos/vehiculos.repository');

const USUARIOS = {
  1: { id: 1, nombre: 'Admin', email: 'admin@t.com', rol: 'ADMINISTRADOR', activo: true },
  2: { id: 2, nombre: 'Rosa', email: 'rosa@t.com', rol: 'RECEPCIONISTA', activo: true },
  3: { id: 3, nombre: 'Mario', email: 'mario@t.com', rol: 'MECANICO', activo: true },
  4: { id: 4, nombre: 'Baja', email: 'baja@t.com', rol: 'RECEPCIONISTA', activo: false },
};
const tokenDe = (id) => `Bearer ${jwt.sign({ rol: USUARIOS[id].rol }, process.env.JWT_SECRET, { subject: String(id) })}`;

const clienteValido = { nombre: 'Juan Pérez', telefono: '6181234567', email: 'JUAN@correo.com', consentimientoAvisoPrivacidad: true };
const vehiculoValido = { placa: 'abc-123', vin: '1hgcm82633a004352', marca: 'Honda', modelo: 'Accord', anio: 2018 };

beforeEach(() => {
  jest.resetAllMocks();
  usuariosRepo.findById.mockImplementation(async (id) => USUARIOS[id] || null);
  usuariosRepo.list.mockResolvedValue(Object.values(USUARIOS));
  clientesRepo.list.mockResolvedValue({ items: [], total: 0 });
  clientesRepo.createConVehiculos.mockImplementation(async (d, v) => ({ id: 10, ...d, vehiculos: v }));
  vehiculosRepo.findByPlaca.mockResolvedValue(null);
  vehiculosRepo.findByVin.mockResolvedValue(null);
});

describe('RF-001: POST /api/auth/login', () => {
  test('devuelve token con credenciales válidas', async () => {
    usuariosRepo.findByEmail.mockResolvedValue({ ...USUARIOS[2], passwordHash: bcrypt.hashSync('Clave1234', 4) });
    const res = await request(app).post('/api/auth/login').send({ email: 'ROSA@t.com', password: 'Clave1234' });
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.usuario.passwordHash).toBeUndefined();
    expect(usuariosRepo.findByEmail).toHaveBeenCalledWith('rosa@t.com'); // normalizado
  });

  test('401 con credenciales inválidas y mensaje de error', async () => {
    usuariosRepo.findByEmail.mockResolvedValue(null);
    const res = await request(app).post('/api/auth/login').send({ email: 'x@t.com', password: 'loquesea' });
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/incorrectos/);
  });

  test('403 con cuenta desactivada', async () => {
    usuariosRepo.findByEmail.mockResolvedValue({ ...USUARIOS[4], passwordHash: bcrypt.hashSync('Clave1234', 4) });
    const res = await request(app).post('/api/auth/login').send({ email: 'baja@t.com', password: 'Clave1234' });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('CUENTA_DESACTIVADA');
  });

  test('400 si faltan campos', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'no-es-correo' });
    expect(res.status).toBe(400);
    expect(res.body.details.length).toBeGreaterThan(0);
  });
});

describe('Sesión (JWT)', () => {
  test('401 sin token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('401 con token manipulado', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer abc.def.ghi');
    expect(res.status).toBe(401);
  });

  test('401 si la cuenta fue desactivada después de emitir el token (RF-002)', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', tokenDe(4));
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('CUENTA_NO_VIGENTE');
  });

  test('200 con token válido', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', tokenDe(3));
    expect(res.status).toBe(200);
    expect(res.body.usuario.rol).toBe('MECANICO');
  });
});

describe('RF-002: control de acceso por roles', () => {
  test.each([
    ['recepcionista', 2],
    ['mecánico', 3],
  ])('%s recibe 403 «acceso denegado» en /api/usuarios', async (_n, id) => {
    const res = await request(app).get('/api/usuarios').set('Authorization', tokenDe(id));
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Acceso denegado/);
  });

  test('el mecánico no puede crear usuarios', async () => {
    const res = await request(app)
      .post('/api/usuarios')
      .set('Authorization', tokenDe(3))
      .send({ nombre: 'X', email: 'x@t.com', password: 'Clave1234', rol: 'ADMINISTRADOR' });
    expect(res.status).toBe(403);
    expect(usuariosRepo.create).not.toHaveBeenCalled();
  });

  test('el administrador lista usuarios', async () => {
    const res = await request(app).get('/api/usuarios').set('Authorization', tokenDe(1));
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(4);
  });

  test('el administrador crea un usuario (201) y valida la contraseña (400)', async () => {
    usuariosRepo.findByEmail.mockResolvedValue(null);
    usuariosRepo.create.mockImplementation(async (d) => ({ id: 20, ...d }));

    const ok = await request(app)
      .post('/api/usuarios')
      .set('Authorization', tokenDe(1))
      .send({ nombre: 'Nuevo', email: 'nuevo@t.com', password: 'Clave1234', rol: 'MECANICO' });
    expect(ok.status).toBe(201);

    const mala = await request(app)
      .post('/api/usuarios')
      .set('Authorization', tokenDe(1))
      .send({ nombre: 'Nuevo', email: 'nuevo@t.com', password: 'corta', rol: 'MECANICO' });
    expect(mala.status).toBe(400);

    const rolMalo = await request(app)
      .post('/api/usuarios')
      .set('Authorization', tokenDe(1))
      .send({ nombre: 'Nuevo', email: 'nuevo@t.com', password: 'Clave1234', rol: 'SUPERUSUARIO' });
    expect(rolMalo.status).toBe(400);
  });

  test('desactivar y reactivar responden con el usuario actualizado', async () => {
    usuariosRepo.update.mockImplementation(async (id, d) => ({ ...USUARIOS[id], ...d }));
    const off = await request(app).patch('/api/usuarios/3/desactivar').set('Authorization', tokenDe(1));
    expect(off.status).toBe(200);
    expect(off.body.activo).toBe(false);

    const on = await request(app).patch('/api/usuarios/4/reactivar').set('Authorization', tokenDe(1));
    expect(on.status).toBe(200);
    expect(on.body.activo).toBe(true);
  });

  test('el id inválido devuelve 400', async () => {
    const res = await request(app).get('/api/usuarios/abc').set('Authorization', tokenDe(1));
    expect(res.status).toBe(400);
  });
});

describe('RF-003: clientes y vehículos', () => {
  test('el mecánico recibe 403 en /api/clientes (datos personales, RD-001)', async () => {
    const res = await request(app).get('/api/clientes').set('Authorization', tokenDe(3));
    expect(res.status).toBe(403);
  });

  test('sin sesión no se pueden consultar clientes', async () => {
    const res = await request(app).get('/api/clientes');
    expect(res.status).toBe(401);
  });

  test('el recepcionista lista clientes con búsqueda y paginación', async () => {
    const res = await request(app).get('/api/clientes?q=juan&page=2').set('Authorization', tokenDe(2));
    expect(res.status).toBe(200);
    expect(clientesRepo.list).toHaveBeenCalledWith({ q: 'juan', page: 2, pageSize: 10 });
  });

  test('crea un cliente con vehículo y normaliza correo, placa y VIN', async () => {
    const res = await request(app)
      .post('/api/clientes')
      .set('Authorization', tokenDe(2))
      .send({ ...clienteValido, vehiculos: [vehiculoValido] });
    expect(res.status).toBe(201);

    const [dataCliente, vehiculos] = clientesRepo.createConVehiculos.mock.calls[0];
    expect(dataCliente.email).toBe('juan@correo.com');
    expect(dataCliente.registradoPorId).toBe(2);
    expect(vehiculos[0].placa).toBe('ABC-123');
    expect(vehiculos[0].vin).toBe('1HGCM82633A004352');
  });

  test('rechaza el alta sin consentimiento (400) y no guarda', async () => {
    const res = await request(app)
      .post('/api/clientes')
      .set('Authorization', tokenDe(2))
      .send({ ...clienteValido, consentimientoAvisoPrivacidad: false });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body.details)).toMatch(/aviso de privacidad/);
    expect(clientesRepo.createConVehiculos).not.toHaveBeenCalled();
  });

  test('rechaza el alta si falta el campo de consentimiento', async () => {
    const { consentimientoAvisoPrivacidad, ...sinConsentimiento } = clienteValido;
    const res = await request(app).post('/api/clientes').set('Authorization', tokenDe(2)).send(sinConsentimiento);
    expect(res.status).toBe(400);
  });

  test('rechaza placas repetidas dentro del mismo alta (400)', async () => {
    const otro = { ...vehiculoValido, vin: '2HGCM82633A004353' };
    const res = await request(app)
      .post('/api/clientes')
      .set('Authorization', tokenDe(2))
      .send({ ...clienteValido, vehiculos: [vehiculoValido, otro] });
    expect(res.status).toBe(400);
  });

  test('rechaza VIN con letras prohibidas y años fuera de rango', async () => {
    const res = await request(app)
      .post('/api/clientes')
      .set('Authorization', tokenDe(2))
      .send({ ...clienteValido, vehiculos: [{ ...vehiculoValido, vin: 'OOOOOOOOOOOOOOOOO', anio: 1900 }] });
    expect(res.status).toBe(400);
    expect(res.body.details.map((d) => d.campo)).toEqual(expect.arrayContaining(['vehiculos.0.vin', 'vehiculos.0.anio']));
  });

  test('409 si la placa ya existe', async () => {
    vehiculosRepo.findByPlaca.mockResolvedValue({ id: 99 });
    const res = await request(app)
      .post('/api/clientes')
      .set('Authorization', tokenDe(2))
      .send({ ...clienteValido, vehiculos: [vehiculoValido] });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('PLACA_DUPLICADA');
  });

  test('agrega un vehículo a un cliente existente y consulta/edita un vehículo', async () => {
    clientesRepo.findById.mockResolvedValue({ id: 10 });
    vehiculosRepo.create.mockImplementation(async (clienteId, d) => ({ id: 3, clienteId, ...d }));
    const alta = await request(app).post('/api/clientes/10/vehiculos').set('Authorization', tokenDe(1)).send(vehiculoValido);
    expect(alta.status).toBe(201);

    vehiculosRepo.findById.mockResolvedValue({ id: 3 });
    vehiculosRepo.update.mockImplementation(async (id, d) => ({ id, ...d }));
    const get = await request(app).get('/api/vehiculos/3').set('Authorization', tokenDe(1));
    expect(get.status).toBe(200);
    const put = await request(app).put('/api/vehiculos/3').set('Authorization', tokenDe(2)).send(vehiculoValido);
    expect(put.status).toBe(200);
  });

  test('404 al consultar un cliente inexistente', async () => {
    clientesRepo.findById.mockResolvedValue(null);
    const res = await request(app).get('/api/clientes/999').set('Authorization', tokenDe(2));
    expect(res.status).toBe(404);
  });

  test('edita los datos de contacto de un cliente', async () => {
    clientesRepo.findById.mockResolvedValue({ id: 10 });
    clientesRepo.update.mockImplementation(async (id, d) => ({ id, ...d }));
    const res = await request(app)
      .put('/api/clientes/10')
      .set('Authorization', tokenDe(2))
      .send({ nombre: 'Juan P.', telefono: '6180000000', email: 'j@j.com', domicilio: '' });
    expect(res.status).toBe(200);
    expect(clientesRepo.update).toHaveBeenCalledWith(10, expect.objectContaining({ domicilio: null }));
  });
});

describe('Errores generales', () => {
  test('JSON mal formado devuelve 400', async () => {
    const res = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{no-json');
    expect(res.status).toBe(400);
  });

  test('ruta inexistente devuelve 404', async () => {
    const res = await request(app).get('/api/nada');
    expect(res.status).toBe(404);
  });

  test('un error P2002 de la BD (carrera) se traduce a 409', async () => {
    const error = Object.assign(new Error('unique'), { code: 'P2002', meta: { target: ['placa'] } });
    clientesRepo.createConVehiculos.mockRejectedValue(error);
    const res = await request(app)
      .post('/api/clientes')
      .set('Authorization', tokenDe(2))
      .send({ ...clienteValido, vehiculos: [vehiculoValido] });
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/placa/);
  });
});
