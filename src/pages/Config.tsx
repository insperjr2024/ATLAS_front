import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Plus, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { createCargo, deleteCargo, getCargos, updateCargo, type CargoPayload } from "@/lib/cargos";
import { createEscopo, deleteEscopo, getEscopos, updateEscopo } from "@/lib/escopos";
import { createFrente, deleteFrente, getFrentes, updateFrente } from "@/lib/frentes";
import { CalendarioAcademicoCard } from "./config/CalendarioAcademicoCard";
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
    campo: "pode_agendar_banca" as const,
    titulo: "Agendar bancas",
    descricao: "Criar, editar e cancelar bancas, e registrar realização e resultado.",
  },
  {
    campo: "pode_definir_formulario" as const,
    titulo: "Editar formulário de banca",
    descricao:
      "Abrir a página Avaliações: montar os critérios do formulário de banca e consultar as notas lançadas. Não tem relação com a Avaliação de Desempenho.",
  },
  {
    campo: "pode_gerenciar_membros" as const,
    titulo: "Gerenciar membros",
    descricao: "Cadastrar pessoas e editar posição, status e frentes de cada uma.",
  },
  {
    campo: "pode_gerenciar_nucleo" as const,
    titulo: "Gerenciar núcleo e configurações",
    descricao: "Editar frentes, escopos, o semestre vigente e o calendário.",
  },
  {
    campo: "pode_gerenciar_desempenho" as const,
    titulo: "Acessar avaliação de desempenho",
    descricao:
      "Abrir o painel de Avaliação de Desempenho: ver os resultados (quem avaliou quem, avaliados, relatórios e pendências) e administrar lotes e mentorias.",
  },
  {
    campo: "pode_definir_formulario_desempenho" as const,
    titulo: "Editar formulário de desempenho",
    descricao:
      "Montar as seções e os critérios dos formulários de Avaliação de Desempenho — o que todo mundo responde. Separada de acessar os resultados.",
  },
  {
    campo: "pode_gerenciar_cargos" as const,
    titulo: "Gerenciar cargos e permissões",
    descricao:
      "Criar cargos e marcar as permissões desta tela. Só tem efeito para quem também é Diretor(a) — é o que impede alguém de se auto-conceder permissões.",
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

  if (!usuario?.cargo.pode_gerenciar_nucleo) {
    return <Navigate to="/dashboard" replace />;
  }

  // Editar cargo é editar quem pode o quê: exige a caixa E a posição, igual
  // ao `require_pode_gerenciar_cargos` do backend. Só a caixa deixaria alguém
  // abrir o próprio cargo e marcar o resto.
  const podeEditarCargos = usuario.posicao === "diretor" && usuario.cargo.pode_gerenciar_cargos;

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
