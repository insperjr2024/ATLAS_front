import { useEffect } from "react";

/**
 * Trava a rolagem da página enquanto o componente está montado, para modais
 * e overlays: deslizar sobre o véu não deve arrastar a página escondida atrás
 * dele.
 *
 * Trava no `<html>`, não no `<body>` (2026-10-05, corrigido): `index.css`
 * põe `overflow-x: clip` no `<html>`, o que o torna o container de rolagem
 * da viewport. Um `overflow` no `<body>` não tinha efeito nenhum, e era por
 * isso que só os modais que mexiam no `<html>` por conta própria (detalhe da
 * banca, `BancaFormModal`) travavam de fato. Só o eixo Y, para o `clip` do X
 * seguir valendo.
 *
 * Contador em vez de "guarda e restaura": com dois modais abertos ao mesmo
 * tempo (confirmação por cima de um detalhe), o que fechasse por último
 * restaurava o `hidden` do outro e a página ficava travada pra sempre.
 *
 * `ativo` permite condicionar sem quebrar a regra dos hooks (ex.: modal que
 * às vezes não renderiza o overlay).
 */
let travas = 0;
let overflowAnterior = "";

export function useLockBodyScroll(ativo = true): void {
  useEffect(() => {
    if (!ativo) return;
    const raiz = document.documentElement;
    if (travas === 0) {
      overflowAnterior = raiz.style.overflowY;
      raiz.style.overflowY = "hidden";
    }
    travas += 1;
    return () => {
      travas -= 1;
      if (travas === 0) raiz.style.overflowY = overflowAnterior;
    };
  }, [ativo]);
}
