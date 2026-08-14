import { useMemo, useRef, useState } from "react";
import { EmptyText, PageButtonSm } from "@/styles/page.styled";
import { exportarPDF } from "@/components/cronograma-pintado/exportar";
import type { DesempenhoRelatorio, DesempenhoRelatorioLote, DesempenhoTipo } from "@/types/desempenho";
import {
  ComentarioItem,
  ComentariosList,
  CriterioLabel,
  CriterioRow,
  CriteriosList,
  LoteFiltroChip,
  LoteFiltroRow,
  NotaGeralCirculo,
  NotaGeralLabel,
  NotaGeralQuantidade,
  NotaGeralRow,
  RelatorioConteudo,
  RelatorioPessoaHeader,
  RelatorioPessoaMeta,
  RelatorioPessoaNome,
  RelatorioStack,
  RelatorioTopoRow,
  RespostaTextoBlock,
  SectionTitle,
  StarBarFill,
  StarBarRow,
  StarBarTrack,
  StarBarValue,
  TipoTabBar,
  TipoTabButton,
} from "./RelatorioDesempenho.styled";

const TIPOS: { valor: DesempenhoTipo; rotulo: string }[] = [
  { valor: "periodico", rotulo: "Periódica" },
  { valor: "finalizacao", rotulo: "Finalização" },
];

// Regra 2.9: nota < 3 é sinalizada (atenção), >= 3 fica neutra, é o que
// deixa escanear o painel sem ler número por número.
function ehAtencao(nota: number | null): boolean {
  return nota !== null && nota < 3;
}

function StarBar({ value }: { value: number | null }) {
  const atencao = ehAtencao(value);
  const percent = value != null ? (value / 5) * 100 : 0;
  return (
    <StarBarRow>
      <StarBarTrack>
        <StarBarFill $percent={percent} $atencao={atencao} />
      </StarBarTrack>
      <StarBarValue $atencao={atencao}>{value != null ? value.toFixed(1) : "—"}</StarBarValue>
    </StarBarRow>
  );
}

function mesclarLotes(lotes: DesempenhoRelatorioLote[]): DesempenhoRelatorioLote {
  const totalAvaliadores = lotes.reduce((soma, l) => soma + l.quantidade_avaliadores, 0);
  const somaNotaGeral = lotes.reduce(
    (soma, l) => soma + (l.nota_geral_media ?? 0) * l.quantidade_avaliadores,
    0,
  );

  const criteriosPorId = new Map<number, { label: string; tipo_resposta: "nota" | "texto"; somaNota: number; pesoNota: number; respostas_texto: string[] }>();
  for (const lote of lotes) {
    for (const criterio of lote.criterios) {
      const atual = criteriosPorId.get(criterio.criterio_id) ?? {
        label: criterio.label,
        tipo_resposta: criterio.tipo_resposta,
        somaNota: 0,
        pesoNota: 0,
        respostas_texto: [],
      };
      if (criterio.tipo_resposta === "nota" && criterio.nota_media != null) {
        atual.somaNota += criterio.nota_media * lote.quantidade_avaliadores;
        atual.pesoNota += lote.quantidade_avaliadores;
      }
      atual.respostas_texto.push(...criterio.respostas_texto);
      criteriosPorId.set(criterio.criterio_id, atual);
    }
  }

  return {
    lote_id: -1,
    lote_nome: "Média geral",
    tipo: lotes[0]?.tipo ?? null,
    nota_geral_media: totalAvaliadores > 0 ? somaNotaGeral / totalAvaliadores : null,
    quantidade_avaliadores: totalAvaliadores,
    criterios: Array.from(criteriosPorId.entries()).map(([criterio_id, c]) => ({
      criterio_id,
      label: c.label,
      tipo_resposta: c.tipo_resposta,
      nota_media: c.pesoNota > 0 ? c.somaNota / c.pesoNota : null,
      respostas_texto: c.respostas_texto,
    })),
    comentarios: lotes.flatMap((l) => l.comentarios),
  };
}

const ROTULO_PAPEL: Record<string, string> = {
  diretor: "Diretor(a)",
  gerente: "Gerente de frente",
  coordenador: "Coordenador(a)",
  consultor: "Consultor(a)",
};

interface RelatorioDesempenhoProps {
  relatorio: DesempenhoRelatorio;
  /** Cabeçalho "Fulano, Coordenador(a) · Projeto Alfa, Projeto Beta", opcional
   * porque nem todo lugar que usa este componente sabe o papel/projetos de
   * quem está sendo mostrado. */
  pessoa?: { nome: string; posicao?: string; projetos?: string[] };
}

