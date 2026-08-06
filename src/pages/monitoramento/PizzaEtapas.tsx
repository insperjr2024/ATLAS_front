import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ConteudoPaginado, POR_PAGINA, Paginacao, usePaginacao } from "./Paginacao";
import { ROTULO_STATUS } from "@/lib/projetos";
import type { EtapaDoPortfolio } from "@/lib/monitoramento";
import { EmptyText } from "@/styles/page.styled";
import {
  BalaoEtapa,
  BalaoLista,
  BalaoTitulo,
  CaixaGrafico,
  COR_ETAPA,
  EnvolveDonut,
  ItemLegendaEtapa,
  ItemLista,
  LegendaEtapas,
  LinkProjeto,
  ListaSimples,
  MioloDonut,
  PontoEtapa,
  ProjetosDaEtapa,
} from "./Monitoramento.styled";

/** Quantos projetos cabem no balão antes de ele virar uma parede de texto.
 *  O que passar disso vira "e mais N" — a lista completa está a um clique, na
 *  seção que abre abaixo do gráfico. */
const MAX_NO_BALAO = 8;

/** O balão de hover: a etapa no topo, os projetos dela embaixo.
 *
 *  Substitui o tooltip padrão do recharts, que mostraria só "em_andamento: 12"
 *  — a chave crua do banco e um número que a legenda já dá. O que falta ao
 *  olhar o gráfico é QUAIS são esses 12. */
function BalaoDaFatia({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: EtapaDoPortfolio }[];
}) {
  const etapa = payload?.[0]?.payload;
  if (!active || !etapa) return null;

  const visiveis = etapa.projetos.slice(0, MAX_NO_BALAO);
  const resto = etapa.total - visiveis.length;

  return (
    <BalaoEtapa>
      <BalaoTitulo>
        <PontoEtapa $cor={COR_ETAPA[etapa.status]} aria-hidden="true" />
        {ROTULO_STATUS[etapa.status] ?? etapa.status}
        <b>{etapa.total}</b>
      </BalaoTitulo>
      <BalaoLista>
        {visiveis.map((p) => (
          <li key={p.id}>{p.nome}</li>
        ))}
        {resto > 0 && <li data-resto="true">e mais {resto}</li>}
      </BalaoLista>
    </BalaoEtapa>
  );
}

/**
 * A distribuição do portfólio pelas etapas do ciclo (§7.1).
 *
 * ⭐ **O número no meio é a soma das fatias, não um número à parte.** O backend
 * monta as etapas sobre a mesma lista `em_curso` de onde tira `total_ativos`,
 * então as partes fecham com o todo por construção. Um donut cujo centro não
 * bate com as fatias é o jeito mais fácil de um gráfico mentir: cada número
 * isolado parece certo.
 *
 * Substituiu a lista de texto "Distribuição por status", que ordenava por
 * quantidade — o que embaralhava o funil — e não deixava chegar aos projetos.
 */
export function PizzaEtapas({ etapas }: { etapas: EtapaDoPortfolio[] }) {
  const [selecionada, setSelecionada] = useState<string | null>(null);

  const total = etapas.reduce((soma, e) => soma + e.total, 0);
  // Etapa vazia fica na legenda, mas não pode ir para o gráfico: o recharts
  // desenha uma fatia de ângulo zero que ainda captura clique e tooltip,
  // criando um alvo invisível.
  const comProjeto = etapas.filter((e) => e.total > 0);
  const aberta = etapas.find((e) => e.status === selecionada) ?? null;
  // `?? []` mantém a chamada do hook estável quando não há etapa aberta — o
  // hook não pode entrar depois do `return` de portfólio vazio, logo abaixo.
  const lista = usePaginacao(aberta?.projetos ?? [], POR_PAGINA);

  function alternar(status: string) {
    setSelecionada((atual) => (atual === status ? null : status));
  }

  if (total === 0) {
    return <EmptyText>Nenhum projeto ativo.</EmptyText>;
  }

  return (
    <div>
      <EnvolveDonut>
        <CaixaGrafico>
          <ResponsiveContainer>
            <PieChart>
              {/* `wrapperStyle` com z-index: o balão é irmão do SVG e sem isto
                  fica atrás dele em parte do giro. */}
              <Tooltip content={<BalaoDaFatia />} wrapperStyle={{ zIndex: 1, outline: "none" }} />
              <Pie
                data={comProjeto}
                dataKey="total"
                nameKey="status"
                innerRadius="62%"
                outerRadius="95%"
                paddingAngle={2}
                // A ordem é o dado: as fatias saem na sequência do ciclo, então
                // a pizza se lê como funil. O padrão do recharts começa às 3h e
                // anda no sentido anti-horário — invertido para a leitura
                // começar no topo e seguir como relógio.
                startAngle={90}
                endAngle={-270}
                // Pelo índice, e não pelo payload da fatia: o recharts tipa o
                // argumento como `PieSectorDataItem`, e cair para os dados
                // originais exigiria um cast que mente sobre o tipo.
                onClick={(_, indice) => alternar(comProjeto[indice].status)}
              >
                {comProjeto.map((e) => (
                  <Cell
                    key={e.status}
                    fill={COR_ETAPA[e.status]}
                    opacity={selecionada && selecionada !== e.status ? 0.35 : 1}
                    style={{ cursor: "pointer", outline: "none" }}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </CaixaGrafico>

        {/* Fora do SVG: <text> do recharts não herda a tipografia do tema nem
            quebra em duas linhas. */}
        <MioloDonut>
          <strong>{total}</strong>
          <span>{total === 1 ? "projeto ativo" : "projetos ativos"}</span>
        </MioloDonut>
      </EnvolveDonut>

      {/* A legenda carrega nome e número, então quem não distingue os matizes
          lê o gráfico inteiro por ela. Cada item é botão porque a fatia é alvo
          pequeno: sem isto o clique não existe em tela estreita. */}
      <LegendaEtapas>
        {etapas.map((e) => (
          <ItemLegendaEtapa key={e.status} $ativo={selecionada === e.status} $vazio={e.total === 0}>
            <button
              type="button"
              onClick={() => e.total > 0 && alternar(e.status)}
              disabled={e.total === 0}
              aria-pressed={selecionada === e.status}
            >
              <PontoEtapa $cor={COR_ETAPA[e.status]} aria-hidden="true" />
              {ROTULO_STATUS[e.status] ?? e.status}
              <b>{e.total}</b>
            </button>
          </ItemLegendaEtapa>
        ))}
      </LegendaEtapas>

      {aberta && (
        <ProjetosDaEtapa>
          <EmptyText>
            {aberta.total} em {(ROTULO_STATUS[aberta.status] ?? aberta.status).toLowerCase()}
          </EmptyText>
          <ConteudoPaginado estado={lista}>
            <ListaSimples>
              {lista.visiveis.map((p) => (
                <ItemLista key={p.id}>
                  {/* Sem o link o clique vira beco sem saída: mostra os nomes e
                      não deixa chegar a nenhum deles. */}
                  <LinkProjeto to={`/projetos/${p.id}`}>{p.nome}</LinkProjeto>
                </ItemLista>
              ))}
            </ListaSimples>
</ConteudoPaginado>
          <Paginacao estado={lista} />
        </ProjetosDaEtapa>
      )}
    </div>
  );
}

export default PizzaEtapas;
