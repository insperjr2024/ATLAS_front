import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Plus, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getPosicoesPermissoes, updatePosicaoPermissao } from "@/lib/posicoes-permissoes";
import { createEscopo, deleteEscopo, getEscopos, updateEscopo } from "@/lib/escopos";
import { createFrente, deleteFrente, getFrentes, updateFrente } from "@/lib/frentes";
import { SituacoesCargaCard } from "./config/SituacoesCargaCard";
import { ComposicaoBancaCard } from "./config/ComposicaoBancaCard";
import { GestaoSemestralCard } from "./config/GestaoSemestralCard";
import { ConfirmarModal } from "@/components/ConfirmarModal";
import type { Escopo, Frente } from "@/types/banca";
import type { Permissoes, PosicaoPermissao } from "@/types/auth";
import { ROTULO_POSICAO } from "@/utils/permissoes";
import {
  PageStack,
  PageCard,
  PageCardHeader,
  PageCardTitle,
  PageCardContent,
  PageButton,
  PageButtonSm,
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
  DataTable,
  TableHead,
  TableHeadCell,
  TableBody,
  TableRow,
  NameCell,
  TableCell,
  ActionsCell,
  CardHeaderActions,
  PermissaoBadge,
  FormStack,
  FieldGroup,
  FieldLabel,
  FieldInput,
  FieldSelect,
  FormErrorText,
  ModalOverlay,
  ModalHeader,
  ModalTitle,
  ModalClose,
  ModalBody,
  ModalFooter,
  WideModalContent,
  PermissoesGrid,
  PermissaoItem,
  PermissaoTexto,
  PermissaoTitulo,
  PermissaoDesc,
  SecaoGrupo,
  SecaoCabecalho,
  SecaoTitulo,
  SecaoDescricao,
  GrupoFrenteTitulo,
} from "./Config.styled";
import { LIST_MAX_VISIVEIS, TableScrollWrap } from "@/styles/shared.styled";

// Fonte única dos rótulos: alimenta as caixas do modal de edição E as tags da
// tabela. Cada título é verbo + objeto, para a tag dizer sozinha o que a posição
// pode fazer, sem depender de abrir o modal para descobrir.
const PERMISSOES = [
  {
    campo: "pode_criar_projeto" as const,
    titulo: "Criar projeto e alocar equipe",
    descricao:
      "Abrir um projeto novo e escolher coordenador e consultores na criação.",
  },
  {
    campo: "pode_editar_equipe" as const,
    titulo: "Editar a equipe de um projeto",
    descricao:
      "Trocar o coordenador e adicionar ou remover consultores de um projeto que já existe.",
  },
  {
    campo: "pode_gerir_membros" as const,
    titulo: "Gerir membros (posição e status)",
    descricao:
      "Abrir a página Membros: cadastrar pessoas e mudar a posição, o status e as frentes de cada uma.",
  },
  {
    campo: "pode_marcar_kickoff" as const,
    titulo: "Marcar kickoff e data de entrega",
    descricao: "Registrar a data de kickoff do projeto e a data de entrega ao cliente.",
  },
  {
    campo: "pode_definir_cronograma" as const,
    titulo: "Definir cronograma por escopo (etapas, banca)",
    descricao:
      "Criar e mover etapas e marcos, definir o cronograma de um escopo e agendar as bancas.",
  },
  {
    campo: "pode_criar_tarefa" as const,
    titulo: "Criar tarefa",
    descricao: "Abrir tarefas novas no quadro de um projeto.",
  },
  {
    campo: "pode_mover_editar_tarefa" as const,
    titulo: "Mover e editar tarefa",
    descricao:
      "Arrastar tarefas entre colunas e editar título, responsável, prazo e descrição.",
  },
  {
    campo: "pode_ver_proprios_projetos" as const,
    titulo: "Ver os próprios projetos",
    descricao:
      "Enxergar a lista de projetos. O que aparece continua limitado pelo recorte de visão: coordenador e consultor só veem onde estão alocados.",
  },
  {
    campo: "pode_ver_monitoramento" as const,
    titulo: "Monitoramento e alocação",
    descricao:
      "Abrir o Monitoramento: visão geral, execução, alocação de pessoas e atrasos.",
  },
  // As 3 abaixo não estão na tabela do , nasceram travadas só por posição
  // (diretor, ou diretor+gerente) e viraram caixa configurável a pedido
  // explícito do usuário, pro mesmo motivo das 10: dar pra delegar sem
  // precisar tornar alguém "diretor" inteiro.
  {
    campo: "pode_administrar_desempenho" as const,
    titulo: "Administrar Avaliação de Desempenho",
    descricao:
      "Abrir o painel de Avaliação de Desempenho: lotes, avaliadores, avaliados, relatório, mentoria e PDI.",
  },
  {
    campo: "pode_editar_formularios_desempenho" as const,
    titulo: "Editar formulários de Avaliação de Desempenho",
    descricao:
      "Mudar as seções e critérios dos formulários, afeta o que todo mundo é avaliado, não só a rotina de administrar.",
  },
  {
    campo: "pode_administrar_configuracoes" as const,
    titulo: "Administrar Configurações",
    descricao:
      "Abrir Configurações e Calendários base, inclusive editar as permissões de qualquer posição, o que inclui conceder esta mesma caixa a outra.",
  },
  {
    campo: "pode_ver_todos_projetos" as const,
    titulo: "Ver todos os projetos, de qualquer frente",
    descricao:
      "A única caixa que muda QUAIS projetos aparecem, as outras de cima só abrem funcionalidade, sem tocar nisso. Sem esta caixa, coordenador e consultor sempre ficam limitados ao que já estão alocados, mesmo com todo o resto marcado.",
  },
];

