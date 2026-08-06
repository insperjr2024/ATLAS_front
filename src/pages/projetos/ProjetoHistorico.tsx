import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { theme } from "@/styles/theme";
import { CORES_STATUS, formatarDataHora, getHistoricoProjeto, ROTULO_STATUS } from "@/lib/projetos";
import { tonsDaColuna } from "@/lib/colunas-tarefa";
import type { StatusHistorico } from "@/types/projeto";
import type { StatusProjeto } from "@/types/projeto";
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
import { Ponto, ColunaPilula } from "@/components/kanban/Kanban.styled";
import { FieldSelect } from "@/pages/Bancas.styled";
import {
  FieldInput,
  HistoricoAutorChip,
  HistoricoFiltroGrupo,
  HistoricoFiltroLabel,
  HistoricoFiltroPill,
  HistoricoFiltroPills,
  HistoricoFiltrosCard,
  HistoricoGrid,
  HistoricoLimparFiltros,
  HistoricoPeriodoPills,
  HistoricoResumoBarraFill,
  HistoricoResumoBarraTrilha,
  HistoricoResumoCabecalho,
  HistoricoResumoLinha,
  HistoricoResumoLista,
  HistoricoResumoNome,
  HistoricoTimeline,
  HistoricoTimelineConteudo,
  HistoricoTimelineDiaTitulo,
  HistoricoTimelineItem,
  HistoricoTimelineMeta,
  HistoricoTimelinePonto,
  HistoricoTimelineTransicao,
  HistoricoTimelineTrilho,
} from "./Projetos.styled";
import { useProjeto } from "./ProjetoPage";

function formatarDuracao(ms: number): string {
  const dias = Math.floor(ms / 86_400_000);
  if (dias >= 1) return `${dias} ${dias === 1 ? "dia" : "dias"}`;
  const horas = Math.floor(ms / 3_600_000);
  if (horas >= 1) return `${horas}h`;
  const minutos = Math.max(1, Math.floor(ms / 60_000));
  return `${minutos}min`;
}

function rotuloDia(iso: string): string {
  const data = new Date(iso);
  return data.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
}

function chaveDia(iso: string): string {
  return iso.slice(0, 10);
}

/** Timeline vertical das mudanças de status do projeto, com resumo de tempo
 *  por etapa e filtros por status/autor/período. */
