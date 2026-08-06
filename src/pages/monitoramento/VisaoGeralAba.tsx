import { lazy, Suspense, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getVisaoGeral, type VisaoGeral } from "@/lib/monitoramento";
import { formatarData, formatarDataHora } from "@/lib/projetos";

// Sob demanda: o recharts pesa ~450KB num bundle que já está acima do limite
// de aviso do Vite, e os gráficos só existem dentro do monitoramento.
const PizzaEtapas = lazy(() => import("./PizzaEtapas"));
import {
  PageStack,
  PageCard,
  PageCardHeader,
  PageCardTitle,
  PageCardContent,
  PageButton,
  PageLoadingBlock,
  ErrorBlock,
  ErrorText,
  EmptyText,
} from "@/styles/page.styled";
import {
  GraficoTendencia,
  ItemAtencao,
  ItemLista,
  KpiCard,
  KpiGrid,
  KpiNota,
  KpiRotulo,
  KpiValor,
  LinkProjeto,
  ListaSimples,
  PainelGrid,
  Pilula,
  SparkBarra,
  SparkColuna,
  SparkRotulos,
  Sparkline,
  type NivelSeveridade,
} from "./Monitoramento.styled";
import { useMonitoramento } from "./MonitoramentoLayout";

/** Itens sem contagem de dias (kickoff não marcado, sem reunião na semana) não
 *  são menos importantes — só não têm magnitude. Ficam no degrau do meio em
 *  vez de fingir gravidade que não foi medida. */
function nivelAtencao(dias: number | null): NivelSeveridade {
  if (dias == null) return "media";
  if (dias > 10) return "critica";
  if (dias > 3) return "media";
  return "leve";
}

