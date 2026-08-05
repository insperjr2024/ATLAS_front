import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format, isToday } from "date-fns";
import { WeekdayCell } from "@/components/calendario/CalendarGrid.styled";
import { chaveData } from "@/components/calendario/semanas";
import {
  COR_MARCO,
  fundoDiagonal,
  TEXTO_SOBRE_DIVIDIDA,
  tonsDaCor,
  type TipoMarco,
} from "./cores";
import {
  BlocoMes,
  CabecalhoDias,
  CronogramaScroll,
  DetalheCelula,
  LinhaDias,
  MarcoBox,
  MarcosDoDia,
  NumeroDia,
  PaintedDayCell,
  TituloMes,
} from "./PaintedCalendar.styled";
import type { BlocoCalendario, Visao } from "./visao";

export interface EtapaPintavel {
  id: number;
  nome: string;
  cor: string;
  data_inicio: string;
  data_fim: string;
  ordem: number;
}

export interface MarcoRenderizavel {
  /** Chave `yyyy-MM-dd`. */
  data: string;
  tipo: TipoMarco;
  /** O nome curto do box na visão de mês, onde não cabe o título inteiro. */
  rotulo: string;
  /** O nome completo — no box das visões maiores e no `title` da célula. */
  titulo: string;
}

export interface FaixaDerivada {
  tipo: "ambientacao" | "pausa";
  inicio: string;
  fim: string;
  rotulo: string;
  cor: string;
}

export interface DiaNaoUtil {
  tipo: string;
  descricao: string | null;
}

interface PaintedCalendarProps {
  /** Os blocos a renderizar, já derivados pela página (ver `visao.ts`). */
  blocos: BlocoCalendario[];
  /** Manda na altura da célula e em quanto detalhe cabe dentro dela. */
  visao: Visao;
  etapas: EtapaPintavel[];
  marcos: MarcoRenderizavel[];
  faixas: FaixaDerivada[];
  /** Chave `yyyy-MM-dd` para o motivo. Vem do backend: `dias_uteis.py` é a
   *  definição única, e recalcular fim de semana aqui divergiria no dia em
   *  que a diretoria carregar um recesso. */
  diasNaoUteis: Map<string, DiaNaoUtil>;
  /** A etapa do "pintando: X". `null` = cursor de leitura. */
  etapaAtiva: number | null;
  somenteLeitura?: boolean;
  onPaintRange: (etapaId: number, inicio: string, fim: string) => void;
  /** Notifica o intervalo em construção, para a barra mostrar a contagem. */
  onArrasteMudou?: (intervalo: { inicio: string; fim: string } | null) => void;
}

interface Arraste {
  etapaId: number;
  ancora: string;
  hover: string;
}

/** Uma fatia da célula: uma etapa (ou a faixa derivada) que reivindica o dia. */
interface DonoDoDia {
  fundo: string;
  texto: string;
  nome: string;
}

/**
 * O calendário pintável do §6.4 — meses empilhados, seg–dom, arrastar para
 * pintar um intervalo.
 *
 * Controlado e sem fetch próprio de propósito: é o que o torna testável e o
 * que faz o export ser determinístico.
 */
