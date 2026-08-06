import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { pode } from "@/utils/permissoes";
import {
  CORES_STATUS,
  excluirJustificativaAtraso,
  excluirRemarcacaoBanca,
  formatarDataHora,
  getHistoricoProjeto,
  ROTULO_MOTIVO_ATRASO,
  ROTULO_STATUS,
} from "@/lib/projetos";
import { tonsDaColuna } from "@/lib/colunas-tarefa";
import { ConfirmarModal } from "@/components/ConfirmarModal";
import type {
  HistoricoEntrada,
  JustificativaAtrasoHistorico,
  RemarcacaoBancaHistorico,
  StatusHistorico,
} from "@/types/projeto";
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
  HistoricoDiaGrupo,
  HistoricoExcluirBtn,
  HistoricoDiaTitulo,
  HistoricoFiltroGrupo,
  HistoricoFiltroLabel,
  HistoricoFiltroPill,
  HistoricoFiltroPills,
  HistoricoFiltrosCard,
  HistoricoGrid,
  HistoricoLimparFiltros,
  HistoricoLinha,
  HistoricoLinhas,
  HistoricoLinhaMeta,
  HistoricoLinhaTransicao,
  HistoricoNotaCabecalho,
  HistoricoNotaLinha,
  HistoricoNotaMotivo,
  HistoricoNotaMotivoTag,
  HistoricoNotaTag,
  HistoricoNotaTexto,
  HistoricoResumoBarraFill,
  HistoricoResumoBarraTrilha,
  HistoricoResumoCabecalho,
  HistoricoResumoLinha,
  HistoricoResumoLista,
  HistoricoResumoNome,
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

function ehStatus(h: HistoricoEntrada): h is StatusHistorico {
  return h.tipo === "status";
}

/** Quem registrou a linha, seja transição de status ou nota de atraso. */
function autorDe(h: HistoricoEntrada): number | null {
  return ehStatus(h) ? h.alterado_por : h.registrado_por;
}

/**
 * Status (F4) e justificativa de atraso (§7.4) na mesma linha do tempo.
 * Reajustes de cronograma e remarcações de banca entram aqui na F11.
 */