export function VisaoGeralAba() {
  const { token } = useAuth();
  const { frenteId } = useMonitoramento();
  const [dados, setDados] = useState<VisaoGeral | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregar() {
    if (!token) return;
    setCarregando(true);
    setErro("");
    try {
      setDados(await getVisaoGeral(token, frenteId));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar o monitoramento");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, frenteId]);

  if (erro) {
    return (
      <ErrorBlock>
        <ErrorText>{erro}</ErrorText>
        <PageButton $variant="outline" onClick={carregar}>
          Tentar novamente
        </PageButton>
      </ErrorBlock>
    );
  }

  if (carregando || !dados) return <PageLoadingBlock />;

  const maxTendencia = Math.max(1, ...dados.entregas.tendencia.map((t) => t.total));

  return (
    <PageStack>
      <KpiGrid>
        <KpiCard>
          <KpiValor>{dados.kpis.total}</KpiValor>
          <KpiRotulo>Projetos</KpiRotulo>
        </KpiCard>
        <KpiCard>
          <KpiValor>{dados.kpis.em_execucao}</KpiValor>
          <KpiRotulo>Em execução</KpiRotulo>
        </KpiCard>
        <KpiCard>
          <KpiValor>{dados.kpis.perto_de_finalizar}</KpiValor>
          <KpiRotulo>Perto de finalizar</KpiRotulo>
        </KpiCard>
        <KpiCard $destaque={dados.kpis.atrasados > 0 ? "alerta" : undefined}>
          {/* Percentual como valor grande, contagem na nota — mesmo formato do
              placar ao lado. Os dois medem a MESMA população (`em_curso`), mas
              coisas diferentes: o placar só olha banca, este olha qualquer
              motivo. `100 - placar` não dá este número, e é por isso que os
              rótulos precisam ser explícitos. */}
          <KpiValor $destaque={dados.kpis.atrasados > 0 ? "alerta" : undefined}>
            {dados.atrasados_gestao.percentual}%
          </KpiValor>
          <KpiRotulo>Atrasados</KpiRotulo>
          <KpiNota>
            {dados.atrasados_gestao.atrasados}/{dados.atrasados_gestao.total_ativos} com algum
            atraso
          </KpiNota>
        </KpiCard>
        <KpiCard>
          {/* O placar da gestão: só as bancas contam — a entrega ao cliente
              depende da agenda dele e é acompanhada à parte (§7.1). */}
          <KpiValor $destaque={dados.placar_gestao.percentual >= 80 ? "ok" : "alerta"}>
            {dados.placar_gestao.percentual}%
          </KpiValor>
          <KpiRotulo>Placar da gestão</KpiRotulo>
          <KpiNota>
            {dados.placar_gestao.no_prazo}/{dados.placar_gestao.total_ativos} com bancas em dia
          </KpiNota>
        </KpiCard>
      </KpiGrid>

      <PainelGrid>
        <PageCard>
          <PageCardHeader>
            <PageCardTitle>Projetos por etapa</PageCardTitle>
          </PageCardHeader>
          <PageCardContent>
            {/* Sob demanda: o recharts pesa ~450KB e só é usado aqui e na
                Alocação — quem abre o login não tem por que pagar por ele. */}
            <Suspense fallback={<PageLoadingBlock />}>
              <PizzaEtapas etapas={dados.por_etapa} />
            </Suspense>
          </PageCardContent>
        </PageCard>

        <PageCard>
          <PageCardHeader>
            <PageCardTitle>
              Entregas na gestão · {dados.entregas.total_escopos} escopos
            </PageCardTitle>
          </PageCardHeader>
          <PageCardContent>
            {dados.entregas.recentes.length === 0 ? (
              <EmptyText>Nenhuma entrega registrada na gestão atual.</EmptyText>
            ) : (
              <ListaSimples>
                {dados.entregas.recentes.map((e, i) => (
                  <ItemLista key={i}>
                    <span>
                      {e.projeto_nome} · {e.escopo}
                    </span>
                    <small>
                      {formatarData(e.data)}{" "}
                      <Pilula $tom={e.no_prazo ? "ok" : "alerta"}>
                        {e.no_prazo ? "no prazo" : "atrasada"}
                      </Pilula>
                    </small>
                  </ItemLista>
                ))}
              </ListaSimples>
            )}
            {/* Sem esse guard a tela QUEBRA quando não há tendência: o
                `tendencia[0]?.inicio` vira `undefined`, a data sai
                `"undefinedT12:00:00"` e o `format` do date-fns lança
                `RangeError: Invalid time value` em vez de renderizar. */}
            {dados.entregas.tendencia.length > 0 && (
              <GraficoTendencia>
                <Sparkline>
                  {dados.entregas.tendencia.map((t) => (
                    /* O alvo do hover é a COLUNA inteira, não a barra: numa
                       semana sem entrega a barra tem 2px e o `title` com o
                       total nunca aparece justo onde precisa explicar. */
                    <SparkColuna key={t.inicio} title={`${formatarData(t.inicio)}: ${t.total} entrega(s)`}>
                      <SparkBarra $altura={(t.total / maxTendencia) * 100} />
                    </SparkColuna>
                  ))}
                </Sparkline>
                <SparkRotulos>
                  <span>{formatarData(dados.entregas.tendencia[0].inicio)}</span>
                  <span>ritmo das últimas 8 semanas</span>
                  <span>hoje</span>
                </SparkRotulos>
              </GraficoTendencia>
            )}
          </PageCardContent>
        </PageCard>

        <PageCard>
          <PageCardHeader>
            <PageCardTitle>Bancas nos próximos 7 dias</PageCardTitle>
          </PageCardHeader>
          <PageCardContent>
            {dados.bancas_proximas.length === 0 ? (
              <EmptyText>Nenhuma banca agendada para a próxima semana.</EmptyText>
            ) : (
              <ListaSimples>
                {dados.bancas_proximas.map((b, i) => (
                  <ItemLista key={i}>
                    <span>
                      {b.projeto_nome} · {b.escopo}
                    </span>
                    <small>{formatarDataHora(b.data_hora)}</small>
                  </ItemLista>
                ))}
              </ListaSimples>
            )}
          </PageCardContent>
        </PageCard>

        <PageCard>
          <PageCardHeader>
            <PageCardTitle>Tempo parado entre escopos</PageCardTitle>
          </PageCardHeader>
          <PageCardContent>
            {dados.tempo_parado.length === 0 ? (
              <EmptyText>Nenhum projeto parado entre escopos.</EmptyText>
            ) : (
              <ListaSimples>
                {dados.tempo_parado.map((p) => (
                  <ItemLista key={p.projeto_id}>
                    <LinkProjeto to={`/projetos/${p.projeto_id}`}>
                      {p.projeto_nome} — entregou {p.escopo_entregue}
                    </LinkProjeto>
                    <small>há {p.dias_parado} dias</small>
                  </ItemLista>
                ))}
              </ListaSimples>
            )}
          </PageCardContent>
        </PageCard>
      </PainelGrid>

      <PageCard>
        <PageCardHeader>
          <PageCardTitle>Atenção agora ({dados.atencao_agora.length})</PageCardTitle>
        </PageCardHeader>
        <PageCardContent>
          {dados.atencao_agora.length === 0 ? (
            <EmptyText>Nada pedindo ação no momento.</EmptyText>
          ) : (
            <ListaSimples>
              {dados.atencao_agora.map((item, i) => (
                /* A cor do marcador carrega a gravidade: sem ela uma lista de
                   15 itens grita igual e a diretoria não sabe por onde começar. */
                <ItemAtencao key={i} $nivel={nivelAtencao(item.dias)}>
                  <strong>
                    <LinkProjeto to={`/projetos/${item.projeto_id}`}>{item.projeto_nome}</LinkProjeto>
                  </strong>
                  {/* O motivo vem pronto e específico do backend — §7.1 é
                      explícito que não pode ser rótulo genérico. */}
                  <span>
                    {item.motivo}
                    {item.dias != null && ` · há ${item.dias} dias`}
                  </span>
                </ItemAtencao>
              ))}
            </ListaSimples>
          )}
        </PageCardContent>
      </PageCard>
    </PageStack>
  );
}