export function PaintedCalendar({
  blocos,
  visao,
  etapas,
  marcos,
  faixas,
  diasNaoUteis,
  etapaAtiva,
  somenteLeitura,
  onPaintRange,
  onArrasteMudou,
}: PaintedCalendarProps) {
  const [arraste, setArraste] = useState<Arraste | null>(null);
  const rafRef = useRef<number | null>(null);
  const arrasteRef = useRef<Arraste | null>(null);
  arrasteRef.current = arraste;

  const marcosPorDia = useMemo(() => {
    const mapa = new Map<string, MarcoRenderizavel[]>();
    for (const m of marcos) {
      const lista = mapa.get(m.data) ?? [];
      lista.push(m);
      mapa.set(m.data, lista);
    }
    return mapa;
  }, [marcos]);

  /**
   * Funde as etapas persistidas com uma etapa **virtual** montada do arraste.
   * O renderizador da célula não sabe a diferença — só pergunta "quem é dona
   * desta data?". É isso que faz o preview aparecer sem estado duplicado.
   */
  /**
   * Quem são os donos de cada dia — uma LISTA, não um vencedor.
   *
   * Duas etapas no mesmo dia dividem a célula em fatias diagonais (ver
   * `fundoDiagonal`). O campo `ordem` deixou de ser desempate de sobreposição
   * e passou a ser a ORDEM DAS FATIAS, a mesma da legenda, para o olho casar
   * as duas sem esforço.
   */
  const donosDoDia = useMemo(() => {
    const porDia = new Map<string, DonoDoDia[]>();

    const acrescentar = (inicio: string, fim: string, cor: string, nome: string) => {
      const tons = tonsDaCor(cor);
      for (const chave of diasDoIntervalo(inicio, fim)) {
        const lista = porDia.get(chave) ?? [];
        lista.push({ fundo: tons.fundo, texto: tons.texto, nome });
        porDia.set(chave, lista);
      }
    };

    for (const etapa of [...etapas].sort((a, b) => a.ordem - b.ordem)) {
      acrescentar(etapa.data_inicio, etapa.data_fim, etapa.cor, etapa.nome);
    }

    // A etapa em arrasto entra como mais uma fatia nos dias que ainda não são
    // dela — o preview mostra o resultado real do drop, não uma cor por cima.
    const preview = new Set<string>();
    if (arraste) {
      const etapa = etapas.find((e) => e.id === arraste.etapaId);
      if (etapa) {
        const inicio = arraste.ancora <= arraste.hover ? arraste.ancora : arraste.hover;
        const fim = arraste.ancora <= arraste.hover ? arraste.hover : arraste.ancora;
        const tons = tonsDaCor(etapa.cor);
        for (const chave of diasDoIntervalo(inicio, fim)) {
          preview.add(chave);
          const lista = porDia.get(chave) ?? [];
          if (!lista.some((d) => d.nome === etapa.nome)) {
            lista.push({ fundo: tons.fundo, texto: tons.texto, nome: etapa.nome });
            porDia.set(chave, lista);
          }
        }
      }
    }

    // Faixas derivadas ficam por BAIXO: só pintam o dia que nenhuma etapa
    // reivindicou. Ambientação como fatia ao lado de uma etapa seria ruído —
    // ela é contexto do projeto, não trabalho planejado.
    for (const faixa of faixas) {
      const tons = tonsDaCor(faixa.cor);
      for (const chave of diasDoIntervalo(faixa.inicio, faixa.fim)) {
        if (!porDia.has(chave)) {
          porDia.set(chave, [{ fundo: tons.fundo, texto: tons.texto, nome: faixa.rotulo }]);
        }
      }
    }

    return { porDia, preview };
  }, [etapas, faixas, arraste]);

  const pintavel = useCallback(
    (chave: string) => !somenteLeitura && etapaAtiva !== null && !diasNaoUteis.has(chave),
    [somenteLeitura, etapaAtiva, diasNaoUteis],
  );

  function iniciarArraste(e: React.PointerEvent<HTMLDivElement>, chave: string) {
    if (!pintavel(chave) || e.button !== 0) return;
    // Mata a seleção de texto nativa sobre a grade.
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setArraste({ etapaId: etapaAtiva!, ancora: chave, hover: chave });
  }

  // pointermove/up ficam na WINDOW: o ponteiro sai da célula o tempo todo
  // durante um arrasto, e com pointer capture `e.target` deixa de ajudar.
  useEffect(() => {
    if (!arraste) return;

    function aoMover(e: PointerEvent) {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        // Hit-test por `data-dia`: `elementFromPoint` porque `e.target` é o
        // elemento capturador durante todo o arrasto.
        const alvo = document
          .elementFromPoint(e.clientX, e.clientY)
          ?.closest<HTMLElement>("[data-dia]");
        const chave = alvo?.dataset.dia;
        // Sem alvo (ponteiro na legenda, no vão entre meses, fora da janela)
        // MANTÉM o último hover — senão o preview pisca a cada borda.
        if (!chave) return;
        setArraste((atual) => (atual && atual.hover !== chave ? { ...atual, hover: chave } : atual));
      });
    }

    function aoSoltar(e: PointerEvent) {
      const atual = arrasteRef.current;
      setArraste(null);
      onArrasteMudou?.(null);
      if (!atual) return;

      // Atenção: hit-test do ponto FINAL aqui, e não confiar só no `hover`: num
      // arrasto rápido o último `pointermove` pode ter sido descartado pelo
      // throttle de rAF, e o intervalo sairia curto — a etapa terminaria
      // antes de onde o dedo soltou.
      const alvoFinal = document
        .elementFromPoint(e.clientX, e.clientY)
        ?.closest<HTMLElement>("[data-dia]");
      const fimReal = alvoFinal?.dataset.dia ?? atual.hover;

      const bruto =
        atual.ancora <= fimReal
          ? { inicio: atual.ancora, fim: fimReal }
          : { inicio: fimReal, fim: atual.ancora };
      const aparado = apararPontas(bruto.inicio, bruto.fim, diasNaoUteis);
      if (!aparado) return; // intervalo inteiro em dia não útil: aborta calado
      onPaintRange(atual.etapaId, aparado.inicio, aparado.fim);
    }

    window.addEventListener("pointermove", aoMover);
    window.addEventListener("pointerup", aoSoltar);
    window.addEventListener("pointercancel", aoSoltar);
    return () => {
      window.removeEventListener("pointermove", aoMover);
      window.removeEventListener("pointerup", aoSoltar);
      window.removeEventListener("pointercancel", aoSoltar);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [arraste, diasNaoUteis, onPaintRange, onArrasteMudou]);

  // Avisa a barra do intervalo em construção, para a contagem viva.
  useEffect(() => {
    if (!arraste) return;
    const inicio = arraste.ancora <= arraste.hover ? arraste.ancora : arraste.hover;
    const fim = arraste.ancora <= arraste.hover ? arraste.hover : arraste.ancora;
    onArrasteMudou?.({ inicio, fim });
  }, [arraste, onArrasteMudou]);

  // Nas células grandes (semana e dia) sobra espaço para dizer de quem é o dia
  // por escrito, em vez de depender só da cor e da legenda ao lado.
  const detalhado = visao !== "mes";

  return (
    <CronogramaScroll data-cronograma-export>
      {blocos.map((bloco) => {
        const colunas = bloco.rotulos.length || bloco.linhas[0]?.length || 1;
        return (
          <BlocoMes key={bloco.chave}>
            <TituloMes>{bloco.titulo}</TituloMes>
            {bloco.rotulos.length > 0 && (
              <CabecalhoDias $colunas={colunas}>
                {bloco.rotulos.map((rotulo) => (
                  <WeekdayCell key={rotulo}>{rotulo}</WeekdayCell>
                ))}
              </CabecalhoDias>
            )}
            {bloco.linhas.map((linha, indiceLinha) => (
              <LinhaDias key={`${bloco.chave}-${indiceLinha}`} $colunas={colunas}>
                {linha.map((dia, indiceColuna) => {
                  // `null` é preenchimento de mês vizinho: com os meses
                  // empilhados a mesma data cairia em DOIS blocos.
                  if (!dia) {
                    return (
                      <PaintedDayCell
                        key={`${bloco.chave}-${indiceLinha}-${indiceColuna}`}
                        $vazia
                        $visao={visao}
                      />
                    );
                  }

                  const chave = chaveData(dia);
                  const naoUtil = diasNaoUteis.get(chave);
                  const donos = donosDoDia.porDia.get(chave) ?? [];
                  // Uma dona = cor chapada; várias = fatias diagonais.
                  const fundo = donos.length
                    ? fundoDiagonal(donos.map((d) => d.fundo))
                    : undefined;
                  // Com a célula dividida, nenhuma cor da paleta serve para
                  // todas as fatias — cai no cinza-escuro neutro.
                  const corTexto =
                    donos.length === 1
                      ? donos[0].texto
                      : donos.length > 1
                        ? TEXTO_SOBRE_DIVIDIDA
                        : undefined;
                  const marcosDoDia = marcosPorDia.get(chave) ?? [];
                  const rotuloDoNaoUtil = naoUtil
                    ? `${rotuloNaoUtil(naoUtil.tipo)}${naoUtil.descricao ? ` — ${naoUtil.descricao}` : ""}`
                    : null;

                  return (
                    <PaintedDayCell
                      key={chave}
                      data-dia={chave}
                      $visao={visao}
                      $naoUtil={!!naoUtil}
                      $cor={fundo}
                      $texto={corTexto}
                      $preview={donosDoDia.preview.has(chave)}
                      $pintavel={pintavel(chave)}
                      title={
                        rotuloDoNaoUtil ??
                        ([...donos.map((d) => d.nome), ...marcosDoDia.map((m) => m.titulo)].join(
                          " · ",
                        ) ||
                          undefined)
                      }
                      onPointerDown={(e) => iniciarArraste(e, chave)}
                    >
                      <NumeroDia $texto={corTexto} $hoje={isToday(dia)}>
                        {format(dia, "d")}
                      </NumeroDia>

                      {/* O nome da etapa só onde cabe; no mês a cor + legenda
                          fazem esse trabalho e o espaço é do box de marco.
                          Com o dia dividido, lista TODAS as donas — é a única
                          forma de saber quem é cada fatia sem contar cor. */}
                      {detalhado && !rotuloDoNaoUtil && donos.length > 0 && (
                        <DetalheCelula $texto={corTexto}>
                          {donos.map((d) => (
                            <strong key={d.nome}>{d.nome}</strong>
                          ))}
                        </DetalheCelula>
                      )}
                      {detalhado && rotuloDoNaoUtil && (
                        <DetalheCelula>
                          <small>{rotuloDoNaoUtil}</small>
                        </DetalheCelula>
                      )}

                      {marcosDoDia.length > 0 && (
                        <MarcosDoDia>
                          {marcosDoDia.map((m) => (
                            <MarcoBox
                              key={`${m.tipo}-${m.titulo}`}
                              $borda={COR_MARCO.borda}
                              $fundo={COR_MARCO.fundo}
                              $texto={COR_MARCO.texto}
                              title={m.titulo}
                            >
                              {detalhado ? m.titulo : m.rotulo}
                            </MarcoBox>
                          ))}
                        </MarcosDoDia>
                      )}
                    </PaintedDayCell>
                  );
                })}
              </LinhaDias>
            ))}
          </BlocoMes>
        );
      })}
    </CronogramaScroll>
  );
}

