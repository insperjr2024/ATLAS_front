import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { theme } from "@/styles/theme";
import { pode } from "@/utils/permissoes";
import {
  CORES_STATUS,
  excluirJustificativaAtraso,
  excluirRemarcacaoBanca,
  formatarDataHora,
  getHistoricoProjeto,
  mostrarHistoricoCompleto,
  ocultarHistorico,
  paraDataUtc,
  ROTULO_MOTIVO_ATRASO,
  ROTULO_STATUS,
} from "@/lib/projetos";
import { tonsDaColuna } from "@/lib/colunas-tarefa";
import { ConfirmarModal } from "@/components/ConfirmarModal";
import { EstadoVazio } from "@/components/EstadoVazio";
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
} from "@/styles/page.styled";
import { Ponto } from "@/components/kanban/Kanban.styled";
import {
  AvisoBanner,
  StatusPilula,
  HistoricoAutorChip,
  HistoricoCarregarMais,
  HistoricoExcluirBtn,
  HistoricoResumoFaixa,
  HistoricoResumoLegenda,
  HistoricoResumoLegendaItem,
  HistoricoResumoSegmento,
  HistoricoRodape,
  HistoricoNotaCabecalho,
  HistoricoNotaLinha,
  HistoricoNotaMotivo,
  HistoricoNotaTag,
  HistoricoTipoTag,
  HistoricoAguardando,
  HistoricoNotaTexto,
  HistoricoTimeline,
  HistoricoTimelineConteudo,
  HistoricoTimelineDiaTitulo,
  HistoricoTimelineItem,
  HistoricoTimelineMeta,
  HistoricoTimelinePonto,
  HistoricoTimelineTransicao,
  HistoricoTimelineTrilho,
} from "./Projetos.styled";
import { HistoricoFiltros } from "./HistoricoFiltros";
import { useProjeto } from "./ProjetoPage";

/**
 * A etiqueta e a cor de cada natureza de evento do Histórico.
 *
 * A cor não é decoração: é a leitura rápida da timeline. Verde é o que
 * destravou (dias aprovados), vermelho o que travou ou mudou uma data
 * combinada, azul é conversa registrada, cinza é pedido ainda sem desfecho.
 * Tipo desconhecido cai num genérico em vez de sumir da tela.
 */
const APARENCIA_EVENTO: Record<string, { rotulo: string; cor: string }> = {
  pedido_de_dias: { rotulo: "Pedido de dias", cor: theme.colors.mutedForeground },
  dias_de_ajuste: { rotulo: "Dias aprovados", cor: theme.colors.success },
  // Nada de `primary` aqui: neste tema ele é o MESMO vermelho do
  // `destructive`, e "Reunião" saía com cara de alerta. `info` e `warning`
  // são as cores que dizem "informação" e "atenção" sem gritar erro.
  reuniao: { rotulo: "Reunião", cor: theme.colors.info },
  entrega_alterada: { rotulo: "Entrega", cor: theme.colors.warning },
  // A banca acontecendo é evento de peso: é ela que destrava a entrega ao
  // cliente (§5.5). Fica em `info`, e não em `success` — a linha existe tanto
  // para a banca aprovada quanto para a reprovada, e a cor não pode antecipar
  // um veredito que está escrito no detalhe.
  banca_realizada: { rotulo: "Banca", cor: theme.colors.info },
};


function formatarDuracao(ms: number): string {
  const dias = Math.floor(ms / 86_400_000);
  if (dias >= 1) return `${dias} ${dias === 1 ? "dia" : "dias"}`;
  const horas = Math.floor(ms / 3_600_000);
  if (horas >= 1) return `${horas}h`;
  const minutos = Math.max(1, Math.floor(ms / 60_000));
  return `${minutos}min`;
}

function rotuloDia(iso: string): string {
  const data = paraDataUtc(iso);
  return data.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
}

