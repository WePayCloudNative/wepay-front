import { Navigate, Route, Routes } from 'react-router-dom';

import RedirigirPorRol from './auth/RedirigirPorRol';
import RutaAdmin from './auth/RutaAdmin';
import RutaProtegida from './auth/RutaProtegida';
import LayoutAdmin from './layouts/LayoutAdmin';
import LayoutTienda from './layouts/LayoutTienda';
import AdminPedidos from './pages/admin/AdminPedidos';
import Mensajeria from './pages/admin/Mensajeria';
import Proximamente from './pages/admin/Proximamente';
import Resumen from './pages/admin/Resumen';
import Confirmacion from './pages/cliente/Confirmacion';
import DetallePedido from './pages/cliente/DetallePedido';
import DetalleProducto from './pages/cliente/DetalleProducto';
import InicioTienda from './pages/cliente/InicioTienda';
import MisPedidos from './pages/cliente/MisPedidos';
import Pago from './pages/cliente/Pago';
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

      {/* Tienda: cualquier usuario autenticado (el admin también puede comprar) */}
      <Route
        element={
          <RutaProtegida>
            <LayoutTienda />
          </RutaProtegida>
        }
      >
        <Route path="/inicio" element={<InicioTienda />} />
        <Route path="/tienda" element={<Tienda />} />
        <Route path="/tienda/:id" element={<DetalleProducto />} />
        <Route path="/pago" element={<Pago />} />
        <Route path="/pedido/:id/confirmado" element={<Confirmacion />} />
        <Route path="/mis-pedidos" element={<MisPedidos />} />
        <Route path="/mis-pedidos/:id" element={<DetallePedido />} />
        <Route path="/perfil" element={<Perfil />} />
      </Route>

      {/* Backoffice: solo rol ADMIN */}
      <Route
        path="/admin"
        element={
          <RutaProtegida>
            <RutaAdmin>
              <LayoutAdmin />
            </RutaAdmin>
          </RutaProtegida>
        }
      >
        <Route index element={<Resumen />} />
        <Route path="pedidos" element={<AdminPedidos />} />
        <Route path="laboratorio" element={<Mensajeria />} />
        <Route path="mensajeria" element={<Navigate replace to="/admin/laboratorio" />} />
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
              descripcion="Indicadores de las últimas 24 horas (ventas, pedidos activos y entregados, tiempo promedio de entrega) y productos más vendidos, calculados por ms-reportes desde Kafka."
              servicio="wepay-ms-reportes (puerto 8087)"
              endpoints={['GET /api/report/kpis?range=last24h', 'GET /api/report/top-products?range=last7d']}
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