const ROTULOS_NAO_UTIL: Record<string, string> = {
  fim_de_semana: "Fim de semana",
  feriado: "Feriado",
  prova: "Semana de provas",
  recesso: "Recesso",
};

function rotuloNaoUtil(tipo: string): string {
  return ROTULOS_NAO_UTIL[tipo] ?? "Dia não letivo";
}

/**
 * As chaves `yyyy-MM-dd` de um intervalo fechado.
 *
 * O `T12:00:00` é deliberado: `new Date("2026-08-10")` é lido como UTC e
 * volta um dia no Brasil. Meio-dia local não escorrega em nenhum fuso.
 */
export function diasDoIntervalo(inicio: string, fim: string): string[] {
  const dias: string[] = [];
  const atual = new Date(`${inicio}T12:00:00`);
  const limite = new Date(`${fim}T12:00:00`);
  while (atual <= limite) {
    dias.push(chaveData(atual));
    atual.setDate(atual.getDate() + 1);
  }
  return dias;
}

/**
 * Caminha as pontas para dentro até o primeiro/último dia útil.
 *
 * Uma etapa que "começa no sábado" envenena o `contar_dias_uteis` do
 * monitoramento depois — o intervalo gravado tem que ser honesto.
 */
export function apararPontas(
  inicio: string,
  fim: string,
  diasNaoUteis: Map<string, unknown>,
): { inicio: string; fim: string } | null {
  const uteis = diasDoIntervalo(inicio, fim).filter((d) => !diasNaoUteis.has(d));
  if (uteis.length === 0) return null;
  return { inicio: uteis[0], fim: uteis[uteis.length - 1] };
}
