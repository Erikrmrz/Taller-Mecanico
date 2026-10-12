// RF-003 + RD-001
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

const clientesRepo = require('../src/modules/clientes/clientes.repository');
const vehiculosRepo = require('../src/modules/vehiculos/vehiculos.repository');
const clientesService = require('../src/modules/clientes/clientes.service');
const vehiculosService = require('../src/modules/vehiculos/vehiculos.service');

const recepcionista = { id: 4, rol: 'RECEPCIONISTA' };
const datosCliente = { nombre: 'Juan Pérez', telefono: '6181234567', email: 'juan@correo.com', domicilio: null, consentimientoAvisoPrivacidad: true };
const vehiculo = { placa: 'ABC-123', vin: '1HGCM82633A004352', marca: 'Honda', modelo: 'Accord', anio: 2018 };

beforeEach(() => {
  jest.resetAllMocks();
  vehiculosRepo.findByPlaca.mockResolvedValue(null);
  vehiculosRepo.findByVin.mockResolvedValue(null);
  clientesRepo.createConVehiculos.mockImplementation(async (d, v) => ({ id: 1, ...d, vehiculos: v }));
});

describe('clientesService.crear', () => {
  test('guarda el cliente con consentimiento, fecha y usuario que lo registró (RD-001)', async () => {
    const antes = Date.now();
    await clientesService.crear({ ...datosCliente, vehiculos: [vehiculo] }, recepcionista);

    const [dataCliente, vehiculos] = clientesRepo.createConVehiculos.mock.calls[0];
    expect(dataCliente.consentimientoPrivacidad).toBe(true);
    expect(dataCliente.fechaConsentimiento.getTime()).toBeGreaterThanOrEqual(antes);
    expect(dataCliente.registradoPorId).toBe(4);
    expect(dataCliente.consentimientoAvisoPrivacidad).toBeUndefined();
    expect(dataCliente.vehiculos).toBeUndefined();
    expect(vehiculos).toEqual([vehiculo]);
  });

  test('permite dar de alta un cliente sin vehículos', async () => {
    await clientesService.crear(datosCliente, recepcionista);
    expect(clientesRepo.createConVehiculos.mock.calls[0][1]).toEqual([]);
  });

  test('rechaza el alta sin consentimiento del aviso de privacidad (400)', async () => {
    await expect(clientesService.crear({ ...datosCliente, consentimientoAvisoPrivacidad: false }, recepcionista)).rejects.toMatchObject({
      statusCode: 400,
      code: 'CONSENTIMIENTO_REQUERIDO',
    });
    expect(clientesRepo.createConVehiculos).not.toHaveBeenCalled();
  });

  test('rechaza una placa ya registrada (409) y no guarda nada', async () => {
    vehiculosRepo.findByPlaca.mockResolvedValue({ id: 50, placa: 'ABC-123' });
    await expect(clientesService.crear({ ...datosCliente, vehiculos: [vehiculo] }, recepcionista)).rejects.toMatchObject({
      statusCode: 409,
      code: 'PLACA_DUPLICADA',
    });
    expect(clientesRepo.createConVehiculos).not.toHaveBeenCalled();
  });

  test('rechaza un VIN ya registrado (409) y no guarda nada', async () => {
    vehiculosRepo.findByVin.mockResolvedValue({ id: 51, vin: vehiculo.vin });
    await expect(clientesService.crear({ ...datosCliente, vehiculos: [vehiculo] }, recepcionista)).rejects.toMatchObject({
      statusCode: 409,
      code: 'VIN_DUPLICADO',
    });
    expect(clientesRepo.createConVehiculos).not.toHaveBeenCalled();
  });
});

