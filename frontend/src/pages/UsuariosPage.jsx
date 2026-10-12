import { useCallback, useEffect, useState } from 'react';
import { usuariosApi } from '../api/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert, Cargando, ConfirmDialog, Field, Insignia, Modal, TextField, useAviso } from '../components/ui.jsx';
import { ROL_ETIQUETA, ROLES } from '../lib/constants.js';
import { detallesAErrores } from '../lib/validation.js';

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validarUsuario(f, esNuevo) {
  const e = {};
  if (f.nombre.trim().length < 2) e.nombre = 'El nombre debe tener al menos 2 caracteres';
  if (!RE_EMAIL.test(f.email.trim())) e.email = 'Escriba un correo electrónico válido';
  if (!f.rol) e.rol = 'Elija un rol';
  if (esNuevo || f.password) {
    if (f.password.length < 8) e.password = 'La contraseña debe tener al menos 8 caracteres';
    else if (!/[A-Za-z]/.test(f.password) || !/[0-9]/.test(f.password)) e.password = 'La contraseña debe incluir letras y números';
  }
  return e;
}

function UsuarioFormModal({ usuario, onClose, onGuardado }) {
  const esNuevo = !usuario;
  const [f, setF] = useState({ nombre: usuario?.nombre ?? '', email: usuario?.email ?? '', rol: usuario?.rol ?? '', password: '' });
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const set = (campo) => (v) => setF((prev) => ({ ...prev, [campo]: v }));

  async function enviar(e) {
    e.preventDefault();
    setError('');
    const errs = validarUsuario(f, esNuevo);
    setErrores(errs);
    if (Object.keys(errs).length) return;

    const body = { nombre: f.nombre.trim(), email: f.email.trim(), rol: f.rol };
    if (f.password) body.password = f.password;

    setEnviando(true);
    try {
      if (esNuevo) await usuariosApi.crear(body);
      else await usuariosApi.actualizar(usuario.id, body);
      onGuardado(esNuevo ? 'Usuario creado' : 'Cambios guardados');
    } catch (err) {
      const deServidor = detallesAErrores(err.details);
      if (Object.keys(deServidor).length) setErrores(deServidor);
      else if (err.code === 'CORREO_DUPLICADO') setErrores({ email: err.message });
      else setError(err.message);
      setEnviando(false);
    }
  }

  return (
    <Modal titulo={esNuevo ? 'Nuevo usuario' : 'Editar usuario'} onClose={onClose}>
      <form onSubmit={enviar} className="space-y-4" noValidate>
        {error && <Alert>{error}</Alert>}
        <TextField label="Nombre completo" value={f.nombre} onChange={set('nombre')} error={errores.nombre} maxLength={100} autoFocus />
        <TextField label="Correo electrónico" type="email" value={f.email} onChange={set('email')} error={errores.email} maxLength={120} />
        <Field label="Rol" error={errores.rol} hint="Cada usuario tiene un único rol">
          {(id, invalido) => (
            <select id={id} className={`input ${invalido ? 'input-error' : ''}`} value={f.rol} onChange={(e) => set('rol')(e.target.value)}>
              <option value="">Elija un rol</option>
              {Object.values(ROLES).map((r) => (
                <option key={r} value={r}>
                  {ROL_ETIQUETA[r]}
                </option>
              ))}
            </select>
          )}
        </Field>
        <TextField
          label={esNuevo ? 'Contraseña' : 'Nueva contraseña'}
          type="password"
          autoComplete="new-password"
          value={f.password}
          onChange={set('password')}
          error={errores.password}
          hint={esNuevo ? 'Mínimo 8 caracteres, con letras y números' : 'Déjela vacía para conservar la actual'}
        />
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={enviando}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={enviando}>
            {enviando ? 'Guardando…' : esNuevo ? 'Crear usuario' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function UsuariosPage() {
  const { usuario: yo } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [formulario, setFormulario] = useState(null); // { usuario } | null
  const [confirmar, setConfirmar] = useState(null); // { usuario, accion }
  const [procesando, setProcesando] = useState(false);
  const [aviso, setAviso] = useAviso();

  const cargar = useCallback(async () => {
    try {
      const { items } = await usuariosApi.listar();
      setUsuarios(items);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function ejecutarConfirmacion() {
    setProcesando(true);
    try {
      const { usuario, accion } = confirmar;
      if (accion === 'desactivar') await usuariosApi.desactivar(usuario.id);
      else await usuariosApi.reactivar(usuario.id);
      setAviso(accion === 'desactivar' ? `Cuenta de ${usuario.nombre} desactivada` : `Cuenta de ${usuario.nombre} reactivada`);
      setConfirmar(null);
      await cargar();
    } catch (err) {
      setConfirmar(null);
      setError(err.message);
    } finally {
      setProcesando(false);
    }
  }

  const guardado = (mensaje) => {
    setFormulario(null);
    setAviso(mensaje);
    cargar();
  };

  const acciones = (u) => (
    <div className="flex flex-wrap gap-2">
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setFormulario({ usuario: u })}>
        Editar
      </button>
      {u.activo ? (
        <button type="button" className="btn btn-secondary btn-sm text-danger" disabled={u.id === yo.id} title={u.id === yo.id ? 'No puede desactivar su propia cuenta' : undefined} onClick={() => setConfirmar({ usuario: u, accion: 'desactivar' })}>
          Desactivar
        </button>
      ) : (
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setConfirmar({ usuario: u, accion: 'reactivar' })}>
          Reactivar
        </button>
      )}
    </div>
  );

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-4xl font-semibold text-petrol-800">Usuarios</h1>
          <p className="text-slate-700">Cuentas del taller y el rol de cada una.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setFormulario({ usuario: null })}>
          Nuevo usuario
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {aviso && <Alert tipo="exito">{aviso}</Alert>}
        {error && <Alert>{error}</Alert>}
      </div>

      {cargando ? (
        <Cargando />
      ) : (
        <>
          {/* Tabla: tableta y escritorio */}
          <div className="card mt-5 hidden overflow-x-auto md:block">
            <table className="w-full text-left text-[15px]">
              <thead className="border-b border-slate-200 bg-petrol-50 text-petrol-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nombre</th>
                  <th className="px-4 py-3 font-semibold">Correo</th>
                  <th className="px-4 py-3 font-semibold">Rol</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usuarios.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3 font-medium">
                      {u.nombre} {u.id === yo.id && <span className="ml-1 text-sm font-normal text-slate-600">(usted)</span>}
                    </td>
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3">{ROL_ETIQUETA[u.rol]}</td>
                    <td className="px-4 py-3">
                      <Insignia activo={u.activo} />
                    </td>
                    <td className="px-4 py-3">{acciones(u)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tarjetas: móvil */}
          <ul className="mt-5 space-y-3 md:hidden">
            {usuarios.map((u) => (
              <li key={u.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {u.nombre} {u.id === yo.id && <span className="text-sm font-normal text-slate-600">(usted)</span>}
                    </p>
                    <p className="break-all text-sm text-slate-700">{u.email}</p>
                    <p className="mt-1 text-sm text-slate-700">{ROL_ETIQUETA[u.rol]}</p>
                  </div>
                  <Insignia activo={u.activo} />
                </div>
                <div className="mt-3">{acciones(u)}</div>
              </li>
            ))}
          </ul>
        </>
      )}

      {formulario && <UsuarioFormModal usuario={formulario.usuario} onClose={() => setFormulario(null)} onGuardado={guardado} />}

      {confirmar && (
        <ConfirmDialog
          titulo={confirmar.accion === 'desactivar' ? 'Desactivar cuenta' : 'Reactivar cuenta'}
          mensaje={
            confirmar.accion === 'desactivar'
              ? `${confirmar.usuario.nombre} ya no podrá iniciar sesión y su sesión actual se cerrará. Podrá reactivar la cuenta cuando quiera.`
              : `${confirmar.usuario.nombre} podrá volver a iniciar sesión con su contraseña actual.`
          }
          textoConfirmar={confirmar.accion === 'desactivar' ? 'Desactivar cuenta' : 'Reactivar cuenta'}
          peligro={confirmar.accion === 'desactivar'}
          enviando={procesando}
          onConfirm={ejecutarConfirmacion}
          onCancel={() => setConfirmar(null)}
        />
      )}
    </div>
  );
}
