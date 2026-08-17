import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { BotaoOrdenar } from "@/styles/shared.styled";
import { TableHeadCell } from "@/pages/Bancas.styled";

/**
 * Ordenação por clique no cabeçalho, a MESMA em toda tabela do app.
 *
 * O padrão nasceu nas tabelas do Histórico de Projetos e estava escrito à mão
 * lá; aqui ele vira um lugar só, porque a regra fina (o que acontece no
 * segundo clique, para onde vai quem não tem valor, qual direção a coluna
 * assume quando é escolhida) é justamente o que diverge quando cada tela
 * reimplementa.
 *
 * Três decisões que valem para todas:
 *
 * 1. **A seta só aparece na coluna ativa.** Uma seta em cada cabeçalho vira
 *    ruído e some com a informação de qual coluna está mandando.
 * 2. **Vazio vai para o fim nas DUAS direções.** "—" não é valor baixo, é
 *    ausência de valor; quem inverte a ordem quer o menor valor REAL, não uma
 *    pilha de linhas em branco no topo.
 * 3. **A ordem inicial pode ser a que veio.** Várias tabelas chegam
 *    ordenadas por uma curadoria que nenhuma coluna sozinha reproduz (a
 *    Execução sobe quem precisa de ação, misturando atraso e vencidas). Com
 *    `colunaInicial: null`, nada é reordenado e nenhuma seta acende até o
 *    primeiro clique — a ordenação vira uma ferramenta a mais, não uma
 *    substituição do que a tela já sabia fazer.
 */

export type Direcao = "asc" | "desc";

/** O que a tabela lê de cada linha para ordenar por uma coluna. */
export interface Coluna<T> {
  /** O valor comparável da linha. `null`/`undefined` = sem valor (vai ao fim). */
  valor: (item: T) => string | number | null | undefined;
  /** A direção do PRIMEIRO clique. Texto costuma abrir em A→Z; número, do
   *  maior para o menor, porque a pergunta costuma ser "quem lidera". */
  inicial?: Direcao;
}

export type Colunas<T> = Record<string, Coluna<T>>;

interface Ordem {
  coluna: string | null;
  dir: Direcao;
}

function comparar(a: string | number, b: string | number): number {
  if (typeof a === "string" || typeof b === "string") {
    return String(a).localeCompare(String(b), "pt-BR", { numeric: true });
  }
  return a - b;
}

/**
 * @param itens a lista já filtrada, na ordem que a tela quer como padrão.
 * @param colunas o mapa de chave da coluna para como extrair o valor dela.
 * @param colunaInicial a coluna acesa ao abrir; `null` mantém a ordem de
 *   `itens` intacta até o primeiro clique.
 */
export function useOrdenacao<T>(
  itens: T[],
  colunas: Colunas<T>,
  colunaInicial: string | null = null,
) {
  const [ordem, setOrdem] = useState<Ordem>(() => ({
    coluna: colunaInicial,
    dir: (colunaInicial && colunas[colunaInicial]?.inicial) || "asc",
  }));

  const ordenados = useMemo(() => {
    const definicao = ordem.coluna ? colunas[ordem.coluna] : null;
    if (!definicao) return itens;
    const dir = ordem.dir === "asc" ? 1 : -1;
    return [...itens].sort((a, b) => {
      const va = definicao.valor(a);
      const vb = definicao.valor(b);
      // Fora do `* dir` de propósito: multiplicado junto, o vazio subiria
      // para o topo no crescente.
      const vazioA = va == null || va === "";
      const vazioB = vb == null || vb === "";
      if (vazioA && vazioB) return 0;
      if (vazioA) return 1;
      if (vazioB) return -1;
      return comparar(va!, vb!) * dir;
    });
    // `colunas` entra na conta: quando o valor de uma coluna depende de outra
    // lista que carrega depois (nome do coordenador, nome da frente), quem
    // chama passa um objeto memoizado, e sem esta dependência a ordenação
    // ficaria presa nos nomes vazios do primeiro render.
  }, [itens, ordem, colunas]);

  /** Segundo clique na mesma coluna inverte; coluna nova entra na direção
   *  que faz sentido para o tipo dela. */
  function ordenarPor(coluna: string) {
    setOrdem((atual) =>
      atual.coluna === coluna
        ? { coluna, dir: atual.dir === "asc" ? "desc" : "asc" }
        : { coluna, dir: colunas[coluna]?.inicial ?? "asc" },
    );
  }

  return { itens: ordenados, ordem, ordenarPor };
}

/**
 * O `th` clicável.
 *
 * Fora de qualquer componente de tela de propósito: declarado dentro, o React
 * o trata como um tipo novo a cada render e remonta o cabeçalho inteiro.
 */
export function Th({
  coluna,
  ordem,
  onOrdenar,
  children,
}: {
  coluna: string;
  ordem: { coluna: string | null; dir: Direcao };
  onOrdenar: (coluna: string) => void;
  children: ReactNode;
}) {
  const ativo = ordem.coluna === coluna;
  return (
    <TableHeadCell aria-sort={ativo ? (ordem.dir === "asc" ? "ascending" : "descending") : "none"}>
      <BotaoOrdenar type="button" $ativo={ativo} onClick={() => onOrdenar(coluna)}>
        {children}
        {ativo && (
          <span className="seta" aria-hidden="true">
            {ordem.dir === "asc" ? "↑" : "↓"}
          </span>
        )}
      </BotaoOrdenar>
    </TableHeadCell>
  );
}
