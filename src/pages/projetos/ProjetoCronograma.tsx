import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Download, Lock, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  createEtapa,
  definirEntregaPlanejada,
  deleteEtapa,
  getCronograma,
  moverEtapa,
  oficializarCronograma,
  responderReajuste,
  solicitarReajuste,
} from "@/lib/cronograma";
import { formatarData } from "@/lib/projetos";
import { chaveData } from "@/components/calendario/semanas";
import {
  corPeriodoEscopo,
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
  AreaExportOculta,
  Barra,
  BotaoBarra,
  BotaoExcluir,
  BotaoNav,
  BotaoVisao,
  ContadorDias,
  CronogramaLayout,
  FieldEntrega,
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
import { ResponderReajusteModal } from "./ResponderReajusteModal";
import { SolicitarReajusteModal } from "./SolicitarReajusteModal";
import { useProjeto } from "./ProjetoPage";


/** "2026-07-14" -> "14/07". O ano é ruído numa legenda de um semestre só. */
function semAno(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
}

export function ProjetoCronograma() {
  const { projeto } = useProjeto();
  const { usuario, token } = useAuth();
  const areaExport = useRef<HTMLDivElement>(null);

  const [dados, setDados] = useState<CronogramaResposta | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  /**
   * O escopo em foco, ou "geral" para o projeto inteiro.
   *
   * Geral não é só um filtro solto: ele é a visão consolidada — junta etapas,
   * marcos, entregas e os dias não úteis de TODAS as frentes. Abre nele porque
   * "como está o cronograma?" é a pergunta de quem chega; editar é ação
   * deliberada de quem escolhe um escopo.
   */
  const [escopoSelecionado, setEscopoSelecionado] = useState<number | "geral">("geral");
  const [grupoAtivo, setGrupoAtivo] = useState<string | null>(null);
  const [previewIntervalo, setPreviewIntervalo] = useState<{ inicio: string; fim: string } | null>(
    null,
  );
  // Mês é o default: é o formato canônico do §6.4. Dia e semana são lentes de
  // detalhe. `referencia` é o período em foco; `null` até a janela chegar.
  const [visao, setVisao] = useState<Visao>("mes");
  const [referencia, setReferencia] = useState<Date | null>(null);
  const [criandoEtapa, setCriandoEtapa] = useState(false);
  const [confirmandoOficializacao, setConfirmandoOficializacao] = useState(false);
  /** Etapas criadas na tela e ainda sem trecho — não existem no banco. */
  const [rascunhos, setRascunhos] = useState<{ escopoId: number; nome: string; cor: string }[]>([]);
  const [exportandoPdf, setExportandoPdf] = useState(false);
  /** Enquanto não é `null`, a cópia fora da tela está montada com estes meses. */
  const [mesesExport, setMesesExport] = useState<Date[] | null>(null);
  /** O escopo escolhido no modal de export — independente do que está na tela. */
  const [escopoExport, setEscopoExport] = useState<number | "geral">("geral");
  const [etapaParaExcluir, setEtapaParaExcluir] = useState<{
    chave: string;
    nome: string;
    trechos: number;
  } | null>(null);
  const [solicitandoReajuste, setSolicitandoReajuste] = useState(false);
  const [respondendoReajuste, setRespondendoReajuste] = useState(false);

  const podeEditar = !!usuario?.cargo.pode_definir_cronograma;
  const podeAprovarReajuste = !!usuario?.cargo.pode_aprovar_reajuste;

  const carregar = useCallback(async () => {
    if (!token) return;
    setErro("");
    try {
      const resposta = await getCronograma(projeto.id, token);
      setDados(resposta);
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

  const modoGeral = escopoSelecionado === "geral";
  const escopo = modoGeral
    ? null
    : (dados?.escopos.find((e) => e.id === escopoSelecionado) ?? null);
  const oficializado = !!escopo?.cronograma_oficializado_em;

  /** As frentes cujo calendário deve aparecer: a do escopo, ou todas no Geral. */
  const frentesVisiveis = useMemo(() => {
    if (!dados) return new Set<number>();
    return modoGeral
      ? new Set(dados.escopos.map((e) => e.frente_id))
      : new Set(escopo ? [escopo.frente_id] : []);
  }, [dados, modoGeral, escopo]);

  /**
   * O calendário acadêmico da frente do escopo SELECIONADO.
   *
   * Cada frente tem o seu — as semanas de avaliação de Administração não são
   * as de Engenharia. Trocar o escopo no seletor troca o calendário junto, que
   * é o que faz um projeto sinérgico mostrar a realidade de cada lado.
   *
   * Os dias sem frente (`null`) entram sempre: feriado é do país.
   */
  /** Sábado e domingo da janela — a base dos dois mapas abaixo. */
  const fimDeSemana = useMemo(() => {
    const mapa = new Map<string, { tipo: string; descricao: string | null }>();
    if (!dados) return mapa;
    // Não vem do backend de propósito: `dia_nao_letivo` guarda o que a
    // diretoria carrega do PDF, e fim de semana não é carregado — o cálculo de
    // dias úteis já o exclui por definição.
    const fim = new Date(`${dados.janela.fim.slice(0, 10)}T12:00:00`);
    const cursor = new Date(`${dados.janela.inicio.slice(0, 10)}T12:00:00`);
    while (cursor <= fim) {
      if (cursor.getDay() === 0 || cursor.getDay() === 6) {
        mapa.set(chaveData(cursor), { tipo: "fim_de_semana", descricao: null });
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    return mapa;
  }, [dados]);

  /**
   * O que aparece hachurado: fim de semana + o calendário das frentes visíveis.
   *
   * No Geral são todas as frentes do projeto, para nenhum bloqueio ficar
   * escondido na visão que serve para apresentar.
   */
  const diasNaoUteis = useMemo(() => {
    const mapa = new Map(fimDeSemana);
    for (const dia of dados?.dias_nao_uteis ?? []) {
      if (dia.frente_id !== null && !frentesVisiveis.has(dia.frente_id)) continue;
      mapa.set(dia.data.slice(0, 10), { tipo: dia.tipo, descricao: dia.descricao });
    }
    return mapa;
  }, [dados, frentesVisiveis, fimDeSemana]);


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
      // Num escopo específico só entram os marcos DELE. O kickoff fica de fora
      // deste filtro logo acima: ele é do projeto, não de um escopo.
      if (!modoGeral && e.id !== escopoSelecionado) continue;
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
      if (!modoGeral && m.projeto_escopo_id && m.projeto_escopo_id !== escopoSelecionado) continue;
      lista.push({
        data: m.data.slice(0, 10),
        tipo: m.tipo,
        rotulo: ROTULOS_MARCO[m.tipo],
        // A nota é o nome que o coordenador deu; sem ela, o rótulo do tipo.
        titulo: m.nota ?? ROTULOS_MARCO[m.tipo],
      });
    }
    return lista;
  }, [dados, modoGeral, escopoSelecionado]);

  /**
   * ⭐ O período de cada escopo (reunião inicial → banca, §5.4) chega como
   * faixa derivada, junto de ambientação e pausa.
   *
   * A cor sai do ÍNDICE do escopo na lista do projeto — a mesma ordem dos
   * grupos da legenda —, então a faixa e o título do escopo na legenda casam
   * sem ninguém precisar decorar cor. O recorte segue o do calendário: no
   * modo Geral aparecem todas; com um escopo selecionado, só a dele.
   */
  const todasAsFaixas = useMemo<FaixaDerivada[]>(() => {
    const escopos = dados?.escopos ?? [];
    const indicePorEscopo = new Map(escopos.map((e, i) => [e.id, i]));
    return (dados?.faixas_derivadas ?? []).map((f) => ({
      ...f,
      inicio: f.inicio.slice(0, 10),
      fim: f.fim.slice(0, 10),
      cor:
        f.tipo === "escopo"
          ? corPeriodoEscopo(indicePorEscopo.get(f.projeto_escopo_id ?? -1) ?? 0)
          : f.tipo === "ambientacao"
            ? COR_AMBIENTACAO
            : COR_PAUSA,
      rotulo:
        f.tipo === "escopo"
          ? `${escopos.find((e) => e.id === f.projeto_escopo_id)?.nome ?? f.rotulo} — período do escopo`
          : f.rotulo,
    }));
  }, [dados]);

  /** O que vai para o calendário — mesmo recorte das etapas. A LEGENDA usa
   *  `todasAsFaixas`: ela lista os escopos todos, mesmo os fora da visão. */
  const faixas = useMemo(
    () =>
      todasAsFaixas.filter(
        (f) => f.tipo !== "escopo" || modoGeral || f.projeto_escopo_id === escopoSelecionado,
      ),
    [todasAsFaixas, modoGeral, escopoSelecionado],
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
      (dados?.escopos ?? [])
        .filter((e) => modoGeral || e.id === escopoSelecionado)
        .flatMap((e) =>
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
    [dados, modoGeral, escopoSelecionado],
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

  /**
   * Os dias em que uma etapa pisa no calendário de uma frente que NÃO está
   * sendo mostrada.
   *
   * Num projeto sinérgico a etapa vale para as duas frentes, mas o calendário
   * na tela é o de uma só. Sem este aviso, o coordenador pintaria por cima da
   * semana de provas de Tech enquanto olha o calendário de Business e nunca
   * saberia — que é exatamente o caso que o aviso existe para pegar.
   */
  const conflitosDeFrente = useMemo(() => {
    if (!dados || !escopo) return [];
    const outras = dados.dias_nao_uteis.filter(
      (d) => d.frente_id !== null && d.frente_id !== escopo.frente_id,
    );
    if (outras.length === 0) return [];

    const nomeDaFrente = new Map(
      dados.escopos.map((e) => [e.frente_id, e.nome] as const),
    );
    const porDia = new Map<string, (typeof outras)[number]>();
    for (const d of outras) porDia.set(d.data.slice(0, 10), d);

    const achados: { data: string; etapa: string; frente: number; motivo: string }[] = [];
    for (const etapa of etapas) {
      for (const chave of diasDoIntervalo(etapa.data_inicio, etapa.data_fim)) {
        const conflito = porDia.get(chave);
        if (!conflito) continue;
        achados.push({
          data: chave,
          etapa: etapa.nome,
          frente: conflito.frente_id!,
          motivo: conflito.descricao ?? conflito.tipo,
        });
      }
    }
    return achados.map((c) => ({
      ...c,
      // O escopo daquela frente é o nome que o coordenador reconhece; a frente
      // em si não aparece em lugar nenhum desta tela.
      escopoDaOutraFrente: nomeDaFrente.get(c.frente) ?? "outra frente",
    }));
  }, [dados, escopo, etapas]);


  /** O pincel manda: pintar é editar a etapa ativa, então quem trava é o
   *  escopo DELA — não o que está escolhido no seletor. */
  const grupoDoPincel = grupos.find((g) => g.chave === grupoAtivo);
  const pincelTravado = !!grupoDoPincel?.oficializado;

  /** A frente do escopo dono da etapa no pincel — quem manda no que trava. */
  const frenteDoPincel = useMemo(
    () => dados?.escopos.find((e) => e.id === grupoDoPincel?.escopoId)?.frente_id ?? null,
    [dados, grupoDoPincel],
  );

  /**
   * O que IMPEDE pintar — e que não é a mesma coisa que o que aparece.
   *
   * Quem manda aqui é a frente da etapa no pincel, não a visão. No Geral o
   * calendário mostra a união das frentes, mas pintar uma etapa de Business
   * num dia que só é não útil em Tech continua legítimo: é exatamente o caso
   * que o aviso de conflito existe para sinalizar, não para proibir. Usar a
   * união como trava deixaria o Geral MAIS restrito que o escopo.
   */
  const diasBloqueados = useMemo(() => {
    const mapa = new Map(fimDeSemana);
    for (const dia of dados?.dias_nao_uteis ?? []) {
      if (dia.frente_id !== null && dia.frente_id !== frenteDoPincel) continue;
      mapa.set(dia.data.slice(0, 10), { tipo: dia.tipo, descricao: dia.descricao });
    }
    return mapa;
  }, [dados, frenteDoPincel, fimDeSemana]);


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
  function criarEtapa(nome: string, cor: string, escopoId: number) {
    setAviso("");
    setRascunhos((atual) => [...atual, { escopoId, nome, cor }]);
    setGrupoAtivo(`${escopoId}|${nome}|${cor}`);
    setCriandoEtapa(false);
  }

  /**
   * Apaga a etapa INTEIRA, com todos os seus trechos.
   *
   * O erro sobe para o modal mostrar; ele só fecha se deu certo.
   */
  /**
   * O que entra no PDF, segundo o escopo escolhido NO MODAL — não o da tela.
   *
   * Exportar "somente Análise Mercadológica" enquanto se olha o Geral tem que
   * produzir o PDF daquele escopo, e não uma foto do que está na tela.
   */
  const exportGeral = escopoExport === "geral";
  const etapasExport = useMemo(
    () => (exportGeral ? etapas : etapas.filter((e) => e.escopoId === escopoExport)),
    [etapas, exportGeral, escopoExport],
  );
  const marcosExport = useMemo(() => {
    if (exportGeral || !dados) return marcos;
    const doEscopo = dados.escopos.find((e) => e.id === escopoExport);
    const nome = doEscopo?.nome;
    // Kickoff é do projeto e fica em qualquer recorte; banca e entrega levam o
    // nome do escopo no título, que é como dá para separá-los aqui.
    return marcos.filter((m) => m.tipo === "kickoff" || (nome && m.titulo.includes(nome)));
  }, [marcos, exportGeral, escopoExport, dados]);
  const diasNaoUteisExport = useMemo(() => {
    if (exportGeral || !dados) return diasNaoUteis;
    const frente = dados.escopos.find((e) => e.id === escopoExport)?.frente_id;
    const mapa = new Map(fimDeSemana);
    for (const dia of dados.dias_nao_uteis) {
      if (dia.frente_id !== null && dia.frente_id !== frente) continue;
      mapa.set(dia.data.slice(0, 10), { tipo: dia.tipo, descricao: dia.descricao });
    }
    return mapa;
  }, [dados, exportGeral, escopoExport, diasNaoUteis, fimDeSemana]);

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

  /**
   * A entrega PLANEJADA do escopo selecionado.
   *
   * Fica aqui porque é decisão de cronograma: a §5.3 diz que ao fim da
   * ambientação o coordenador crava o cronograma do escopo, e a data de
   * entrega faz parte disso. Não confundir com a entrega REAL, que é registro
   * de execução e fica travada até a banca aprovar (§5.5).
   */
  async function salvarEntrega(valor: string) {
    if (!token || !escopo) return;
    setAviso("");
    try {
      await definirEntregaPlanejada(escopo.id, valor || null, token);
      await carregar();
    } catch (err) {
      setAviso(err instanceof Error ? err.message : "Erro ao definir a entrega");
    }
  }

  async function oficializar() {
    if (!token || !escopo) return;
    await oficializarCronograma(escopo.id, token);
    setConfirmandoOficializacao(false);
    await carregar();
  }

  async function pedirReajuste(motivo: string) {
    if (!token || !escopo) return;
    await solicitarReajuste(escopo.id, motivo, token);
    setSolicitandoReajuste(false);
    await carregar();
  }

  async function responderPedidoReajuste(aprovado: boolean, justificativa: string) {
    if (!token || !escopo?.reajuste_pendente) return;
    await responderReajuste(escopo.reajuste_pendente.id, aprovado, justificativa, token);
    setRespondendoReajuste(false);
    await carregar();
  }

  /**
   * Gera o PDF ou a imagem a partir de uma cópia FORA DA TELA com os meses
   * escolhidos.
   *
   * Não dá para rasterizar o calendário visível: ele mostra o recorte da visão
   * atual (um dia, se for o caso), e o §6.4 quer o cronograma de apresentação.
   * O erro sobe para o modal mostrar.
   */
  async function gerarPdf(
    mesesEscolhidos: Date[],
    escopoEscolhido: number | "geral",
    formato: "pdf" | "png",
  ) {
    setEscopoExport(escopoEscolhido);
    setMesesExport(mesesEscolhidos);
    // Dois frames: um para o React montar a área, outro para o navegador
    // aplicar o layout. Sem isso o html-to-image fotografa a folha em branco.
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );
    try {
      if (!areaExport.current) throw new Error("A área de exportação não montou");
      if (formato === "png") {
        await exportarPNG(areaExport.current, projeto.nome);
      } else {
        await exportarPDF(areaExport.current, projeto.nome);
      }
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
      {oficializado && !escopo!.reajuste_pendente && (
        <AvisoBanner>
          <Lock size={14} /> Cronograma oficializado em{" "}
          {formatarData(escopo!.cronograma_oficializado_em)}. Qualquer mudança agora exige uma
          solicitação de reajuste aprovada pela diretoria.
          {podeEditar && (
            <PageButton type="button" $variant="outline" onClick={() => setSolicitandoReajuste(true)}>
              Solicitar reajuste
            </PageButton>
          )}
        </AvisoBanner>
      )}

      {oficializado && escopo!.reajuste_pendente && (
        <AvisoBanner>
          <Lock size={14} />{" "}
          {podeAprovarReajuste
            ? "Há um pedido de reajuste de cronograma esperando sua resposta."
            : `Pedido de reajuste enviado em ${formatarData(escopo!.reajuste_pendente.criado_em)} — aguardando aprovação da diretoria.`}
          {podeAprovarReajuste && (
            <PageButton type="button" $variant="outline" onClick={() => setRespondendoReajuste(true)}>
              Ver pedido
            </PageButton>
          )}
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

        <FieldSelect
          value={String(escopoSelecionado)}
          onChange={(e) => {
            setEscopoSelecionado(e.target.value === "geral" ? "geral" : Number(e.target.value));
            setGrupoAtivo(null);
          }}
          aria-label="Escopo"
        >
          {/* Geral junta tudo: etapas, marcos e os dias não úteis de todas as
              frentes. Escolher um escopo estreita a tela para o que é dele. */}
          <option value="geral">Geral — o projeto inteiro</option>
          {dados.escopos.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nome}
            </option>
          ))}
        </FieldSelect>

        {podeEditar && escopo && (
          <FieldEntrega>
            <span>Entrega</span>
            <input
              type="date"
              value={escopo.data_entrega_planejada?.slice(0, 10) ?? ""}
              disabled={oficializado}
              title={
                oficializado
                  ? "Cronograma oficializado: mudar exige reajuste aprovado pela diretoria"
                  : `Entrega planejada de ${escopo.nome}`
              }
              onChange={(e) => salvarEntrega(e.target.value)}
            />
          </FieldEntrega>
        )}

        {podeEditar &&
          !oficializado &&
          dados.escopos.some((e) => !e.cronograma_oficializado_em) && (
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

        {podeEditar && escopo && !oficializado && etapas.length > 0 && escopo.banca && (
          <BotaoBarra type="button" $variant="outline" onClick={() => setConfirmandoOficializacao(true)}>
            <Lock size={14} />
            Oficializar
          </BotaoBarra>
        )}

        {/* Exportar é a única ação da matriz liberada ao consultor — o
            botão não fica atrás de `pode()`. */}
        <BotaoBarra type="button" $variant="ghost" onClick={() => setExportandoPdf(true)}>
          <Download size={14} />
          Exportar
        </BotaoBarra>
      </Barra>

      {aviso && <FormErrorText>{aviso}</FormErrorText>}

      {/* O calendário na tela é o de uma frente só, mas a etapa vale para as
          duas. Este banner é o único lugar em que o conflito com a frente
          escondida aparece. */}
      {conflitosDeFrente.length > 0 && (
        <AvisoBanner>
          <Lock size={14} />
          <span>
            {conflitosDeFrente.length} {conflitosDeFrente.length === 1 ? "dia pintado cai" : "dias pintados caem"}{" "}
            em calendário de outra frente do projeto, que não aparece nesta visão:{" "}
            {[
              ...new Set(
                conflitosDeFrente.map(
                  (c) => `${formatarData(c.data)} (${c.motivo}, ${c.escopoDaOutraFrente})`,
                ),
              ),
            ].join(" · ")}
          </span>
        </AvisoBanner>
      )}

      <CronogramaLayout>
        <PaintedCalendar
          blocos={blocos}
          visao={visao}
          etapas={etapas}
          marcos={marcos}
          faixas={faixas}
          diasNaoUteis={diasNaoUteis}
          diasBloqueados={diasBloqueados}
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
            const periodo = todasAsFaixas.find(
              (f) => f.tipo === "escopo" && f.projeto_escopo_id === esc.id,
            );
            return (
              <LegendaGrupo key={esc.id}>
                <LegendaTitulo>{esc.nome}</LegendaTitulo>
                {/* ⭐ A janela do §5.4, antes das etapas: é dentro dela que
                    elas são pintadas. Sem período, o escopo ainda não teve
                    reunião inicial — e é isso que a linha diz. */}
                {periodo ? (
                  <LegendaItem as="div">
                    <Amostra $cor={periodo.cor} />
                    <LegendaTexto>
                      <strong>período do escopo</strong>
                      <small>
                        {semAno(periodo.inicio)} – {semAno(periodo.fim)} · reunião inicial → banca
                      </small>
                    </LegendaTexto>
                  </LegendaItem>
                ) : (
                  <EmptyText>
                    Sem período: registre a reunião inicial na aba Reuniões (a banca já precisa
                    ter data).
                  </EmptyText>
                )}
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
                        {grupo.trechos.map((t) => {
                          // Dias ÚTEIS, não corridos: é a unidade em que o
                          // escopo é vendido e em que o atraso é medido (§5.4).
                          const uteis = diasDoIntervalo(t.data_inicio, t.data_fim).filter(
                            (d) => !diasNaoUteis.has(d),
                          ).length;
                          return (
                            <small key={t.id}>
                              {semAno(t.data_inicio)} – {semAno(t.data_fim)} · {uteis}{" "}
                              {uteis === 1 ? "dia útil" : "dias úteis"}
                            </small>
                          );
                        })}
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
              etapas={etapasExport}
              marcos={marcosExport}
              faixas={faixas}
              diasNaoUteis={diasNaoUteisExport}
              grupoAtivo={null}
              somenteLeitura
              onPaintRange={() => {}}
            />
            <LegendaBox>
              {dados.escopos.map((esc) => {
                const doEscopo = grupos.filter((g) => g.escopoId === esc.id);
                const periodo = todasAsFaixas.find(
                  (f) => f.tipo === "escopo" && f.projeto_escopo_id === esc.id,
                );
                if (doEscopo.length === 0 && !periodo) return null;
                return (
                  <LegendaGrupo key={esc.id}>
                    <LegendaTitulo>{esc.nome}</LegendaTitulo>
                    {periodo && (
                      <LegendaItem as="div">
                        <Amostra $cor={periodo.cor} />
                        <LegendaTexto>
                          <strong>período do escopo</strong>
                          <small>
                            {formatarData(periodo.inicio)} – {formatarData(periodo.fim)}
                          </small>
                        </LegendaTexto>
                      </LegendaItem>
                    )}
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
          meses={
            // Sem semestre cadastrado, o recorte padrão é a janela inteira —
            // melhor oferecer demais que não oferecer nada.
            dados.semestre
              ? mesesDaJanela(dados.semestre.inicio, dados.semestre.fim)
              : mesesDaJanela(janela.inicio, janela.fim)
          }
          mesesExtras={mesesDaJanela(janela.inicio, janela.fim)}
          escopos={dados.escopos.map((e) => ({ id: e.id, nome: e.nome }))}
          escopoAtual={escopoSelecionado}
          onCancelar={() => setExportandoPdf(false)}
          onExportar={gerarPdf}
        />
      )}

      {criandoEtapa && (
        <NovaEtapaModal
          corInicial={corSugerida(etapas.length)}
          escopos={dados.escopos
            .filter((e) => !e.cronograma_oficializado_em)
            .map((e) => ({ id: e.id, nome: e.nome }))}
          escopoFixo={escopo?.id ?? null}
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

      {confirmandoOficializacao && (
        <ConfirmarModal
          titulo="Oficializar cronograma"
          mensagem="Oficializar trava o cronograma: qualquer mudança passa a exigir reajuste aprovado pela diretoria. Confirma?"
          rotuloConfirmar="Oficializar"
          onCancelar={() => setConfirmandoOficializacao(false)}
          onConfirmar={oficializar}
        />
      )}

      {solicitandoReajuste && escopo && (
        <SolicitarReajusteModal
          nomeEscopo={escopo.nome}
          onCancelar={() => setSolicitandoReajuste(false)}
          onSolicitar={pedirReajuste}
        />
      )}

      {respondendoReajuste && escopo?.reajuste_pendente && (
        <ResponderReajusteModal
          nomeEscopo={escopo.nome}
          motivo={escopo.reajuste_pendente.motivo}
          solicitadoPorNome={escopo.reajuste_pendente.solicitado_por_nome ?? "Alguém"}
          onCancelar={() => setRespondendoReajuste(false)}
          onResponder={responderPedidoReajuste}
        />
      )}
    </PageStack>
  );
}
