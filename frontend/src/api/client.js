const BASE = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'taller_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(status, message, code, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

let onSesionExpirada = () => {};
export const registrarSesionExpirada = (fn) => {
  onSesionExpirada = fn;
};

export async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = tokenStore.get();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE}${path}`, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor. Revise su conexión e intente de nuevo', 'SIN_CONEXION');
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && auth) onSesionExpirada();
    throw new ApiError(res.status, (data && data.message) || 'Ocurrió un error inesperado', data && data.code, data && data.details);
  }
  return data;
}
