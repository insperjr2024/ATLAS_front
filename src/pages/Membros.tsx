import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getFrentes } from "@/lib/bancas";
import { getCargos } from "@/lib/cargos";
import { frentesDoUsuario, nomeCargo, normalizarTexto } from "@/lib/nucleo";
import { getUsuarios, updateUsuario } from "@/lib/usuarios";
import { getUsuariosFrentes, syncFrentesUsuario } from "@/lib/usuarios-frentes";
import type { Frente } from "@/types/banca";
import type { Cargo, Posicao, StatusUsuario, UsuarioFrente, UsuarioResumo } from "@/types/auth";
import { ROTULO_POSICAO, ROTULO_STATUS_USUARIO } from "@/utils/permissoes";
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
  StatusBadge,
  DetailList,
  DetailRow,
  DetailTerm,
  DetailValue,
  ModalOverlay,
  ModalHeader,
  ModalTitle,
  ModalClose,
  ModalBody,
  ModalFooter,
  WideModalContent,
  FormStack,
  FieldGroup,
  FieldLabel,
  FieldInput,
  FieldSelect,
  CheckboxGrid,
  CheckboxLabel,
  FormErrorText,
  EditSection,
  EditSectionTitle,
  ToggleRow,
  FiltersRow,
  SearchField,
  FilterSelect,
} from "./Membros.styled";
import { TableScrollWrap } from "@/styles/shared.styled";

const MEMBROS_MAX_VISIVEIS = 9;

interface Contexto {
  cargos: Cargo[];
  frentes: Frente[];
  usuariosFrentes: UsuarioFrente[];
}