export function ProjetoHistorico() {
  const { projeto, usuarios } = useProjeto();
  const { token } = useAuth();
  const [historico, setHistorico] = useState<StatusHistorico[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [statusFiltro, setStatusFiltro] = useState<Set<StatusProjeto>>(new Set());
  const [autorFiltro, setAutorFiltro] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  /** Qual pill de período rápido está ativa — `null` quando as datas vieram
   *  de edição manual (ou não há filtro), pra não marcar um pill errado. */
  const [periodoRapido, setPeriodoRapido] = useState<number | null>(null);

  async function carregar() {
    if (!token) return;
    setCarregando(true);
    setErro("");
    try {
      setHistorico(await getHistoricoProjeto(projeto.id, token));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar o histórico");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, projeto.id]);

  const nomeUsuario = (id: number) => usuarios.find((u) => u.id === id)?.nome ?? `Usuário ${id}`;

  // Cada linha marca a entrada num status — "quanto tempo ficou" é a
  // distância até a PRÓXIMA linha (ou até agora, pra quem está vigente).
  // Soma por status pra dar conta de quem visitou a mesma etapa mais de
  // uma vez (voltou e avançou de novo).
  const resumoPorStatus = useMemo(() => {
    if (historico.length === 0) return [];
    const ascendente = [...historico].sort((a, b) => a.alterado_em.localeCompare(b.alterado_em));
    const duracoes = new Map<StatusProjeto, number>();
    for (let i = 0; i < ascendente.length; i++) {
      const inicio = new Date(ascendente[i].alterado_em).getTime();
      const fim =
        i + 1 < ascendente.length ? new Date(ascendente[i + 1].alterado_em).getTime() : Date.now();
      const status = ascendente[i].status_novo;
      duracoes.set(status, (duracoes.get(status) ?? 0) + Math.max(0, fim - inicio));
    }
    const total = [...duracoes.values()].reduce((soma, ms) => soma + ms, 0) || 1;
    return [...duracoes.entries()]
      .map(([status, ms]) => ({ status, ms, percent: (ms / total) * 100 }))
      .sort((a, b) => b.ms - a.ms);
  }, [historico]);

  const statusPresentes = useMemo(
    () => [...new Set(historico.map((h) => h.status_novo))].sort(
      (a, b) => (resumoPorStatus.find((r) => r.status === a)?.ms ?? 0) < (resumoPorStatus.find((r) => r.status === b)?.ms ?? 0) ? 1 : -1,
    ),
    [historico, resumoPorStatus],
  );

  const autoresPresentes = useMemo(() => {
    const ids = [...new Set(historico.map((h) => h.alterado_por).filter((id): id is number => id !== null))];
    return ids.sort((a, b) => nomeUsuario(a).localeCompare(nomeUsuario(b), "pt-BR"));
  }, [historico, usuarios]);

  const temAutomatico = historico.some((h) => h.alterado_por === null);

  function alternarStatusFiltro(status: StatusProjeto) {
    setStatusFiltro((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(status)) proximo.delete(status);
      else proximo.add(status);
      return proximo;
    });
  }

  function limparFiltros() {
    setStatusFiltro(new Set());
    setAutorFiltro("");
    setDataInicio("");
    setDataFim("");
    setPeriodoRapido(null);
  }

  // Atalho pros recortes de data mais pedidos — sem isso, "só a última
  // semana" exigia calcular a data de cabeça e digitar nos dois campos.
  function aplicarPeriodoRapido(dias: number) {
    const fim = new Date();
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - dias);
    setDataInicio(inicio.toISOString().slice(0, 10));
    setDataFim(fim.toISOString().slice(0, 10));
    setPeriodoRapido(dias);
  }

  function editarDataManual(campo: "inicio" | "fim", valor: string) {
    setPeriodoRapido(null);
    if (campo === "inicio") setDataInicio(valor);
    else setDataFim(valor);
  }

  const filtroAtivo = statusFiltro.size > 0 || autorFiltro !== "" || dataInicio !== "" || dataFim !== "";

  const historicoFiltrado = useMemo(() => {
    return historico.filter((linha) => {
      if (statusFiltro.size > 0 && !statusFiltro.has(linha.status_novo)) return false;
      if (autorFiltro === "automatico" && linha.alterado_por !== null) return false;
      if (autorFiltro && autorFiltro !== "automatico" && String(linha.alterado_por) !== autorFiltro) return false;
      const dia = chaveDia(linha.alterado_em);
      if (dataInicio && dia < dataInicio) return false;
      if (dataFim && dia > dataFim) return false;
      return true;
    });
  }, [historico, statusFiltro, autorFiltro, dataInicio, dataFim]);

  const gruposPorDia = useMemo(() => {
    const ordenado = [...historicoFiltrado].sort((a, b) => b.alterado_em.localeCompare(a.alterado_em));
    const grupos = new Map<string, StatusHistorico[]>();
    for (const linha of ordenado) {
      const chave = chaveDia(linha.alterado_em);
      const lista = grupos.get(chave) ?? [];
      lista.push(linha);
      grupos.set(chave, lista);
    }
    return [...grupos.entries()];
  }, [historicoFiltrado]);

  if (erro) {
    return (
      <ErrorBlock>
        <ErrorText>Não foi possível carregar o histórico: {erro}</ErrorText>
        <PageButton $variant="outline" onClick={carregar}>
          Tentar novamente
        </PageButton>
      </ErrorBlock>
    );
  }

  if (carregando) return <PageLoadingBlock />;

  if (historico.length === 0) {
    return (
      <PageCard>
        <PageCardHeader>
          <PageCardTitle>Mudanças de status</PageCardTitle>
        </PageCardHeader>
        <PageCardContent>
          <EmptyText>Nenhuma mudança registrada.</EmptyText>
        </PageCardContent>
      </PageCard>
    );
  }

  return (
    <PageStack>
      <HistoricoGrid>
        <PageCard>
          <PageCardHeader>
            <PageCardTitle>Tempo por etapa</PageCardTitle>
          </PageCardHeader>
          <PageCardContent>
            <HistoricoResumoLista>
              {resumoPorStatus.map(({ status, ms, percent }) => {
                const tons = tonsDaColuna(CORES_STATUS[status]);
                return (
                  <HistoricoResumoLinha key={status}>
                    <HistoricoResumoCabecalho>
                      <HistoricoResumoNome>
                        <Ponto $cor={tons.ponto} />
                        {ROTULO_STATUS[status]}
                      </HistoricoResumoNome>
                      <span>{formatarDuracao(ms)}</span>
                    </HistoricoResumoCabecalho>
                    <HistoricoResumoBarraTrilha>
                      <HistoricoResumoBarraFill $percent={percent} $cor={tons.ponto} />
                    </HistoricoResumoBarraTrilha>
                  </HistoricoResumoLinha>
                );
              })}
            </HistoricoResumoLista>
          </PageCardContent>
        </PageCard>

        <PageStack>
          <HistoricoFiltrosCard>
            <HistoricoFiltroGrupo style={{ flex: 1 }}>
              <HistoricoFiltroLabel>Etapa</HistoricoFiltroLabel>
              <HistoricoFiltroPills>
                {statusPresentes.map((status) => {
                  const tons = tonsDaColuna(CORES_STATUS[status]);
                  return (
                    <HistoricoFiltroPill
                      key={status}
                      type="button"
                      $ativo={statusFiltro.has(status)}
                      $cor={tons.ponto}
                      onClick={() => alternarStatusFiltro(status)}
                    >
                      <Ponto $cor={tons.ponto} />
                      {ROTULO_STATUS[status]}
                    </HistoricoFiltroPill>
                  );
                })}
              </HistoricoFiltroPills>
            </HistoricoFiltroGrupo>

            <HistoricoFiltroGrupo>
              <HistoricoFiltroLabel htmlFor="historico-autor">Quem alterou</HistoricoFiltroLabel>
              <FieldSelect id="historico-autor" value={autorFiltro} onChange={(e) => setAutorFiltro(e.target.value)}>
                <option value="">Todo mundo</option>
                {autoresPresentes.map((id) => (
                  <option key={id} value={id}>
                    {nomeUsuario(id)}
                  </option>
                ))}
                {temAutomatico && <option value="automatico">🤖 Automático</option>}
              </FieldSelect>
            </HistoricoFiltroGrupo>

            <HistoricoFiltroGrupo>
              <HistoricoFiltroLabel>Período</HistoricoFiltroLabel>
              <HistoricoPeriodoPills>
                {[7, 30, 90].map((dias) => (
                  <HistoricoFiltroPill
                    key={dias}
                    type="button"
                    $ativo={periodoRapido === dias}
                    $cor={theme.colors.primary}
                    onClick={() => aplicarPeriodoRapido(dias)}
                  >
                    {dias} dias
                  </HistoricoFiltroPill>
                ))}
              </HistoricoPeriodoPills>
            </HistoricoFiltroGrupo>

            <HistoricoFiltroGrupo>
              <HistoricoFiltroLabel htmlFor="historico-data-inicio">De</HistoricoFiltroLabel>
              <FieldInput
                id="historico-data-inicio"
                type="date"
                value={dataInicio}
                onChange={(e) => editarDataManual("inicio", e.target.value)}
              />
            </HistoricoFiltroGrupo>

            <HistoricoFiltroGrupo>
              <HistoricoFiltroLabel htmlFor="historico-data-fim">Até</HistoricoFiltroLabel>
              <FieldInput
                id="historico-data-fim"
                type="date"
                value={dataFim}
                onChange={(e) => editarDataManual("fim", e.target.value)}
              />
            </HistoricoFiltroGrupo>

            {filtroAtivo && (
              <HistoricoLimparFiltros type="button" onClick={limparFiltros}>
                Limpar filtros
              </HistoricoLimparFiltros>
            )}
          </HistoricoFiltrosCard>

          {historicoFiltrado.length === 0 ? (
            <PageCard>
              <PageCardContent>
                <EmptyText>Nenhuma mudança bate com esses filtros.</EmptyText>
              </PageCardContent>
            </PageCard>
          ) : (
            <HistoricoTimeline>
              {gruposPorDia.map(([dia, linhas], indiceGrupo) => (
                <div key={dia}>
                  <HistoricoTimelineDiaTitulo>{rotuloDia(linhas[0].alterado_em)}</HistoricoTimelineDiaTitulo>
                  {linhas.map((linha, indiceLinha) => {
                    const tonsNovo = tonsDaColuna(CORES_STATUS[linha.status_novo]);
                    const ultimo =
                      indiceGrupo === gruposPorDia.length - 1 && indiceLinha === linhas.length - 1;
                    return (
                      <HistoricoTimelineItem key={linha.id}>
                        <HistoricoTimelineTrilho $ultimo={ultimo}>
                          <HistoricoTimelinePonto $cor={tonsNovo.ponto} />
                        </HistoricoTimelineTrilho>
                        <HistoricoTimelineConteudo>
                          <HistoricoTimelineTransicao>
                            {linha.status_anterior && (
                              <>
                                <ColunaPilula $cor={tonsDaColuna(CORES_STATUS[linha.status_anterior])}>
                                  <Ponto $cor={tonsDaColuna(CORES_STATUS[linha.status_anterior]).ponto} />
                                  {ROTULO_STATUS[linha.status_anterior]}
                                </ColunaPilula>
                                <span>→</span>
                              </>
                            )}
                            <ColunaPilula $cor={tonsNovo}>
                              <Ponto $cor={tonsNovo.ponto} />
                              {ROTULO_STATUS[linha.status_novo]}
                            </ColunaPilula>
                            {!linha.status_anterior && <span>· projeto criado</span>}
                          </HistoricoTimelineTransicao>
                          <HistoricoTimelineMeta>
                            <HistoricoAutorChip>
                              {linha.alterado_por ? nomeUsuario(linha.alterado_por) : "🤖 automático"}
                            </HistoricoAutorChip>
                            <span>{formatarDataHora(linha.alterado_em)}</span>
                          </HistoricoTimelineMeta>
                        </HistoricoTimelineConteudo>
                      </HistoricoTimelineItem>
                    );
                  })}
                </div>
              ))}
            </HistoricoTimeline>
          )}
        </PageStack>
      </HistoricoGrid>
    </PageStack>
  );
}
