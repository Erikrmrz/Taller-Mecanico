// RF-001 + RNF-005 + RNF-007
jest.mock('../src/modules/usuarios/usuarios.repository', () => ({ findByEmail: jest.fn() }));
jest.mock('../src/modules/auth/bitacora.repository', () => ({ registrar: jest.fn() }));

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const usuariosRepository = require('../src/modules/usuarios/usuarios.repository');
const bitacoraRepository = require('../src/modules/auth/bitacora.repository');
const authService = require('../src/modules/auth/auth.service');

const contexto = { ip: '10.0.0.5', userAgent: 'jest' };
const crearUsuario = (extra = {}) => ({
  id: 7,
  nombre: 'Rosa',
  email: 'rosa@taller.local',
  passwordHash: bcrypt.hashSync('Clave1234', 4),
  rol: 'RECEPCIONISTA',
  activo: true,
  ...extra,
});

beforeEach(() => jest.clearAllMocks());

describe('authService.login (RF-001)', () => {
  test('con credenciales válidas devuelve un JWT y el usuario sin hash', async () => {
    usuariosRepository.findByEmail.mockResolvedValue(crearUsuario());

    const { token, usuario } = await authService.login({ email: 'rosa@taller.local', password: 'Clave1234' }, contexto);

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    expect(payload.sub).toBe('7');
    expect(payload.rol).toBe('RECEPCIONISTA');
    expect(usuario).toEqual({ id: 7, nombre: 'Rosa', email: 'rosa@taller.local', rol: 'RECEPCIONISTA', activo: true });
    expect(usuario.passwordHash).toBeUndefined();
  });

  test('registra el inicio de sesión exitoso en la bitácora (RNF-007)', async () => {
    usuariosRepository.findByEmail.mockResolvedValue(crearUsuario());
    await authService.login({ email: 'rosa@taller.local', password: 'Clave1234' }, contexto);

    expect(bitacoraRepository.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ usuarioId: 7, email: 'rosa@taller.local', exitoso: true, ip: '10.0.0.5', userAgent: 'jest' })
    );
  });

  test('rechaza una contraseña incorrecta con 401 y lo registra', async () => {
    usuariosRepository.findByEmail.mockResolvedValue(crearUsuario());

    await expect(authService.login({ email: 'rosa@taller.local', password: 'otra-clave1' }, contexto)).rejects.toMatchObject({
      statusCode: 401,
      code: 'CREDENCIALES_INVALIDAS',
    });
    expect(bitacoraRepository.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ usuarioId: 7, exitoso: false, motivo: 'CREDENCIALES_INVALIDAS' })
    );
  });

  test('rechaza un correo inexistente con el mismo mensaje y registra usuarioId nulo', async () => {
    usuariosRepository.findByEmail.mockResolvedValue(null);

    await expect(authService.login({ email: 'nadie@taller.local', password: 'Clave1234' }, contexto)).rejects.toMatchObject({
      statusCode: 401,
      message: 'Correo o contraseña incorrectos',
    });
    expect(bitacoraRepository.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ usuarioId: null, email: 'nadie@taller.local', exitoso: false })
    );
  });

  test('rechaza una cuenta desactivada aunque la contraseña sea correcta (403)', async () => {
    usuariosRepository.findByEmail.mockResolvedValue(crearUsuario({ activo: false }));

    await expect(authService.login({ email: 'rosa@taller.local', password: 'Clave1234' }, contexto)).rejects.toMatchObject({
      statusCode: 403,
      code: 'CUENTA_DESACTIVADA',
    });
    expect(bitacoraRepository.registrar).toHaveBeenCalledWith(expect.objectContaining({ exitoso: false, motivo: 'CUENTA_DESACTIVADA' }));
  });

  test('no revela que la cuenta está desactivada si la contraseña es incorrecta', async () => {
    usuariosRepository.findByEmail.mockResolvedValue(crearUsuario({ activo: false }));

    await expect(authService.login({ email: 'rosa@taller.local', password: 'incorrecta1' }, contexto)).rejects.toMatchObject({
      statusCode: 401,
      code: 'CREDENCIALES_INVALIDAS',
    });
  });

  test('funciona sin contexto de petición', async () => {
    usuariosRepository.findByEmail.mockResolvedValue(crearUsuario());
    await expect(authService.login({ email: 'rosa@taller.local', password: 'Clave1234' })).resolves.toHaveProperty('token');
  });
});
