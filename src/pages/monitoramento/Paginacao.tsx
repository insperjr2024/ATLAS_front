import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BarraPaginacao, BotaoPagina, ContadorPagina } from "./Monitoramento.styled";

/** Quantos itens cabem numa página de card.
 *
 *  12 é o meio da faixa que o João pediu (10 a 15): o card não domina a tela e
 *  ainda assim uma página resolve a maioria dos casos sem ninguém navegar. */
export const POR_PAGINA = 12;

/** Página de TABELA. Maior que a das listas porque linha de tabela é uma linha
 *  de texto só — um item de "Atenção agora" tem duas, e mais o marcador de
 *  gravidade. Mesma altura de card, mais informação. */
export const POR_PAGINA_TABELA = 15;

/**
 * Pagina uma lista de card.
 *
 * ⭐ **Por que páginas e não rolagem interna.** A página já rola; uma área
 * rolável dentro dela captura a roda do mouse, e quem queria descer a página
 * trava no meio de um card. Em celular a rolagem interna disputa com a da
 * página e a de baixo perde.
 *
 * E por que não "mostrar todos", que era a versão anterior: com 77 itens o
 * botão devolvia um card de 77 linhas, que é o problema que ele deveria
 * resolver. A página mantém a altura do card CONSTANTE, sem importar o tamanho
 * do núcleo — que é o ponto de tudo isto.
 *
 * ⚠ A página atual é **derivada, não guardada crua**: quando a lista encolhe
 * (troca de filtro, troca de semana), `Math.min` traz de volta para a última
 * página existente. Guardando o número cru, filtrar na página 6 de uma lista
 * que passou a ter 2 páginas mostraria um card vazio, e o usuário concluiria
 * que o filtro não achou nada.
 *
 * ⚠ É hook: não pode ficar depois de `return` cedo de erro ou carregando. Os
 * componentes que têm essas saídas separam o corpo num subcomponente.
 */
export function usePaginacao<T>(itens: T[], porPagina: number = POR_PAGINA) {
  const [pedida, setPedida] = useState(0);

  const totalPaginas = Math.max(1, Math.ceil(itens.length / porPagina));
  const pagina = Math.min(pedida, totalPaginas - 1);
  const inicio = pagina * porPagina;

  const visiveis = useMemo(
    () => itens.slice(inicio, inicio + porPagina),
    [itens, inicio, porPagina],
  );

  return {
    visiveis,
    pagina,
    totalPaginas,
    total: itens.length,
    /** 1-based, para o texto "13–24 de 77" que a pessoa lê. */
    primeiroDaPagina: itens.length === 0 ? 0 : inicio + 1,
    ultimoDaPagina: Math.min(inicio + porPagina, itens.length),
    irPara: (n: number) => setPedida(Math.max(0, Math.min(n, totalPaginas - 1))),
  };
}

export type EstadoPaginacao<T> = ReturnType<typeof usePaginacao<T>>;

/**
 * Segura a altura do card entre páginas.
 *
 * ⭐ **O problema:** a última página quase sempre tem menos itens que as
 * outras. Dimensionada pelo conteúdo, ela encolhe o card, e tudo que está
 * abaixo sobe de repente — inclusive a própria barra de paginação, que foge de
 * debaixo do cursor bem na hora de clicar em "voltar".
 *
 * **Por que MEDIR e não calcular.** Uma altura fixa em `rem` exigiria saber
 * quanto ocupa um item, e isso muda por card: "Atenção agora" tem duas linhas
 * por item, a lista de bancas tem uma, e nome de projeto longo quebra em mais.
 * Qualquer número cravado erraria em metade dos casos. Medindo, cada card
 * aprende a própria altura.
 *
 * Guarda a MAIOR já vista: as páginas cheias medem primeiro, e a última nunca
 * encolhe abaixo delas. Se uma página posterior for mais alta (nomes que
 * quebram), cresce uma vez e estabiliza.
 *
 * ⚠ Reseta quando a lista muda de tamanho. Sem isso, filtrar de 77 itens para 3
 * manteria a altura dos 77 e deixaria um vão enorme embaixo dos 3.
 */
export function ConteudoPaginado<T>({
  estado,
  children,
}: {
  estado: EstadoPaginacao<T>;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [altura, setAltura] = useState<number>();

  useLayoutEffect(() => {
    setAltura(undefined);
  }, [estado.total]);

  useLayoutEffect(() => {
    // Página única não reserva nada: o card acompanha o conteúdo, como antes.
    if (estado.totalPaginas <= 1) return;
    const medida = ref.current?.offsetHeight ?? 0;
    setAltura((maior) => (maior && maior >= medida ? maior : medida));
  }, [estado.pagina, estado.totalPaginas, estado.total]);

  const reservar = estado.totalPaginas > 1 && altura;

  return (
    <div ref={ref} style={reservar ? { minHeight: altura } : undefined}>
      {children}
    </div>
  );
}

/**
 * O rodapé de navegação. Some sozinho quando tudo cabe numa página — setas
 * desabilitadas num card de 3 itens são ruído.
 *
 * O contador diz o INTERVALO e o total ("13–24 de 77"), não só o número da
 * página: "página 2 de 7" não responde quantos itens existem, que é o que
 * importa quando a lista está ordenada por gravidade.
 */
export function Paginacao<T>({ estado }: { estado: EstadoPaginacao<T> }) {
  if (estado.totalPaginas <= 1) return null;

  const { pagina, totalPaginas, primeiroDaPagina, ultimoDaPagina, total, irPara } = estado;

  return (
    <BarraPaginacao>
      <BotaoPagina
        type="button"
        onClick={() => irPara(pagina - 1)}
        disabled={pagina === 0}
        aria-label="Página anterior"
      >
        <ChevronLeft size={14} />
      </BotaoPagina>

      <ContadorPagina aria-live="polite">
        {primeiroDaPagina}–{ultimoDaPagina} de {total}
      </ContadorPagina>

      <BotaoPagina
        type="button"
        onClick={() => irPara(pagina + 1)}
        disabled={pagina >= totalPaginas - 1}
        aria-label="Próxima página"
      >
        <ChevronRight size={14} />
      </BotaoPagina>
    </BarraPaginacao>
  );
}
