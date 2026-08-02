import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getFrentes } from "@/lib/bancas";
import { getCargos } from "@/lib/cargos";
import { frentesDoUsuario, nomeCargo } from "@/lib/nucleo";
import { getUsuarios, updateUsuario } from "@/lib/usuarios";
import { getUsuariosFrentes, syncFrentesUsuario } from "@/lib/usuarios-frentes";
import type { Frente } from "@/types/banca";
import type { Cargo, UsuarioFrente, UsuarioResumo } from "@/types/auth";
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
  FieldSelect,
  CheckboxGrid,
  CheckboxLabel,
  FormErrorText,
  EditSection,
  EditSectionTitle,
  ToggleRow,
} from "./Membros.styled";

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

  async function buscar() {
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
    buscar();
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
        <PageButton $variant="outline" onClick={buscar}>
          Tentar novamente
        </PageButton>
      </ErrorBlock>
    );
  }

  if (carregando || !contexto) return <PageLoadingBlock />;

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
          {membros.length === 0 && <EmptyText>Nenhum membro cadastrado.</EmptyText>}
          {membros.length > 0 && (
            <DataTable>
              <TableHead>
                <TableRow>
                  <TableHeadCell>Nome</TableHeadCell>
                  <TableHeadCell>E-mail</TableHeadCell>
                  <TableHeadCell>Cargo</TableHeadCell>
                  <TableHeadCell>Frentes</TableHeadCell>
                  <TableHeadCell>Status</TableHeadCell>
                  <TableHeadCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {membros.map((membro) => {
                  const frentes = frentesDoUsuario(contexto.usuariosFrentes, contexto.frentes, membro.id);
                  return (
                    <TableRow key={membro.id}>
                      <NameCell>{membro.nome}</NameCell>
                      <TableCell>{membro.email_insper}</TableCell>
                      <TableCell>{nomeCargo(contexto.cargos, membro.cargo_id)}</TableCell>
                      <TableCell>{frentes.length > 0 ? frentes.join(", ") : "—"}</TableCell>
                      <TableCell>
                        <StatusBadge $ativo={membro.ativo}>{membro.ativo ? "Ativo" : "Inativo"}</StatusBadge>
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
            buscar();
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
  const [frenteIds, setFrenteIds] = useState<number[]>(() =>
    contexto.usuariosFrentes.filter((uf) => uf.usuario_id === membro.id).map((uf) => uf.frente_id),
  );
  const [ativo, setAtivo] = useState(membro.ativo);
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
          ativo,
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
                    <StatusBadge $ativo={membro.ativo}>{membro.ativo ? "Ativo" : "Inativo"}</StatusBadge>
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
                  <FieldLabel htmlFor="cargo-membro">Cargo</FieldLabel>
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

                <ToggleRow>
                  <input id="ativo-membro" type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
                  <span>Usuário ativo na plataforma</span>
                </ToggleRow>

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
                  setFrenteIds(
                    contexto.usuariosFrentes.filter((uf) => uf.usuario_id === membro.id).map((uf) => uf.frente_id),
                  );
                  setAtivo(membro.ativo);
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
