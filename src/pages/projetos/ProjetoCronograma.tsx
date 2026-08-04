import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Download, Lock, Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  createEtapa,
  getCronograma,
  mesesDaJanela,
  moverEtapa,
  oficializarCronograma,
} from "@/lib/cronograma";
import { formatarData } from "@/lib/projetos";
import { corSugerida, COR_AMBIENTACAO, COR_PAUSA } from "@/components/cronograma-pintado/cores";
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
  ContadorDias,
  CronogramaLayout,
  LegendaBox,
  LegendaGrupo,
  LegendaItem,
  LegendaTexto,
  LegendaTitulo,
  PincelAtivo,
} from "@/components/cronograma-pintado/PaintedCalendar.styled";
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
import { useProjeto } from "./ProjetoPage";

/** Os glifos do §6.4 — glifo + cor, nunca cor sozinha: o export costuma ser
 *  impresso em preto-e-branco. */
const GLIFOS = {
  banca: "★",
  entrega: "●",
  kickoff: "🏁",
  reuniao_alinhamento: "▲",
  visita_presencial: "◆",
} as const;

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

  const podeEditar = pode(usuario, "definir_cronograma");

  const carregar = useCallback(async () => {
    if (!token) return;
    setErro("");
    try {
      const resposta = await getCronograma(projeto.id, token);
      setDados(resposta);
      setEscopoSelecionado((atual) => atual ?? resposta.escopos[0]?.id ?? null);
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

  /** ★ banca, ● entrega e 🏁 kickoff são LIDOS de onde já vivem — não há
   *  linha de marco para eles. */
  const marcos = useMemo<MarcoRenderizavel[]>(() => {
    if (!dados) return [];
    const lista: MarcoRenderizavel[] = [];
    if (dados.data_kickoff) {
      lista.push({
        data: dados.data_kickoff.slice(0, 10),
        glifo: GLIFOS.kickoff,
        titulo: "Kickoff",
      });
    }
    for (const e of dados.escopos) {
      if (e.banca?.data_hora) {
        lista.push({
          data: e.banca.data_hora.slice(0, 10),
          glifo: GLIFOS.banca,
          titulo: `Banca — ${e.nome}`,
        });
      }
      const entrega = e.data_entrega_real ?? e.data_entrega_planejada;
      if (entrega) {
        lista.push({
          data: entrega.slice(0, 10),
          glifo: GLIFOS.entrega,
          titulo: `Entrega — ${e.nome}`,
        });
      }
    }
    for (const m of dados.marcos) {
      lista.push({
        data: m.data.slice(0, 10),
        glifo: GLIFOS[m.tipo],
        titulo: m.nota ?? (m.tipo === "reuniao_alinhamento" ? "Reunião de alinhamento" : "Visita"),
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

  const meses = useMemo(
    () => (dados ? mesesDaJanela(dados.janela.inicio, dados.janela.fim) : []),
    [dados],
  );

  const etapas = escopo?.etapas ?? [];

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

  async function novaEtapa() {
    if (!token || !escopo) return;
    const nome = prompt("Nome da etapa (ex.: Pesquisa, Entrevistas, Diagnóstico)");
    if (!nome?.trim()) return;
    // `toISOString()` é UTC — à noite no Brasil já virou o dia seguinte lá.
    // A etapa nova nasceria com a data errada.
    const hoje = format(new Date(), "yyyy-MM-dd");
    setAviso("");
    try {
      await createEtapa(
        escopo.id,
        { nome: nome.trim(), cor: corSugerida(etapas.length), data_inicio: hoje, data_fim: hoje },
        token,
      );
      await carregar();
    } catch (err) {
      setAviso(err instanceof Error ? err.message : "Erro ao criar a etapa");
    }
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
        ⚠ Marque o kickoff na aba <Link to={`/projetos/${projeto.id}`}>Visão geral</Link> para montar
        o cronograma — é ele que dá o ponto de partida da contagem.
      </AvisoBanner>
    );
  }

  if (dados.escopos.length === 0) {
    return <EmptyText>Cadastre um escopo vendido antes de montar o cronograma.</EmptyText>;
  }

  const etapaDoPincel = etapas.find((e) => e.id === etapaAtiva);
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
          <PageButtonSm type="button" $variant="outline" onClick={novaEtapa}>
            <Plus size={14} />
            Nova etapa
          </PageButtonSm>
        )}

        {etapaDoPincel ? (
          <PincelAtivo $cor={etapaDoPincel.cor}>
            🖌 pintando: {etapaDoPincel.nome}
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

        {/* Exportar é a única ação da matriz em que o consultor tem ✅ — o
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
          meses={meses}
          etapas={etapas}
          marcos={marcos}
          faixas={faixas}
          diasNaoUteis={diasNaoUteis}
          etapaAtiva={etapaAtiva}
          somenteLeitura={!podeEditar || oficializado}
          onPaintRange={aoPintar}
          onArrasteMudou={setPreviewIntervalo}
        />

        <LegendaBox>
          <LegendaGrupo>
            <LegendaTitulo>Etapas</LegendaTitulo>
            {etapas.length === 0 && <EmptyText>Nenhuma etapa ainda.</EmptyText>}
            {etapas.map((etapa) => (
              <LegendaItem
                key={etapa.id}
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
            ))}
          </LegendaGrupo>

          <LegendaGrupo>
            <LegendaTitulo>Marcos</LegendaTitulo>
            <LegendaItem as="div">
              {GLIFOS.banca} <LegendaTexto>banca</LegendaTexto>
            </LegendaItem>
            <LegendaItem as="div">
              {GLIFOS.entrega} <LegendaTexto>entrega</LegendaTexto>
            </LegendaItem>
            <LegendaItem as="div">
              {GLIFOS.kickoff} <LegendaTexto>kickoff</LegendaTexto>
            </LegendaItem>
            <LegendaItem as="div">
              {GLIFOS.reuniao_alinhamento} <LegendaTexto>reunião de alinhamento</LegendaTexto>
            </LegendaItem>
            <LegendaItem as="div">
              {GLIFOS.visita_presencial} <LegendaTexto>visita presencial</LegendaTexto>
            </LegendaItem>
          </LegendaGrupo>

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
    </PageStack>
  );
}
