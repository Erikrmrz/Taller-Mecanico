import { request } from './client.js';

export const authApi = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  me: () => request('/auth/me'),
};

export const usuariosApi = {
  listar: () => request('/usuarios'),
  crear: (data) => request('/usuarios', { method: 'POST', body: data }),
  actualizar: (id, data) => request(`/usuarios/${id}`, { method: 'PUT', body: data }),
  desactivar: (id) => request(`/usuarios/${id}/desactivar`, { method: 'PATCH' }),
  reactivar: (id) => request(`/usuarios/${id}/reactivar`, { method: 'PATCH' }),
};

export const clientesApi = {
  listar: ({ q = '', page = 1, pageSize = 10 } = {}) => {
    const params = new URLSearchParams({ page, pageSize });
    if (q) params.set('q', q);
    return request(`/clientes?${params}`);
  },
  obtener: (id) => request(`/clientes/${id}`),
  crear: (data) => request('/clientes', { method: 'POST', body: data }),
  actualizar: (id, data) => request(`/clientes/${id}`, { method: 'PUT', body: data }),
  agregarVehiculo: (clienteId, data) => request(`/clientes/${clienteId}/vehiculos`, { method: 'POST', body: data }),
};

export const vehiculosApi = {
  actualizar: (id, data) => request(`/vehiculos/${id}`, { method: 'PUT', body: data }),
};
