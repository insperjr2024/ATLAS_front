import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Plus, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { createCargo, deleteCargo, getCargos, updateCargo, type CargoPayload } from "@/lib/cargos";
import { createEscopo, deleteEscopo, getEscopos, updateEscopo } from "@/lib/escopos";
import { createFrente, deleteFrente, getFrentes, updateFrente } from "@/lib/frentes";
import { SituacoesCargaCard } from "./config/SituacoesCargaCard";
import { ConfiguracaoBancaCard } from "./config/ConfiguracaoBancaCard";
import { GestaoSemestralCard } from "./config/GestaoSemestralCard";
import { ConfirmarModal } from "@/components/ConfirmarModal";
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
  // As 3 abaixo não estão na tabela do §3 — nasceram travadas só por posição
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
      "Mudar as seções e critérios dos formulários — afeta o que todo mundo é avaliado, não só a rotina de administrar.",
  },
  {
    campo: "pode_administrar_configuracoes" as const,
    titulo: "Administrar Configurações",
    descricao:
      "Abrir Configurações e Calendários base — inclusive editar cargos, o que inclui conceder esta mesma caixa a outros.",
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

  const [paraExcluir, setParaExcluir] = useState<
    { tipo: "frente"; item: Frente } | { tipo: "escopo"; item: Escopo } | { tipo: "cargo"; item: Cargo } | null
  >(null);

  async function confirmarExclusao() {
    if (!token || !paraExcluir) return;
    if (paraExcluir.tipo === "frente") await deleteFrente(paraExcluir.item.id, token);
    else if (paraExcluir.tipo === "escopo") await deleteEscopo(paraExcluir.item.id, token);
    else await deleteCargo(paraExcluir.item.id, token);
    setParaExcluir(null);
    buscar();
  }

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

  // Núcleo e Configurações ficaram fora da tabela das 10 do §3, mas viraram
  // caixa de cargo própria (`pode_administrar_configuracoes`) a pedido
  // explícito do usuário — inclusive pra editar cargo, que é a ação mais
  // sensível daqui: quem tem a caixa concede a mesma caixa (ou qualquer
  // outra) a outro cargo. Só quem já tem a permissão consegue distribuí-la,
  // então não dá pra se auto-conceder do zero.
  if (!usuario?.cargo.pode_administrar_configuracoes) {
    return <Navigate to="/dashboard" replace />;
  }

  const podeEditarCargos = usuario.cargo.pode_administrar_configuracoes;

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

      <GestaoSemestralCard />

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
            <TableScrollWrap $scrollable={frentes.length > LIST_MAX_VISIVEIS}>
              <DataTable>
                <TableHead>
                  <TableRow>
                    <TableHeadCell>Nome</TableHeadCell>
                    <TableHeadCell>Piso mínimo por banca</TableHeadCell>
                    <TableHeadCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {frentes.map((frente) => (
                    <TableRow key={frente.id}>
                      <NameCell>{frente.nome}</NameCell>
                      <TableCell>{frente.piso_banca}</TableCell>
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

      <ConfiguracaoBancaCard />

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
              Só quem já tem esta permissão pode editar cargos — impede auto-concessão de acesso.
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
                            onClick={() => setParaExcluir({ tipo: "cargo", item: cargo })}
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

      {paraExcluir && (
        <ConfirmarModal
          titulo="Excluir"
          mensagem={`Excluir ${
            paraExcluir.tipo === "frente" ? "a frente" : paraExcluir.tipo === "escopo" ? "o escopo" : "o cargo"
          } "${paraExcluir.item.nome}"?`}
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
  const nomeFrente = (frenteId: number | null) =>
    frenteId ? (frentes.find((f) => f.id === frenteId)?.nome ?? "—") : "—";

  return (
    <TableScrollWrap $scrollable={itens.length > LIST_MAX_VISIVEIS}>
      <DataTable>
        <TableHead>
          <TableRow>
            <TableHeadCell>Nome</TableHeadCell>
            <TableHeadCell>Frente</TableHeadCell>
            <TableHeadCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {itens.map((item) => (
            <TableRow key={item.id}>
              <NameCell>{item.nome}</NameCell>
              <TableCell>{nomeFrente(item.frente_id)}</TableCell>
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
