import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Download, Lock, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  createEtapa,
  deleteEtapa,
  getCronograma,
  moverEtapa,
  oficializarCronograma,
} from "@/lib/cronograma";
import { formatarData } from "@/lib/projetos";
import {
  corSugerida,
  COR_AMBIENTACAO,
  COR_PAUSA,
  ROTULOS_MARCO,
} from "@/components/cronograma-pintado/cores";
import { exportarPDF, exportarPNG } from "@/components/cronograma-pintado/exportar";
import {
  diasDoIntervalo,
  PaintedCalendar,
  type FaixaDerivada,
  type MarcoRenderizavel,
} from "@/components/cronograma-pintado/PaintedCalendar";
import {
  Amostra,
  AmostraHachurada,
  Barra,
  BotaoExcluir,
  BotaoNav,
  BotaoVisao,
  ContadorDias,
  CronogramaLayout,
  GrupoVisao,
  LegendaBox,
  LegendaGrupo,
  LegendaItem,
  LegendaLinha,
  LegendaTexto,
  LegendaTitulo,
  NavPeriodo,
  PincelAtivo,
  RotuloPeriodo,
} from "@/components/cronograma-pintado/PaintedCalendar.styled";
import {
  ancorar,
  avancar,
  blocosDaVisao,
  intervaloDaVisao,
  normalizar,
  VISOES,
  type Visao,
} from "@/components/cronograma-pintado/visao";
import type { CronogramaResposta } from "@/types/cronograma";
import { pode } from "@/utils/permissoes";
import {
  PageStack,
  PageButton,
  PageButtonSm,
  PageLoadingBlock,
  ErrorBlock,
  ErrorText,
  EmptyText,
} from "@/styles/page.styled";
import { AvisoBanner, FieldSelect, FormErrorText } from "./Projetos.styled";
import { ConfirmarModal } from "@/components/ConfirmarModal";
import { NovaEtapaModal } from "./NovaEtapaModal";
import { useProjeto } from "./ProjetoPage";