export function RelatorioDesempenho({ relatorio, pessoa }: RelatorioDesempenhoProps) {
  const [tipoAtivo, setTipoAtivo] = useState<DesempenhoTipo>("periodico");
  const [loteIdFiltro, setLoteIdFiltro] = useState<number | null>(null);
  const [exportando, setExportando] = useState(false);
  const conteudoRef = useRef<HTMLDivElement>(null);

  async function handleExportarPDF() {
    if (!conteudoRef.current) return;
    setExportando(true);
    try {
      await exportarPDF(conteudoRef.current, pessoa?.nome ?? "relatorio", "relatorio-desempenho");
    } finally {
      setExportando(false);
    }
  }

  const lotesDoTipo = useMemo(
    () => relatorio.lotes.filter((l) => l.tipo === tipoAtivo),
    [relatorio.lotes, tipoAtivo],
  );

  const loteExibido = useMemo(() => {
    if (lotesDoTipo.length === 0) return null;
    if (loteIdFiltro != null) {
      return lotesDoTipo.find((l) => l.lote_id === loteIdFiltro) ?? mesclarLotes(lotesDoTipo);
    }
    return lotesDoTipo.length > 1 ? mesclarLotes(lotesDoTipo) : lotesDoTipo[0];
  }, [lotesDoTipo, loteIdFiltro]);

  return (
    <RelatorioStack>
      <RelatorioTopoRow>
        <PageButtonSm type="button" $variant="outline" onClick={handleExportarPDF} disabled={exportando}>
          {exportando ? "Gerando PDF..." : "Baixar PDF"}
        </PageButtonSm>
      </RelatorioTopoRow>

      <RelatorioConteudo ref={conteudoRef}>
      {pessoa && (
        <RelatorioPessoaHeader>
          <RelatorioPessoaNome>{pessoa.nome}</RelatorioPessoaNome>
          {(pessoa.posicao || (pessoa.projetos && pessoa.projetos.length > 0)) && (
            <RelatorioPessoaMeta>
              {pessoa.posicao && (ROTULO_PAPEL[pessoa.posicao] ?? pessoa.posicao)}
              {pessoa.posicao && pessoa.projetos && pessoa.projetos.length > 0 && " · "}
              {pessoa.projetos && pessoa.projetos.join(", ")}
            </RelatorioPessoaMeta>
          )}
        </RelatorioPessoaHeader>
      )}

      {/* Sempre as duas abas, mesmo sem avaliação daquele tipo ainda, perder
          a aba faria perder a informação de qual tipo é aquela nota. */}
      <TipoTabBar role="tablist">
        {TIPOS.map((t) => (
          <TipoTabButton
            key={t.valor}
            type="button"
            role="tab"
            $active={tipoAtivo === t.valor}
            aria-selected={tipoAtivo === t.valor}
            onClick={() => {
              setTipoAtivo(t.valor);
              setLoteIdFiltro(null);
            }}
          >
            {t.rotulo}
          </TipoTabButton>
        ))}
      </TipoTabBar>

      {lotesDoTipo.length === 0 && <EmptyText>Nenhuma avaliação deste tipo ainda.</EmptyText>}

      {lotesDoTipo.length > 1 && (
        <LoteFiltroRow>
          <LoteFiltroChip type="button" $active={loteIdFiltro == null} onClick={() => setLoteIdFiltro(null)}>
            Média geral
          </LoteFiltroChip>
          {lotesDoTipo.map((l) => (
            <LoteFiltroChip
              key={l.lote_id}
              type="button"
              $active={loteIdFiltro === l.lote_id}
              onClick={() => setLoteIdFiltro(l.lote_id)}
            >
              {l.lote_nome}
            </LoteFiltroChip>
          ))}
        </LoteFiltroRow>
      )}

      {loteExibido && (
        <>
          <NotaGeralRow>
            <NotaGeralCirculo $atencao={ehAtencao(loteExibido.nota_geral_media)}>
              {loteExibido.nota_geral_media != null ? loteExibido.nota_geral_media.toFixed(1) : "—"}
            </NotaGeralCirculo>
            <div>
              <NotaGeralLabel>Nota geral</NotaGeralLabel>
              <NotaGeralQuantidade>
                {loteExibido.quantidade_avaliadores}{" "}
                {loteExibido.quantidade_avaliadores === 1 ? "avaliação" : "avaliações"}
              </NotaGeralQuantidade>
            </div>
          </NotaGeralRow>

          {loteExibido.criterios.length > 0 && (
            <div>
              <SectionTitle>Desempenho por critério</SectionTitle>
              <CriteriosList>
                {loteExibido.criterios.map((c) => (
                  <CriterioRow key={c.criterio_id}>
                    <CriterioLabel>{c.label}</CriterioLabel>
                    {c.tipo_resposta === "nota" ? (
                      <StarBar value={c.nota_media} />
                    ) : (
                      c.respostas_texto.map((resposta, i) => (
                        <RespostaTextoBlock key={i}>{resposta}</RespostaTextoBlock>
                      ))
                    )}
                  </CriterioRow>
                ))}
              </CriteriosList>
            </div>
          )}

          {loteExibido.comentarios.length > 0 && (
            <div>
              <SectionTitle>Comentários recebidos</SectionTitle>
              <ComentariosList>
                {loteExibido.comentarios.map((comentario, i) => (
                  <ComentarioItem key={i}>{comentario}</ComentarioItem>
                ))}
              </ComentariosList>
            </div>
          )}
        </>
      )}
      </RelatorioConteudo>
    </RelatorioStack>
  );
}
