import { useEffect, useId, useState } from 'react';

export function Alert({ tipo = 'error', children }) {
  const estilos = tipo === 'error' ? 'border-danger/40 bg-danger-soft text-danger-dark' : 'border-ok/40 bg-ok-soft text-ok';
  return (
    <div role={tipo === 'error' ? 'alert' : 'status'} className={`rounded-md border px-4 py-3 text-[15px] ${estilos}`}>
      {children}
    </div>
  );
}

export function Cargando({ texto = 'Cargando…' }) {
  return <p className="py-10 text-center text-slate-600">{texto}</p>;
}

/** La placa se muestra como una placa: es el dato con el que el taller identifica cada vehículo. */
export function Placa({ valor }) {
  return (
    <span className="inline-flex items-center rounded-[5px] border-2 border-ink bg-white px-2 py-0.5 font-display text-base font-semibold leading-none tracking-[0.14em] text-ink">
      {valor}
    </span>
  );
}

export function Insignia({ activo }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-sm font-medium ${activo ? 'bg-ok-soft text-ok' : 'bg-slate-200 text-slate-700'}`}>
      {activo ? 'Activa' : 'Desactivada'}
    </span>
  );
}

export function Field({ label, error, hint, children }) {
  const id = useId();
  const control = children(id, Boolean(error));
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      {control}
      {hint && !error && <p className="mt-1 text-sm text-slate-600">{hint}</p>}
      {error && (
        <p className="mt-1 text-sm font-medium text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** Input de texto con etiqueta y mensaje de error. */
export function TextField({ label, error, hint, value, onChange, ...props }) {
  return (
    <Field label={label} error={error} hint={hint}>
      {(id, invalido) => (
        <input
          id={id}
          className={`input ${invalido ? 'input-error' : ''}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={invalido}
          {...props}
        />
      )}
    </Field>
  );
}

export function Modal({ titulo, onClose, children, ancho = 'max-w-lg' }) {
  useEffect(() => {
    const alTeclear = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', alTeclear);
    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', alTeclear);
      document.body.style.overflow = previo;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={titulo} className={`max-h-[94vh] w-full ${ancho} overflow-y-auto rounded-t-xl bg-white shadow-xl sm:rounded-xl`}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
          <h2 className="text-2xl font-semibold text-petrol-800">{titulo}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="flex h-10 w-10 items-center justify-center rounded-md text-2xl text-slate-600 hover:bg-slate-100">
            ×
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({ titulo, mensaje, textoConfirmar, peligro = false, enviando = false, onConfirm, onCancel }) {
  return (
    <Modal titulo={titulo} onClose={onCancel} ancho="max-w-md">
      <p className="text-[15px] text-slate-700">{mensaje}</p>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={enviando}>
          Cancelar
        </button>
        <button type="button" className={`btn ${peligro ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={enviando}>
          {enviando ? 'Procesando…' : textoConfirmar}
        </button>
      </div>
    </Modal>
  );
}

export function Paginacion({ page, pageSize, total, onChange }) {
  const paginas = Math.max(1, Math.ceil(total / pageSize));
  if (paginas <= 1) return null;
  return (
    <nav className="mt-4 flex items-center justify-between gap-3" aria-label="Paginación">
      <button type="button" className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Anterior
      </button>
      <span className="text-sm text-slate-700">
        Página {page} de {paginas}
      </span>
      <button type="button" className="btn btn-secondary btn-sm" disabled={page >= paginas} onClick={() => onChange(page + 1)}>
        Siguiente
      </button>
    </nav>
  );
}

/** Mensaje de confirmación que desaparece solo. */
export function useAviso() {
  const [aviso, setAviso] = useState('');
  useEffect(() => {
    if (!aviso) return undefined;
    const t = setTimeout(() => setAviso(''), 5000);
    return () => clearTimeout(t);
  }, [aviso]);
  return [aviso, setAviso];
}

export function useDebounce(valor, ms = 300) {
  const [v, setV] = useState(valor);
  useEffect(() => {
    const t = setTimeout(() => setV(valor), ms);
    return () => clearTimeout(t);
  }, [valor, ms]);
  return v;
}
