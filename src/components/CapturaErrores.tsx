import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type Estado = { error: Error | null };

/**
 * Si un componente falla al mostrarse, enseña el error en vez de dejar
 * la página en negro.
 */
export default class CapturaErrores extends Component<Props, Estado> {
  state: Estado = { error: null };

  static getDerivedStateFromError(error: Error): Estado {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Error en la interfaz', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="pagina">
          <section className="tarjeta">
            <p className="eyebrow">Algo salió mal</p>
            <h1>La página no se pudo mostrar</h1>
            <div className="aviso aviso--error">{this.state.error.message}</div>
            <div className="acciones">
              <button className="boton boton--primario" onClick={() => window.location.reload()}>
                Recargar
              </button>
              <a className="boton boton--fantasma" href="/">
                Ir al inicio
              </a>
            </div>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}
