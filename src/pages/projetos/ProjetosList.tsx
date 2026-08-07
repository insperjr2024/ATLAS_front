import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Archive,
  AlertTriangle,
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
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
import { ProjetoKanbanBoard } from "@/components/kanban/ProjetoKanbanBoard";
import { ColunaPilula, Ponto } from "@/components/kanban/Kanban.styled";
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
  FormErrorText,
} from "./Projetos.styled";

type ModoVisualizacao = "lista" | "kanban";

export function ProjetosList() {
  const { usuario, token } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [projetos, setProjetos] = useState<ProjetoResumo[]>([]);
  const [frentes, setFrentes] = useState<Frente[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioResumo[]>([]);
  const [frentesSelecionadas, setFrentesSelecionadas] = useState<number[]>([]);
  const [filtroAberto, setFiltroAberto] = useState(false);
  // Além do lugar próprio (/projetos/arquivados), dá pra misturar os
  // arquivados na lista/kanban geral — pra quem quer comparar lado a lado
  // com os ativos, sem trocar de tela.
  const [mostrarArquivados, setMostrarArquivados] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  // O kanban é a visão prioritária de Projetos — a lista é a segunda opção,
  // pra quem quer conferir/ordenar em texto corrido. Guardado na URL (não só
  // em estado local) pra "voltar" de dentro de um projeto devolver pro modo
  // de onde a pessoa veio, em vez de sempre resetar pro kanban.
  const [modo, setModoState] = useState<ModoVisualizacao>(
    searchParams.get("modo") === "lista" ? "lista" : "kanban",
  );
  function setModo(novoModo: ModoVisualizacao) {
    setModoState(novoModo);
    setSearchParams(novoModo === "lista" ? { modo: "lista" } : {}, { replace: true });
  }
  const [avisoKanban, setAvisoKanban] = useState("");
  const [ordemAsc, setOrdemAsc] = useState(true);
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
        // um refinamento no cliente (ver `projetosFiltrados` abaixo), pra
        // suportar marcar várias de uma vez.
        getProjetos(token, null, podeArquivar && mostrarArquivados),
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
  }, [token, mostrarArquivados]);

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

  const projetosFiltrados =
    frentesSelecionadas.length === 0
      ? projetos
      : projetos.filter((p) => p.frente_ids.some((id) => frentesSelecionadas.includes(id)));

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

  return (
    <PageStack>
      <PageHeaderRow>
        <PageHeaderText>
          <PageHeading>{rotuloProjetos(usuario)}</PageHeading>
          <PageSubheading>
            {projetosFiltrados.length} {projetosFiltrados.length === 1 ? "projeto" : "projetos"}
            {pendentes > 0 && ` · ${pendentes} com kickoff pendente`}
          </PageSubheading>
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
            {/* Arquivados é outro LUGAR (rota própria, §6.2), não um terceiro
                `modo` desta tela — mas mora na mesma fileira de abas pra não
                virar mais um botão solto no cabeçalho. */}
            {podeArquivar && (
              <ViewToggleBtn
                type="button"
                role="tab"
                aria-selected={false}
                onClick={() => navigate("/projetos/arquivados")}
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
                    {(modo === "lista" || podeArquivar) && <FrenteFilterDivisor />}
                  </>
                )}

                {/* Ordem só faz sentido na Lista — no Kanban quem organiza os
                    cards é a coluna (status), não uma fila crescente/decrescente. */}
                {modo === "lista" && (
                  <>
                    <FrenteFilterSecao>Ordem</FrenteFilterSecao>
                    <FrenteFilterOpcao type="button" onClick={() => setOrdemAsc((atual) => !atual)}>
                      {ordemAsc ? <ArrowDownNarrowWide size={14} /> : <ArrowUpNarrowWide size={14} />}
                      {ordemAsc ? "Início → Fim" : "Fim → Início"}
                    </FrenteFilterOpcao>
                    {podeArquivar && <FrenteFilterDivisor />}
                  </>
                )}

                {podeArquivar && (
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
        <EmptyText>
          {frentesSelecionadas.length > 0
            ? "Nenhum projeto nas frentes selecionadas."
            : podeCriar
              ? "Nenhum projeto ainda. Crie o primeiro."
              : "Você ainda não está alocado em nenhum projeto."}
        </EmptyText>
      ) : modo === "kanban" ? (
        <>
          {avisoKanban && <FormErrorText>{avisoKanban}</FormErrorText>}
          <ProjetoKanbanBoard
            projetos={projetosOrdenados}
            podeArrastar={podeArrastarKanban}
            nomeFrente={nomeFrente}
            onMover={moverStatus}
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
                // Só aqui (visão Lista): kanban já é o padrão pra onde "Voltar"
                // cai sem state nenhum, então só precisa dizer explicitamente
                // quando o destino NÃO é o padrão.
                state={{ voltarPara: "/projetos?modo=lista", voltarRotulo: "Voltar para projetos" }}
              >
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
                      pra a etapa não parecer outra coisa entre as duas visões. */}
                  <ColunaPilula $cor={tonsStatus}>
                    <Ponto $cor={tonsStatus.ponto} />
                    {ROTULO_STATUS[projeto.status]}
                  </ColunaPilula>
                  {projeto.arquivado_em && <PageBadge $tone="muted">📦 Arquivado</PageBadge>}
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
