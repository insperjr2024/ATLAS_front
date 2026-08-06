import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Plus, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { createCargo, deleteCargo, getCargos, updateCargo, type CargoPayload } from "@/lib/cargos";
import { createEscopo, deleteEscopo, getEscopos, updateEscopo } from "@/lib/escopos";
import { createFrente, deleteFrente, getFrentes, updateFrente } from "@/lib/frentes";
import { CalendarioAcademicoCard } from "./config/CalendarioAcademicoCard";
import { SituacoesCargaCard } from "./config/SituacoesCargaCard";
import type { Escopo, Frente } from "@/types/banca";
import type { Cargo } from "@/types/auth";
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
} from "./Config.styled";
import { LIST_MAX_VISIVEIS, TableScrollWrap } from "@/styles/shared.styled";

// Fonte única dos rótulos: alimenta as caixas do modal de edição E as tags da
// tabela. Cada título é verbo + objeto, para a tag dizer sozinha o que o cargo
// pode fazer — sem depender de abrir o modal para descobrir.
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
      "Criar e mover etapas e marcos, oficializar o cronograma de um escopo e agendar as bancas.",
  },
  {
    campo: "pode_aprovar_reajuste" as const,
    titulo: "Aprovar reajuste de cronograma",
    descricao:
      "Liberar a mudança de um cronograma já oficializado. A tela de reajuste ainda não existe — a caixa fica pronta para quando ela for construída.",
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
];

type CampoPermissao = (typeof PERMISSOES)[number]["campo"];

function permissoesDoCargo(cargo: Cargo) {
  return PERMISSOES.filter((p) => cargo[p.campo]);
}

