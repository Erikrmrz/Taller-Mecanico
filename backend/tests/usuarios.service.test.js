// RF-002 (gestión de cuentas) + RNF-005
jest.mock('../src/modules/usuarios/usuarios.repository', () => ({
  findById: jest.fn(),
  findByEmail: jest.fn(),
  list: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  countAdministradoresActivos: jest.fn(),
}));

const bcrypt = require('bcryptjs');
const repo = require('../src/modules/usuarios/usuarios.repository');
const service = require('../src/modules/usuarios/usuarios.service');

const usuario = (extra = {}) => ({ id: 2, nombre: 'Mario', email: 'mario@taller.local', rol: 'MECANICO', activo: true, ...extra });
const admin = { id: 1, rol: 'ADMINISTRADOR' };

beforeEach(() => {
  jest.resetAllMocks();
  repo.update.mockImplementation(async (id, data) => ({ id, ...data }));
});

describe('crear', () => {
  test('guarda la contraseña con hash bcrypt, nunca en texto plano (RNF-005)', async () => {
    repo.findByEmail.mockResolvedValue(null);
    repo.create.mockImplementation(async (d) => ({ id: 9, ...d }));

    await service.crear({ nombre: 'Ana', email: 'ana@taller.local', password: 'Secreta123', rol: 'RECEPCIONISTA' });

    const guardado = repo.create.mock.calls[0][0];
    expect(guardado.password).toBeUndefined();
    expect(guardado.passwordHash).not.toBe('Secreta123');
    expect(guardado.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(bcrypt.compareSync('Secreta123', guardado.passwordHash)).toBe(true);
    expect(guardado.activo).toBe(true);
  });

  test('rechaza un correo ya registrado (409)', async () => {
    repo.findByEmail.mockResolvedValue(usuario());
    await expect(service.crear({ nombre: 'X', email: 'mario@taller.local', password: 'Secreta123', rol: 'MECANICO' })).rejects.toMatchObject({
      statusCode: 409,
      code: 'CORREO_DUPLICADO',
    });
    expect(repo.create).not.toHaveBeenCalled();
  });
});

describe('listar / obtener', () => {
  test('listar devuelve los usuarios del repositorio', async () => {
    repo.list.mockResolvedValue([usuario()]);
    await expect(service.listar()).resolves.toHaveLength(1);
  });

  test('obtener lanza 404 si no existe', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(service.obtener(99)).rejects.toMatchObject({ statusCode: 404 });
  });

  test('obtener devuelve el usuario', async () => {
    repo.findById.mockResolvedValue(usuario());
    await expect(service.obtener(2)).resolves.toMatchObject({ id: 2 });
  });
});

