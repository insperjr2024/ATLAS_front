import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { CorSelo } from "@/components/health-track/CorSelo";
import { SOLIDO_COR } from "@/components/health-track/HealthTrack.styled";
import { ICONE_COR } from "@/components/health-track/icones";
import { SemCor } from "@/components/health-track/HealthTrack.styled";
import { EstadoVazio } from "@/components/EstadoVazio";
import { getFrentes } from "@/lib/frentes";
import { formatarDataHora, ROTULO_STATUS } from "@/lib/projetos";
import {
  getCarteira,
  getClassificacoes,
  getRodadaAtual,
  getRodadas,
  ROTULO_COR,
  type Carteira,
  type Classificacao,
  type CorHealthTrack,
  type Pilar,
  type ProjetoNaCarteira,
  type Rodada,
} from "@/lib/health-track";
import { podeFiltrarPorFrente } from "@/utils/permissoes";
import type { Frente } from "@/types/banca";
import type { StatusProjeto } from "@/types/projeto";
import { BarraFiltros, FiltroMulti, FiltroSelect, FiltroToggle } from "@/pages/monitoramento/Monitoramento.styled";
import {
  EmptyText,
  ErrorBlock,
  ErrorText,
  PageButton,
  PageGrid,
  PageCard,
  PageCardContent,
  PageCardHeader,
  PageCardTitle,
  PageHeader,
  PageHeaderText,
  PageLoadingBlock,
  PageStack,
  PageSubtitle,
  PageTitle,
} from "@/styles/page.styled";
import { RodadaCard } from "./RodadaCard";
import { EvolucaoCard } from "./EvolucaoCard";
import { AtencaoCard } from "./AtencaoCard";
import { CoordenadoresCard } from "./CoordenadoresCard";
import {
  Celula,
  Contagem,
  FaixaBarra,
  Faixas,
  Legenda,
  Mapa,
  NomeProjeto,
  PendenteBadge,
  Placar,
  PlacarItem,
  Ranking,
  RankingItem,
  Rolagem,
  Secundario,
  Sequencia,
  Tendencia,
} from "./HealthTrack.styled";

const CORES: CorHealthTrack[] = ["verde", "amarelo", "vermelho"];
/** As etapas que podem estar no mapa (antes da venda fechar fica fora). */
const ETAPAS: StatusProjeto[] = [
  "ambientacao",
  "em_andamento",
  "validacao_bancas",
  "pausado",
  "envio_tep",
  "periodo_ajustes",
  "finalizado",
];
const SEM_AVALIACAO = "sem";
const PESO_COR: Record<CorHealthTrack, number> = { verde: 0, amarelo: 1, vermelho: 2 };

/**
 * O mapa da carteira (Health Track §8, §9 e §17).
 *
 * Uma consulta só (`/health-track/carteira`) traz todos os projetos em curso
 * com a cor de cada pilar; filtros e KPIs são calculados aqui em cima dela,
 * então trocar um filtro não custa requisição e os números do topo sempre
 * batem com as linhas da tabela. Só a frente vai ao backend, porque é ela
 * que define o recorte de visão.
 *
 * Só quem tem a caixa `pode_ver_health_track` chega aqui: coordenador e
 * consultor não veem (decisão da diretoria, 2026-10-08).
 */
