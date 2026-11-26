import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useSesion } from '../../auth/sesion';
import Aviso from '../../components/Aviso';
import BadgeEstado from '../../components/BadgeEstado';
import EstadoCarga from '../../components/EstadoCarga';
import ProgresoPedido from '../../components/ProgresoPedido';
import { ESTADO_PARA_CLIENTE, unidadesDe, type Pedido } from '../../domain/pedidos';
import { usePedidos } from '../../pedidos/usePedidos';
import { formatearFecha, formatearPesos } from '../../utils/formato';

type Vista = 'curso' | 'entregados' | 'cancelados' | 'todos';

const VISTAS: { id: Vista; texto: string; incluye: (p: Pedido) => boolean }[] = [
  { id: 'curso', texto: 'En curso', incluye: (p) => p.estado !== 'ENTREGADO' && p.estado !== 'CANCELADO' },
  { id: 'entregados', texto: 'Entregados', incluye: (p) => p.estado === 'ENTREGADO' },
  { id: 'cancelados', texto: 'Cancelados', incluye: (p) => p.estado === 'CANCELADO' },
  { id: 'todos', texto: 'Todos', incluye: () => true },
];

function resumenProductos(pedido: Pedido): string {
  const detalles = pedido.detalles ?? [];
  if (detalles.length === 0) return '';
  const [primero, ...resto] = detalles;
  return resto.length === 0 ? primero.nombreProducto : `${primero.nombreProducto} y ${resto.length} más`;
}

export default function MisPedidos() {
  const { perfil } = useSesion();
  const { pedidos, error, actualizado } = usePedidos({ soloDe: perfil?.oid });
  const [vista, setVista] = useState<Vista>('curso');

  useEffect(() => {
    document.title = 'WePay | Mis pedidos';
  }, []);

  const filtro = VISTAS.find((v) => v.id === vista) ?? VISTAS[0];
  const visibles = (pedidos ?? []).filter(filtro.incluye);

  return (
    <>
      <header className="cabecera-pagina">
        <h1>Mis pedidos</h1>
        <p>Revisa en qué etapa está cada compra. Esta página se actualiza sola.</p>
      </header>

      <div className="barra-filtros">
        <div className="contenedor barra-filtros__fila">
          <div className="pestanas" role="tablist" aria-label="Filtrar pedidos">
            {VISTAS.map((v) => (
              <button
                key={v.id}
                role="tab"
                aria-selected={vista === v.id}
                className={`pestana ${vista === v.id ? 'pestana--activa' : ''}`}
                onClick={() => setVista(v.id)}
              >
                {v.texto}
                <span className="pestana__conteo">{(pedidos ?? []).filter(v.incluye).length}</span>
              </button>
            ))}
          </div>
          {actualizado ? (
            <span className="contador">
              Actualizado a las{' '}
              {actualizado.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
            </span>
          ) : null}
        </div>
      </div>

      <section className="seccion seccion--ajustada">
        <div className="contenedor">
          {error ? <Aviso tipo="error">{error}</Aviso> : null}
          {!pedidos && !error ? <EstadoCarga texto="Cargando tus pedidos..." /> : null}

          {pedidos && pedidos.length === 0 ? (
            <div className="vacio-grande">
              <p>Todavía no tienes pedidos.</p>
              <Link className="boton boton--primario" to="/tienda">
                Ver productos
              </Link>
            </div>
          ) : null}
          {pedidos && pedidos.length > 0 && visibles.length === 0 ? (
            <p className="vacio">No tienes pedidos en esta lista.</p>
          ) : null}

          <ul className="lista-pedidos">
            {visibles.map((pedido) => (
              <li key={pedido.id}>
                <Link className="pedido-fila" to={`/mis-pedidos/${pedido.id}`}>
                  <div className="pedido-fila__cabecera">
                    <div>
                      <p className="pedido-fila__numero">Pedido #{pedido.id}</p>
                      <p className="texto-suave">{formatearFecha(pedido.fechaRegistro)}</p>
                    </div>
                    <BadgeEstado estado={pedido.estado} />
                  </div>
                  <p className="pedido-fila__estado">{ESTADO_PARA_CLIENTE[pedido.estado].titulo}</p>
                  {resumenProductos(pedido) ? (
                    <p className="texto-suave">
                      {resumenProductos(pedido)} · {unidadesDe(pedido)}{' '}
                      {unidadesDe(pedido) === 1 ? 'unidad' : 'unidades'}
                    </p>
                  ) : null}
                  <ProgresoPedido estado={pedido.estado} compacto />
                  <div className="pedido-fila__pie">
                    <strong>{formatearPesos(pedido.total)}</strong>
                    <span className="enlace-subrayado">Ver detalle</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
