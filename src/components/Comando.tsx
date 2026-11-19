import { useState } from 'react';

/** Bloque de comando con botón para copiarlo. */
export default function Comando({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <div className="comando">
      <pre>
        <code>{texto}</code>
      </pre>
      <button className="boton boton--chico" onClick={() => void copiar()}>
        {copiado ? 'Copiado' : 'Copiar'}
      </button>
    </div>
  );
}