export function ProjetoHistorico() {
  const { projeto, usuarios } = useProjeto();
  const { token, usuario } = useAuth();
  const location = useLocation();
  const [historico, setHistorico] = useState<HistoricoEntrada[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  // Mesma trava de quem registra (§7.4/§5.6) — não é edição de rotina, é
  // pra corrigir engano/teste.
  const podeExcluir = pode(usuario, "registrar_justificativa_atraso");
  const [excluindo, setExcluindo] = useState<
    JustificativaAtrasoHistorico | RemarcacaoBancaHistorico | null
  >(null);

  // Quem acabou de justificar um atraso (ou remarcar uma banca) chega aqui
  // via `#justificativa-7`/`#remarcacao-3` — sem isso a pessoa caía no topo
  // da lista inteira e tinha que procurar a nota que acabou de escrever.
  const [realcado, setRealcado] = useState<string | null>(null);
  const jaRolouRef = useRef(false);
  useEffect(() => {
    if (carregando || jaRolouRef.current) return;
    const alvo = location.hash.replace("#", "");
    if (!alvo) return;
    jaRolouRef.current = true;
    const elemento = document.getElementById(alvo);
    if (!elemento) return;
    elemento.scrollIntoView({ behavior: "smooth", block: "center" });
    setRealcado(alvo);
    const t = setTimeout(() => setRealcado(null), 1800);
    return () => clearTimeout(t);
  }, [carregando, location.hash]);

  const [statusFiltro, setStatusFiltro] = useState<Set<StatusProjeto>>(new Set());
  const [autorFiltro, setAutorFiltro] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

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

  async function excluir(linha: JustificativaAtrasoHistorico | RemarcacaoBancaHistorico) {
    if (!token) return;
    if (linha.tipo === "justificativa_atraso") {
      await excluirJustificativaAtraso(projeto.id, linha.id, token);
    } else {
      await excluirRemarcacaoBanca(projeto.id, linha.id, token);
    }
    // No sucesso quem chamou desmonta o ConfirmarModal (ver o próprio
    // componente) — precisa fechar aqui antes de recarregar.
    setExcluindo(null);
    await carregar();
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
  const historicoStatus = useMemo(() => historico.filter(ehStatus), [historico]);

  const resumoPorStatus = useMemo(() => {
    if (historicoStatus.length === 0) return [];
    const ascendente = [...historicoStatus].sort((a, b) => a.alterado_em.localeCompare(b.alterado_em));
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
  }, [historicoStatus]);

  const statusPresentes = useMemo(
    () => [...new Set(historicoStatus.map((h) => h.status_novo))].sort(
      (a, b) => (resumoPorStatus.find((r) => r.status === a)?.ms ?? 0) < (resumoPorStatus.find((r) => r.status === b)?.ms ?? 0) ? 1 : -1,
    ),
    [historicoStatus, resumoPorStatus],
  );

  const autoresPresentes = useMemo(() => {
    const ids = [...new Set(historico.map(autorDe).filter((id): id is number => id !== null))];
    return ids.sort((a, b) => nomeUsuario(a).localeCompare(nomeUsuario(b), "pt-BR"));
  }, [historico, usuarios]);

  const temAutomatico = historicoStatus.some((h) => h.alterado_por === null);

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
  }

  const filtroAtivo = statusFiltro.size > 0 || autorFiltro !== "" || dataInicio !== "" || dataFim !== "";

  const historicoFiltrado = useMemo(() => {
    return historico.filter((linha) => {
      // O filtro de status pinta as PÍLULAS de transição — uma nota de
      // atraso não tem status, então fica de fora só se o usuário estiver
      // filtrando por status (senão ela sempre aparece).
      if (statusFiltro.size > 0 && (!ehStatus(linha) || !statusFiltro.has(linha.status_novo))) return false;
      const autor = autorDe(linha);
      if (autorFiltro === "automatico" && autor !== null) return false;
      if (autorFiltro && autorFiltro !== "automatico" && String(autor) !== autorFiltro) return false;
      const dia = chaveDia(linha.alterado_em);
      if (dataInicio && dia < dataInicio) return false;
      if (dataFim && dia > dataFim) return false;
      return true;
    });
  }, [historico, statusFiltro, autorFiltro, dataInicio, dataFim]);

  const gruposPorDia = useMemo(() => {
    const ordenado = [...historicoFiltrado].sort((a, b) => b.alterado_em.localeCompare(a.alterado_em));
    const grupos = new Map<string, HistoricoEntrada[]>();
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
              <HistoricoFiltroLabel htmlFor="historico-data-inicio">De</HistoricoFiltroLabel>
              <FieldInput
                id="historico-data-inicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </HistoricoFiltroGrupo>

            <HistoricoFiltroGrupo>
              <HistoricoFiltroLabel htmlFor="historico-data-fim">Até</HistoricoFiltroLabel>
              <FieldInput
                id="historico-data-fim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
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
            gruposPorDia.map(([dia, linhas]) => (
              <HistoricoDiaGrupo key={dia}>
                <HistoricoDiaTitulo>{rotuloDia(linhas[0].alterado_em)}</HistoricoDiaTitulo>
                <HistoricoLinhas>
                  {linhas.map((linha) => {
                    if (linha.tipo === "justificativa_atraso") {
                      const escopo = projeto.escopos.find((e) => e.id === linha.projeto_escopo_id);
                      const idAncora = `justificativa-${linha.id}`;
                      return (
                        <HistoricoLinha
                          key={idAncora}
                          id={idAncora}
                          $destaque
                          $realcado={realcado === idAncora}
                        >
                          <HistoricoNotaLinha>
                            <HistoricoNotaCabecalho>
                              <HistoricoNotaTag>Justificativa de Atraso</HistoricoNotaTag>
                              {linha.motivo_tipo && (
                                <HistoricoNotaMotivoTag>
                                  {ROTULO_MOTIVO_ATRASO[linha.motivo_tipo] ?? linha.motivo_tipo}
                                </HistoricoNotaMotivoTag>
                              )}
                              {escopo && <HistoricoNotaMotivo>{escopo.nome}</HistoricoNotaMotivo>}
                            </HistoricoNotaCabecalho>
                            <HistoricoNotaTexto>{linha.texto}</HistoricoNotaTexto>
                          </HistoricoNotaLinha>
                          <HistoricoLinhaMeta>
                            <HistoricoAutorChip>{nomeUsuario(linha.registrado_por)}</HistoricoAutorChip>
                            <span>{formatarDataHora(linha.alterado_em)}</span>
                            {podeExcluir && (
                              <HistoricoExcluirBtn type="button" onClick={() => setExcluindo(linha)}>
                                Excluir
                              </HistoricoExcluirBtn>
                            )}
                          </HistoricoLinhaMeta>
                        </HistoricoLinha>
                      );
                    }

                    if (linha.tipo === "remarcacao_banca") {
                      const escopo = projeto.escopos.find((e) => e.id === linha.projeto_escopo_id);
                      const idAncora = `remarcacao-${linha.id}`;
                      return (
                        <HistoricoLinha
                          key={idAncora}
                          id={idAncora}
                          $destaque
                          $realcado={realcado === idAncora}
                        >
                          <HistoricoNotaLinha>
                            <HistoricoNotaCabecalho>
                              <HistoricoNotaTag>Remarcação de Banca</HistoricoNotaTag>
                              {escopo && <HistoricoNotaMotivo>{escopo.nome}</HistoricoNotaMotivo>}
                              <HistoricoNotaMotivo>
                                {formatarDataHora(linha.data_anterior)} → {formatarDataHora(linha.data_nova)}
                              </HistoricoNotaMotivo>
                            </HistoricoNotaCabecalho>
                            <HistoricoNotaTexto>{linha.justificativa}</HistoricoNotaTexto>
                          </HistoricoNotaLinha>
                          <HistoricoLinhaMeta>
                            <HistoricoAutorChip>{nomeUsuario(linha.registrado_por)}</HistoricoAutorChip>
                            <span>{formatarDataHora(linha.alterado_em)}</span>
                            {podeExcluir && (
                              <HistoricoExcluirBtn type="button" onClick={() => setExcluindo(linha)}>
                                Excluir
                              </HistoricoExcluirBtn>
                            )}
                          </HistoricoLinhaMeta>
                        </HistoricoLinha>
                      );
                    }

                    const tonsNovo = tonsDaColuna(CORES_STATUS[linha.status_novo]);
                    return (
                      <HistoricoLinha key={`status-${linha.id}`}>
                        <HistoricoLinhaTransicao>
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
                        </HistoricoLinhaTransicao>
                        <HistoricoLinhaMeta>
                          <HistoricoAutorChip>
                            {linha.alterado_por ? nomeUsuario(linha.alterado_por) : "🤖 automático"}
                          </HistoricoAutorChip>
                          <span>{formatarDataHora(linha.alterado_em)}</span>
                        </HistoricoLinhaMeta>
                      </HistoricoLinha>
                    );
                  })}
                </HistoricoLinhas>
              </HistoricoDiaGrupo>
            ))
          )}
        </PageStack>
      </HistoricoGrid>

      {excluindo && (
        <ConfirmarModal
          titulo={excluindo.tipo === "justificativa_atraso" ? "Excluir justificativa" : "Excluir remarcação"}
          mensagem="Isso apaga o registro do histórico do projeto. Não dá pra desfazer."
          onConfirmar={() => excluir(excluindo)}
          onCancelar={() => setExcluindo(null)}
        />
      )}
    </PageStack>
  );
}
