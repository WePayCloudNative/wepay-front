import { Navigate, Route, Routes } from 'react-router-dom';

import RedirigirPorRol from './auth/RedirigirPorRol';
import RutaAdmin from './auth/RutaAdmin';
import RutaProtegida from './auth/RutaProtegida';
import LayoutPrivado from './layouts/LayoutPrivado';
import AdminPedidos from './pages/admin/AdminPedidos';
import Mensajeria from './pages/admin/Mensajeria';
import Proximamente from './pages/admin/Proximamente';
import MisPedidos from './pages/cliente/MisPedidos';
import Perfil from './pages/cliente/Perfil';
import Tienda from './pages/cliente/Tienda';
import Inicio from './pages/Inicio';
import './App.css';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />

      <Route
        path="/app"
        element={
          <RutaProtegida>
            <RedirigirPorRol />
          </RutaProtegida>
        }
      />

      {/* Zona cliente: cualquier usuario autenticado */}
      <Route
        element={
          <RutaProtegida>
            <LayoutPrivado zona="cliente" />
          </RutaProtegida>
        }
      >
        <Route path="/tienda" element={<Tienda />} />
        <Route path="/mis-pedidos" element={<MisPedidos />} />
        <Route path="/perfil" element={<Perfil />} />
      </Route>

      {/* Zona administración: solo rol ADMIN */}
      <Route
        path="/admin"
        element={
          <RutaProtegida>
            <RutaAdmin>
              <LayoutPrivado zona="admin" />
            </RutaAdmin>
          </RutaProtegida>
        }
      >
        <Route index element={<Navigate replace to="pedidos" />} />
        <Route path="pedidos" element={<AdminPedidos />} />
        <Route path="mensajeria" element={<Mensajeria />} />
        <Route
          path="auditoria"
          element={
            <Proximamente
              titulo="Auditoría"
              descripcion="Historial de todos los eventos de pedidos (quién, qué y cuándo), registrado por ms-auditoria desde el tópico orders.events de Kafka."
              servicio="wepay-ms-auditoria (puerto 8086)"
              endpoints={['GET /api/audit', 'GET /api/audit/entidad/{pedidoId}', 'GET /api/audit/usuario/{oid}']}
            />
          }
        />
        <Route
          path="reportes"
          element={
            <Proximamente
              titulo="Reportes"
              descripcion="Indicadores de las últimas 24 horas (ventas, pedidos activos y entregados, tiempo promedio de entrega), calculados por ms-reportes desde Kafka."
              servicio="wepay-ms-reportes (puerto 8087)"
              endpoints={['GET /api/report/kpis?range=last24h']}
            />
          }
        />
      </Route>

      {/* Rutas antiguas y desconocidas */}
      <Route path="/productos" element={<Navigate replace to="/tienda" />} />
      <Route path="/pedidos" element={<Navigate replace to="/mis-pedidos" />} />
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  );
}
