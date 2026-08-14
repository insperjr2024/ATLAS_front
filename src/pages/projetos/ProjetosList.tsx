import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Archive,
  AlertTriangle,
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
  ArrowRight,
  ChevronDown,
  LayoutGrid,
  KanbanSquare,
  Plus,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getFrentes } from "@/lib/bancas";
import {
  CORES_STATUS,
  formatarDataHoraBanca,
  getProjetos,
  mudarStatus,
  ordemStatus,
  ROTULO_STATUS,
} from "@/lib/projetos";
import { getUsuarios } from "@/lib/usuarios";
import { getProjetosComVaga, getSolicitacoesRecebidas } from "@/lib/vagas";
import { ProjetoKanbanBoard } from "@/components/kanban/ProjetoKanbanBoard";
import { Ponto } from "@/components/kanban/Kanban.styled";
import { tonsDaColuna } from "@/lib/colunas-tarefa";
import type { UsuarioResumo } from "@/types/auth";
import type { Frente } from "@/types/banca";
import type { ProjetoResumo, StatusProjeto } from "@/types/projeto";
import { pode, rotuloProjetos } from "@/utils/permissoes";
import {
  PageStack,
  PageButton,
  PageBadge,
  PageLoadingBlock,
  ErrorBlock,
  ErrorText,
  EmptyText,
} from "@/styles/page.styled";
import {
  PageHeaderRow,
  PageHeaderText,
  PageHeading,
  PageSubheading,
  CardGrid,
  ProjetoCard,
  CardTitle,
  TagRow,
  FrenteTag,
  StatusPilula,
  CardEquipe,
  CardAlerta,
  FiltersRow,
  FrenteFilterWrap,
  FrenteFilterButton,
  FrenteFilterPanel,
  FrenteFilterFooter,
  FrenteFilterDivisor,
  FrenteFilterSecao,
  FrenteFilterOpcao,
  CheckboxLabel,
  ViewToggleRow,
  ViewToggleBtn,
  VagasSelo,
  PendenteDot,
  FormErrorText,
} from "./Projetos.styled";

type ModoVisualizacao = "lista" | "kanban" | "arquivados";

