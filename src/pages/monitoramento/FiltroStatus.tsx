import { useState } from "react";
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
 * @param opcoes as etapas oferecidas, quando a aba não aceita todas. A aba
 *   Projetos ativos passa a lista sem `finalizado`, que ela recorta de
 *   qualquer jeito — oferecer uma opção que sempre devolve tabela vazia é
 *   pior que não oferecer.
 */
export function useFiltroStatus(opcoes: StatusProjeto[] = ORDEM_DO_CICLO) {
  const [status, setStatus] = useState<StatusProjeto[]>([]);

  return {
    /** O que vai para a API, um `?status=` por etapa marcada. Vazio = sem
     *  filtro; quem traduz isso para "não mandar o parâmetro" é `query()`
     *  em `lib/monitoramento.ts`. */
    status,
    /** Só o campo. Quem posiciona é a aba, dentro da `BarraFiltros` que ela
     *  compartilha com os filtros de frente e escopo. */
    seletor: (
      <FiltroMulti
        valores={status}
        onChange={(valores) => setStatus(valores as StatusProjeto[])}
        opcoes={opcoes.map((s) => ({ value: s, label: ROTULO_STATUS[s] }))}
        rotuloVazio="Todos os status"
        resumo={(n) => `${n} status`}
        aria-label="Filtrar por status"
      />
    ),
  };
}