describe('clientesService.listar / obtener / actualizar', () => {
  test('listar devuelve la página con total', async () => {
    clientesRepo.list.mockResolvedValue({ items: [{ id: 1 }], total: 25 });
    await expect(clientesService.listar({ q: 'juan', page: 2, pageSize: 10 })).resolves.toEqual({ items: [{ id: 1 }], total: 25, page: 2, pageSize: 10 });
    expect(clientesRepo.list).toHaveBeenCalledWith({ q: 'juan', page: 2, pageSize: 10 });
  });

  test('listar usa valores por defecto', async () => {
    clientesRepo.list.mockResolvedValue({ items: [], total: 0 });
    await expect(clientesService.listar()).resolves.toMatchObject({ page: 1, pageSize: 10 });
  });

  test('obtener devuelve el cliente', async () => {
    clientesRepo.findById.mockResolvedValue({ id: 1 });
    await expect(clientesService.obtener(1)).resolves.toEqual({ id: 1 });
  });

  test('obtener lanza 404 si no existe', async () => {
    clientesRepo.findById.mockResolvedValue(null);
    await expect(clientesService.obtener(9)).rejects.toMatchObject({ statusCode: 404, code: 'CLIENTE_NO_ENCONTRADO' });
  });

  test('actualizar guarda los nuevos datos de contacto', async () => {
    clientesRepo.findById.mockResolvedValue({ id: 1 });
    clientesRepo.update.mockResolvedValue({ id: 1, telefono: '6189999999' });
    await clientesService.actualizar(1, { nombre: 'Juan', telefono: '6189999999', email: 'j@j.com', domicilio: null });
    expect(clientesRepo.update).toHaveBeenCalledWith(1, expect.objectContaining({ telefono: '6189999999' }));
  });

  test('actualizar lanza 404 si el cliente no existe', async () => {
    clientesRepo.findById.mockResolvedValue(null);
    await expect(clientesService.actualizar(9, datosCliente)).rejects.toMatchObject({ statusCode: 404 });
    expect(clientesRepo.update).not.toHaveBeenCalled();
  });
});

describe('vehiculosService', () => {
  test('agregarACliente registra el vehículo en el cliente', async () => {
    clientesRepo.findById.mockResolvedValue({ id: 1 });
    vehiculosRepo.create.mockResolvedValue({ id: 5, clienteId: 1, ...vehiculo });
    await vehiculosService.agregarACliente(1, vehiculo);
    expect(vehiculosRepo.create).toHaveBeenCalledWith(1, vehiculo);
  });

  test('agregarACliente lanza 404 si el cliente no existe', async () => {
    clientesRepo.findById.mockResolvedValue(null);
    await expect(vehiculosService.agregarACliente(9, vehiculo)).rejects.toMatchObject({ code: 'CLIENTE_NO_ENCONTRADO' });
  });

  test('agregarACliente rechaza placa duplicada', async () => {
    clientesRepo.findById.mockResolvedValue({ id: 1 });
    vehiculosRepo.findByPlaca.mockResolvedValue({ id: 8 });
    await expect(vehiculosService.agregarACliente(1, vehiculo)).rejects.toMatchObject({ code: 'PLACA_DUPLICADA' });
  });

  test('actualizar permite conservar su propia placa y VIN', async () => {
    vehiculosRepo.findById.mockResolvedValue({ id: 5 });
    vehiculosRepo.findByPlaca.mockResolvedValue({ id: 5 });
    vehiculosRepo.findByVin.mockResolvedValue({ id: 5 });
    vehiculosRepo.update.mockResolvedValue({ id: 5, ...vehiculo });
    await expect(vehiculosService.actualizar(5, vehiculo)).resolves.toBeDefined();
  });

  test('actualizar rechaza la placa de otro vehículo', async () => {
    vehiculosRepo.findById.mockResolvedValue({ id: 5 });
    vehiculosRepo.findByPlaca.mockResolvedValue({ id: 6 });
    await expect(vehiculosService.actualizar(5, vehiculo)).rejects.toMatchObject({ code: 'PLACA_DUPLICADA' });
  });

  test('actualizar rechaza el VIN de otro vehículo', async () => {
    vehiculosRepo.findById.mockResolvedValue({ id: 5 });
    vehiculosRepo.findByVin.mockResolvedValue({ id: 6 });
    await expect(vehiculosService.actualizar(5, vehiculo)).rejects.toMatchObject({ code: 'VIN_DUPLICADO' });
  });

  test('obtener / actualizar lanzan 404 si el vehículo no existe', async () => {
    vehiculosRepo.findById.mockResolvedValue(null);
    await expect(vehiculosService.obtener(9)).rejects.toMatchObject({ statusCode: 404 });
    await expect(vehiculosService.actualizar(9, vehiculo)).rejects.toMatchObject({ code: 'VEHICULO_NO_ENCONTRADO' });
  });
});