export function Membros() {
  const { usuario, token } = useAuth();
  const [membros, setMembros] = useState<UsuarioResumo[]>([]);
  const [contexto, setContexto] = useState<Contexto | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [membroDetalhe, setMembroDetalhe] = useState<UsuarioResumo | null>(null);
  const [termoPesquisa, setTermoPesquisa] = useState("");
  const [filtroCargo, setFiltroCargo] = useState("");
  const [filtroFrente, setFiltroFrente] = useState("");

  async function carregarMembros() {
    if (!token) return;
    setCarregando(true);
    setErro("");
    try {
      const [usuariosResp, cargos, frentes, usuariosFrentes] = await Promise.all([
        getUsuarios(token),
        getCargos(token),
        getFrentes(token),
        getUsuariosFrentes(token),
      ]);
      setMembros(usuariosResp.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")));
      setContexto({ cargos, frentes, usuariosFrentes });
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar membros");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarMembros();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const membrosAtivos = useMemo(() => membros.filter((m) => m.ativo).length, [membros]);

  if (!usuario?.cargo.pode_gerenciar_cargos) {
    return <Navigate to="/dashboard" replace />;
  }

  if (erro) {
    return (
      <ErrorBlock>
        <ErrorText>Não foi possível carregar os membros: {erro}</ErrorText>
        <PageButton $variant="outline" onClick={carregarMembros}>
          Tentar novamente
        </PageButton>
      </ErrorBlock>
    );
  }

  if (carregando || !contexto) return <PageLoadingBlock />;

  const termo = normalizarTexto(termoPesquisa.trim());
  const membrosFiltrados = membros.filter((membro) => {
    if (filtroCargo && String(membro.cargo_id) !== filtroCargo) return false;
    if (filtroFrente) {
      const temFrente = contexto.usuariosFrentes.some(
        (uf) => uf.usuario_id === membro.id && uf.frente_id === Number(filtroFrente),
      );
      if (!temFrente) return false;
    }
    if (!termo) return true;
    const frentes = frentesDoUsuario(contexto.usuariosFrentes, contexto.frentes, membro.id).join(" ");
    const texto = normalizarTexto(
      `${membro.nome} ${membro.email_insper ?? ""} ${nomeCargo(contexto.cargos, membro.cargo_id)} ${frentes}`,
    );
    return texto.includes(termo);
  });

  return (
    <PageStack>
      <PageHeaderRow>
        <PageHeaderText>
          <PageHeading>Membros</PageHeading>
          <PageSubheading>
            {membros.length} usuários cadastrados · {membrosAtivos} ativos
          </PageSubheading>
        </PageHeaderText>
      </PageHeaderRow>

      <PageCard>
        <PageCardHeader>
          <PageCardTitle>Todos os membros do núcleo</PageCardTitle>
        </PageCardHeader>
        <PageCardContent>
          <FiltersRow>
            <SearchField
              type="text"
              value={termoPesquisa}
              onChange={(e) => setTermoPesquisa(e.target.value)}
              placeholder="Buscar por nome ou e-mail..."
              aria-label="Buscar membros"
            />
            <FilterSelect value={filtroCargo} onChange={(e) => setFiltroCargo(e.target.value)} aria-label="Filtrar por cargo">
              <option value="">Todos os cargos</option>
              {contexto.cargos.map((cargo) => (
                <option key={cargo.id} value={cargo.id}>
                  {cargo.nome}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect value={filtroFrente} onChange={(e) => setFiltroFrente(e.target.value)} aria-label="Filtrar por frente">
              <option value="">Todas as frentes</option>
              {contexto.frentes.map((frente) => (
                <option key={frente.id} value={frente.id}>
                  {frente.nome}
                </option>
              ))}
            </FilterSelect>
          </FiltersRow>

          {membros.length === 0 && <EmptyText>Nenhum membro cadastrado.</EmptyText>}
          {membros.length > 0 && membrosFiltrados.length === 0 && (
            <EmptyText>Nenhum membro encontrado com os filtros selecionados.</EmptyText>
          )}
          {membrosFiltrados.length > 0 && (
            <TableScrollWrap
              $scrollable={membrosFiltrados.length > MEMBROS_MAX_VISIVEIS}
              $maxVisiveis={MEMBROS_MAX_VISIVEIS}
            >
            <DataTable>
              <TableHead>
                <TableRow>
                  <TableHeadCell>Nome</TableHeadCell>
                  <TableHeadCell>E-mail</TableHeadCell>
                  {/* Posição (§3) e cargo (permissões de banca) são dimensões
                      diferentes — a tela mostra as duas. */}
                  <TableHeadCell>Posição</TableHeadCell>
                  <TableHeadCell>Cargo</TableHeadCell>
                  <TableHeadCell>Frentes</TableHeadCell>
                  <TableHeadCell>Status</TableHeadCell>
                  <TableHeadCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {membrosFiltrados.map((membro) => {
                  const frentes = frentesDoUsuario(contexto.usuariosFrentes, contexto.frentes, membro.id);
                  return (
                    <TableRow key={membro.id}>
                      <NameCell>{membro.nome}</NameCell>
                      <TableCell>{membro.email_insper}</TableCell>
                      <TableCell>{ROTULO_POSICAO[membro.posicao] ?? membro.posicao}</TableCell>
                      <TableCell>{nomeCargo(contexto.cargos, membro.cargo_id)}</TableCell>
                      <TableCell>{frentes.length > 0 ? frentes.join(", ") : "—"}</TableCell>
                      <TableCell>
                        {/* Os 3 estados do §10, não um booleano: ex-membro e
                            desligado são situações diferentes. */}
                        <StatusBadge $ativo={membro.status === "ativo"}>
                          {ROTULO_STATUS_USUARIO[membro.status] ?? membro.status}
                        </StatusBadge>
                      </TableCell>
                      <ActionsCell>
                        <PageButtonSm $variant="outline" type="button" onClick={() => setMembroDetalhe(membro)}>
                          Ver mais
                        </PageButtonSm>
                      </ActionsCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </DataTable>
            </TableScrollWrap>
          )}
        </PageCardContent>
      </PageCard>

      {membroDetalhe && token && (
        <MembroModal
          membro={membroDetalhe}
          contexto={contexto}
          token={token}
          onClose={() => setMembroDetalhe(null)}
          onSalvo={(atualizado) => {
            setMembroDetalhe(null);
            setMembros((lista) =>
              lista
                .map((m) => (m.id === atualizado.id ? atualizado : m))
                .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
            );
            carregarMembros();
          }}
        />
      )}
    </PageStack>
  );
}

function MembroModal({
  membro,
  contexto,
  token,
  onClose,
  onSalvo,
}: {
  membro: UsuarioResumo;
  contexto: Contexto;
  token: string;
  onClose: () => void;
  onSalvo: (membro: UsuarioResumo) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [cargoId, setCargoId] = useState(String(membro.cargo_id));
  const [posicao, setPosicao] = useState<Posicao>(membro.posicao);
  const [status, setStatus] = useState<StatusUsuario>(membro.status);
  const [frenteIds, setFrenteIds] = useState<number[]>(() =>
    contexto.usuariosFrentes.filter((uf) => uf.usuario_id === membro.id).map((uf) => uf.frente_id),
  );
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const frentesMembro = frentesDoUsuario(contexto.usuariosFrentes, contexto.frentes, membro.id);

  function toggleFrente(id: number) {
    setFrenteIds((lista) => (lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id]));
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro("");
    try {
      const atualizado = await updateUsuario(
        membro.id,
        {
          cargo_id: Number(cargoId),
          posicao,
          status,
          // `ativo` é espelho de `status` (F2) — mandado junto para o front
          // legado que ainda lê o booleano não divergir.
          ativo: status === "ativo",
        },
        token,
      );
      await syncFrentesUsuario(membro.id, frenteIds, contexto.usuariosFrentes, token);
      onSalvo(atualizado);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar alterações");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <ModalOverlay onClick={onClose} role="presentation">
      <WideModalContent onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="membro-titulo">
        <ModalHeader>
          <ModalTitle id="membro-titulo">{membro.nome}</ModalTitle>
          <ModalClose type="button" aria-label="Fechar" onClick={onClose}>
            <X size={18} />
          </ModalClose>
        </ModalHeader>

        {!editando ? (
          <>
            <ModalBody>
              <DetailList>
                <DetailRow>
                  <DetailTerm>E-mail</DetailTerm>
                  <DetailValue>{membro.email_insper}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailTerm>Posição</DetailTerm>
                  <DetailValue>{ROTULO_POSICAO[membro.posicao] ?? membro.posicao}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailTerm>Cargo</DetailTerm>
                  <DetailValue>{nomeCargo(contexto.cargos, membro.cargo_id)}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailTerm>Frentes</DetailTerm>
                  <DetailValue>{frentesMembro.length > 0 ? frentesMembro.join(", ") : "—"}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailTerm>Status</DetailTerm>
                  <DetailValue>
                    <StatusBadge $ativo={membro.status === "ativo"}>
                      {ROTULO_STATUS_USUARIO[membro.status] ?? membro.status}
                    </StatusBadge>
                  </DetailValue>
                </DetailRow>
              </DetailList>
            </ModalBody>
            <ModalFooter>
              <PageButton $variant="outline" type="button" onClick={onClose}>
                Fechar
              </PageButton>
              <PageButton type="button" onClick={() => setEditando(true)}>
                Editar
              </PageButton>
            </ModalFooter>
          </>
        ) : (
          <FormStack onSubmit={handleSalvar}>
            <ModalBody>
              <EditSection>
                <EditSectionTitle>Editar membro</EditSectionTitle>

                <FieldGroup>
                  {/* §10: "na troca de gestão, muitos consultores viram
                      coordenadores ou gerentes" — a promoção da virada é
                      feita por aqui. */}
                  <FieldLabel htmlFor="posicao-membro">Posição na plataforma</FieldLabel>
                  <FieldSelect
                    id="posicao-membro"
                    value={posicao}
                    onChange={(e) => setPosicao(e.target.value as Posicao)}
                    required
                  >
                    {(Object.keys(ROTULO_POSICAO) as Posicao[]).map((p) => (
                      <option key={p} value={p}>
                        {ROTULO_POSICAO[p]}
                      </option>
                    ))}
                  </FieldSelect>
                </FieldGroup>

                <FieldGroup>
                  <FieldLabel htmlFor="cargo-membro">Cargo (permissões de banca)</FieldLabel>
                  <FieldSelect id="cargo-membro" value={cargoId} onChange={(e) => setCargoId(e.target.value)} required>
                    {contexto.cargos.map((cargo) => (
                      <option key={cargo.id} value={cargo.id}>
                        {cargo.nome}
                      </option>
                    ))}
                  </FieldSelect>
                </FieldGroup>

                <FieldGroup>
                  <FieldLabel>Frentes</FieldLabel>
                  <CheckboxGrid>
                    {contexto.frentes.length === 0 && <EmptyText>Nenhuma frente cadastrada.</EmptyText>}
                    {contexto.frentes.map((frente) => (
                      <CheckboxLabel key={frente.id}>
                        <input
                          type="checkbox"
                          checked={frenteIds.includes(frente.id)}
                          onChange={() => toggleFrente(frente.id)}
                        />
                        {frente.nome}
                      </CheckboxLabel>
                    ))}
                  </CheckboxGrid>
                </FieldGroup>

                <FieldGroup>
                  <FieldLabel htmlFor="status-membro">Status</FieldLabel>
                  <FieldSelect
                    id="status-membro"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as StatusUsuario)}
                    required
                  >
                    {(Object.keys(ROTULO_STATUS_USUARIO) as StatusUsuario[]).map((s) => (
                      <option key={s} value={s}>
                        {ROTULO_STATUS_USUARIO[s]}
                      </option>
                    ))}
                  </FieldSelect>
                  <EmptyText style={{ fontSize: "0.7rem" }}>
                    <strong>Ex-membro</strong>: saiu por vontade própria ou fim de gestão — perde o
                    acesso, mantém o histórico. <strong>Desligado</strong>: removido da plataforma.
                    Em ambos, a participação em projetos passados permanece íntegra (§10).
                  </EmptyText>
                </FieldGroup>

                {erro && <FormErrorText>{erro}</FormErrorText>}
              </EditSection>
            </ModalBody>
            <ModalFooter>
              <PageButton
                $variant="outline"
                type="button"
                onClick={() => {
                  setEditando(false);
                  setCargoId(String(membro.cargo_id));
                  setPosicao(membro.posicao);
                  setStatus(membro.status);
                  setFrenteIds(
                    contexto.usuariosFrentes.filter((uf) => uf.usuario_id === membro.id).map((uf) => uf.frente_id),
                  );
                  setErro("");
                }}
              >
                Cancelar
              </PageButton>
              <PageButton type="submit" disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar"}
              </PageButton>
            </ModalFooter>
          </FormStack>
        )}
      </WideModalContent>
    </ModalOverlay>
  );
}