type CampoPermissao = (typeof PERMISSOES)[number]["campo"];

function permissoesDaPosicao(posicao: PosicaoPermissao) {
  return PERMISSOES.filter((p) => posicao[p.campo]);
}

export function Config() {
  const { usuario, token } = useAuth();
  const [frentes, setFrentes] = useState<Frente[]>([]);
  const [escopos, setEscopos] = useState<Escopo[]>([]);
  const [posicoes, setPosicoes] = useState<PosicaoPermissao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [modalFrente, setModalFrente] = useState<Frente | "novo" | null>(null);
  const [modalEscopo, setModalEscopo] = useState<Escopo | "novo" | null>(null);
  const [modalPosicao, setModalPosicao] = useState<PosicaoPermissao | null>(null);

  const [paraExcluir, setParaExcluir] = useState<
    { tipo: "frente"; item: Frente } | { tipo: "escopo"; item: Escopo } | null
  >(null);

  async function confirmarExclusao() {
    if (!token || !paraExcluir) return;
    if (paraExcluir.tipo === "frente") await deleteFrente(paraExcluir.item.id, token);
    else await deleteEscopo(paraExcluir.item.id, token);
    setParaExcluir(null);
    buscar();
  }

  async function buscar() {
    if (!token) return;
    setCarregando(true);
    setErro("");
    try {
      const [frentesResp, escoposResp, posicoesResp] = await Promise.all([
        getFrentes(token),
        getEscopos(token),
        getPosicoesPermissoes(token),
      ]);
      setFrentes(frentesResp.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")));
      setEscopos(escoposResp.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")));
      setPosicoes(posicoesResp);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar configurações");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    buscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Núcleo e Configurações ficaram fora da tabela das 10, mas viraram
  // caixa própria (`pode_administrar_configuracoes`) a pedido explícito do
  // usuário, inclusive pra editar as permissões de qualquer posição, que é
  // a ação mais sensível daqui: quem tem a caixa concede a mesma caixa (ou
  // qualquer outra) a outra posição. Só quem já tem a permissão consegue
  // distribuí-la, então não dá pra se auto-conceder do zero.
  if (!usuario?.permissoes.pode_administrar_configuracoes) {
    return <Navigate to="/dashboard" replace />;
  }

  const podeEditarPermissoes = usuario.permissoes.pode_administrar_configuracoes;

  if (erro) {
    return (
      <ErrorBlock>
        <ErrorText>Não foi possível carregar as configurações: {erro}</ErrorText>
        <PageButton $variant="outline" onClick={buscar}>
          Tentar novamente
        </PageButton>
      </ErrorBlock>
    );
  }

  if (carregando || !token) return <PageLoadingBlock />;

  return (
    <PageStack>
      <PageHeaderRow>
        <PageHeaderText>
          <PageHeading>Configurações</PageHeading>
          <PageSubheading>
            O semestre em curso, a estrutura de frentes e escopos, as regras que a plataforma
            aplica sozinha e o acesso de cada posição.
          </PageSubheading>
        </PageHeaderText>
      </PageHeaderRow>

      {/* Os cards estão agrupados por assunto, e não na ordem em que foram
          sendo construídos. A ordem dos grupos segue a dependência: o semestre
          e os cadastros vêm primeiro porque o resto os referencia (escopo
          aponta pra frente, banca conta o piso da frente), as regras
          automáticas depois, e o acesso por último, é o único grupo que não
          fala de operação, e sim de quem entra onde. */}
      <SecaoGrupo>
        <SecaoCabecalho>
          <SecaoTitulo>Ciclo e estrutura</SecaoTitulo>
          <SecaoDescricao>
            O semestre em curso e os cadastros que o resto da plataforma referencia.
          </SecaoDescricao>
        </SecaoCabecalho>

        <GestaoSemestralCard />

        <PageCard>
          <PageCardHeader>
            <CardHeaderActions>
              <PageCardTitle>Frentes</PageCardTitle>
              <PageButtonSm type="button" onClick={() => setModalFrente("novo")}>
                <Plus size={14} />
                Adicionar
              </PageButtonSm>
            </CardHeaderActions>
          </PageCardHeader>
          <PageCardContent>
            {frentes.length === 0 && <EmptyText>Nenhuma frente cadastrada.</EmptyText>}
            {frentes.length > 0 && (
              <TableScrollWrap $scrollable={frentes.length > LIST_MAX_VISIVEIS} $min="30rem">
                <DataTable>
                  <TableHead>
                    <TableRow>
                      <TableHeadCell>Nome</TableHeadCell>
                      <TableHeadCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {frentes.map((frente) => (
                      <TableRow key={frente.id}>
                        {/* ⚠ A coluna "Piso mínimo por banca" saiu em
                            2026-09-01: o número virou só o PADRÃO de combinação
                            não configurada, e mostrá-lo aqui fazia parecer que
                            editá-lo mudava as bancas — quem manda é a matriz,
                            em "Composição por combinação de frentes". */}
                        <NameCell>{frente.nome}</NameCell>
                        <ActionsCell>
                          <PageButtonSm $variant="outline" type="button" onClick={() => setModalFrente(frente)}>
                            Editar
                          </PageButtonSm>
                          <PageButtonSm
                            $variant="outline"
                            type="button"
                            onClick={() => setParaExcluir({ tipo: "frente", item: frente })}
                          >
                            Excluir
                          </PageButtonSm>
                        </ActionsCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </DataTable>
              </TableScrollWrap>
            )}
          </PageCardContent>
        </PageCard>

        {/* Logo abaixo de Frentes: todo escopo aponta para uma frente, então a
            lista de cima é o vocabulário do select daqui. */}
        <PageCard>
          <PageCardHeader>
            <CardHeaderActions>
              <PageCardTitle>Escopos</PageCardTitle>
              <PageButtonSm type="button" onClick={() => setModalEscopo("novo")}>
                <Plus size={14} />
                Adicionar
              </PageButtonSm>
            </CardHeaderActions>
          </PageCardHeader>
          <PageCardContent>
            {escopos.length === 0 && <EmptyText>Nenhum escopo cadastrado.</EmptyText>}
            {escopos.length > 0 && (
              <TabelaEscopos
                itens={escopos}
                frentes={frentes}
                onEditar={setModalEscopo}
                onExcluir={(item) => setParaExcluir({ tipo: "escopo", item })}
              />
            )}
          </PageCardContent>
        </PageCard>
      </SecaoGrupo>

      <SecaoGrupo>
        <SecaoCabecalho>
          <SecaoTitulo>Regras de operação</SecaoTitulo>
          <SecaoDescricao>
            Os números que a plataforma aplica sozinha ao montar bancas e ao ler a carga de cada
            pessoa.
          </SecaoDescricao>
        </SecaoCabecalho>

        {/* ⚠ O card "Configurações de banca" saiu daqui em 2026-09-01. Ele
            editava `vagas_por_banca` e `lideranca_minima_por_frente`, e com a
            matriz por combinação existindo eram TRÊS lugares configurando a
            mesma coisa — a diretoria mexia num e não via efeito, porque quem
            manda é a matriz. O teto migrou para o card abaixo; o mínimo de
            liderança virou só o padrão de combinação não configurada, e se
            edita por lá. */}
        <ComposicaoBancaCard />

        <SituacoesCargaCard />
      </SecaoGrupo>

      <SecaoGrupo>
        <SecaoCabecalho>
          <SecaoTitulo>Acesso</SecaoTitulo>
          <SecaoDescricao>Quem pode fazer o quê na plataforma, por posição.</SecaoDescricao>
        </SecaoCabecalho>

        <PageCard>
          <PageCardHeader>
            <CardHeaderActions>
              <PageCardTitle>Permissões por posição</PageCardTitle>
            </CardHeaderActions>
          </PageCardHeader>
          <PageCardContent>
            {!podeEditarPermissoes && (
              <EmptyText style={{ fontSize: "0.7rem" }}>
                Só quem já tem esta permissão pode editar, impede auto-concessão de acesso.
              </EmptyText>
            )}
            <TableScrollWrap $scrollable={posicoes.length > LIST_MAX_VISIVEIS} $min="30rem">
              <DataTable>
                <TableHead>
                  <TableRow>
                    <TableHeadCell>Posição</TableHeadCell>
                    <TableHeadCell>Permissões</TableHeadCell>
                    <TableHeadCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {posicoes.map((posicao) => (
                    <TableRow key={posicao.posicao}>
                      <NameCell>{ROTULO_POSICAO[posicao.posicao] ?? posicao.posicao}</NameCell>
                      <TableCell>
                        {permissoesDaPosicao(posicao).length === 0 && "—"}
                        {permissoesDaPosicao(posicao).map((p) => (
                          <PermissaoBadge key={p.campo} title={p.descricao}>
                            {p.titulo}
                          </PermissaoBadge>
                        ))}
                      </TableCell>
                      <ActionsCell>
                        {podeEditarPermissoes && (
                          <PageButtonSm $variant="outline" type="button" onClick={() => setModalPosicao(posicao)}>
                            Editar
                          </PageButtonSm>
                        )}
                      </ActionsCell>
                    </TableRow>
                  ))}
                </TableBody>
              </DataTable>
            </TableScrollWrap>
          </PageCardContent>
        </PageCard>
      </SecaoGrupo>

      {modalFrente && (
        <ModalFrente
          frente={modalFrente === "novo" ? null : modalFrente}
          onClose={() => setModalFrente(null)}
          onSalvar={async (nome, pisoBanca) => {
            if (modalFrente === "novo") await createFrente({ nome, piso_banca: pisoBanca }, token);
            else await updateFrente(modalFrente.id, { nome, piso_banca: pisoBanca }, token);
            setModalFrente(null);
            buscar();
          }}
        />
      )}

      {modalEscopo && (
        <ModalEscopo
          escopo={modalEscopo === "novo" ? null : modalEscopo}
          frentes={frentes}
          onClose={() => setModalEscopo(null)}
          onSalvar={async (nome, frenteId) => {
            if (modalEscopo === "novo") await createEscopo(nome, frenteId, token);
            else await updateEscopo(modalEscopo.id, nome, frenteId, token);
            setModalEscopo(null);
            buscar();
          }}
        />
      )}

      {modalPosicao && (
        <ModalPosicaoPermissao
          posicao={modalPosicao}
          onClose={() => setModalPosicao(null)}
          onSalvar={async (dados) => {
            await updatePosicaoPermissao(modalPosicao.posicao, dados, token);
            setModalPosicao(null);
            buscar();
          }}
        />
      )}

      {paraExcluir && (
        <ConfirmarModal
          titulo="Excluir"
          mensagem={`Excluir ${paraExcluir.tipo === "frente" ? "a frente" : "o escopo"} "${paraExcluir.item.nome}"?`}
          onCancelar={() => setParaExcluir(null)}
          onConfirmar={confirmarExclusao}
        />
      )}
    </PageStack>
  );
}

function TabelaEscopos({
  itens,
  frentes,
  onEditar,
  onExcluir,
}: {
  itens: Escopo[];
  frentes: Frente[];
  onEditar: (item: Escopo) => void;
  onExcluir: (item: Escopo) => void;
}) {
  // Um grupo por frente, na ordem em que elas aparecem em Frentes (acima
  // desta lista), e "Sem frente" por último — é a exceção, não a regra.
  const grupos: { nome: string; itens: Escopo[] }[] = [
    ...frentes.map((f) => ({
      nome: f.nome,
      itens: itens.filter((e) => e.frente_id === f.id),
    })),
    { nome: "Sem frente", itens: itens.filter((e) => e.frente_id === null) },
  ].filter((g) => g.itens.length > 0);

  return (
    <TableScrollWrap $scrollable={itens.length > LIST_MAX_VISIVEIS}>
      {grupos.map((grupo) => (
        <div key={grupo.nome}>
          <GrupoFrenteTitulo>{grupo.nome}</GrupoFrenteTitulo>
          <DataTable>
            <TableHead>
              <TableRow>
                <TableHeadCell>Nome</TableHeadCell>
                <TableHeadCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {grupo.itens.map((item) => (
                <TableRow key={item.id}>
                  <NameCell>{item.nome}</NameCell>
                  <ActionsCell>
                    <PageButtonSm $variant="outline" type="button" onClick={() => onEditar(item)}>
                      Editar
                    </PageButtonSm>
                    <PageButtonSm $variant="outline" type="button" onClick={() => onExcluir(item)}>
                      Excluir
                    </PageButtonSm>
                  </ActionsCell>
                </TableRow>
              ))}
            </TableBody>
          </DataTable>
        </div>
      ))}
    </TableScrollWrap>
  );
}

function ModalEscopo({
  escopo,
  frentes,
  onClose,
  onSalvar,
}: {
  /** `null` = criando um escopo novo. */
  escopo: Escopo | null;
  frentes: Frente[];
  onClose: () => void;
  onSalvar: (nome: string, frenteId: number | null) => Promise<void>;
}) {
  const [nome, setNome] = useState(escopo?.nome ?? "");
  const [frenteId, setFrenteId] = useState<string>(
    escopo?.frente_id ? String(escopo.frente_id) : "",
  );
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    setSalvando(true);
    setErro("");
    try {
      await onSalvar(nome.trim(), frenteId ? Number(frenteId) : null);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <ModalOverlay onClick={onClose} role="presentation">
      <WideModalContent onClick={(e) => e.stopPropagation()} role="dialog">
        <ModalHeader>
          <ModalTitle>{escopo ? "Editar escopo" : "Novo escopo"}</ModalTitle>
          <ModalClose type="button" aria-label="Fechar" onClick={onClose}>
            <X size={18} />
          </ModalClose>
        </ModalHeader>
        <FormStack onSubmit={handleSubmit}>
          <ModalBody>
            <FieldGroup>
              <FieldLabel htmlFor="escopo-nome">Nome</FieldLabel>
              <FieldInput id="escopo-nome" value={nome} onChange={(e) => setNome(e.target.value)} required autoFocus />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel htmlFor="escopo-frente">Frente</FieldLabel>
              <FieldSelect id="escopo-frente" value={frenteId} onChange={(e) => setFrenteId(e.target.value)}>
                <option value="">Sem frente</option>
                {frentes.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nome}
                  </option>
                ))}
              </FieldSelect>
            </FieldGroup>
            {erro && <FormErrorText>{erro}</FormErrorText>}
          </ModalBody>
          <ModalFooter>
            <PageButton $variant="outline" type="button" onClick={onClose}>
              Cancelar
            </PageButton>
            <PageButton type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar"}
            </PageButton>
          </ModalFooter>
        </FormStack>
      </WideModalContent>
    </ModalOverlay>
  );
}

function ModalFrente({
  frente,
  onClose,
  onSalvar,
}: {
  /** `null` = criando uma frente nova. */
  frente: Frente | null;
  onClose: () => void;
  onSalvar: (nome: string, pisoBanca: number) => Promise<void>;
}) {
  const [nome, setNome] = useState(frente?.nome ?? "");
  const [pisoBanca, setPisoBanca] = useState(String(frente?.piso_banca ?? 1));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    const piso = Number(pisoBanca);
    if (!Number.isFinite(piso) || piso < 0) {
      setErro("Informe um piso mínimo válido.");
      return;
    }
    setSalvando(true);
    setErro("");
    try {
      await onSalvar(nome.trim(), piso);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <ModalOverlay onClick={onClose} role="presentation">
      <WideModalContent onClick={(e) => e.stopPropagation()} role="dialog">
        <ModalHeader>
          <ModalTitle>{frente ? "Editar frente" : "Nova frente"}</ModalTitle>
          <ModalClose type="button" aria-label="Fechar" onClick={onClose}>
            <X size={18} />
          </ModalClose>
        </ModalHeader>
        <FormStack onSubmit={handleSubmit}>
          <ModalBody>
            <FieldGroup>
              <FieldLabel htmlFor="nome-frente">Nome</FieldLabel>
              <FieldInput id="nome-frente" value={nome} onChange={(e) => setNome(e.target.value)} required autoFocus />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel htmlFor="piso-frente">Piso mínimo por banca</FieldLabel>
              <FieldInput
                id="piso-frente"
                type="number"
                min={0}
                value={pisoBanca}
                onChange={(e) => setPisoBanca(e.target.value)}
                required
              />
            </FieldGroup>
            {erro && <FormErrorText>{erro}</FormErrorText>}
          </ModalBody>
          <ModalFooter>
            <PageButton $variant="outline" type="button" onClick={onClose}>
              Cancelar
            </PageButton>
            <PageButton type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar"}
            </PageButton>
          </ModalFooter>
        </FormStack>
      </WideModalContent>
    </ModalOverlay>
  );
}

/** As caixas do formulário, na ordem em que aparecem, derivadas de
 *  `PERMISSOES` para uma permissão nova não nascer faltando no modal. */
function permissoesDe(posicao: PosicaoPermissao): Record<CampoPermissao, boolean> {
  return Object.fromEntries(
    PERMISSOES.map((p) => [p.campo, posicao[p.campo]]),
  ) as Record<CampoPermissao, boolean>;
}

function ModalPosicaoPermissao({
  posicao,
  onClose,
  onSalvar,
}: {
  posicao: PosicaoPermissao;
  onClose: () => void;
  onSalvar: (dados: Partial<Permissoes>) => Promise<void>;
}) {
  const [permissoes, setPermissoes] = useState(permissoesDe(posicao));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  function togglePermissao(campo: keyof typeof permissoes) {
    setPermissoes((p) => ({ ...p, [campo]: !p[campo] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro("");
    try {
      await onSalvar(permissoes);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar permissões");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <ModalOverlay onClick={onClose} role="presentation">
      <WideModalContent onClick={(e) => e.stopPropagation()} role="dialog">
        <ModalHeader>
          <ModalTitle>Editar permissões, {ROTULO_POSICAO[posicao.posicao] ?? posicao.posicao}</ModalTitle>
          <ModalClose type="button" aria-label="Fechar" onClick={onClose}>
            <X size={18} />
          </ModalClose>
        </ModalHeader>
        <FormStack onSubmit={handleSubmit}>
          <ModalBody>
            <FieldGroup>
              <FieldLabel>Permissões na plataforma</FieldLabel>
              <PermissoesGrid>
                {PERMISSOES.map((p) => (
                  <PermissaoItem key={p.campo}>
                    <input
                      type="checkbox"
                      checked={permissoes[p.campo]}
                      onChange={() => togglePermissao(p.campo)}
                    />
                    <PermissaoTexto>
                      <PermissaoTitulo>{p.titulo}</PermissaoTitulo>
                      <PermissaoDesc>{p.descricao}</PermissaoDesc>
                    </PermissaoTexto>
                  </PermissaoItem>
                ))}
              </PermissoesGrid>
            </FieldGroup>

            {erro && <FormErrorText>{erro}</FormErrorText>}
          </ModalBody>
          <ModalFooter>
            <PageButton $variant="outline" type="button" onClick={onClose}>
              Cancelar
            </PageButton>
            <PageButton type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar"}
            </PageButton>
          </ModalFooter>
        </FormStack>
      </WideModalContent>
    </ModalOverlay>
  );
}