function chaveDia(iso: string): string {
  // Não é `iso.slice(0, 10)`: cortar a string pega a data em UTC, e um evento
  // entre 21h e meia-noite (horário de Brasília) cai no dia seguinte em UTC —
  // agruparia na data errada. Precisa passar pelo Date pra pegar o dia local.
  const d = paraDataUtc(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function ehStatus(h: HistoricoEntrada): h is StatusHistorico {
  return h.tipo === "status";
}

/** Quem registrou a linha, qualquer que seja o tipo.
 *
 * `alterado_por` é o único campo de autoria que TODAS as cinco fontes
 * emitem; `registrado_por` só existe em algumas. Preferir o específico e cair
 * no comum evita ter de listar as variantes aqui toda vez que nasce uma. */
function autorDe(h: HistoricoEntrada): number | null {
  if (ehStatus(h)) return h.alterado_por;
  const especifico = "registrado_por" in h ? h.registrado_por : null;
  return especifico ?? h.alterado_por ?? null;
}

/**
 * Timeline vertical das mudanças de status (F4) e notas de atraso/remarcação
 * de banca do projeto, com resumo de tempo por etapa, filtros
 * por status/autor/período, paginação por dia e "Limpar histórico".
 */
/**
 * O id NUMÉRICO de uma linha do histórico.
 *
 * O backend compõe a timeline de sete fontes e prefixa o id de cada uma para
 * as chaves não colidirem, `"justificativa:7"`, `"remarcacao:3"`,
 * `"entrega:12"`. Ótimo como chave de React, inútil como id de rota.
 *
 * Dois bugs saíram de ler o valor cru:
 *
 * - a âncora virava `#justificativa-justificativa:7`, e o link "justificado"
 *   da aba Atrasos aponta para `#justificativa-7`, a pessoa caía no topo do
 *   histórico em vez de na nota que acabou de escrever;
 * - o botão Excluir mandava `justificativa:7` para uma rota que espera `int`,
 *   e voltava 422.
 */
function idNumerico(id: number | string): number {
  return Number(String(id).split(":").pop());
}

export function ProjetoHistorico() {
  const { projeto, usuarios, recarregar } = useProjeto();
  const { token, usuario } = useAuth();
  const location = useLocation();
  const [historico, setHistorico] = useState<HistoricoEntrada[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [confirmandoLimpar, setConfirmandoLimpar] = useState(false);
  const [mostrandoTudo, setMostrandoTudo] = useState(false);
  // Mesma trava de quem registra, não é edição de rotina, é
  // pra corrigir engano/teste.
  const podeExcluir = pode(usuario, "registrar_justificativa_atraso");
  const [excluindo, setExcluindo] = useState<
    JustificativaAtrasoHistorico | RemarcacaoBancaHistorico | null
  >(null);

  // Quem acabou de justificar um atraso (ou remarcar uma banca) chega aqui
  // via `#justificativa-7`/`#remarcacao-3`, sem isso a pessoa caía no topo
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
  /** Qual pill de período rápido está ativa, `null` quando as datas vieram
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

  async function excluir(linha: JustificativaAtrasoHistorico | RemarcacaoBancaHistorico) {
    if (!token) return;
    if (linha.tipo === "justificativa_atraso") {
      await excluirJustificativaAtraso(projeto.id, idNumerico(linha.id), token);
    } else {
      await excluirRemarcacaoBanca(projeto.id, idNumerico(linha.id), token);
    }
    // No sucesso quem chamou desmonta o ConfirmarModal (ver o próprio
    // componente), precisa fechar aqui antes de recarregar.
    setExcluindo(null);
    await carregar();
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, projeto.id]);

  // "Limpar histórico" não apaga linha nenhuma, só marca o corte de
  // exibição no projeto (ver OcultarHistoricoUseCase no back). Por isso um
  // recarregar() (atualiza o projeto no contexto, pro banner aparecer) e um
  // carregar() (o back já devolve a lista filtrada pelo novo corte).
  async function limparHistorico() {
    if (!token) return;
    await ocultarHistorico(projeto.id, token);
    setConfirmandoLimpar(false);
    await Promise.all([recarregar(), carregar()]);
  }

  async function mostrarTudo() {
    if (!token) return;
    setMostrandoTudo(true);
    try {
      await mostrarHistoricoCompleto(projeto.id, token);
      await Promise.all([recarregar(), carregar()]);
    } finally {
      setMostrandoTudo(false);
    }
  }

  const nomeUsuario = (id: number) => usuarios.find((u) => u.id === id)?.nome ?? `Usuário ${id}`;

  // Cada linha marca a entrada num status, "quanto tempo ficou" é a
  // distância até a PRÓXIMA linha (ou até agora, pra quem está vigente).
  // Soma por status pra dar conta de quem visitou a mesma etapa mais de
  // uma vez (voltou e avançou de novo).
  const historicoStatus = useMemo(() => historico.filter(ehStatus), [historico]);

  const resumoPorStatus = useMemo(() => {
    if (historicoStatus.length === 0) return [];
    // `?? ""` porque a lista é composta de cinco fontes no backend, e uma
    // linha sem data derrubava a TELA INTEIRA no localeCompare. Ordenar mal
    // uma linha é um defeito; não abrir o Histórico é outro, bem maior.
    const ascendente = [...historicoStatus].sort((a, b) =>
      (a.alterado_em ?? "").localeCompare(b.alterado_em ?? ""),
    );
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
    setPeriodoRapido(null);
  }

  // Atalho pros recortes de data mais pedidos, sem isso, "só a última
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
      // O filtro de status pinta as PÍLULAS de transição, uma nota de
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
    const ordenado = [...historicoFiltrado].sort((a, b) =>
      (b.alterado_em ?? "").localeCompare(a.alterado_em ?? ""),
    );
    const grupos = new Map<string, HistoricoEntrada[]>();
    for (const linha of ordenado) {
      const chave = chaveDia(linha.alterado_em);
      const lista = grupos.get(chave) ?? [];
      lista.push(linha);
      grupos.set(chave, lista);
    }
    return [...grupos.entries()];
  }, [historicoFiltrado]);

  // A lista não vem toda de uma vez, só os dias mais recentes, com um botão
  // pra pedir mais. Sem isso, um projeto de gestões passadas vira uma
  // rolagem infinita de dias que ninguém pediu pra ver.
  const DIAS_POR_PAGINA = 10;
  const [diasVisiveis, setDiasVisiveis] = useState(DIAS_POR_PAGINA);
  useEffect(() => {
    setDiasVisiveis(DIAS_POR_PAGINA);
  }, [statusFiltro, autorFiltro, dataInicio, dataFim]);
  const gruposVisiveis = gruposPorDia.slice(0, diasVisiveis);
  const temMaisDias = gruposPorDia.length > diasVisiveis;

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
      <PageStack>
        {projeto.historico_oculto_ate && (
          <AvisoBanner>
            Histórico anterior a {formatarDataHora(projeto.historico_oculto_ate)} está oculto.
            <PageButton type="button" $variant="outline" disabled={mostrandoTudo} onClick={mostrarTudo}>
              {mostrandoTudo ? "Mostrando…" : "Mostrar tudo"}
            </PageButton>
          </AvisoBanner>
        )}
        {/* Oculto e vazio são causas diferentes, e pedem reações diferentes:
            uma se desfaz num clique ali em cima, a outra é só esperar o
            projeto andar. */}
        {projeto.historico_oculto_ate ? (
          <EstadoVazio
            causa="filtro"
            titulo="Nada à vista no histórico"
            motivo={'O corte de exibição escondeu tudo. Use "Mostrar tudo" acima para trazer de volta.'}
          />
        ) : (
          <EstadoVazio
            causa="vazio"
            titulo="Nenhuma mudança registrada"
            motivo="As mudanças de etapa, notas de atraso, bancas e reuniões deste projeto aparecem aqui conforme acontecem."
          />
        )}
      </PageStack>
    );
  }

  return (
    <PageStack>
      {projeto.historico_oculto_ate && (
        <AvisoBanner>
          Histórico anterior a {formatarDataHora(projeto.historico_oculto_ate)} está oculto.
          <PageButton type="button" $variant="outline" disabled={mostrandoTudo} onClick={mostrarTudo}>
            {mostrandoTudo ? "Mostrando…" : "Mostrar tudo"}
          </PageButton>
        </AvisoBanner>
      )}

      {/* ⭐ O resumo virou UMA faixa empilhada, horizontal, no topo. Era um
          card lateral de 320px num grid de duas colunas, e a timeline — o
          conteúdo real da aba — ficava espremida na coluna que sobrava.
          A pergunta que este bloco responde ("onde o tempo foi") é de
          proporção, e proporção se lê melhor numa faixa só. */}
      {resumoPorStatus.length > 0 && (
        <PageCard>
          <PageCardHeader>
            <PageCardTitle>Tempo por etapa</PageCardTitle>
          </PageCardHeader>
          <PageCardContent>
            <HistoricoResumoFaixa
              role="img"
              aria-label={`Tempo por etapa: ${resumoPorStatus
                .map((r) => `${ROTULO_STATUS[r.status]}, ${formatarDuracao(r.ms)}`)
                .join("; ")}`}
            >
              {resumoPorStatus.map(({ status, percent }) => (
                <HistoricoResumoSegmento
                  key={status}
                  $percent={percent}
                  $cor={tonsDaColuna(CORES_STATUS[status]).ponto}
                  title={`${ROTULO_STATUS[status]} · ${Math.round(percent)}%`}
                />
              ))}
            </HistoricoResumoFaixa>
            {/* ⚠ A legenda não é enfeite: é ela que carrega nome e duração.
                A faixa sozinha diria tudo por cor, e cor não pode ser o
                único indicador. */}
            <HistoricoResumoLegenda>
              {resumoPorStatus.map(({ status, ms }) => (
                <HistoricoResumoLegendaItem key={status}>
                  <Ponto $cor={tonsDaColuna(CORES_STATUS[status]).ponto} />
                  <strong>{ROTULO_STATUS[status]}</strong>
                  {formatarDuracao(ms)}
                </HistoricoResumoLegendaItem>
              ))}
            </HistoricoResumoLegenda>
          </PageCardContent>
        </PageCard>
      )}

      <div>
        <HistoricoFiltros
          statusPresentes={statusPresentes}
          statusFiltro={statusFiltro}
          onAlternarStatus={alternarStatusFiltro}
          autoresPresentes={autoresPresentes}
          nomeUsuario={nomeUsuario}
          temAutomatico={temAutomatico}
          autorFiltro={autorFiltro}
          onAutorFiltro={setAutorFiltro}
          periodoRapido={periodoRapido}
          onPeriodoRapido={aplicarPeriodoRapido}
          dataInicio={dataInicio}
          dataFim={dataFim}
          onDataManual={editarDataManual}
          filtroAtivo={filtroAtivo}
          onLimpar={limparFiltros}
        />

        {historicoFiltrado.length === 0 ? (
          <EstadoVazio
            causa="filtro"
            titulo="Nenhuma mudança bate com esses filtros"
            motivo={'O histórico tem registros, o recorte atual é que não alcança nenhum. Use "Limpar filtros" acima para ver tudo de novo.'}
          />
        ) : (
            <HistoricoTimeline>
              {gruposVisiveis.map(([dia, linhas], indiceGrupo) => (
                <div key={dia}>
                  <HistoricoTimelineDiaTitulo>{rotuloDia(linhas[0].alterado_em)}</HistoricoTimelineDiaTitulo>
                  {linhas.map((linha, indiceLinha) => {
                    const ultimo =
                      !temMaisDias &&
                      indiceGrupo === gruposVisiveis.length - 1 &&
                      indiceLinha === linhas.length - 1;

                    if (linha.tipo === "justificativa_atraso") {
                      const escopo = projeto.escopos.find((e) => e.id === linha.projeto_escopo_id);
                      const idAncora = `justificativa-${idNumerico(linha.id)}`;
                      return (
                        <HistoricoTimelineItem key={idAncora}>
                          <HistoricoTimelineTrilho $ultimo={ultimo}>
                            <HistoricoTimelinePonto $cor={theme.colors.mutedForeground} />
                          </HistoricoTimelineTrilho>
                          <HistoricoTimelineConteudo
                            id={idAncora}
                            $destaque
                            $realcado={realcado === idAncora}
                          >
                            <HistoricoNotaLinha>
                              <HistoricoNotaCabecalho>
                                <HistoricoNotaTag>Justificativa de Atraso</HistoricoNotaTag>
                                {(linha.motivo_tipo || escopo) && (
                                  <HistoricoNotaMotivo>
                                    {[
                                      linha.motivo_tipo
                                        ? (ROTULO_MOTIVO_ATRASO[linha.motivo_tipo] ?? linha.motivo_tipo)
                                        : null,
                                      escopo?.nome ?? null,
                                    ]
                                      .filter(Boolean)
                                      .join(" · ")}
                                  </HistoricoNotaMotivo>
                                )}
                              </HistoricoNotaCabecalho>
                              {/* `detalhe`, não `texto`. O backend unificou as
                                  cinco fontes do histórico num envelope com
                                  `titulo`/`detalhe` prontos; o campo `texto`
                                  parou de ser enviado e esta linha renderizava
                                  `undefined`, a nota aparecia com autor e data,
                                  mas SEM o motivo escrito. */}
                              <HistoricoNotaTexto>{linha.detalhe}</HistoricoNotaTexto>
                            </HistoricoNotaLinha>
                            <HistoricoTimelineMeta>
                              <HistoricoAutorChip>{nomeUsuario(linha.registrado_por)}</HistoricoAutorChip>
                              <span>{formatarDataHora(linha.alterado_em)}</span>
                              {podeExcluir && (
                                <HistoricoExcluirBtn type="button" onClick={() => setExcluindo(linha)}>
                                  Excluir
                                </HistoricoExcluirBtn>
                              )}
                            </HistoricoTimelineMeta>
                          </HistoricoTimelineConteudo>
                        </HistoricoTimelineItem>
                      );
                    }

                    if (linha.tipo === "banca_remarcada") {
                      const escopo = projeto.escopos.find((e) => e.id === linha.projeto_escopo_id);
                      const idAncora = `remarcacao-${idNumerico(linha.id)}`;
                      return (
                        <HistoricoTimelineItem key={idAncora}>
                          <HistoricoTimelineTrilho $ultimo={ultimo}>
                            <HistoricoTimelinePonto $cor={theme.colors.mutedForeground} />
                          </HistoricoTimelineTrilho>
                          <HistoricoTimelineConteudo
                            id={idAncora}
                            $destaque
                            $realcado={realcado === idAncora}
                          >
                            <HistoricoNotaLinha>
                              <HistoricoNotaCabecalho>
                                <HistoricoNotaTag>Remarcação de Banca</HistoricoNotaTag>
                                <HistoricoNotaMotivo>
                                  {[
                                    escopo?.nome ?? null,
                                    `${formatarDataHora(linha.data_anterior)} → ${formatarDataHora(linha.data_nova)}`,
                                  ]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </HistoricoNotaMotivo>
                              </HistoricoNotaCabecalho>
                              {/* Mesmo caso da justificativa de atraso acima: o
                                  campo virou `detalhe` no envelope, e este lia
                                  o nome antigo. */}
                              <HistoricoNotaTexto>{linha.detalhe}</HistoricoNotaTexto>
                            </HistoricoNotaLinha>
                            <HistoricoTimelineMeta>
                              <HistoricoAutorChip>
                                {linha.registrado_por ? nomeUsuario(linha.registrado_por) : "Automático"}
                              </HistoricoAutorChip>
                              <span>{formatarDataHora(linha.alterado_em)}</span>
                              {podeExcluir && (
                                <HistoricoExcluirBtn type="button" onClick={() => setExcluindo(linha)}>
                                  Excluir
                                </HistoricoExcluirBtn>
                              )}
                            </HistoricoTimelineMeta>
                          </HistoricoTimelineConteudo>
                        </HistoricoTimelineItem>
                      );
                    }

                    // Toda linha que não é transição de status é desenhada
                    // aqui, a partir do `titulo`/`detalhe` que o backend manda
                    // pronto, o que deixa uma fonte nova aparecer sem a tela
                    // saber nada sobre ela. A ETIQUETA é o que dá leitura: sem
                    // ela, seis naturezas de evento viravam seis frases soltas
                    // e indistinguíveis na mesma coluna.
                    if (linha.tipo !== "status") {
                      const aparencia = APARENCIA_EVENTO[linha.tipo] ?? {
                        rotulo: "Evento",
                        cor: theme.colors.mutedForeground,
                      };
                      // A recusa de um pedido é o único caso em que o rótulo
                      // depende do dado, não só do tipo: "aprovados" e
                      // "negados" são histórias opostas.
                      const negado = linha.tipo === "dias_de_ajuste" && linha.aprovado === false;
                      const cor = negado ? theme.colors.destructive : aparencia.cor;
                      // A cor vive só na ETIQUETA. A bolinha e a borda do
                      // cartão ficam neutras de propósito: com seis naturezas
                      // de evento, colorir também a moldura enchia a coluna de
                      // vermelho e verde e a timeline perdia a leitura calma —
                      // tudo parecia alerta. Um acento por linha basta.
                      const idAncora = `evento-${linha.id}`;
                      return (
                        <HistoricoTimelineItem key={idAncora}>
                          <HistoricoTimelineTrilho $ultimo={ultimo}>
                            <HistoricoTimelinePonto $cor={theme.colors.mutedForeground} />
                          </HistoricoTimelineTrilho>
                          <HistoricoTimelineConteudo
                            id={idAncora}
                            $destaque
                            $corDestaque={theme.colors.mutedForeground}
                            $realcado={realcado === idAncora}
                          >
                            <HistoricoNotaLinha>
                              <HistoricoNotaCabecalho>
                                <HistoricoTipoTag $cor={cor}>
                                  {negado ? "Dias negados" : aparencia.rotulo}
                                </HistoricoTipoTag>
                                <HistoricoNotaMotivo>{linha.titulo}</HistoricoNotaMotivo>
                                {linha.tipo === "pedido_de_dias" && linha.aguardando && (
                                  <HistoricoAguardando>aguardando a diretoria</HistoricoAguardando>
                                )}
                              </HistoricoNotaCabecalho>
                              {linha.detalhe && (
                                <HistoricoNotaTexto>{linha.detalhe}</HistoricoNotaTexto>
                              )}
                            </HistoricoNotaLinha>
                            <HistoricoTimelineMeta>
                              <HistoricoAutorChip>
                                {linha.alterado_por ? nomeUsuario(linha.alterado_por) : "Automático"}
                              </HistoricoAutorChip>
                              <span>{formatarDataHora(linha.alterado_em)}</span>
                            </HistoricoTimelineMeta>
                          </HistoricoTimelineConteudo>
                        </HistoricoTimelineItem>
                      );
                    }

                    const tonsNovo = tonsDaColuna(CORES_STATUS[linha.status_novo]);
                    return (
                      <HistoricoTimelineItem key={`status-${linha.id}`}>
                        <HistoricoTimelineTrilho $ultimo={ultimo}>
                          <HistoricoTimelinePonto $cor={tonsNovo.ponto} />
                        </HistoricoTimelineTrilho>
                        <HistoricoTimelineConteudo>
                          <HistoricoTimelineTransicao>
                            {linha.status_anterior && (
                              <>
                                <StatusPilula $cor={tonsDaColuna(CORES_STATUS[linha.status_anterior])}>
                                  <Ponto $cor={tonsDaColuna(CORES_STATUS[linha.status_anterior]).ponto} />
                                  {ROTULO_STATUS[linha.status_anterior]}
                                </StatusPilula>
                                <span>→</span>
                              </>
                            )}
                            <StatusPilula $cor={tonsNovo}>
                              <Ponto $cor={tonsNovo.ponto} />
                              {ROTULO_STATUS[linha.status_novo]}
                            </StatusPilula>
                            {!linha.status_anterior && <span>· projeto criado</span>}
                          </HistoricoTimelineTransicao>
                          <HistoricoTimelineMeta>
                            <HistoricoAutorChip>
                              {linha.alterado_por ? nomeUsuario(linha.alterado_por) : "Automático"}
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
        {temMaisDias && (
          <HistoricoCarregarMais
            type="button"
            onClick={() => setDiasVisiveis((atual) => atual + DIAS_POR_PAGINA)}
          >
            Carregar mais dias
          </HistoricoCarregarMais>
        )}

        {/* ⚠ "Limpar histórico" vivia no cabeçalho do card de Filtros, ao lado
            de controles que só mudam o que se VÊ — vizinhança que sugeria que
            ela também fosse só de exibição. Aqui embaixo, depois de tudo que
            ela afeta, e só para quem pode. */}
        {podeExcluir && (
          <HistoricoRodape>
            <PageButton type="button" $variant="ghost" onClick={() => setConfirmandoLimpar(true)}>
              Limpar histórico
            </PageButton>
          </HistoricoRodape>
        )}
      </div>

      {excluindo && (
        <ConfirmarModal
          titulo={excluindo.tipo === "justificativa_atraso" ? "Excluir justificativa" : "Excluir remarcação"}
          mensagem="Isso apaga o registro do histórico do projeto. Não dá pra desfazer."
          onConfirmar={() => excluir(excluindo)}
          onCancelar={() => setExcluindo(null)}
        />
      )}

      {confirmandoLimpar && (
        <ConfirmarModal
          titulo="Limpar histórico"
          mensagem={
            <>
              As mudanças de status de até agora saem da timeline. Nada é apagado de verdade: elas
              continuam contando pros dias já usados pelos escopos deste projeto, só não aparecem mais
              aqui. Dá pra trazer tudo de volta depois, em "Mostrar tudo".
            </>
          }
          rotuloConfirmar="Limpar"
          onCancelar={() => setConfirmandoLimpar(false)}
          onConfirmar={limparHistorico}
        />
      )}
    </PageStack>
  );
}
