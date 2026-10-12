import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/index.js';
import { registrarSesionExpirada, tokenStore } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(Boolean(tokenStore.get()));

  const cerrarSesion = useCallback(() => {
    tokenStore.clear();
    setUsuario(null);
  }, []);

  // Si el servidor responde 401 (token vencido o cuenta desactivada), se cierra la sesión.
  useEffect(() => registrarSesionExpirada(cerrarSesion), [cerrarSesion]);

  // Al abrir la app se recupera la sesión guardada.
  useEffect(() => {
    if (!tokenStore.get()) return;
    authApi
      .me()
      .then(({ usuario: u }) => setUsuario(u))
      .catch(() => tokenStore.clear())
      .finally(() => setCargando(false));
  }, []);

  const iniciarSesion = useCallback(async (email, password) => {
    const { token, usuario: u } = await authApi.login(email, password);
    tokenStore.set(token);
    setUsuario(u);
  }, []);

  const value = useMemo(
    () => ({ usuario, cargando, iniciarSesion, cerrarSesion, tieneRol: (...roles) => Boolean(usuario) && roles.includes(usuario.rol) }),
    [usuario, cargando, iniciarSesion, cerrarSesion]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
