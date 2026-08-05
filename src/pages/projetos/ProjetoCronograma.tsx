import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
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
import { exportarPDF } from "@/components/cronograma-pintado/exportar";
import {
  diasDoIntervalo,
  PaintedCalendar,
  type FaixaDerivada,
  type MarcoRenderizavel,
} from "@/components/cronograma-pintado/PaintedCalendar";
import {
  Amostra,
  AmostraHachurada,
  AreaExportOculta,
  Barra,
  BotaoBarra,
  BotaoExcluir,
  BotaoNav,
  BotaoVisao,
  ContadorDias,
  CronogramaLayout,
  GrupoVisao,
  MolduraExport,
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
  blocosDosMeses,
  intervaloDaVisao,
  mesesDaJanela,
  normalizar,
  VISOES,
  type Visao,
} from "@/components/cronograma-pintado/visao";
import type { CronogramaResposta } from "@/types/cronograma";
import { pode } from "@/utils/permissoes";
import {
  PageStack,
  PageButton,
  PageLoadingBlock,
  ErrorBlock,
  ErrorText,
  EmptyText,
} from "@/styles/page.styled";
import { AvisoBanner, FieldSelect, FormErrorText } from "./Projetos.styled";
import { ConfirmarModal } from "@/components/ConfirmarModal";
import {
  planejarEscrita,
  subtrairTrecho,
  unirTrechos,
} from "@/components/cronograma-pintado/trechos";
import { ExportarPdfModal } from "./ExportarPdfModal";
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
  const [grupoAtivo, setGrupoAtivo] = useState<string | null>(null);
  const [previewIntervalo, setPreviewIntervalo] = useState<{ inicio: string; fim: string } | null>(
    null,
  );
  // Mês é o default: é o formato canônico do §6.4. Dia e semana são lentes de
  // detalhe. `referencia` é o período em foco; `null` até a janela chegar.
  const [visao, setVisao] = useState<Visao>("mes");
  const [referencia, setReferencia] = useState<Date | null>(null);
  const [criandoEtapa, setCriandoEtapa] = useState(false);
  /** Etapas criadas na tela e ainda sem trecho — não existem no banco. */
  const [rascunhos, setRascunhos] = useState<{ escopoId: number; nome: string; cor: string }[]>([]);
  const [exportandoPdf, setExportandoPdf] = useState(false);
  /** Enquanto não é `null`, a cópia fora da tela está montada com estes meses. */
  const [mesesExport, setMesesExport] = useState<Date[] | null>(null);
  const [etapaParaExcluir, setEtapaParaExcluir] = useState<{
    chave: string;
    nome: string;
    trechos: number;
  } | null>(null);

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
          // Linhas com a mesma chave são TRECHOS de uma etapa só. Nome e cor
          // definem a identidade porque é isso que o usuário enxerga — o id é
          // detalhe de como o banco guarda.
          grupo: `${e.id}|${etapa.nome}|${etapa.cor}`,
          escopoId: e.id,
          escopoNome: e.nome,
          escopoOficializado: !!e.cronograma_oficializado_em,
        })),
      ),
    [dados],
  );

  /** As etapas como o usuário as vê: uma entrada por grupo, com seus trechos. */
  const grupos = useMemo(() => {
    const mapa = new Map<string, { chave: string; nome: string; cor: string; escopoId: number; oficializado: boolean; trechos: typeof etapas }>();

    // Rascunhos primeiro, para uma etapa recém-criada já aparecer na legenda
    // mesmo sem nenhum trecho. Se ela ganhar trechos, o laço abaixo preenche
    // esta mesma entrada — a chave é a mesma.
    for (const r of rascunhos) {
      const chave = `${r.escopoId}|${r.nome}|${r.cor}`;
      const esc = dados?.escopos.find((e) => e.id === r.escopoId);
      mapa.set(chave, {
        chave,
        nome: r.nome,
        cor: r.cor,
        escopoId: r.escopoId,
        oficializado: !!esc?.cronograma_oficializado_em,
        trechos: [],
      });
    }

    for (const etapa of etapas) {
      const atual = mapa.get(etapa.grupo);
      if (atual) {
        atual.trechos.push(etapa);
      } else {
        mapa.set(etapa.grupo, {
          chave: etapa.grupo,
          nome: etapa.nome,
          cor: etapa.cor,
          escopoId: etapa.escopoId,
          oficializado: etapa.escopoOficializado,
          trechos: [etapa],
        });
      }
    }
    for (const g of mapa.values()) {
      g.trechos.sort((a, b) => a.data_inicio.localeCompare(b.data_inicio));
    }
    return [...mapa.values()];
  }, [etapas, rascunhos, dados]);

  /** O pincel manda: pintar é editar a etapa ativa, então quem trava é o
   *  escopo DELA — não o que está escolhido no seletor. */
  const grupoDoPincel = grupos.find((g) => g.chave === grupoAtivo);
  const pincelTravado = !!grupoDoPincel?.oficializado;

  /**
   * Pintar ACRESCENTA um trecho ao grupo, em vez de mover a etapa inteira.
   *
   * O novo intervalo entra na lista, os que se encostam são fundidos, e o
   * resultado é reconciliado contra as linhas que já existem — reaproveitando
   * ids para o `criado_em`/`criado_por` de cada trecho não se perder a cada
   * pincelada.
   */
  const aoPintar = useCallback(
    async (grupoChave: string, inicio: string, fim: string) => {
      if (!token) return;
      const grupo = grupos.find((g) => g.chave === grupoChave);
      if (!grupo) return;
      setAviso("");
      try {
        const existentes = grupo.trechos.map((t) => ({
          id: t.id,
          inicio: t.data_inicio,
          fim: t.data_fim,
        }));
        const desejados = unirTrechos([...existentes, { inicio, fim }]);
        const plano = planejarEscrita(existentes, desejados);

        for (const t of plano.atualizar) await moverEtapa(t.id, t.inicio, t.fim, token);
        for (const t of plano.criar) {
          await createEtapa(
            grupo.escopoId,
            { nome: grupo.nome, cor: grupo.cor, data_inicio: t.inicio, data_fim: t.fim },
            token,
          );
        }
        for (const id of plano.remover) await deleteEtapa(id, token);

        // Ganhou trecho: deixa de ser rascunho e passa a viver no banco.
        setRascunhos((atual) =>
          atual.filter((r) => `${r.escopoId}|${r.nome}|${r.cor}` !== grupoChave),
        );
        await carregar();
      } catch (err) {
        setAviso(err instanceof Error ? err.message : "Erro ao pintar a etapa");
      }
    },
    [token, carregar, grupos],
  );

  /**
   * Desmarcar: tira o intervalo da etapa em que o gesto começou.
   *
   * Não há botão de borracha. O arrasto que nasce sobre um dia já pintado pela
   * etapa selecionada apaga; o que nasce sobre dia livre pinta. Quem decide é
   * o calendário, na âncora, e avisa aqui qual dos dois foi.
   */
  const aoApagar = useCallback(
    async (grupoChave: string, inicio: string, fim: string) => {
      if (!token) return;
      const grupo = grupos.find((g) => g.chave === grupoChave);
      if (!grupo) return;
      setAviso("");
      try {
        const existentes = grupo.trechos.map((t) => ({
          id: t.id,
          inicio: t.data_inicio,
          fim: t.data_fim,
        }));
        const plano = planejarEscrita(existentes, subtrairTrecho(existentes, { inicio, fim }));

        for (const t of plano.atualizar) await moverEtapa(t.id, t.inicio, t.fim, token);
        for (const t of plano.criar) {
          await createEtapa(
            grupo.escopoId,
            { nome: grupo.nome, cor: grupo.cor, data_inicio: t.inicio, data_fim: t.fim },
            token,
          );
        }
        for (const id of plano.remover) await deleteEtapa(id, token);
        await carregar();
      } catch (err) {
        setAviso(err instanceof Error ? err.message : "Erro ao desmarcar");
      }
    },
    [token, carregar, grupos],
  );

  /**
   * A etapa nova nasce SEM dia nenhum marcado.
   *
   * Ela não vai para o backend ainda: `cronograma_etapa` exige data_inicio e
   * data_fim, e semear com a data de hoje pintava um dia que ninguém pediu —
   * e que, pior, não dava para desmarcar. Enquanto não tem trecho, ela vive só
   * aqui como rascunho; a primeira pincelada é que cria a linha.
   */
  function criarEtapa(nome: string, cor: string) {
    if (!escopo) return;
    setAviso("");
    setRascunhos((atual) => [...atual, { escopoId: escopo.id, nome, cor }]);
    setGrupoAtivo(`${escopo.id}|${nome}|${cor}`);
    setCriandoEtapa(false);
  }

  /**
   * Apaga a etapa INTEIRA, com todos os seus trechos.
   *
   * O erro sobe para o modal mostrar; ele só fecha se deu certo.
   */
  async function excluirGrupo(chave: string) {
    if (!token) return;
    const grupo = grupos.find((g) => g.chave === chave);
    if (!grupo) return;
    setAviso("");
    for (const trecho of grupo.trechos) await deleteEtapa(trecho.id, token);
    setRascunhos((atual) => atual.filter((r) => `${r.escopoId}|${r.nome}|${r.cor}` !== chave));
    // Se o pincel era esta etapa, ele fica órfão — apagar tem que desarmá-lo.
    setGrupoAtivo((atual) => (atual === chave ? null : atual));
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

  /**
   * Gera o PDF a partir de uma cópia FORA DA TELA com os meses escolhidos.
   *
   * Não dá para rasterizar o calendário visível: ele mostra o recorte da visão
   * atual (um dia, se for o caso), e o §6.4 quer o cronograma de apresentação.
   * O erro sobe para o modal mostrar.
   */
  async function gerarPdf(mesesEscolhidos: Date[]) {
    setMesesExport(mesesEscolhidos);
    // Dois frames: um para o React montar a área, outro para o navegador
    // aplicar o layout. Sem isso o html-to-image fotografa a folha em branco.
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );
    try {
      if (!areaExport.current) throw new Error("A área de exportação não montou");
      await exportarPDF(areaExport.current, projeto.nome);
      setExportandoPdf(false);
    } finally {
      setMesesExport(null);
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
              setGrupoAtivo(null);
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
          <BotaoBarra type="button" $variant="outline" onClick={() => setCriandoEtapa(true)}>
            <Plus size={14} />
            Nova etapa
          </BotaoBarra>
        )}

        {grupoDoPincel ? (
          <>
            <PincelAtivo $cor={grupoDoPincel.cor}>
              Pintando: {grupoDoPincel.nome}
              {diasPreview !== null && <ContadorDias>· {diasPreview} dias úteis</ContadorDias>}
            </PincelAtivo>
            {/* Sem botão de borracha, o gesto precisa estar escrito em algum
                lugar — senão ninguém descobre que dá para desmarcar. */}
            <ContadorDias>Arraste a partir de um dia já pintado para desmarcar.</ContadorDias>
          </>
        ) : (
          podeEditar &&
          !oficializado &&
          etapas.length > 0 && (
            <ContadorDias>Clique numa etapa da legenda para começar a pintar.</ContadorDias>
          )
        )}

        {podeEditar && !oficializado && etapas.length > 0 && escopo?.banca && (
          <BotaoBarra type="button" $variant="outline" onClick={oficializar}>
            <Lock size={14} />
            Oficializar
          </BotaoBarra>
        )}

        {/* Exportar é a única ação da matriz liberada ao consultor — o
            botão não fica atrás de `pode()`. */}
        <BotaoBarra type="button" $variant="ghost" onClick={() => setExportandoPdf(true)}>
          <Download size={14} />
          PDF
        </BotaoBarra>
      </Barra>

      {aviso && <FormErrorText>{aviso}</FormErrorText>}

      <CronogramaLayout>
        <PaintedCalendar
          blocos={blocos}
          visao={visao}
          etapas={etapas}
          marcos={marcos}
          faixas={faixas}
          diasNaoUteis={diasNaoUteis}
          grupoAtivo={grupoAtivo}
          pincel={grupoDoPincel ?? null}
          somenteLeitura={!podeEditar || pincelTravado}
          onPaintRange={aoPintar}
          onEraseRange={aoApagar}
          onArrasteMudou={setPreviewIntervalo}
        />

        <LegendaBox>
          {/* Um grupo por escopo: com o calendário do projeto inteiro, "Etapas"
              numa lista só não diria de qual escopo é cada faixa. Com um
              escopo só, o título continua sendo o nome dele — sem seção órfã. */}
          {dados.escopos.map((esc) => {
            const doEscopo = grupos.filter((g) => g.escopoId === esc.id);
            return (
              <LegendaGrupo key={esc.id}>
                <LegendaTitulo>{esc.nome}</LegendaTitulo>
                {doEscopo.length === 0 && <EmptyText>Nenhuma etapa ainda.</EmptyText>}
                {doEscopo.map((grupo) => (
                  <LegendaLinha key={grupo.chave}>
                    <LegendaItem
                      type="button"
                      $ativa={grupo.chave === grupoAtivo}
                      onClick={() =>
                        setGrupoAtivo(grupo.chave === grupoAtivo ? null : grupo.chave)
                      }
                    >
                      <Amostra $cor={grupo.cor} />
                      <LegendaTexto>
                        <strong>{grupo.nome}</strong>
                        {/* Um trecho por linha: a etapa pode ocupar pedaços
                            separados do calendário, e "14/07 – 28/07" esconderia
                            justamente o vão que o cronograma quer mostrar. */}
                        {grupo.trechos.map((t) => (
                          <small key={t.id}>
                            {formatarData(t.data_inicio)} – {formatarData(t.data_fim)}
                          </small>
                        ))}
                      </LegendaTexto>
                    </LegendaItem>

                    {/* Excluir segue a mesma trava do pincel: o que manda é o
                        escopo DESTA etapa, não o do seletor. */}
                    {podeEditar && !grupo.oficializado && (
                      <BotaoExcluir
                        type="button"
                        data-excluir
                        aria-label={`Excluir a etapa ${grupo.nome}`}
                        title="Excluir etapa"
                        onClick={() =>
                          setEtapaParaExcluir({
                            chave: grupo.chave,
                            nome: grupo.nome,
                            trechos: grupo.trechos.length,
                          })
                        }
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

      {/* A cópia que o PDF rasteriza: os meses escolhidos empilhados, a
          legenda do lado e nada de interação. Só existe durante o export. */}
      {mesesExport && (
        <AreaExportOculta aria-hidden>
          <MolduraExport ref={areaExport}>
          <CronogramaLayout>
            <PaintedCalendar
              blocos={blocosDosMeses(mesesExport)}
              visao="mes"
              etapas={etapas}
              marcos={marcos}
              faixas={faixas}
              diasNaoUteis={diasNaoUteis}
              grupoAtivo={null}
              somenteLeitura
              onPaintRange={() => {}}
            />
            <LegendaBox>
              {dados.escopos.map((esc) => {
                const doEscopo = grupos.filter((g) => g.escopoId === esc.id);
                if (doEscopo.length === 0) return null;
                return (
                  <LegendaGrupo key={esc.id}>
                    <LegendaTitulo>{esc.nome}</LegendaTitulo>
                    {doEscopo.map((grupo) => (
                      <LegendaItem as="div" key={grupo.chave}>
                        <Amostra $cor={grupo.cor} />
                        <LegendaTexto>
                          <strong>{grupo.nome}</strong>
                          {grupo.trechos.map((t) => (
                            <small key={t.id}>
                              {formatarData(t.data_inicio)} – {formatarData(t.data_fim)}
                            </small>
                          ))}
                        </LegendaTexto>
                      </LegendaItem>
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
          </MolduraExport>
        </AreaExportOculta>
      )}

      {exportandoPdf && janela && (
        <ExportarPdfModal
          meses={mesesDaJanela(janela.inicio, janela.fim)}
          onCancelar={() => setExportandoPdf(false)}
          onExportar={gerarPdf}
        />
      )}

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
              A etapa <strong>{etapaParaExcluir.nome}</strong> será apagada
              {etapaParaExcluir.trechos > 1 && ` — os ${etapaParaExcluir.trechos} trechos dela`}, e
              os dias que estavam pintados voltam a ficar em branco. As tarefas e a banca do escopo
              não são afetadas.
            </>
          }
          onCancelar={() => setEtapaParaExcluir(null)}
          onConfirmar={() => excluirGrupo(etapaParaExcluir.chave)}
        />
      )}
    </PageStack>
  );
}