export function Config() {
  const { usuario, token } = useAuth();
  const [frentes, setFrentes] = useState<Frente[]>([]);
  const [escopos, setEscopos] = useState<Escopo[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [modalFrente, setModalFrente] = useState<Frente | "novo" | null>(null);
  const [modalEscopo, setModalEscopo] = useState<Escopo | "novo" | null>(null);
  const [modalCargo, setModalCargo] = useState<Cargo | "novo" | null>(null);

  async function buscar() {
    if (!token) return;
    setCarregando(true);
    setErro("");
    try {
      const [frentesResp, escoposResp, cargosResp] = await Promise.all([
        getFrentes(token),
        getEscopos(token),
        getCargos(token),
      ]);
      setFrentes(frentesResp.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")));
      setEscopos(escoposResp.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")));
      setCargos(cargosResp.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")));
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

  // Núcleo e Configurações ficaram fora da tabela das 10, então voltam a ser
  // restritos à diretoria por posição.
  if (usuario?.posicao !== "diretor") {
    return <Navigate to="/dashboard" replace />;
  }

  // Editar cargo é editar quem pode o quê. Sem caixa própria (ela saiu com as
  // 7 antigas), a trava é a posição — que não se edita por aqui, e por isso
  // ninguém consegue se auto-conceder permissão.
  const podeEditarCargos = usuario.posicao === "diretor";

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
            Gestão semestral, calendário acadêmico, frentes, escopos e cargos.
          </PageSubheading>
        </PageHeaderText>
      </PageHeaderRow>

      {/* Vem primeiro de propósito: é a carga que define o dia útil (§5.4),
          e sem ela toda a contagem do sistema fica errada. */}
      <CalendarioAcademicoCard />

      <SituacoesCargaCard />

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
            <TabelaNomes
              itens={frentes}
              onEditar={setModalFrente}
              onExcluir={async (item) => {
                if (!confirm(`Excluir a frente "${item.nome}"?`)) return;
                try {
                  await deleteFrente(item.id, token);
                  buscar();
                } catch (err) {
                  alert(err instanceof Error ? err.message : "Erro ao excluir");
                }
              }}
            />
          )}
        </PageCardContent>
      </PageCard>

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
            <TabelaNomes
              itens={escopos}
              onEditar={setModalEscopo}
              onExcluir={async (item) => {
                if (!confirm(`Excluir o escopo "${item.nome}"?`)) return;
                try {
                  await deleteEscopo(item.id, token);
                  buscar();
                } catch (err) {
                  alert(err instanceof Error ? err.message : "Erro ao excluir");
                }
              }}
            />
          )}
        </PageCardContent>
      </PageCard>

      <PageCard>
        <PageCardHeader>
          <CardHeaderActions>
            <PageCardTitle>Cargos</PageCardTitle>
            {podeEditarCargos && (
              <PageButtonSm type="button" onClick={() => setModalCargo("novo")}>
                <Plus size={14} />
                Adicionar
              </PageButtonSm>
            )}
          </CardHeaderActions>
        </PageCardHeader>
        <PageCardContent>
          {!podeEditarCargos && (
            <EmptyText style={{ fontSize: "0.7rem" }}>
              Só a diretoria altera cargos e permissões — é o que impede alguém de
              se auto-conceder acesso. Aqui você consulta quem pode o quê.
            </EmptyText>
          )}
          {cargos.length === 0 && <EmptyText>Nenhum cargo cadastrado.</EmptyText>}
          {cargos.length > 0 && (
            <TableScrollWrap $scrollable={cargos.length > LIST_MAX_VISIVEIS}>
            <DataTable>
              <TableHead>
                <TableRow>
                  <TableHeadCell>Cargo</TableHeadCell>
                  <TableHeadCell>Permissões</TableHeadCell>
                  <TableHeadCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {cargos.map((cargo) => (
                  <TableRow key={cargo.id}>
                    <NameCell>{cargo.nome}</NameCell>
                    <TableCell>
                      {permissoesDoCargo(cargo).length === 0 && "—"}
                      {permissoesDoCargo(cargo).map((p) => (
                        <PermissaoBadge key={p.campo} title={p.descricao}>
                          {p.titulo}
                        </PermissaoBadge>
                      ))}
                    </TableCell>
                    <ActionsCell>
                      {podeEditarCargos && (
                        <>
                          <PageButtonSm $variant="outline" type="button" onClick={() => setModalCargo(cargo)}>
                            Editar
                          </PageButtonSm>
                          <PageButtonSm
                            $variant="outline"
                            type="button"
                            onClick={async () => {
                              if (!confirm(`Excluir o cargo "${cargo.nome}"?`)) return;
                              try {
                                await deleteCargo(cargo.id, token);
                                buscar();
                              } catch (err) {
                                alert(err instanceof Error ? err.message : "Erro ao excluir");
                              }
                            }}
                          >
                            Excluir
                          </PageButtonSm>
                        </>
                      )}
                    </ActionsCell>
                  </TableRow>
                ))}
              </TableBody>
            </DataTable>
            </TableScrollWrap>
          )}
        </PageCardContent>
      </PageCard>

      {modalFrente && (
        <ModalNome
          titulo={modalFrente === "novo" ? "Nova frente" : "Editar frente"}
          nomeInicial={modalFrente === "novo" ? "" : modalFrente.nome}
          onClose={() => setModalFrente(null)}
          onSalvar={async (nome) => {
            if (modalFrente === "novo") await createFrente(nome, token);
            else await updateFrente(modalFrente.id, nome, token);
            setModalFrente(null);
            buscar();
          }}
        />
      )}

      {modalEscopo && (
        <ModalNome
          titulo={modalEscopo === "novo" ? "Novo escopo" : "Editar escopo"}
          nomeInicial={modalEscopo === "novo" ? "" : modalEscopo.nome}
          onClose={() => setModalEscopo(null)}
          onSalvar={async (nome) => {
            if (modalEscopo === "novo") await createEscopo(nome, token);
            else await updateEscopo(modalEscopo.id, nome, token);
            setModalEscopo(null);
            buscar();
          }}
        />
      )}

      {modalCargo && (
        <ModalCargo
          cargo={modalCargo === "novo" ? null : modalCargo}
          cargos={cargos}
          onClose={() => setModalCargo(null)}
          onSalvar={async (dados, cargoId) => {
            if (cargoId === null) await createCargo(dados, token);
            else await updateCargo(cargoId, dados, token);
            setModalCargo(null);
            buscar();
          }}
        />
      )}
    </PageStack>
  );
}

// Genérica no item para preservar o tipo concreto (`Escopo`, `Frente`, …)
// no callback — sem isso, `onEditar={setModalEscopo}` perde os campos novos.
function TabelaNomes<T extends { id: number; nome: string }>({
  itens,
  onEditar,
  onExcluir,
}: {
  itens: T[];
  onEditar: (item: T) => void;
  onExcluir: (item: T) => void;
}) {
  return (
    <TableScrollWrap $scrollable={itens.length > LIST_MAX_VISIVEIS}>
      <DataTable>
        <TableHead>
          <TableRow>
            <TableHeadCell>Nome</TableHeadCell>
            <TableHeadCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {itens.map((item) => (
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
    </TableScrollWrap>
  );
}

function ModalNome({
  titulo,
  nomeInicial,
  onClose,
  onSalvar,
}: {
  titulo: string;
  nomeInicial: string;
  onClose: () => void;
  onSalvar: (nome: string) => Promise<void>;
}) {
  const [nome, setNome] = useState(nomeInicial);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    setSalvando(true);
    setErro("");
    try {
      await onSalvar(nome.trim());
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
          <ModalTitle>{titulo}</ModalTitle>
          <ModalClose type="button" aria-label="Fechar" onClick={onClose}>
            <X size={18} />
          </ModalClose>
        </ModalHeader>
        <FormStack onSubmit={handleSubmit}>
          <ModalBody>
            <FieldGroup>
              <FieldLabel htmlFor="nome-item">Nome</FieldLabel>
              <FieldInput id="nome-item" value={nome} onChange={(e) => setNome(e.target.value)} required autoFocus />
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

/** As caixas do formulário, na ordem em que aparecem — derivadas de
 *  `PERMISSOES` para uma permissão nova não nascer faltando no modal. */
function permissoesDe(cargo: Cargo | null): Record<CampoPermissao, boolean> {
  return Object.fromEntries(
    PERMISSOES.map((p) => [p.campo, cargo?.[p.campo] ?? false]),
  ) as Record<CampoPermissao, boolean>;
}

function ModalCargo({
  cargo,
  cargos,
  onClose,
  onSalvar,
}: {
  /** `null` = criando um cargo novo. */
  cargo: Cargo | null;
  cargos: Cargo[];
  onClose: () => void;
  onSalvar: (dados: CargoPayload, cargoId: number | null) => Promise<void>;
}) {
  const criando = cargo === null;
  // Ao editar, o cargo é escolhido numa lista — digitar o nome renomearia o
  // cargo por engano, que é o oposto do que esta tela existe para fazer.
  const [cargoId, setCargoId] = useState(cargo?.id ?? null);
  const [nome, setNome] = useState(cargo?.nome ?? "");
  const [permissoes, setPermissoes] = useState(permissoesDe(cargo));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const selecionado = criando ? null : (cargos.find((c) => c.id === cargoId) ?? null);

  function trocarCargo(novoId: number) {
    // Trocar de cargo recarrega as caixas dele — senão as marcações do cargo
    // anterior seriam salvas por cima do novo.
    setCargoId(novoId);
    setPermissoes(permissoesDe(cargos.find((c) => c.id === novoId) ?? null));
    setErro("");
  }

  function togglePermissao(campo: keyof typeof permissoes) {
    setPermissoes((p) => ({ ...p, [campo]: !p[campo] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (criando && !nome.trim()) return;
    if (!criando && !selecionado) {
      setErro("Escolha o cargo que você quer alterar.");
      return;
    }
    setSalvando(true);
    setErro("");
    try {
      await onSalvar(
        { nome: criando ? nome.trim() : selecionado!.nome, ...permissoes },
        criando ? null : selecionado!.id,
      );
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar cargo");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <ModalOverlay onClick={onClose} role="presentation">
      <WideModalContent onClick={(e) => e.stopPropagation()} role="dialog">
        <ModalHeader>
          <ModalTitle>{criando ? "Novo cargo" : "Editar permissões"}</ModalTitle>
          <ModalClose type="button" aria-label="Fechar" onClick={onClose}>
            <X size={18} />
          </ModalClose>
        </ModalHeader>
        <FormStack onSubmit={handleSubmit}>
          <ModalBody>
            <FieldGroup>
              <FieldLabel htmlFor="nome-cargo">Cargo</FieldLabel>
              {criando ? (
                <FieldInput
                  id="nome-cargo"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome do cargo novo"
                  required
                  autoFocus
                />
              ) : (
                <FieldSelect
                  id="nome-cargo"
                  value={cargoId ?? ""}
                  onChange={(e) => trocarCargo(Number(e.target.value))}
                  autoFocus
                >
                  {cargos.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </FieldSelect>
              )}
            </FieldGroup>

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