export function HealthTrack() {
  const { token, usuario } = useAuth();
  const [carteira, setCarteira] = useState<Carteira | null>(null);
  const [rodada, setRodada] = useState<Rodada | null>(null);
  const [rodadas, setRodadas] = useState<Rodada[]>([]);
  const [classificacoes, setClassificacoes] = useState<Classificacao[]>([]);
  const [frentes, setFrentes] = useState<Frente[]>([]);
  const [erro, setErro] = useState("");
  const [tentativa, setTentativa] = useState(0);

  const [frenteId, setFrenteId] = useState<number | null>(null);
  const [coordenadorId, setCoordenadorId] = useState<number | null>(null);
  const [gerenteId, setGerenteId] = useState<number | null>(null);
  const [statusGeral, setStatusGeral] = useState<string[]>([]);
  const [etapas, setEtapas] = useState<string[]>([]);
  const [pilarId, setPilarId] = useState<number | null>(null);
  const [corDoPilar, setCorDoPilar] = useState<string[]>([]);
  const [soPersistentes, setSoPersistentes] = useState(false);
  // A rodada só aparece quando chamada (a pedido, 2026-10-08): os KPIs são
  // a primeira coisa da página. Abre sozinha se há rodada em andamento com
  // pendente, que é quando ela tem trabalho a cobrar.
  const [mostrarRodada, setMostrarRodada] = useState(false);

  const podeFiltrarFrente = podeFiltrarPorFrente(usuario);

  useEffect(() => {
    if (!token) return;
    let vivo = true;
    getClassificacoes(token)
      .then((c) => vivo && setClassificacoes(c))
      .catch(() => undefined);
    if (podeFiltrarFrente) {
      getFrentes(token)
        .then((f) => vivo && setFrentes(f.filter((x) => x.ativa)))
        .catch(() => undefined);
    }
    return () => {
      vivo = false;
    };
  }, [token, podeFiltrarFrente]);

  useEffect(() => {
    if (!token) return;
    let vivo = true;
    Promise.all([getRodadaAtual(token), getRodadas(token)])
      .then(([atual, todas]) => {
        if (!vivo) return;
        setRodada(atual);
        setRodadas(todas);
      })
      .catch(() => undefined);
    return () => {
      vivo = false;
    };
  }, [token, tentativa]);

  async function recarregarRodada() {
    if (!token) return;
    const [atual, todas] = await Promise.all([getRodadaAtual(token), getRodadas(token)]);
    setRodada(atual);
    setRodadas(todas);
  }

  useEffect(() => {
    if (!token) return;
    let vivo = true;
    getCarteira(token, frenteId)
      .then((c) => {
        if (!vivo) return;
        setCarteira(c);
        setErro("");
      })
      .catch((err) => vivo && setErro(err instanceof Error ? err.message : "Erro ao carregar a carteira"));
    return () => {
      vivo = false;
    };
  }, [token, frenteId, tentativa]);

  const nomeDaCor = useCallback(
    (cor: CorHealthTrack) => classificacoes.find((c) => c.cor === cor)?.nome ?? ROTULO_COR[cor],
    [classificacoes],
  );

  const pessoas = useMemo(() => {
    const coordenadores = new Map<number, string>();
    const gerentes = new Map<number, string>();
    for (const p of carteira?.projetos ?? []) {
      p.coordenadores.forEach((c) => coordenadores.set(c.id, c.nome));
      p.gerentes.forEach((g) => gerentes.set(g.id, g.nome));
    }
    const ordenar = (m: Map<number, string>) =>
      [...m.entries()].sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));
    return { coordenadores: ordenar(coordenadores), gerentes: ordenar(gerentes) };
  }, [carteira]);

  const projetos = useMemo(() => {
    if (!carteira) return [];
    return carteira.projetos.filter((p) => {
      if (coordenadorId && !p.coordenadores.some((c) => c.id === coordenadorId)) return false;
      if (gerenteId && !p.gerentes.some((g) => g.id === gerenteId)) return false;
      if (etapas.length && !etapas.includes(p.status)) return false;
      if (statusGeral.length) {
        const chave = p.status_geral?.pela_regra_atual ?? SEM_AVALIACAO;
        if (!statusGeral.includes(chave)) return false;
      }
      if (pilarId && corDoPilar.length) {
        const chave = p.pilares[String(pilarId)]?.cor ?? SEM_AVALIACAO;
        if (!corDoPilar.includes(chave)) return false;
      }
      if (soPersistentes && p.alertas_persistentes === 0) return false;
      return true;
    });
  }, [carteira, coordenadorId, gerenteId, etapas, statusGeral, pilarId, corDoPilar, soPersistentes]);

  const emAcompanhamento = useMemo(() => projetos.filter((p) => p.bloco === "acompanhamento"), [projetos]);
  const encerrados = useMemo(() => projetos.filter((p) => p.bloco === "encerrado"), [projetos]);
  // KPIs e rankings só sobre quem está em acompanhamento: o bloco de
  // encerrados é leitura do passado, não entra na conta de hoje.
  const placar = useMemo(() => contar(emAcompanhamento), [emAcompanhamento]);
  const rankingCoordenadores = useMemo(() => rankearCoordenadores(emAcompanhamento), [emAcompanhamento]);
  const rankingPilares = useMemo(
    () => (carteira ? rankearPilares(emAcompanhamento, carteira.pilares) : []),
    [emAcompanhamento, carteira],
  );
  const pendentesNaRodada = useMemo(
    () => new Set(rodada?.projetos.filter((p) => p.situacao === "pendente").map((p) => p.projeto_id) ?? []),
    [rodada],
  );

  if (erro) {
    return (
      <ErrorBlock>
        <ErrorText>Não foi possível carregar o Health Track: {erro}</ErrorText>
        <PageButton $variant="outline" onClick={() => setTentativa((n) => n + 1)}>
          Tentar novamente
        </PageButton>
      </ErrorBlock>
    );
  }
  if (!carteira) return <PageLoadingBlock />;

  const pilares = carteira.pilares;
  const filtrando =
    frenteId !== null ||
    coordenadorId !== null ||
    gerenteId !== null ||
    etapas.length > 0 ||
    statusGeral.length > 0 ||
    soPersistentes ||
    (pilarId !== null && corDoPilar.length > 0);

  return (
    <PageStack>
      <PageHeader>
        <PageHeaderText>
          <PageTitle>Health Track</PageTitle>
          <PageSubtitle>
            A saúde da carteira, pilar a pilar. Clique num projeto para ver o detalhe e preencher a avaliação.
          </PageSubtitle>
        </PageHeaderText>
        <PageButton
          type="button"
          $variant={rodada ? "primary" : "outline"}
          aria-expanded={mostrarRodada}
          onClick={() => setMostrarRodada((v) => !v)}
        >
          {mostrarRodada
            ? "Esconder rodada"
            : rodada
              ? `Rodada em andamento${rodada.pendente ? ` · ${rodada.pendente} pendente${rodada.pendente > 1 ? "s" : ""}` : ""}`
              : "Rodada de avaliação"}
        </PageButton>
      </PageHeader>

      <BarraFiltros>
        {podeFiltrarFrente && (
          <FiltroSelect
            value={frenteId ? String(frenteId) : ""}
            onChange={(e) => setFrenteId(e.target.value ? Number(e.target.value) : null)}
            aria-label="Filtrar por frente"
          >
            <option value="">Todas as frentes</option>
            {frentes.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </FiltroSelect>
        )}
        <FiltroSelect
          value={coordenadorId ? String(coordenadorId) : ""}
          onChange={(e) => setCoordenadorId(e.target.value ? Number(e.target.value) : null)}
          aria-label="Filtrar por coordenador"
        >
          <option value="">Todos os coordenadores</option>
          {pessoas.coordenadores.map(([id, nome]) => (
            <option key={id} value={id}>
              {nome}
            </option>
          ))}
        </FiltroSelect>
        <FiltroSelect
          value={gerenteId ? String(gerenteId) : ""}
          onChange={(e) => setGerenteId(e.target.value ? Number(e.target.value) : null)}
          aria-label="Filtrar por gerente"
        >
          <option value="">Todos os gerentes</option>
          {pessoas.gerentes.map(([id, nome]) => (
            <option key={id} value={id}>
              {nome}
            </option>
          ))}
        </FiltroSelect>
        <FiltroMulti
          valores={etapas}
          onChange={setEtapas}
          opcoes={ETAPAS.map((s) => ({ value: s, label: ROTULO_STATUS[s] }))}
          rotuloVazio="Todas as etapas"
          resumo={(n) => `${n} etapas`}
        />
        <FiltroMulti
          valores={statusGeral}
          onChange={setStatusGeral}
          opcoes={[
            ...CORES.map((c) => ({ value: c, label: nomeDaCor(c) })),
            { value: SEM_AVALIACAO, label: "Sem avaliação" },
          ]}
          rotuloVazio="Qualquer status geral"
          resumo={(n) => `${n} status`}
        />
        <FiltroSelect
          value={pilarId ? String(pilarId) : ""}
          onChange={(e) => {
            setPilarId(e.target.value ? Number(e.target.value) : null);
            if (!e.target.value) setCorDoPilar([]);
          }}
          aria-label="Filtrar por pilar"
        >
          <option value="">Qualquer pilar</option>
          {pilares.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </FiltroSelect>
        {pilarId !== null && (
          <FiltroMulti
            valores={corDoPilar}
            onChange={setCorDoPilar}
            opcoes={[
              ...CORES.map((c) => ({ value: c, label: nomeDaCor(c) })),
              { value: SEM_AVALIACAO, label: "Sem avaliação" },
            ]}
            rotuloVazio="Em qualquer cor"
            resumo={(n) => `${n} cores`}
          />
        )}
        <FiltroToggle
          type="button"
          $ativo={soPersistentes}
          aria-pressed={soPersistentes}
          onClick={() => setSoPersistentes((v) => !v)}
          title={`Pilar amarelo há ${carteira.persistencia.amarelo}+ ou vermelho há ${carteira.persistencia.vermelho}+ avaliações seguidas`}
        >
          Só com alerta persistente
        </FiltroToggle>
      </BarraFiltros>

      <Placar>
        <PlacarItem>
          <strong>{placar.total}</strong>
          <span>Em acompanhamento</span>
          <small>{placar.avaliados} com avaliação</small>
        </PlacarItem>
        {CORES.map((cor) => (
          <PlacarItem key={cor} $cor={cor}>
            <strong>{placar.porCor[cor]}</strong>
            <span>{nomeDaCor(cor)}</span>
            <small>{percentual(placar.porCor[cor], placar.total)} da carteira</small>
          </PlacarItem>
        ))}
        <PlacarItem>
          <strong>{placar.algumVermelho}</strong>
          <span>Com algum pilar crítico</span>
          <small>{placar.semAvaliacao} ainda sem avaliação</small>
        </PlacarItem>
        <PlacarItem>
          <strong>{placar.persistentes}</strong>
          <span>Com alerta persistente</span>
          <small>
            amarelo há {carteira.persistencia.amarelo}+ ou vermelho há {carteira.persistencia.vermelho}+ avaliações
          </small>
        </PlacarItem>
        <PlacarItem>
          <strong>
            {placar.pioraram} <Secundario as="span" style={{ display: "inline" }}>pioraram</Secundario>
            {" · "}
            {placar.melhoraram} <Secundario as="span" style={{ display: "inline" }}>melhoraram</Secundario>
          </strong>
          <span>Desde o ciclo anterior</span>
        </PlacarItem>
      </Placar>

      {mostrarRodada && <RodadaCard atual={rodada} historico={rodadas} onMudou={recarregarRodada} />}

      <PageCard>
        <PageCardHeader>
          <PageCardTitle>Em acompanhamento</PageCardTitle>
          <Legenda aria-label="Legenda das cores">
            {CORES.map((c) => (
              <span key={c}>
                <Celula $cor={c}>{iconeDe(c)}</Celula>
                {nomeDaCor(c)}
              </span>
            ))}
            <span>
              <Celula $cor={null}>·</Celula>
              Sem avaliação
            </span>
          </Legenda>
        </PageCardHeader>
        <PageCardContent>
          {emAcompanhamento.length === 0 ? (
            <EstadoVazio
              causa={filtrando ? "filtro" : "vazio"}
              titulo="Nenhum projeto em acompanhamento"
              motivo={
                filtrando
                  ? "Nenhum projeto em acompanhamento bate com os filtros escolhidos. Limpe um deles."
                  : "Não há projeto em ambientação, em andamento ou aguardando banca na carteira que você enxerga."
              }
            />
          ) : (
            <MapaTabela projetos={emAcompanhamento} pilares={pilares} nomeDaCor={nomeDaCor} pendentes={pendentesNaRodada} />
          )}
        </PageCardContent>
      </PageCard>

      {(rankingCoordenadores.length > 0 || rankingPilares.length > 0) && (
        <PageGrid $columns={2}>
          <PageCard>
            <PageCardHeader>
              <PageCardTitle>Coordenadores com mais atenção</PageCardTitle>
            </PageCardHeader>
            <PageCardContent>
              {rankingCoordenadores.length === 0 ? (
                <EmptyText>Sem projeto avaliado em acompanhamento.</EmptyText>
              ) : (
                <Ranking>
                  {rankingCoordenadores.map((c, i) => (
                    <RankingItem key={c.id}>
                      <span className="posicao">{i + 1}.</span>
                      <button
                        type="button"
                        className="nome"
                        onClick={() => setCoordenadorId(coordenadorId === c.id ? null : c.id)}
                        title="Clique pra filtrar o mapa por este coordenador"
                      >
                        {c.nome}
                        <Secundario as="span" style={{ display: "inline", marginLeft: "0.35rem" }}>
                          {c.projetos} proj. · {percentual(c.verde, c.projetos)} saudáveis
                        </Secundario>
                      </button>
                      <FaixasCores verde={c.verde} amarelo={c.amarelo} vermelho={c.vermelho} />
                    </RankingItem>
                  ))}
                </Ranking>
              )}
            </PageCardContent>
          </PageCard>
          <PageCard>
            <PageCardHeader>
              <PageCardTitle>Pilares que mais pedem atenção</PageCardTitle>
            </PageCardHeader>
            <PageCardContent>
              {rankingPilares.length === 0 ? (
                <EmptyText>Sem pilar avaliado em acompanhamento.</EmptyText>
              ) : (
                <Ranking>
                  {rankingPilares.map((p, i) => (
                    <RankingItem key={p.id}>
                      <span className="posicao">{i + 1}.</span>
                      <button
                        type="button"
                        className="nome"
                        onClick={() => {
                          setPilarId(pilarId === p.id ? null : p.id);
                          setCorDoPilar([]);
                        }}
                        title="Clique pra escolher este pilar no filtro"
                      >
                        {p.nome}
                        <Secundario as="span" style={{ display: "inline", marginLeft: "0.35rem" }}>
                          {percentual(p.verde, p.verde + p.amarelo + p.vermelho)} saudável
                        </Secundario>
                      </button>
                      <FaixasCores verde={p.verde} amarelo={p.amarelo} vermelho={p.vermelho} />
                    </RankingItem>
                  ))}
                </Ranking>
              )}
            </PageCardContent>
          </PageCard>
        </PageGrid>
      )}

      <AtencaoCard projetos={emAcompanhamento} pilares={pilares} nomeDaCor={nomeDaCor} />

      <CoordenadoresCard
        // Sem o filtro de coordenador aplicado: a visão é de TODOS os
        // coordenadores, e é ela que escolhe o filtro.
        projetos={carteira.projetos.filter(
          (p) =>
            p.bloco === "acompanhamento" &&
            (!gerenteId || p.gerentes.some((g) => g.id === gerenteId)) &&
            (!etapas.length || etapas.includes(p.status)),
        )}
        pilares={pilares}
        nomeDaCor={nomeDaCor}
        coordenadorId={coordenadorId}
        onEscolher={setCoordenadorId}
      />

      <EvolucaoCard />

      <PageCard>
        <PageCardHeader>
          <PageCardTitle>Pós-banca e finalizados</PageCardTitle>
          <Secundario as="span">Já passaram pela banca: não entram nas rodadas, mas a última leitura fica aqui.</Secundario>
        </PageCardHeader>
        <PageCardContent>
          {encerrados.length === 0 ? (
            <EmptyText>Nenhum projeto pós-banca ou finalizado{filtrando ? " com esses filtros" : ""}.</EmptyText>
          ) : (
            <MapaTabela projetos={encerrados} pilares={pilares} nomeDaCor={nomeDaCor} pendentes={new Set()} />
          )}
        </PageCardContent>
      </PageCard>
    </PageStack>
  );
}

function MapaTabela({
  projetos,
  pilares,
  nomeDaCor,
  pendentes,
}: {
  projetos: ProjetoNaCarteira[];
  pilares: Pilar[];
  nomeDaCor: (cor: CorHealthTrack) => string;
  /** Ids pendentes na rodada aberta: ganham o selo vermelho. */
  pendentes: Set<number>;
}) {
  const navigate = useNavigate();
  return (
    <Rolagem>
      <Mapa>
        <thead>
          <tr>
            <th>Projeto</th>
            <th>Coordenação</th>
            <th>Etapa</th>
            <th>Geral</th>
            {pilares.map((p) => (
              <th key={p.id} className="pilar" title={p.descricao ?? undefined}>
                {abreviar(p.nome)}
              </th>
            ))}
            <th>Tendência</th>
            <th>Avaliado em</th>
          </tr>
        </thead>
        <tbody>
          {projetos.map((p) => (
            <tr key={p.id} onClick={() => navigate(`/health-track/projetos/${p.id}`)}>
              <td>
                <NomeProjeto to={`/health-track/projetos/${p.id}`} onClick={(e) => e.stopPropagation()}>
                  {p.nome}
                </NomeProjeto>
                {pendentes.has(p.id) && <PendenteBadge title="Pendente na rodada em andamento">Pendente</PendenteBadge>}
                <Secundario>{p.frentes.map((f) => f.nome).join(" + ") || "Sem frente"}</Secundario>
              </td>
              <td>
                {p.coordenadores.map((c) => primeiroNome(c.nome)).join(", ") || <Secundario>Sem coordenador</Secundario>}
                {p.gerentes.length > 0 && (
                  <Secundario>Ger.: {p.gerentes.map((g) => primeiroNome(g.nome)).join(", ")}</Secundario>
                )}
              </td>
              <td>{ROTULO_STATUS[p.status as StatusProjeto] ?? p.status}</td>
              <td>
                {p.status_geral ? (
                  <CorSelo cor={p.status_geral.pela_regra_atual} rotulo={nomeDaCor(p.status_geral.pela_regra_atual)} />
                ) : (
                  <SemCor>{p.total_ciclos ? "Pendente" : "Sem avaliação"}</SemCor>
                )}
              </td>
              {pilares.map((pilar) => {
                const celula = p.pilares[String(pilar.id)];
                const cor = celula?.cor ?? null;
                const rotulo = celula
                  ? `${pilar.nome}: ${nomeDaCor(celula.cor)} há ${celula.sequencia} avaliaç${celula.sequencia === 1 ? "ão" : "ões"}${celula.persistente ? " (persistente)" : ""}`
                  : `${pilar.nome}: sem avaliação`;
                return (
                  <td key={pilar.id} className="pilar">
                    <Celula $cor={cor} $persistente={celula?.persistente} title={rotulo} aria-label={rotulo}>
                      {cor ? iconeDe(cor) : "·"}
                      {celula?.persistente && <Sequencia aria-hidden="true">{celula.sequencia}</Sequencia>}
                    </Celula>
                  </td>
                );
              })}
              <td>
                <TendenciaDoProjeto projeto={p} />
              </td>
              <td>{p.avaliado_em ? formatarDataHora(p.avaliado_em) : <Secundario>nunca</Secundario>}</td>
            </tr>
          ))}
        </tbody>
      </Mapa>
    </Rolagem>
  );
}

/** Verde, amarelo e vermelho lado a lado: a barra e os três números. */
function FaixasCores({ verde, amarelo, vermelho }: { verde: number; amarelo: number; vermelho: number }) {
  const total = Math.max(1, verde + amarelo + vermelho);
  return (
    <Faixas>
      <FaixaBarra aria-hidden="true">
        <i style={{ width: `${(verde / total) * 100}%`, background: SOLIDO_COR.verde }} />
        <i style={{ width: `${(amarelo / total) * 100}%`, background: SOLIDO_COR.amarelo }} />
        <i style={{ width: `${(vermelho / total) * 100}%`, background: SOLIDO_COR.vermelho }} />
      </FaixaBarra>
      <Contagem $cor="verde">{verde}</Contagem>
      <Contagem $cor="amarelo">{amarelo}</Contagem>
      <Contagem $cor="vermelho">{vermelho}</Contagem>
    </Faixas>
  );
}

type LinhaRanking = { id: number; nome: string; projetos: number; verde: number; amarelo: number; vermelho: number };

/** Quem tem mais projeto crítico (depois em atenção) primeiro; empate pelo nome. */
function rankearCoordenadores(projetos: ProjetoNaCarteira[]): LinhaRanking[] {
  const por = new Map<number, LinhaRanking>();
  for (const p of projetos) {
    if (!p.status_geral) continue;
    for (const c of p.coordenadores) {
      const linha = por.get(c.id) ?? { id: c.id, nome: c.nome, projetos: 0, verde: 0, amarelo: 0, vermelho: 0 };
      linha.projetos += 1;
      linha[p.status_geral.pela_regra_atual] += 1;
      por.set(c.id, linha);
    }
  }
  return [...por.values()].sort(
    (a, b) => b.vermelho - a.vermelho || b.amarelo - a.amarelo || a.verde - b.verde || a.nome.localeCompare(b.nome, "pt-BR"),
  );
}

/** O pilar com mais vermelho (depois amarelo) na JR inteira: problema
 *  sistêmico, não de um projeto. */
function rankearPilares(projetos: ProjetoNaCarteira[], pilares: Pilar[]): LinhaRanking[] {
  return pilares
    .map((pilar) => {
      const linha: LinhaRanking = { id: pilar.id, nome: pilar.nome, projetos: 0, verde: 0, amarelo: 0, vermelho: 0 };
      for (const p of projetos) {
        const cor = p.pilares[String(pilar.id)]?.cor;
        if (cor) {
          linha[cor] += 1;
          linha.projetos += 1;
        }
      }
      return linha;
    })
    .filter((l) => l.projetos > 0)
    .sort((a, b) => b.vermelho - a.vermelho || b.amarelo - a.amarelo || a.verde - b.verde);
}

function iconeDe(cor: CorHealthTrack) {
  const Icone = ICONE_COR[cor];
  return <Icone aria-hidden="true" />;
}

function primeiroNome(nome: string) {
  const partes = nome.trim().split(/\s+/);
  return partes.length > 1 ? `${partes[0]} ${partes[partes.length - 1][0]}.` : partes[0];
}

/** "Cronograma & Prazos" vira "Cronograma" no cabeçalho estreito; o nome
 *  inteiro fica no `title`. */
function abreviar(nome: string) {
  return nome.split(/\s*[&/]\s*/)[0];
}

function percentual(parte: number, total: number) {
  return total ? `${Math.round((parte / total) * 100)}%` : "0%";
}

/** Para onde o projeto foi entre os dois últimos ciclos completos. */
function rumo(p: ProjetoNaCarteira): "melhorou" | "piorou" | "igual" | null {
  if (!p.status_geral || !p.status_anterior) return null;
  const agora = PESO_COR[p.status_geral.pela_regra_atual];
  const antes = PESO_COR[p.status_anterior];
  return agora === antes ? "igual" : agora < antes ? "melhorou" : "piorou";
}

function TendenciaDoProjeto({ projeto }: { projeto: ProjetoNaCarteira }) {
  const r = rumo(projeto);
  if (!r) return <Secundario>{projeto.total_ciclos > 1 ? "" : "1º ciclo"}</Secundario>;
  if (r === "melhorou")
    return (
      <Tendencia $rumo="melhorou">
        <TrendingUp aria-hidden="true" /> melhorou
      </Tendencia>
    );
  if (r === "piorou")
    return (
      <Tendencia $rumo="piorou">
        <TrendingDown aria-hidden="true" /> piorou
      </Tendencia>
    );
  return (
    <Tendencia $rumo="igual">
      <Minus aria-hidden="true" /> igual
    </Tendencia>
  );
}

function contar(projetos: ProjetoNaCarteira[]) {
  const porCor: Record<CorHealthTrack, number> = { verde: 0, amarelo: 0, vermelho: 0 };
  let avaliados = 0;
  let algumVermelho = 0;
  let persistentes = 0;
  let pioraram = 0;
  let melhoraram = 0;
  for (const p of projetos) {
    if (p.status_geral) {
      avaliados += 1;
      porCor[p.status_geral.pela_regra_atual] += 1;
    }
    if (p.algum_vermelho) algumVermelho += 1;
    if (p.alertas_persistentes > 0) persistentes += 1;
    const r = rumo(p);
    if (r === "piorou") pioraram += 1;
    if (r === "melhorou") melhoraram += 1;
  }
  return {
    total: projetos.length,
    avaliados,
    semAvaliacao: projetos.length - avaliados,
    porCor,
    algumVermelho,
    persistentes,
    pioraram,
    melhoraram,
  };
}
