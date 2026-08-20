import { useEffect, useState } from "react";
import { ROTULO_STATUS } from "@/lib/projetos";
import type { StatusProjeto } from "@/types/projeto";
import { FiltroMulti } from "./Monitoramento.styled";

/** As etapas na ORDEM DO CICLO (§4), não em ordem alfabética: a lista se lê
 *  como funil, de Vendido a Finalizado, e Pausado no fim por ser estado à
 *  parte. Alfabética poria "Ambientação" antes de "Vendido" e quebraria a
 *  única leitura que a lista já tem de graça. */
const ORDEM_DO_CICLO: StatusProjeto[] = [
  "vendido",
  "ambientacao",
  "em_andamento",
  "validacao_bancas",
  "envio_tep",
  "periodo_ajustes",
  "finalizado",
  "pausado",
];

/** A MESMA referência de lista vazia para os dois estados do hook.
 *
 *  Dois `[]` literais são objetos diferentes para o React, e como o `status`
 *  entra no array de dependências das abas, a aba dispararia uma segunda
 *  requisição no primeiro render só porque a lista vazia trocou de identidade
 *  sem trocar de conteúdo. */
const VAZIO: StatusProjeto[] = [];

/** Quanto tempo sem clique até a aba recarregar.
 *
 *  Curto o bastante para não parecer travado, longo o bastante para caber o
 *  intervalo entre dois cliques de quem marca etapas em sequência. */
const ESPERA_MS = 400;

/** Duas seleções valem a mesma consulta? Comparação por CONTEÚDO — o `IN` do
 *  backend não liga para a ordem, então marcar A depois B e marcar B depois A
 *  não podem ser duas requisições diferentes. */
function mesmaSelecao(a: StatusProjeto[], b: StatusProjeto[]): boolean {
  return a.length === b.length && a.every((s) => b.includes(s));
}

/**
 * O filtro de status de UMA aba, terceiro irmão de `useFiltroFrente` e
 * `useFiltroEscopo`, mesma ideia: estado próprio por aba, sem seletor global
 * no topo.
 *
 * **Marca vários**, ao contrário dos outros dois. As perguntas que a diretoria
 * faz nesta tela quase nunca são de uma etapa só — "o que está tocando agora?"
 * é Ambientação + Em andamento; "o que está fechando?" é Envio do TEP +
 * Período de ajustes. Com um valor por vez, responder isso exigia ler dois
 * payloads e somar na cabeça, e os KPIs desta tela não somam: o placar de
 * gestão e os percentuais são médias sobre bases diferentes.
 *
 * Como frente e escopo, não há gate de permissão aqui: o backend já aplica o
 * recorte de visão (§7.5) em cima do que for pedido, então filtrar por etapa
 * nunca amplia o que a pessoa enxerga.
 *
 * ⭐ **A marcação e a consulta andam em ritmos diferentes, de propósito.** São
 * dois estados:
 *
 *   `marcados` — o que a pessoa clicou. Muda NA HORA, é o que o checkbox
 *                mostra. Nada depende dele além do próprio campo.
 *   `status`   — o que vai para a API. Só alcança `marcados` depois de
 *                `ESPERA_MS` sem clique nenhum.
 *
 * Sem essa separação, marcar três etapas custava três requisições, e como a
 * aba troca o conteúdo inteiro por um bloco de carregamento enquanto busca
 * (`if (carregando || !dados)`), a tela apagava e voltava a cada clique — dava
 * para marcar a segunda etapa, mas em cima de uma tela piscando. A espera
 * junta a rajada de cliques numa consulta só, e continua automática: não há
 * botão de "aplicar", quem dispara é parar de clicar.
 *
 * @param opcoes as etapas oferecidas, quando a aba não aceita todas. A aba
 *   Projetos ativos passa a lista sem `finalizado`, que ela recorta de
 *   qualquer jeito — oferecer uma opção que sempre devolve tabela vazia é
 *   pior que não oferecer.
 */
export function useFiltroStatus(opcoes: StatusProjeto[] = ORDEM_DO_CICLO) {
  const [marcados, setMarcados] = useState<StatusProjeto[]>(VAZIO);
  const [status, setStatus] = useState<StatusProjeto[]>(VAZIO);

  useEffect(() => {
    const relogio = setTimeout(() => {
      // Devolver `atual` quando a seleção não mudou de CONTEÚDO faz o React
      // parar aqui, sem re-render: marcar uma etapa e desmarcar antes da
      // espera acabar não vale requisição nenhuma, porque a pergunta na tela
      // continua sendo a mesma de antes.
      setStatus((atual) => (mesmaSelecao(atual, marcados) ? atual : marcados));
    }, ESPERA_MS);
    // Cada clique novo cancela o relógio anterior — é isso que faz a espera
    // contar do ÚLTIMO clique, e não do primeiro.
    return () => clearTimeout(relogio);
  }, [marcados]);

  return {
    /** O que vai para a API, um `?status=` por etapa marcada. Vazio = sem
     *  filtro; quem traduz isso para "não mandar o parâmetro" é `query()`
     *  em `lib/monitoramento.ts`.
     *
     *  ⚠ Fica ATRÁS do que está marcado na tela por até `ESPERA_MS`. É o
     *  valor certo para o array de dependências da aba justamente por isso:
     *  ele só muda quando há consulta nova a fazer. */
    status,
    /** Só o campo. Quem posiciona é a aba, dentro da `BarraFiltros` que ela
     *  compartilha com os filtros de frente e escopo. */
    seletor: (
      <FiltroMulti
        valores={marcados}
        onChange={(valores) => setMarcados(valores as StatusProjeto[])}
        opcoes={opcoes.map((s) => ({ value: s, label: ROTULO_STATUS[s] }))}
        rotuloVazio="Todos os status"
        resumo={(n) => `${n} status`}
        aria-label="Filtrar por status"
      />
    ),
  };
}