export function ProjetoCronograma() {
  const { projeto } = useProjeto();
  const { usuario, token } = useAuth();
  const areaExport = useRef<HTMLDivElement>(null);

  const [dados, setDados] = useState<CronogramaResposta | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [escopoSelecionado, setEscopoSelecionado] = useState<number | null>(null);
  const [etapaAtiva, setEtapaAtiva] = useState<number | null>(null);
  const [previewIntervalo, setPreviewIntervalo] = useState<{ inicio: string; fim: string } | null>(
    null,
  );
  // Mês é o default: é o formato canônico do §6.4. Dia e semana são lentes de
  // detalhe. `referencia` é o período em foco; `null` até a janela chegar.
  const [visao, setVisao] = useState<Visao>("mes");
  const [referencia, setReferencia] = useState<Date | null>(null);
  const [criandoEtapa, setCriandoEtapa] = useState(false);
  const [etapaParaExcluir, setEtapaParaExcluir] = useState<{ id: number; nome: string } | null>(
    null,
  );

  const podeEditar = pode(usuario, "definir_cronograma");

  const carregar = useCallback(async () => {
    if (!token) return;
    setErro("");
    try {
      const resposta = await getCronograma(projeto.id, token);
      setDados(resposta);
      setEscopoSelecionado((atual) => atual ?? resposta.escopos[0]?.id ?? null);
      // Ancora aqui, e não num efeito: o efeito seria um setState em cascata
      // logo após o render (react-hooks/set-state-in-effect). Abrimos no
      // período de hoje trazido para dentro da janela — um cronograma já
      // encerrado abriria num mês vazio e pareceria quebrado.
      setReferencia((atual) =>
        atual ??
        ancorar(new Date(), resposta.janela.inicio.slice(0, 10), resposta.janela.fim.slice(0, 10)),
      );
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar o cronograma");
    } finally {
      setCarregando(false);
    }
  }, [projeto.id, token]);

  useEffect(() => {
    setCarregando(true);
    carregar();
  }, [carregar]);

  const escopo = dados?.escopos.find((e) => e.id === escopoSelecionado) ?? null;
  const oficializado = !!escopo?.cronograma_oficializado_em;

  const diasNaoUteis = useMemo(() => {
    const mapa = new Map<string, { tipo: string; descricao: string | null }>();
    for (const dia of dados?.dias_nao_uteis ?? []) {
      mapa.set(dia.data.slice(0, 10), { tipo: dia.tipo, descricao: dia.descricao });
    }
    return mapa;
  }, [dados]);

  /** Banca, entrega e kickoff são LIDOS de onde já vivem (`banca.data_hora`,
   *  `data_entrega_*`, `data_kickoff`) — não há linha de marco para eles. */
  const marcos = useMemo<MarcoRenderizavel[]>(() => {
    if (!dados) return [];
    const lista: MarcoRenderizavel[] = [];
    if (dados.data_kickoff) {
      lista.push({
        data: dados.data_kickoff.slice(0, 10),
        tipo: "kickoff",
        rotulo: ROTULOS_MARCO.kickoff,
        titulo: "Kickoff",
      });
    }
    for (const e of dados.escopos) {
      if (e.banca?.data_hora) {
        lista.push({
          data: e.banca.data_hora.slice(0, 10),
          tipo: "banca",
          rotulo: ROTULOS_MARCO.banca,
          titulo: `Banca — ${e.nome}`,
        });
      }
      const entrega = e.data_entrega_real ?? e.data_entrega_planejada;
      if (entrega) {
        lista.push({
          data: entrega.slice(0, 10),
          tipo: "entrega",
          rotulo: ROTULOS_MARCO.entrega,
          titulo: `Entrega — ${e.nome}`,
        });
      }
    }
    for (const m of dados.marcos) {
      lista.push({
        data: m.data.slice(0, 10),
        tipo: m.tipo,
        rotulo: ROTULOS_MARCO[m.tipo],
        // A nota é o nome que o coordenador deu; sem ela, o rótulo do tipo.
        titulo: m.nota ?? ROTULOS_MARCO[m.tipo],
      });
    }
    return lista;
  }, [dados]);

  const faixas = useMemo<FaixaDerivada[]>(
    () =>
      (dados?.faixas_derivadas ?? []).map((f) => ({
        ...f,
        inicio: f.inicio.slice(0, 10),
        fim: f.fim.slice(0, 10),
        cor: f.tipo === "ambientacao" ? COR_AMBIENTACAO : COR_PAUSA,
      })),
    [dados],
  );

  const janela = useMemo(
    () =>
      dados
        ? { inicio: dados.janela.inicio.slice(0, 10), fim: dados.janela.fim.slice(0, 10) }
        : null,
    [dados],
  );

  const blocos = useMemo(
    () => (referencia ? blocosDaVisao(visao, referencia) : []),
    [visao, referencia],
  );

  // A navegação para nas bordas da janela — fora dela não há cronograma.
  const limites = useMemo(() => {
    if (!referencia || !janela) return { recuar: true, avancar: true };
    const atual = intervaloDaVisao(visao, referencia);
    return {
      recuar: atual.inicio <= janela.inicio,
      avancar: atual.fim >= janela.fim,
    };
  }, [visao, referencia, janela]);

  function navegar(passo: number) {
    setReferencia((atual) => (atual ? avancar(visao, atual, passo) : atual));
  }

  /** Trocar de visão mantém o período em foco, ancorado no seu início. */
  function trocarVisao(nova: Visao) {
    setVisao(nova);
    setReferencia((atual) => (atual ? normalizar(nova, atual) : atual));
  }

  /**
   * TODAS as etapas do projeto, de todos os escopos — o calendário é do
   * projeto, não do escopo.
   *
   * O seletor de escopo continua existindo, mas só decide a que escopo uma
   * etapa NOVA pertence e qual escopo o botão de oficializar trava. Trocar de
   * escopo não muda mais o que o calendário mostra: a §5.4 admite escopos em
   * paralelo, e escondê-los um do outro esconderia justamente a sobreposição
   * que o coordenador precisa enxergar para não estourar a equipe.
   *
   * Cada etapa carrega de onde veio, para a legenda poder agrupar.
   */
  const etapas = useMemo(
    () =>
      (dados?.escopos ?? []).flatMap((e) =>
        (e.etapas ?? []).map((etapa) => ({
          ...etapa,
          escopoId: e.id,
          escopoNome: e.nome,
          escopoOficializado: !!e.cronograma_oficializado_em,
        })),
      ),
    [dados],
  );

  /** O pincel manda: pintar é editar a etapa ativa, então quem trava é o
   *  escopo DELA — não o que está escolhido no seletor. */
  const etapaDoPincel = etapas.find((e) => e.id === etapaAtiva);
  const pincelTravado = !!etapaDoPincel?.escopoOficializado;

  const aoPintar = useCallback(
    async (etapaId: number, inicio: string, fim: string) => {
      if (!token) return;
      setAviso("");
      try {
        await moverEtapa(etapaId, inicio, fim, token);
        await carregar();
      } catch (err) {
        setAviso(err instanceof Error ? err.message : "Erro ao pintar a etapa");
      }
    },
    [token, carregar],
  );

  /** O modal propaga o erro para exibir dentro dele, junto do formulário. */
  async function criarEtapa(nome: string, cor: string) {
    if (!token || !escopo) return;
    // `toISOString()` é UTC — à noite no Brasil já virou o dia seguinte lá.
    // A etapa nova nasceria com a data errada.
    const hoje = format(new Date(), "yyyy-MM-dd");
    setAviso("");
    await createEtapa(escopo.id, { nome, cor, data_inicio: hoje, data_fim: hoje }, token);
    setCriandoEtapa(false);
    await carregar();
  }

  /** O erro sobe para o modal mostrar; ele só fecha se deu certo. */
  async function excluirEtapa(etapaId: number) {
    if (!token) return;
    setAviso("");
    await deleteEtapa(etapaId, token);
    // Se o pincel era esta etapa, ele fica órfão — apagar tem que desarmá-lo.
    setEtapaAtiva((atual) => (atual === etapaId ? null : atual));
    setEtapaParaExcluir(null);
    await carregar();
  }

  async function oficializar() {
    if (!token || !escopo) return;
    if (!confirm("Oficializar trava o cronograma: qualquer mudança passa a exigir reajuste aprovado pela diretoria. Confirma?")) return;
    setAviso("");
    try {
      await oficializarCronograma(escopo.id, token);
      await carregar();
    } catch (err) {
      setAviso(err instanceof Error ? err.message : "Erro ao oficializar");
    }
  }

  async function exportar(formato: "png" | "pdf") {
    if (!areaExport.current) return;
    setAviso("");
    try {
      const acao = formato === "png" ? exportarPNG : exportarPDF;
      await acao(areaExport.current, projeto.nome);
    } catch (err) {
      setAviso(err instanceof Error ? err.message : "Erro ao exportar");
    }
  }

  if (erro) {
    return (
      <ErrorBlock>
        <ErrorText>Não foi possível carregar o cronograma: {erro}</ErrorText>
        <PageButton $variant="outline" onClick={() => carregar()}>
          Tentar novamente
        </PageButton>
      </ErrorBlock>
    );
  }

  if (carregando || !dados) return <PageLoadingBlock />;

  // Cronograma antes do kickoff não tem o que dizer — é o estado honesto.
  if (!dados.data_kickoff) {
    return (
      <AvisoBanner>
        Marque o kickoff na aba <Link to={`/projetos/${projeto.id}`}>Visão geral</Link> para montar
        o cronograma — é ele que dá o ponto de partida da contagem.
      </AvisoBanner>
    );
  }

  if (dados.escopos.length === 0) {
    return <EmptyText>Cadastre um escopo vendido antes de montar o cronograma.</EmptyText>;
  }

  const diasPreview = previewIntervalo
    ? diasDoIntervalo(previewIntervalo.inicio, previewIntervalo.fim).filter(
        (d) => !diasNaoUteis.has(d),
      ).length
    : null;

  return (
    <PageStack>
      {oficializado && (
        <AvisoBanner>
          <Lock size={14} /> Cronograma oficializado em{" "}
          {formatarData(escopo!.cronograma_oficializado_em)}. Qualquer mudança agora exige uma
          solicitação de reajuste aprovada pela diretoria (§5.6).
        </AvisoBanner>
      )}

      <Barra>
        <GrupoVisao role="group" aria-label="Visão do cronograma">
          {VISOES.map((opcao) => (
            <BotaoVisao
              key={opcao.valor}
              type="button"
              $ativo={visao === opcao.valor}
              aria-pressed={visao === opcao.valor}
              onClick={() => trocarVisao(opcao.valor)}
            >
              {opcao.rotulo}
            </BotaoVisao>
          ))}
        </GrupoVisao>

        <NavPeriodo>
          <BotaoNav
            type="button"
            aria-label="Período anterior"
            disabled={limites.recuar}
            onClick={() => navegar(-1)}
          >
            <ChevronLeft size={14} />
          </BotaoNav>
          <BotaoNav
            type="button"
            aria-label="Próximo período"
            disabled={limites.avancar}
            onClick={() => navegar(1)}
          >
            <ChevronRight size={14} />
          </BotaoNav>
          <RotuloPeriodo>{blocos[0]?.titulo}</RotuloPeriodo>
        </NavPeriodo>

        {dados.escopos.length > 1 && (
          <FieldSelect
            value={String(escopoSelecionado ?? "")}
            onChange={(e) => {
              setEscopoSelecionado(Number(e.target.value));
              setEtapaAtiva(null);
            }}
            aria-label="Escopo"
          >
            {dados.escopos.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome}
              </option>
            ))}
          </FieldSelect>
        )}

        {podeEditar && !oficializado && (
          <PageButtonSm type="button" $variant="outline" onClick={() => setCriandoEtapa(true)}>
            <Plus size={14} />
            Nova etapa
          </PageButtonSm>
        )}

        {etapaDoPincel ? (
          <PincelAtivo $cor={etapaDoPincel.cor}>
            Pintando: {etapaDoPincel.nome}
            {diasPreview !== null && <ContadorDias>· {diasPreview} dias úteis</ContadorDias>}
          </PincelAtivo>
        ) : (
          podeEditar &&
          !oficializado &&
          etapas.length > 0 && (
            <ContadorDias>Clique numa etapa da legenda para começar a pintar.</ContadorDias>
          )
        )}

        {podeEditar && !oficializado && etapas.length > 0 && escopo?.banca && (
          <PageButtonSm type="button" $variant="outline" onClick={oficializar}>
            <Lock size={14} />
            Oficializar
          </PageButtonSm>
        )}

        {/* Exportar é a única ação da matriz liberada ao consultor — o
            botão não fica atrás de `pode()`. */}
        <PageButtonSm type="button" $variant="ghost" onClick={() => exportar("png")}>
          <Download size={14} />
          PNG
        </PageButtonSm>
        <PageButtonSm type="button" $variant="ghost" onClick={() => exportar("pdf")}>
          <Download size={14} />
          PDF
        </PageButtonSm>
      </Barra>

      {aviso && <FormErrorText>{aviso}</FormErrorText>}

      <CronogramaLayout ref={areaExport}>
        <PaintedCalendar
          blocos={blocos}
          visao={visao}
          etapas={etapas}
          marcos={marcos}
          faixas={faixas}
          diasNaoUteis={diasNaoUteis}
          etapaAtiva={etapaAtiva}
          somenteLeitura={!podeEditar || pincelTravado}
          onPaintRange={aoPintar}
          onArrasteMudou={setPreviewIntervalo}
        />

        <LegendaBox>
          {/* Um grupo por escopo: com o calendário do projeto inteiro, "Etapas"
              numa lista só não diria de qual escopo é cada faixa. Com um
              escopo só, o título continua sendo o nome dele — sem seção órfã. */}
          {dados.escopos.map((esc) => {
            const doEscopo = etapas.filter((e) => e.escopoId === esc.id);
            return (
              <LegendaGrupo key={esc.id}>
                <LegendaTitulo>{esc.nome}</LegendaTitulo>
                {doEscopo.length === 0 && <EmptyText>Nenhuma etapa ainda.</EmptyText>}
                {doEscopo.map((etapa) => (
                  <LegendaLinha key={etapa.id}>
                    <LegendaItem
                      type="button"
                      $ativa={etapa.id === etapaAtiva}
                      onClick={() => setEtapaAtiva(etapa.id === etapaAtiva ? null : etapa.id)}
                    >
                      <Amostra $cor={etapa.cor} />
                      <LegendaTexto>
                        <strong>{etapa.nome}</strong>
                        <small>
                          {formatarData(etapa.data_inicio)} – {formatarData(etapa.data_fim)}
                        </small>
                      </LegendaTexto>
                    </LegendaItem>

                    {/* Excluir segue a mesma trava do pincel: o que manda é o
                        escopo DESTA etapa, não o do seletor. */}
                    {podeEditar && !etapa.escopoOficializado && (
                      <BotaoExcluir
                        type="button"
                        data-excluir
                        aria-label={`Excluir a etapa ${etapa.nome}`}
                        title="Excluir etapa"
                        onClick={() => setEtapaParaExcluir(etapa)}
                      >
                        <Trash2 size={14} />
                      </BotaoExcluir>
                    )}
                  </LegendaLinha>
                ))}
              </LegendaGrupo>
            );
          })}

          <LegendaGrupo>
            <LegendaTitulo>Outros</LegendaTitulo>
            {faixas.some((f) => f.tipo === "ambientacao") && (
              <LegendaItem as="div">
                <Amostra $cor={COR_AMBIENTACAO} />
                <LegendaTexto>ambientação</LegendaTexto>
              </LegendaItem>
            )}
            <LegendaItem as="div">
              <AmostraHachurada />
              <LegendaTexto>
                <strong>não útil</strong>
                <small>fim de semana, feriado, prova ou recesso</small>
              </LegendaTexto>
            </LegendaItem>
          </LegendaGrupo>
        </LegendaBox>
      </CronogramaLayout>

      {criandoEtapa && (
        <NovaEtapaModal
          corInicial={corSugerida(etapas.length)}
          onCancelar={() => setCriandoEtapa(false)}
          onCriar={criarEtapa}
        />
      )}

      {etapaParaExcluir && (
        <ConfirmarModal
          titulo="Excluir etapa"
          mensagem={
            <>
              A etapa <strong>{etapaParaExcluir.nome}</strong> será apagada, e os dias que estavam
              pintados com ela voltam a ficar em branco. As tarefas e a banca do escopo não são
              afetadas.
            </>
          }
          onCancelar={() => setEtapaParaExcluir(null)}
          onConfirmar={() => excluirEtapa(etapaParaExcluir.id)}
        />
      )}
    </PageStack>
  );
}