export function ProjetosList() {
  const { usuario, token } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [projetos, setProjetos] = useState<ProjetoResumo[]>([]);
  const [frentes, setFrentes] = useState<Frente[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioResumo[]>([]);
  const [frentesSelecionadas, setFrentesSelecionadas] = useState<number[]>([]);
  const [filtroAberto, setFiltroAberto] = useState(false);
  // Independente do modo "Arquivados": dá pra misturar os arquivados na
  // lista/kanban geral também, pra quem quer comparar lado a lado com os
  // ativos sem trocar de aba.
  const [mostrarArquivados, setMostrarArquivados] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  // O kanban é a visão prioritária de Projetos — a lista é a segunda opção,
  // pra quem quer conferir/ordenar em texto corrido, e "Arquivados" é a
  // MESMA lista, só que com outro recorte de conteúdo (não é uma página
  // separada — ver `projetosVisiveis` abaixo). Guardado na URL (não só em
  // estado local) pra "voltar" de dentro de um projeto devolver pro modo de
  // onde a pessoa veio, em vez de sempre resetar pro kanban.
  const [modo, setModoState] = useState<ModoVisualizacao>(
    searchParams.get("modo") === "lista"
      ? "lista"
      : searchParams.get("modo") === "arquivados"
        ? "arquivados"
        : "kanban",
  );
  function setModo(novoModo: ModoVisualizacao) {
    setModoState(novoModo);
    setSearchParams(novoModo === "kanban" ? {} : { modo: novoModo }, { replace: true });
  }
  const [avisoKanban, setAvisoKanban] = useState("");
  const [ordemAsc, setOrdemAsc] = useState(true);
  const [vagasAbertas, setVagasAbertas] = useState<number | null>(null);
  const [projetosComPendencia, setProjetosComPendencia] = useState<Set<number>>(new Set());
  const filtroRef = useRef<HTMLDivElement>(null);

  const podeFiltrar = pode(usuario, "filtrar_por_frente");
  const podeCriar = !!usuario?.permissoes.pode_criar_projeto;
  const podeArrastarKanban = pode(usuario, "mover_projeto_kanban");
  const podeArquivar = pode(usuario, "arquivar_projeto");

  async function carregar() {
    if (!token) return;
    setCarregando(true);
    setErro("");
    try {
      // O recorte de visão é do backend: `GET /projetos` já vem filtrado pelo
      // token. O filtro por frente(s), aqui, é só um refinamento no cliente —
      // pra permitir marcar várias frentes de uma vez, um projeto sinérgico
      // aparece assim que QUALQUER uma das suas frentes estiver marcada.
      const [projetosResp, frentesResp, usuariosResp] = await Promise.all([
        // `frente_id` não vai mais pro backend — o filtro de frente(s) virou
        // um refinamento no cliente (ver `projetosVisiveis` abaixo), pra
        // suportar marcar várias de uma vez. Arquivados sempre vêm junto
        // (quando a permissão existe) — a aba "Arquivados" e o checkbox
        // "Mostrar" só filtram em cima do mesmo dado já carregado, sem
        // precisar de uma nova busca a cada troca.
        getProjetos(token, null, podeArquivar),
        getFrentes(token),
        getUsuarios(token),
      ]);
      setProjetos(projetosResp);
      setFrentes(frentesResp);
      setUsuarios(usuariosResp);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar projetos");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Só a contagem, pro botão "Vagas abertas" — a lista completa (com
  // impedimento, coordenador, etc.) só é buscada dentro de /vagas.
  useEffect(() => {
    if (!token) return;
    let ativo = true;
    getProjetosComVaga(token)
      .then((r) => {
        if (ativo) setVagasAbertas(r.projetos.length);
      })
      .catch(() => {
        // Contagem é só um adorno do botão — sem ela, o botão continua
        // levando pra /vagas normalmente.
      });
    return () => {
      ativo = false;
    };
  }, [token]);

  // A bolinha vermelha no card (§7.3): só marca projeto que ESTA pessoa pode
  // responder — o endpoint já vem escopado assim (coordenador do projeto,
  // gerência ou diretoria), então não precisa checar permissão de novo aqui.
  useEffect(() => {
    if (!token) return;
    let ativo = true;
    getSolicitacoesRecebidas(token)
      .then((r) => {
        if (ativo) {
          setProjetosComPendencia(
            new Set(r.filter((s) => s.status === "pendente").map((s) => s.projeto_id)),
          );
        }
      })
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, [token]);

  useEffect(() => {
    if (!filtroAberto) return;
    function aoClicarFora(e: MouseEvent) {
      if (filtroRef.current && !filtroRef.current.contains(e.target as Node)) {
        setFiltroAberto(false);
      }
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, [filtroAberto]);

  const nomeFrente = (id: number) => frentes.find((f) => f.id === id)?.nome ?? `Frente ${id}`;
  const nomeUsuario = (id: number) => usuarios.find((u) => u.id === id)?.nome ?? `Usuário ${id}`;

  function alternarFrente(id: number) {
    setFrentesSelecionadas((atual) =>
      atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id],
    );
  }

  /**
   * Otimista, igual ao kanban de tarefas: o card já pula de coluna antes da
   * resposta do PATCH. Se o backend recusar a transição, volta pro estado
   * anterior — a fonte da verdade nunca é o arrasto local.
   */
  async function moverStatus(projetoId: number, statusNovo: StatusProjeto) {
    if (!token) return;
    const anterior = projetos;
    setProjetos((lista) => lista.map((p) => (p.id === projetoId ? { ...p, status: statusNovo } : p)));
    setAvisoKanban("");
    try {
      await mudarStatus(projetoId, statusNovo, token);
    } catch (err) {
      setProjetos(anterior);
      setAvisoKanban(err instanceof Error ? err.message : "Erro ao mudar o status do projeto");
    }
  }

  // "Arquivados" é a MESMA tela de Lista, só trocando o recorte de conteúdo
  // (§6.2) — nunca uma rota/página à parte. Fora dela, o checkbox "Mostrar"
  // é quem decide se os arquivados aparecem misturados aos ativos.
  const projetosVisiveis =
    modo === "arquivados"
      ? projetos.filter((p) => p.arquivado_em)
      : projetos.filter((p) => mostrarArquivados || !p.arquivado_em);

  const projetosFiltrados =
    frentesSelecionadas.length === 0
      ? projetosVisiveis
      : projetosVisiveis.filter((p) => p.frente_ids.some((id) => frentesSelecionadas.includes(id)));

  // Ordena pela mesma fila de fases do kanban (`ordemStatus`), não por nome —
  // é a etapa do ciclo de vida que a diretoria quer varrer em ordem, com a
  // direção (crescente/decrescente) escolhida ao lado.
  const projetosOrdenados = [...projetosFiltrados].sort((a, b) => {
    const diferenca = ordemStatus(a.status) - ordemStatus(b.status);
    return ordemAsc ? diferenca : -diferenca;
  });

  if (erro) {
    return (
      <ErrorBlock>
        <ErrorText>Não foi possível carregar os projetos: {erro}</ErrorText>
        <PageButton $variant="outline" onClick={carregar}>
          Tentar novamente
        </PageButton>
      </ErrorBlock>
    );
  }

  // Só bloqueia a tela na PRIMEIRA carga (sem dado nenhum ainda). Reconsultas
  // disparadas por um filtro (ex.: "Mostrar arquivados") mantêm a lista atual
  // visível enquanto busca — sem isso, cada clique piscava a tela inteira
  // pra um spinner, parecendo um reload em vez de uma atualização.
  if (carregando && projetos.length === 0) return <PageLoadingBlock />;

  const pendentes = projetosFiltrados.filter((p) => p.kickoff_pendente).length;
  const mostrarSecaoOrdem = modo !== "kanban";
  const mostrarSecaoArquivados = podeArquivar && modo !== "arquivados";

  return (
    <PageStack>
      <PageHeaderRow>
        <PageHeaderText>
          <PageHeading>{rotuloProjetos(usuario)}</PageHeading>
          <PageSubheading>
            {projetosFiltrados.length} {projetosFiltrados.length === 1 ? "projeto" : "projetos"}
            {pendentes > 0 && ` · ${pendentes} com kickoff pendente`}
          </PageSubheading>
          {!!vagasAbertas && (
            <VagasSelo
              to="/vagas"
              state={{ voltarPara: `/projetos?modo=${modo}`, voltarRotulo: "Voltar para Projetos" }}
            >
              {vagasAbertas} {vagasAbertas === 1 ? "vaga aberta" : "vagas abertas"}
              <ArrowRight size={12} />
            </VagasSelo>
          )}
        </PageHeaderText>

        <FiltersRow>
          <ViewToggleRow role="tablist" aria-label="Modo de visualização">
            <ViewToggleBtn
              type="button"
              role="tab"
              aria-selected={modo === "kanban"}
              $ativo={modo === "kanban"}
              onClick={() => setModo("kanban")}
            >
              <KanbanSquare size={14} />
              Kanban
            </ViewToggleBtn>
            <ViewToggleBtn
              type="button"
              role="tab"
              aria-selected={modo === "lista"}
              $ativo={modo === "lista"}
              onClick={() => setModo("lista")}
            >
              <LayoutGrid size={14} />
              Lista
            </ViewToggleBtn>
            {/* Arquivados (§6.2) é a MESMA tela de Lista — troca só o recorte
                de conteúdo (`projetosVisiveis`), não a rota nem o
                componente. */}
            {podeArquivar && (
              <ViewToggleBtn
                type="button"
                role="tab"
                aria-selected={modo === "arquivados"}
                $ativo={modo === "arquivados"}
                onClick={() => setModo("arquivados")}
              >
                <Archive size={14} />
                Arquivados
              </ViewToggleBtn>
            )}
          </ViewToggleRow>
          <FrenteFilterWrap ref={filtroRef}>
            <FrenteFilterButton
              type="button"
              aria-haspopup="listbox"
              aria-expanded={filtroAberto}
              onClick={() => setFiltroAberto((aberto) => !aberto)}
            >
              Filtros
              <ChevronDown size={14} />
            </FrenteFilterButton>
            {filtroAberto && (
              <FrenteFilterPanel role="listbox" aria-label="Filtros">
                {podeFiltrar && (
                  <>
                    <FrenteFilterSecao>Frentes</FrenteFilterSecao>
                    {frentes.map((frente) => (
                      <CheckboxLabel key={frente.id}>
                        <input
                          type="checkbox"
                          checked={frentesSelecionadas.includes(frente.id)}
                          onChange={() => alternarFrente(frente.id)}
                        />
                        {frente.nome}
                      </CheckboxLabel>
                    ))}
                    {frentesSelecionadas.length > 0 && (
                      <FrenteFilterFooter type="button" onClick={() => setFrentesSelecionadas([])}>
                        Limpar seleção
                      </FrenteFilterFooter>
                    )}
                    {(mostrarSecaoOrdem || mostrarSecaoArquivados) && <FrenteFilterDivisor />}
                  </>
                )}

                {/* Ordem só faz sentido em Lista/Arquivados — no Kanban quem
                    organiza os cards é a coluna (status), não uma fila
                    crescente/decrescente. */}
                {mostrarSecaoOrdem && (
                  <>
                    <FrenteFilterSecao>Ordem</FrenteFilterSecao>
                    <FrenteFilterOpcao type="button" onClick={() => setOrdemAsc((atual) => !atual)}>
                      {ordemAsc ? <ArrowDownNarrowWide size={14} /> : <ArrowUpNarrowWide size={14} />}
                      {ordemAsc ? "Início → Fim" : "Fim → Início"}
                    </FrenteFilterOpcao>
                    {mostrarSecaoArquivados && <FrenteFilterDivisor />}
                  </>
                )}

                {/* Já dentro da aba Arquivados o checkbox não faz sentido —
                    o recorte ali JÁ é só arquivados. */}
                {mostrarSecaoArquivados && (
                  <>
                    <FrenteFilterSecao>Arquivados</FrenteFilterSecao>
                    <CheckboxLabel>
                      <input
                        type="checkbox"
                        checked={mostrarArquivados}
                        onChange={(e) => setMostrarArquivados(e.target.checked)}
                      />
                      Mostrar
                    </CheckboxLabel>
                  </>
                )}
              </FrenteFilterPanel>
            )}
          </FrenteFilterWrap>
          {podeCriar && (
            <PageButton type="button" onClick={() => navigate("/projetos/novo")}>
              <Plus size={16} />
              Criar projeto
            </PageButton>
          )}
        </FiltersRow>
      </PageHeaderRow>

      {projetosFiltrados.length === 0 ? (
        modo !== "arquivados" && frentesSelecionadas.length === 0 && !podeCriar ? (
          /* ⭐ Quem não está em projeto nenhum via só uma frase e um beco sem
             saída — e tela vazia sem explicação parece defeito. Agora ela diz
             o que fazer e leva para lá. São ~28 pessoas hoje. */
          <EmptyText>
            Você ainda não está em nenhum projeto.{" "}
            <Link
              to="/vagas"
              state={{ voltarPara: `/projetos?modo=${modo}`, voltarRotulo: "Voltar para Projetos" }}
            >
              Veja os projetos com vaga
            </Link>{" "}
            e peça para entrar em um,
            quem responde é o coordenador.
          </EmptyText>
        ) : (
          <EmptyText>
            {modo === "arquivados"
              ? "Nenhum projeto arquivado."
              : frentesSelecionadas.length > 0
                ? "Nenhum projeto nas frentes selecionadas."
                : "Nenhum projeto ainda. Crie o primeiro."}
          </EmptyText>
        )
      ) : modo === "kanban" ? (
        <>
          {avisoKanban && <FormErrorText>{avisoKanban}</FormErrorText>}
          <ProjetoKanbanBoard
            projetos={projetosOrdenados}
            podeArrastar={podeArrastarKanban}
            nomeFrente={nomeFrente}
            onMover={moverStatus}
            projetosComPendencia={projetosComPendencia}
          />
        </>
      ) : (
        <CardGrid>
          {projetosOrdenados.map((projeto) => {
            const tonsStatus = tonsDaColuna(CORES_STATUS[projeto.status]);
            return (
              <ProjetoCard
                key={projeto.id}
                to={`/projetos/${projeto.id}`}
                // Este card só renderiza fora do Kanban (que já é o padrão
                // pra onde "Voltar" cai sem state nenhum) — aqui é sempre
                // preciso dizer explicitamente o modo de onde se veio.
                state={{ voltarPara: `/projetos?modo=${modo}`, voltarRotulo: "Voltar para projetos" }}
              >
                {projetosComPendencia.has(projeto.id) && (
                  <PendenteDot title="Pedido de entrada pendente" />
                )}
                <div>
                  <CardTitle>{projeto.nome}</CardTitle>
                </div>

                <TagRow>
                  {projeto.frente_ids.map((id) => (
                    <FrenteTag key={id}>{nomeFrente(id)}</FrenteTag>
                  ))}
                  {projeto.sinergico && <FrenteTag>🔗 sinérgico</FrenteTag>}
                </TagRow>

                <div>
                  {/* Mesma cor por fase do kanban de projetos (`CORES_STATUS`) —
                      pra a etapa não parecer outra coisa entre as duas visões.
                      Borda arredondada igual à `FrenteTag` ao lado, não a
                      borda do cabeçalho de coluna do kanban. */}
                  <StatusPilula $cor={tonsStatus}>
                    <Ponto $cor={tonsStatus.ponto} />
                    {ROTULO_STATUS[projeto.status]}
                  </StatusPilula>
                  {/* Redundante dentro da própria aba Arquivados — lá TODO
                      card já é arquivado. */}
                  {projeto.arquivado_em && modo !== "arquivados" && (
                    <PageBadge $tone="muted">📦 Arquivado</PageBadge>
                  )}
                </div>

                <CardEquipe>
                  <strong>Coord:</strong>{" "}
                  {projeto.coordenador_id ? nomeUsuario(projeto.coordenador_id) : "—"}
                  <br />
                  <strong>Cons:</strong>{" "}
                  {projeto.consultor_ids.length > 0
                    ? projeto.consultor_ids.map(nomeUsuario).join(", ")
                    : "—"}
                  {projeto.proxima_banca && (
                    <>
                      <br />
                      <strong>Próxima banca:</strong> {formatarDataHoraBanca(projeto.proxima_banca)}
                    </>
                  )}
                </CardEquipe>

                {projeto.kickoff_pendente && (
                  <CardAlerta>
                    <AlertTriangle size={14} />
                    Kickoff pendente
                  </CardAlerta>
                )}
              </ProjetoCard>
            );
          })}
        </CardGrid>
      )}
    </PageStack>
  );
}
