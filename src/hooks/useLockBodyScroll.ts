import { useEffect } from "react";

/**
 * Trava a rolagem do `<body>` enquanto o componente está montado — para modais
 * e overlays: deslizar sobre o véu não deve arrastar a página escondida atrás
 * dele.
 *
 * ⚠ `overflowY` e não `overflow`: `index.css` define `overflow-x: clip` no
 * body de propósito, e sobrescrever os dois eixos o perderia. Mesmo cuidado do
 * menu mobile em `Layout.tsx`.
 *
 * `ativo` permite condicionar sem quebrar a regra dos hooks (ex.: modal que
 * às vezes não renderiza o overlay).
 */
export function useLockBodyScroll(ativo = true): void {
  useEffect(() => {
    if (!ativo) return;
    const anterior = document.body.style.overflowY;
    document.body.style.overflowY = "hidden";
    return () => {
      document.body.style.overflowY = anterior;
    };
  }, [ativo]);
}
