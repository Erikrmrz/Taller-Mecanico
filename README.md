# Taller Mecánico — RF-001, RF-002 y RF-003

Implementación de los tres primeros requisitos funcionales del **Formato 2 (ERS)**:

| ID | Requisito | Dónde está |
|----|-----------|-----------|
| RF-001 | Autenticación de usuarios | `backend/src/modules/auth` · `frontend/src/pages/LoginPage.jsx` |
| RF-002 | Gestión de usuarios y control de acceso por roles | `backend/src/modules/usuarios` + `middlewares/auth.js` · `UsuariosPage.jsx` · `RutasProtegidas.jsx` |
| RF-003 | Registro de clientes y vehículos | `backend/src/modules/clientes` y `vehiculos` · `ClientesPage.jsx`, `ClienteDetallePage.jsx` |

Requisitos no funcionales y reglas de dominio que ya se cumplen en esta entrega:

| ID | Cómo se cumple |
|----|----------------|
| RNF-005 | Contraseñas con hash bcrypt (`bcryptjs`, costo 12). Nunca se devuelven en el API. |
| RNF-007 | Tabla `bitacora_accesos`: cada inicio de sesión, exitoso o fallido, con usuario, fecha, hora, IP y motivo. Sesiones con JWT. |
| RNF-011 | Pruebas Jest sobre la capa de servicios con cobertura mínima del 80 % exigida (`npm run test:coverage`). |
| RNF-012 | Tres capas (rutas/controladores → servicios → repositorios), API REST, PostgreSQL con Prisma. |
| RNF-003 | Interfaz responsiva (tablas en pantallas ≥ 768 px, tarjetas en móvil). |
| RD-001 | Aviso de privacidad y consentimiento obligatorio al dar de alta un cliente (se guarda fecha y quién lo registró). Los datos personales solo se consultan con sesión y rol. |
| RNF-006 | HTTPS/TLS se configura en el despliegue (Render, Railway, Nginx…), no en el código. |

## Requisitos previos

- Node.js 20 o superior
- PostgreSQL instalado y en ejecución

## Puesta en marcha

### 1. Base de datos (descargar postgresql)

```bash
psql -U postgres -c "CREATE DATABASE taller_mecanico;"
```

### 2. Backend

```bash
cd backend
# Modifica el archivo .env: DATABASE_URL (usuario/contraseña de tu PostgreSQL) y JWT_SECRET
npm install
npm run db:setup              # crea las tablas (migración "init") y el usuario administrador
npm run dev                   # API en http://localhost:4000
```

`db:setup` ejecuta `prisma migrate dev --name init` y el seed. Cuando cambies `schema.prisma`,
usa `npm run prisma:migrate`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                   # http://localhost:5173 (reenvía /api al backend)
```




### Usuarios de prueba 

| Rol | Correo | Contraseña |
|-----|--------|-----------|
| Administrador | admin@taller.local | Admin1234 |
| Recepcionista | recepcion@taller.local | Recepcion123 |
| Mecánico | mecanico@taller.local | Mecanico123 |






## Pruebas

```bash
cd backend
npm test                # 76 pruebas
npm run test:coverage   # falla si la cobertura de servicios baja del 80 %
```


## API

Todas las rutas (salvo el login) requieren `Authorization: Bearer <token>`. Errores: `{ message, code, details? }`.

| Método y ruta | Rol | Descripción |
|---|---|---|
| `POST /api/auth/login` | público | RF-001. Devuelve `{ token, usuario }` |
| `GET /api/auth/me` | autenticado | Usuario de la sesión |
| `GET /api/usuarios` · `GET /api/usuarios/:id` | Administrador | RF-002 |
| `POST /api/usuarios` | Administrador | Crea cuenta con un único rol |
| `PUT /api/usuarios/:id` | Administrador | Edita nombre, correo, rol y (opcional) contraseña |
| `PATCH /api/usuarios/:id/desactivar` · `/reactivar` | Administrador | Desactiva o reactiva la cuenta |
| `GET /api/clientes?q=&page=&pageSize=` | Administrador, Recepcionista | RF-003. Busca por nombre, teléfono, correo, placa o VIN |
| `POST /api/clientes` | Administrador, Recepcionista | Alta con `consentimientoAvisoPrivacidad: true` y `vehiculos` opcionales |
| `GET/PUT /api/clientes/:id` | Administrador, Recepcionista | Consulta o edita datos de contacto |
| `POST /api/clientes/:id/vehiculos` | Administrador, Recepcionista | Agrega un vehículo |
| `GET/PUT /api/vehiculos/:id` | Administrador, Recepcionista | Consulta o edita un vehículo |

## Decisiones que tomé donde el ERS no es explícito

1. **Cuenta desactivada = sesión cortada.** El middleware consulta la base en cada petición, así que desactivar a un usuario o cambiarle el rol aplica de inmediato, sin esperar a que expire su JWT (8 h).
2. **Mensaje de cuenta desactivada solo con contraseña correcta.** Con contraseña incorrecta se responde el mensaje genérico, para no revelar qué correos existen.
3. **Protecciones extra en RF-002:** no se puede desactivar la propia cuenta ni dejar el sistema sin administrador activo.
4. **Clientes: nombre, teléfono y correo son obligatorios; domicilio es opcional.** El correo es obligatorio porque RF-013 notifica por ese medio. Para cambiarlo, edita `clientes.schemas.js` y `validation.js`.
5. **Un cliente puede crearse sin vehículos** y agregarlos después desde su ficha.
6. **El mecánico no accede a clientes** (RF-003 solo nombra a Recepcionista/Administrador). Cuando programemos RF-004 y RF-005 habrá que abrirle la consulta de historial.
7. **VIN de 17 caracteres** (sin I, O, Q) y **placa de 5 a 10** letras, números o guion; ambos se guardan en mayúsculas.
8. **Edición con PUT de reemplazo completo**, sin PATCH parcial.
9. **El texto del aviso de privacidad es de ejemplo** (`frontend/src/lib/constants.js`): sustitúyelo por el aviso oficial del taller.
10. **Limitador de intentos de login:** 20 fallos por IP cada 15 minutos.
11. **Token en `localStorage`** del navegador, con vencimiento de 8 horas.

## Estructura

```
backend/
  prisma/            schema.prisma y seed.js
  src/
    modules/<nombre>/  routes → controller → service → repository (+ schemas de validación)
    middlewares/       auth (authenticate/authorize), validate, errorHandler
  tests/             Jest + Supertest
frontend/
  src/
    api/ context/ components/ pages/ lib/
```
