import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import { Clock, Download, FileText, Search, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getHistoricoProjetos, type HistoricoProjeto } from "@/lib/monitoramento";
import { ROTULO_STATUS, formatarData } from "@/lib/projetos";
import { getUsuarios } from "@/lib/usuarios";
import type { UsuarioResumo } from "@/types/auth";
import {
  exportarHistoricoCSV,
  exportarHistoricoPDF,
  type SecaoHistorico,
} from "@/lib/historico-export";
import {
  PageCard,
  PageCardHeader,
  PageCardTitle,
  PageCardContent,
  PageButtonSm,
  PageLoadingBlock,
  ErrorText,
} from "@/styles/page.styled";
import {
  BarraBusca,
  BotaoLimparBusca,
  BotaoAlternativa,
  CelulaDias,
  DataTable,
  EstadoLimpo,
  EstadoLimpoIcone,
  GrupoBotoes,
  HistAcoes,
  HistBotaoAcoes,
  HistCelulaProjeto,
  HistCliente,
  HistControles,
  HistDatas,
  HistGrupoCelula,
  HistOrdenar,
  HistSegmentos,
  HistTags,
  LinkProjeto,
  Pilula,
  SemDado,
  TabelaRolagem,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  type TomPilula,
} from "./Monitoramento.styled";
import { useFiltroFrente } from "./FiltroFrente";
import { AcoesRecentesModal } from "./AcoesRecentesModal";

/**
 * A tabela do PORTFÓLIO ENCERRADO (finalizados ou arquivados), na aba
 * Histórico. Card autônomo, no mesmo modelo do Projetos em curso: filtro de
 * frente PRÓPRIO (independente da outra tabela), segmento, busca, ordenação,
 * agrupamento por semestre, exportação (CSV/PDF) e o modal de ações.
 *
 * Um fetch, o resto na tela: pede "todos" e faz segmento/busca/ordenação/
 * agrupamento no cliente. O recorte por frente volta ao servidor.
 */
type Segmento = "todos" | "finalizados" | "arquivados";

const SEGMENTOS: { chave: Segmento; rotulo: string }[] = [
  { chave: "todos", rotulo: "Todos" },
  { chave: "finalizados", rotulo: "Finalizados" },
  { chave: "arquivados", rotulo: "Arquivados" },
];

type ColunaOrd = "nome" | "coordenador" | "semestre" | "encerrado_em" | "duracao_dias";
type Direcao = "asc" | "desc";

const DIR_INICIAL: Record<ColunaOrd, Direcao> = {
  nome: "asc",
  coordenador: "asc",
  semestre: "desc",
  encerrado_em: "desc",
  duracao_dias: "desc",
};

function tomStatus(p: HistoricoProjeto): TomPilula {
  if (p.status === "finalizado") return "ok";
  if (p.status === "pausado") return "atencao";
  return "neutro";
}

function comparar(a: HistoricoProjeto, b: HistoricoProjeto, coluna: ColunaOrd): number {
  const texto = (x: string | null) => x ?? "";
  const nuloDepois = (av: unknown, bv: unknown) =>
    av == null && bv == null ? 0 : av == null ? 1 : bv == null ? -1 : null;

  switch (coluna) {
    case "nome":
      return a.nome.localeCompare(b.nome, "pt-BR");
    case "coordenador":
      return nuloDepois(a.coordenador, b.coordenador) ?? texto(a.coordenador).localeCompare(texto(b.coordenador), "pt-BR");
    case "semestre":
      return nuloDepois(a.semestre, b.semestre) ?? texto(a.semestre).localeCompare(texto(b.semestre));
    case "encerrado_em":
      return nuloDepois(a.encerrado_em, b.encerrado_em) ?? texto(a.encerrado_em).localeCompare(texto(b.encerrado_em));
    case "duracao_dias":
      return nuloDepois(a.duracao_dias, b.duracao_dias) ?? (a.duracao_dias! - b.duracao_dias!);
  }
}

