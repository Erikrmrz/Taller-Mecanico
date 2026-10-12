import { Link, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import { RutaPorRol, RutaPrivada } from './components/RutasProtegidas.jsx';
import { ROLES } from './lib/constants.js';
import ClienteDetallePage from './pages/ClienteDetallePage.jsx';
import ClientesPage from './pages/ClientesPage.jsx';
import InicioPage from './pages/InicioPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import UsuariosPage from './pages/UsuariosPage.jsx';

const NoEncontrada = () => (
  <div className="card mx-auto mt-10 max-w-lg p-8 text-center">
    <h1 className="text-3xl font-semibold text-petrol-800">Página no encontrada</h1>
    <p className="mt-3 text-slate-700">La dirección no existe o fue movida.</p>
    <Link to="/" className="btn btn-primary mt-6">
      Volver al inicio
    </Link>
  </div>
);

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<RutaPrivada />}>
        <Route element={<Layout />}>
          <Route index element={<InicioPage />} />

          <Route element={<RutaPorRol roles={[ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA]} />}>
            <Route path="clientes" element={<ClientesPage />} />
            <Route path="clientes/:id" element={<ClienteDetallePage />} />
          </Route>

          <Route element={<RutaPorRol roles={[ROLES.ADMINISTRADOR]} />}>
            <Route path="usuarios" element={<UsuariosPage />} />
          </Route>

          <Route path="*" element={<NoEncontrada />} />
        </Route>
      </Route>
    </Routes>
  );
}
