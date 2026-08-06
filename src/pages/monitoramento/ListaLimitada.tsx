import { useMemo, useState } from "react";
import { BotaoMais } from "./Monitoramento.styled";

/** Quantos itens um card mostra antes de cortar.
 *
 *  8 é o que cabe num card sem ele dominar a tela — a Visão geral tem três
 *  cards lado a lado, e um deles com 30 linhas empurra os outros para longe. */
export const LIMITE_LISTA = 8;

/**
 * Mostra os primeiros `limite` itens e guarda o resto atrás de um botão.
 *
 * ⭐ **Por que não rolagem dentro do card.** A página já rola. Uma área rolável
 * dentro dela captura a roda do mouse quando o ponteiro passa por cima, e quem
 * queria descer a página trava no meio de um card. Em celular é pior: a
 * rolagem interna disputa com a da página, e a de baixo perde.
 *
 * E rolagem não resolve o problema de verdade destas listas. Elas são
 * ORDENADAS POR GRAVIDADE — o pior no topo. Com 40 itens, os 30 do fim não são
 * informação escondida, são ruído: quem precisa agir age sobre os primeiros.
 * Cortar e oferecer "mostrar todos" diz isso na cara; rolar finge que os 40 têm
 * o mesmo peso e cobra a leitura de todos.
 *
 * Onde achar alguém específico é o ponto — as tabelas de Alocação, Execução e
 * Atrasos — a escolha é outra: lá vale `TabelaRolagem $max`, porque cortar
 * esconderia justamente a pessoa que estão procurando.
 *
 * ⚠ É hook: não pode ficar depois de `return` cedo de erro ou carregando. Os
 * componentes que têm essas saídas separam o corpo num subcomponente.
 */
export function useLimite<T>(itens: T[], limite: number = LIMITE_LISTA) {
  const [expandido, setExpandido] = useState(false);

  const visiveis = useMemo(
    () => (expandido ? itens : itens.slice(0, limite)),
    [itens, limite, expandido],
  );

  return {
    visiveis,
    /** Quantos ficaram de fora. Zero quando tudo cabe — e aí não há botão. */
    escondidos: itens.length - visiveis.length,
    expandido,
    alternar: () => setExpandido((v) => !v),
  };
}

export type EstadoLimite<T> = ReturnType<typeof useLimite<T>>;

/**
 * O rodapé que revela o resto. Some sozinho quando a lista inteira já cabe —
 * um botão "mostrar todos os 3" numa lista de 3 é ruído.
 *
 * O total vai no rótulo de propósito: "Mostrar todos os 34" avisa o tamanho
 * ANTES do clique. Sem o número, expandir vira aposta.
 */
export function MostrarTodos<T>({
  estado,
  total,
  genero = "m",
}: {
  estado: EstadoLimite<T>;
  total: number;
  /** Concordância do rótulo: "todos os 34" (m) ou "todas as 25" (f). */
  genero?: "m" | "f";
}) {
  if (estado.escondidos === 0 && !estado.expandido) return null;

  const tudo = genero === "f" ? `todas as ${total}` : `todos os ${total}`;

  return (
    <BotaoMais type="button" onClick={estado.alternar} aria-expanded={estado.expandido}>
      {estado.expandido ? "Mostrar menos" : `Mostrar ${tudo}`}
    </BotaoMais>
  );
}