export function PortfolioEncerradoTabela() {
  const { token } = useAuth();
  const { frenteId, seletor } = useFiltroFrente();
  const [segmento, setSegmento] = useState<Segmento>("todos");
  const [busca, setBusca] = useState("");
  const [agrupar, setAgrupar] = useState(false);
  const [ordem, setOrdem] = useState<{ coluna: ColunaOrd; dir: Direcao }>({
    coluna: "encerrado_em",
    dir: "desc",
  });
  const [dados, setDados] = useState<HistoricoProjeto[] | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [exportandoPdf, setExportandoPdf] = useState(false);
  const [erro, setErro] = useState("");
  const [acoesDe, setAcoesDe] = useState<HistoricoProjeto | null>(null);
  const [usuarios, setUsuarios] = useState<UsuarioResumo[]>([]);

  useEffect(() => {
    if (!token) return;
    getUsuarios(token)
      .then(setUsuarios)
      .catch(() => setUsuarios([]));
  }, [token]);

  const nomeDoUsuario = (id: number) =>
    usuarios.find((u) => u.id === id)?.nome ?? `Usuário ${id}`;

  useEffect(() => {
    if (!token) return;
    let vivo = true;
    setCarregando(true);
    setErro("");
    // Sempre "todos": o segmento é aplicado na tela.
    getHistoricoProjetos(token, frenteId, "todos")
      .then((r) => {
        if (vivo) setDados(r);
      })
      .catch((e) => {
        if (vivo) setErro(e instanceof Error ? e.message : "Erro ao carregar o histórico");
      })
      .finally(() => {
        if (vivo) setCarregando(false);
      });
    return () => {
      vivo = false;
    };
  }, [token, frenteId]);

  const contagem = useMemo(() => {
    const lista = dados ?? [];
    return {
      todos: lista.length,
      finalizados: lista.filter((p) => p.status === "finalizado").length,
      arquivados: lista.filter((p) => p.arquivado).length,
    };
  }, [dados]);

  const ordenadas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const filtradas = (dados ?? []).filter((p) => {
      if (segmento === "finalizados" && p.status !== "finalizado") return false;
      if (segmento === "arquivados" && !p.arquivado) return false;
      if (!termo) return true;
      return `${p.nome} ${p.cliente ?? ""} ${p.coordenador ?? ""}`.toLowerCase().includes(termo);
    });
    const dir = ordem.dir === "asc" ? 1 : -1;
    return filtradas.sort((a, b) => comparar(a, b, ordem.coluna) * dir);
  }, [dados, segmento, busca, ordem]);

  // As faixas da tabela. Sem agrupar, um bloco só; agrupando, um por semestre,
  // do mais recente para o mais antigo, com "Sem semestre" por último.
  const secoes: SecaoHistorico[] = useMemo(() => {
    if (!agrupar) return [{ titulo: null, itens: ordenadas }];
    const mapa = new Map<string, HistoricoProjeto[]>();
    for (const p of ordenadas) {
      const chave = p.semestre ?? "Sem semestre";
      const atual = mapa.get(chave);
      if (atual) atual.push(p);
      else mapa.set(chave, [p]);
    }
    const chaves = [...mapa.keys()].sort((a, b) => {
      if (a === "Sem semestre") return 1;
      if (b === "Sem semestre") return -1;
      return b.localeCompare(a);
    });
    return chaves.map((c) => ({ titulo: c, itens: mapa.get(c)! }));
  }, [ordenadas, agrupar]);

  function ordenarPor(coluna: ColunaOrd) {
    setOrdem((atual) =>
      atual.coluna === coluna
        ? { coluna, dir: atual.dir === "asc" ? "desc" : "asc" }
        : { coluna, dir: DIR_INICIAL[coluna] },
    );
  }

  async function baixarPdf() {
    setExportandoPdf(true);
    try {
      await exportarHistoricoPDF(secoes);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível gerar o PDF");
    } finally {
      setExportandoPdf(false);
    }
  }

  const vazio = !dados || ordenadas.length === 0;

  function Th({ coluna, children }: { coluna: ColunaOrd; children: ReactNode }) {
    const ativo = ordem.coluna === coluna;
    return (
      <TableHeadCell aria-sort={ativo ? (ordem.dir === "asc" ? "ascending" : "descending") : "none"}>
        <HistOrdenar type="button" $ativo={ativo} onClick={() => ordenarPor(coluna)}>
          {children}
          {ativo && (
            <span className="seta" aria-hidden="true">
              {ordem.dir === "asc" ? "↑" : "↓"}
            </span>
          )}
        </HistOrdenar>
      </TableHeadCell>
    );
  }

  function linha(p: HistoricoProjeto) {
    return (
      <TableRow key={p.id}>
        <TableCell>
          <HistCelulaProjeto>
            <LinkProjeto to={`/projetos/${p.id}`}>{p.nome}</LinkProjeto>
            <HistCliente>{p.cliente ?? "Sem cliente definido"}</HistCliente>
          </HistCelulaProjeto>
        </TableCell>
        <TableCell>
          {p.frentes.length > 0 ? (
            <HistTags>
              {p.frentes.map((f) => (
                <Pilula key={f} $tom="neutro">
                  {f}
                </Pilula>
              ))}
            </HistTags>
          ) : (
            <SemDado>—</SemDado>
          )}
        </TableCell>
        <TableCell>{p.coordenador ?? <SemDado>—</SemDado>}</TableCell>
        <TableCell>{p.semestre ?? <SemDado>—</SemDado>}</TableCell>
        <TableCell>
          <HistDatas>
            {formatarData(p.data_kickoff)}
            <span className="seta" aria-hidden="true">
              &rarr;
            </span>
            {formatarData(p.encerrado_em)}
          </HistDatas>
        </TableCell>
        <TableCell>
          {p.duracao_dias != null ? (
            <CelulaDias>
              {p.duracao_dias}
              <small>{p.duracao_dias === 1 ? "dia" : "dias"}</small>
            </CelulaDias>
          ) : (
            <SemDado>—</SemDado>
          )}
        </TableCell>
        <TableCell>
          <HistTags>
            <Pilula $tom={tomStatus(p)}>{ROTULO_STATUS[p.status]}</Pilula>
            {/* Arquivado é ortogonal ao status — some das listagens normais,
                mas o projeto pode nem ter sido finalizado. */}
            {p.arquivado && <Pilula $tom="neutro">Arquivado</Pilula>}
          </HistTags>
        </TableCell>
        <TableCell>
          <HistBotaoAcoes
            type="button"
            onClick={() => setAcoesDe(p)}
            title={`Ver ações recentes de ${p.nome}`}
          >
            <Clock size={13} aria-hidden="true" />
            Ações
          </HistBotaoAcoes>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <PageCard>
      <PageCardHeader>
        <PageCardTitle>Portfólio encerrado{dados ? ` (${contagem.todos})` : ""}</PageCardTitle>
        <HistAcoes>
          <PageButtonSm
            type="button"
            $variant="outline"
            onClick={() => exportarHistoricoCSV(ordenadas)}
            disabled={vazio}
          >
            <Download size={14} aria-hidden="true" />
            CSV
          </PageButtonSm>
          <PageButtonSm
            type="button"
            $variant="outline"
            onClick={baixarPdf}
            disabled={vazio || exportandoPdf}
          >
            <FileText size={14} aria-hidden="true" />
            {exportandoPdf ? "Gerando…" : "PDF"}
          </PageButtonSm>
        </HistAcoes>
      </PageCardHeader>
      <PageCardContent>
        {erro ? (
          <ErrorText>{erro}</ErrorText>
        ) : (
          <>
            <HistControles>
              <HistSegmentos>
                {seletor}
                <GrupoBotoes role="group" aria-label="Filtrar por situação">
                  {SEGMENTOS.map((s) => (
                    <BotaoAlternativa
                      key={s.chave}
                      type="button"
                      $ativo={segmento === s.chave}
                      aria-pressed={segmento === s.chave}
                      onClick={() => setSegmento(s.chave)}
                    >
                      {s.rotulo} ({contagem[s.chave]})
                    </BotaoAlternativa>
                  ))}
                </GrupoBotoes>
                <BotaoAlternativa
                  type="button"
                  $ativo={agrupar}
                  aria-pressed={agrupar}
                  onClick={() => setAgrupar((v) => !v)}
                >
                  Agrupar por semestre
                </BotaoAlternativa>
              </HistSegmentos>

              <BarraBusca>
                <Search size={15} aria-hidden="true" />
                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar projeto ou cliente"
                  aria-label="Buscar projeto, cliente ou coordenador"
                />
                {busca && (
                  <BotaoLimparBusca type="button" onClick={() => setBusca("")} aria-label="Limpar busca">
                    <X size={14} />
                  </BotaoLimparBusca>
                )}
              </BarraBusca>
            </HistControles>

            {carregando || !dados ? (
              <PageLoadingBlock />
            ) : ordenadas.length === 0 ? (
              <EstadoLimpo>
                <EstadoLimpoIcone aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 7v13a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V7" />
                    <path d="M1 3h22v4H1zM10 12h4" />
                  </svg>
                </EstadoLimpoIcone>
                <strong>Nenhum projeto encerrado</strong>
                <span>
                  {busca
                    ? `Nada casa com "${busca}" neste filtro.`
                    : "Assim que um projeto for finalizado ou arquivado, ele aparece aqui."}
                </span>
              </EstadoLimpo>
            ) : (
              <TabelaRolagem $min="58rem" $max="32rem">
                <DataTable>
                  <TableHead>
                    <TableRow>
                      <Th coluna="nome">Projeto</Th>
                      <TableHeadCell>Frentes</TableHeadCell>
                      <Th coluna="coordenador">Coordenador</Th>
                      <Th coluna="semestre">Semestre</Th>
                      <Th coluna="encerrado_em">Kickoff &rarr; Encerrado</Th>
                      <Th coluna="duracao_dias">Duração</Th>
                      <TableHeadCell>Situação</TableHeadCell>
                      <TableHeadCell>Atividade</TableHeadCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {secoes.map((secao) => (
                      <Fragment key={secao.titulo ?? "__todos"}>
                        {secao.titulo && (
                          <TableRow>
                            <HistGrupoCelula colSpan={8}>
                              {secao.titulo}
                              <small>
                                {secao.itens.length}{" "}
                                {secao.itens.length === 1 ? "projeto" : "projetos"}
                              </small>
                            </HistGrupoCelula>
                          </TableRow>
                        )}
                        {secao.itens.map(linha)}
                      </Fragment>
                    ))}
                  </TableBody>
                </DataTable>
              </TabelaRolagem>
            )}
          </>
        )}
      </PageCardContent>

      {acoesDe && (
        <AcoesRecentesModal
          projetoId={acoesDe.id}
          projetoNome={acoesDe.nome}
          nomeDoUsuario={nomeDoUsuario}
          onClose={() => setAcoesDe(null)}
        />
      )}
    </PageCard>
  );
}