describe('actualizar', () => {
  test('actualiza nombre, correo y rol sin tocar la contraseña si no se envía', async () => {
    repo.findById.mockResolvedValue(usuario());
    repo.findByEmail.mockResolvedValue(null);

    await service.actualizar(2, { nombre: 'Mario P.', email: 'mario@taller.local', rol: 'RECEPCIONISTA' });

    expect(repo.update).toHaveBeenCalledWith(2, { nombre: 'Mario P.', email: 'mario@taller.local', rol: 'RECEPCIONISTA' });
  });

  test('re-hashea la contraseña cuando se envía una nueva', async () => {
    repo.findById.mockResolvedValue(usuario());
    repo.findByEmail.mockResolvedValue(null);

    await service.actualizar(2, { nombre: 'Mario', email: 'mario@taller.local', rol: 'MECANICO', password: 'Nueva12345' });

    const data = repo.update.mock.calls[0][1];
    expect(bcrypt.compareSync('Nueva12345', data.passwordHash)).toBe(true);
  });

  test('permite conservar el propio correo', async () => {
    repo.findById.mockResolvedValue(usuario());
    repo.findByEmail.mockResolvedValue(usuario()); // es él mismo
    await expect(service.actualizar(2, { nombre: 'Mario', email: 'mario@taller.local', rol: 'MECANICO' })).resolves.toBeDefined();
  });

  test('rechaza usar el correo de otro usuario (409)', async () => {
    repo.findById.mockResolvedValue(usuario());
    repo.findByEmail.mockResolvedValue(usuario({ id: 5 }));
    await expect(service.actualizar(2, { nombre: 'Mario', email: 'otro@taller.local', rol: 'MECANICO' })).rejects.toMatchObject({ statusCode: 409 });
  });

  test('404 si el usuario no existe', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(service.actualizar(99, { nombre: 'X', email: 'x@x.com', rol: 'MECANICO' })).rejects.toMatchObject({ statusCode: 404 });
  });

  test('no permite quitar el rol al último administrador activo (409)', async () => {
    repo.findById.mockResolvedValue(usuario({ id: 1, rol: 'ADMINISTRADOR' }));
    repo.findByEmail.mockResolvedValue(null);
    repo.countAdministradoresActivos.mockResolvedValue(1);

    await expect(service.actualizar(1, { nombre: 'Admin', email: 'a@a.com', rol: 'MECANICO' })).rejects.toMatchObject({ code: 'ULTIMO_ADMINISTRADOR' });
    expect(repo.update).not.toHaveBeenCalled();
  });

  test('sí permite cambiar el rol de un administrador si hay otro activo', async () => {
    repo.findById.mockResolvedValue(usuario({ id: 1, rol: 'ADMINISTRADOR' }));
    repo.findByEmail.mockResolvedValue(null);
    repo.countAdministradoresActivos.mockResolvedValue(2);
    await expect(service.actualizar(1, { nombre: 'Admin', email: 'a@a.com', rol: 'RECEPCIONISTA' })).resolves.toBeDefined();
  });

  test('conservar el rol de administrador no consulta el conteo', async () => {
    repo.findById.mockResolvedValue(usuario({ id: 1, rol: 'ADMINISTRADOR' }));
    repo.findByEmail.mockResolvedValue(null);
    await service.actualizar(1, { nombre: 'Admin', email: 'a@a.com', rol: 'ADMINISTRADOR' });
    expect(repo.countAdministradoresActivos).not.toHaveBeenCalled();
  });
});

describe('desactivar', () => {
  test('desactiva una cuenta activa', async () => {
    repo.findById.mockResolvedValue(usuario());
    await service.desactivar(2, admin);
    expect(repo.update).toHaveBeenCalledWith(2, { activo: false });
  });

  test('no permite que el administrador desactive su propia cuenta', async () => {
    await expect(service.desactivar(1, admin)).rejects.toMatchObject({ code: 'AUTO_DESACTIVACION' });
    expect(repo.update).not.toHaveBeenCalled();
  });

  test('409 si la cuenta ya estaba desactivada', async () => {
    repo.findById.mockResolvedValue(usuario({ activo: false }));
    await expect(service.desactivar(2, admin)).rejects.toMatchObject({ code: 'YA_DESACTIVADA' });
  });

  test('no permite desactivar al último administrador activo', async () => {
    repo.findById.mockResolvedValue(usuario({ id: 3, rol: 'ADMINISTRADOR' }));
    repo.countAdministradoresActivos.mockResolvedValue(1);
    await expect(service.desactivar(3, admin)).rejects.toMatchObject({ code: 'ULTIMO_ADMINISTRADOR' });
  });

  test('permite desactivar a un administrador si queda otro activo', async () => {
    repo.findById.mockResolvedValue(usuario({ id: 3, rol: 'ADMINISTRADOR' }));
    repo.countAdministradoresActivos.mockResolvedValue(2);
    await service.desactivar(3, admin);
    expect(repo.update).toHaveBeenCalledWith(3, { activo: false });
  });

  test('404 si no existe', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(service.desactivar(99, admin)).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('reactivar', () => {
  test('reactiva una cuenta desactivada', async () => {
    repo.findById.mockResolvedValue(usuario({ activo: false }));
    await service.reactivar(2);
    expect(repo.update).toHaveBeenCalledWith(2, { activo: true });
  });

  test('409 si ya estaba activa', async () => {
    repo.findById.mockResolvedValue(usuario());
    await expect(service.reactivar(2)).rejects.toMatchObject({ code: 'YA_ACTIVA' });
  });
});
