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

const PERMISSOES = [
  {
    campo: "pode_agendar_banca" as const,
    titulo: "Agendar bancas",
    descricao: "Exibe o botão Criar banca na página de Bancas.",
  },
  {
    campo: "pode_definir_formulario" as const,
    titulo: "Definir formulário",
    descricao: "Acesso à página de Avaliações para consultar notas e editar o formulário.",
  },
  {
    campo: "pode_gerenciar_cargos" as const,
    titulo: "Gerenciar plataforma",
    descricao: "Acesso às páginas de Configurações, Núcleo e Membros.",
  },
];

function labelsPermissao(cargo: Cargo): string[] {
  const labels: string[] = [];
  if (cargo.pode_agendar_banca) labels.push("Agendar bancas");
  if (cargo.pode_definir_formulario) labels.push("Formulário");
  if (cargo.pode_gerenciar_cargos) labels.push("Admin");
  return labels;
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

  if (!usuario?.cargo.pode_gerenciar_cargos) {
    return <Navigate to="/dashboard" replace />;
  }

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
            <PageButtonSm type="button" onClick={() => setModalCargo("novo")}>
              <Plus size={14} />
              Adicionar
            </PageButtonSm>
          </CardHeaderActions>
        </PageCardHeader>
        <PageCardContent>
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
                      {labelsPermissao(cargo).length === 0 && "—"}
                      {labelsPermissao(cargo).map((label) => (
                        <PermissaoBadge key={label}>{label}</PermissaoBadge>
                      ))}
                    </TableCell>
                    <ActionsCell>
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
          onClose={() => setModalCargo(null)}
          onSalvar={async (dados) => {
            if (modalCargo === "novo") await createCargo(dados, token);
            else await updateCargo(modalCargo.id, dados, token);
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

function ModalCargo({
  cargo,
  onClose,
  onSalvar,
}: {
  cargo: Cargo | null;
  onClose: () => void;
  onSalvar: (dados: CargoPayload) => Promise<void>;
}) {
  const [nome, setNome] = useState(cargo?.nome ?? "");
  const [permissoes, setPermissoes] = useState({
    pode_agendar_banca: cargo?.pode_agendar_banca ?? false,
    pode_definir_formulario: cargo?.pode_definir_formulario ?? false,
    pode_gerenciar_cargos: cargo?.pode_gerenciar_cargos ?? false,
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  function togglePermissao(campo: keyof typeof permissoes) {
    setPermissoes((p) => ({ ...p, [campo]: !p[campo] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    setSalvando(true);
    setErro("");
    try {
      await onSalvar({ nome: nome.trim(), ...permissoes });
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
          <ModalTitle>{cargo ? "Editar cargo" : "Novo cargo"}</ModalTitle>
          <ModalClose type="button" aria-label="Fechar" onClick={onClose}>
            <X size={18} />
          </ModalClose>
        </ModalHeader>
        <FormStack onSubmit={handleSubmit}>
          <ModalBody>
            <FieldGroup>
              <FieldLabel htmlFor="nome-cargo">Nome do cargo</FieldLabel>
              <FieldInput id="nome-cargo" value={nome} onChange={(e) => setNome(e.target.value)} required autoFocus />
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
