import { useEffect, useState } from "react";
import { Send, Trash2, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ConfirmarModal } from "@/components/ConfirmarModal";
import { formatarData, formatarDataHora } from "@/lib/projetos";
import { MultiSelect } from "@/components/MultiSelect";
import { ehDiretoriaDeProjetos } from "@/utils/permissoes";
import {
  createComentario,
  deleteComentario,
  deleteTarefa,
  getComentarios,
  podeEditarTarefa,
  SINAL_URGENCIA,
  updateTarefa,
} from "@/lib/tarefas";
import type { ColunaTarefa } from "@/lib/colunas-tarefa";
import type { ComentarioTarefa, Tarefa } from "@/types/tarefa";
import type { UsuarioResumo } from "@/types/auth";
import { PageButton, PageButtonSm, EmptyText } from "@/styles/page.styled";
import {
  FieldGroup,
  FieldInput,
  FieldLabel,
  FieldSelect,
  FieldTextarea,
  FormErrorText,
  ModalOverlay,
  ModalHeader,
  ModalTitle,
  ModalClose,
  ModalBody,
  ModalFooter,
  WideModalContent,
} from "@/pages/Bancas.styled";
import {
  Autor,
  Comentario,
  ComentarioTexto,
  ComposerLinha,
  DetalheGrid,
  DetalheItem,
  DetalheRotulo,
  DetalheValor,
  ListaComentarios,
  SecaoTitulo,
  SinalLinha,
} from "./TarefaDetalhe.styled";

interface Props {
  tarefa: Tarefa;
  colunas: ColunaTarefa[];
  /** Quadro inteiro, usado só pra resolver nome (ex.: um responsável que já
   *  saiu do projeto ainda precisa aparecer com o nome certo, não "Usuário 7"). */
  usuarios: UsuarioResumo[];
  /** Só quem está alocado neste projeto, são as opções do seletor. */
  usuariosAtribuiveis: UsuarioResumo[];
  /** Consultores atuais do projeto, para o atalho "Todos os consultores". */
  consultorIds: number[];
  /** As outras partes da mesma tarefa dividida (mesmo `grupo_id`), sem esta.
   *  Vazio/ausente quando a tarefa não foi dividida. */
  irmasDoGrupo?: Tarefa[];
  onClose: () => void;
  /** Recarrega o board depois de editar ou excluir. */
  onMudou: () => Promise<void>;
}

/**
 * O detalhe da tarefa: o que o card não mostra.
 *
 * O card na tela tem só nome e responsável, aqui ficam as datas, quem
 * criou, e a conversa. Editar é da diretoria e de quem criou (o backend
 * revalida); comentar é de quem enxerga o projeto.
 */
export function TarefaDetalheModal({ tarefa, colunas, usuarios, usuariosAtribuiveis, consultorIds, irmasDoGrupo = [], onClose, onMudou }: Props) {
  const { usuario, token } = useAuth();
  const [comentarios, setComentarios] = useState<ComentarioTarefa[]>([]);
  const [novo, setNovo] = useState("");
  const [editando, setEditando] = useState(false);
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  const [titulo, setTitulo] = useState(tarefa.titulo);
  const [responsavelIds, setResponsavelIds] = useState<number[]>(tarefa.responsavel_ids);
  const [prazo, setPrazo] = useState(tarefa.prazo.slice(0, 10));

  const podeEditar = podeEditarTarefa(usuario, tarefa);
  const nomeUsuario = (id: number) => usuarios.find((u) => u.id === id)?.nome ?? `Usuário ${id}`;
  // Opções do seletor: quem está atribuível AGORA, mais qualquer responsável
  // atual que já tenha saído do projeto (senão sumiria da lista sem aviso).
  const opcoesResponsavel = [
    ...usuariosAtribuiveis.filter((u) => u.ativo),
    ...tarefa.responsavel_ids
      .filter((id) => !usuariosAtribuiveis.some((u) => u.id === id))
      .map((id) => ({ id, nome: nomeUsuario(id) })),
  ];
  const idsConsultores = consultorIds.filter((id) =>
    usuariosAtribuiveis.some((u) => u.id === id),
  );
  const coluna = colunas.find((c) => c.id === tarefa.coluna_id);
  const nomeColuna = (id: number) => colunas.find((c) => c.id === id)?.nome ?? "—";
  const sinal = SINAL_URGENCIA[tarefa.urgencia];

  // Parte de uma tarefa dividida ("cada um faz a sua parte"): o card só tem
  // um responsável e não dá para virar conjunta, então o seletor aqui é de
  // uma pessoa só, e o backend recusa lista com tamanho diferente de 1.
  const ehParte = tarefa.grupo_id != null;

  async function carregarComentarios() {
    if (!token) return;
    try {
      setComentarios(await getComentarios(tarefa.id, token));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar os comentários");
    }
  }

  useEffect(() => {
    carregarComentarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tarefa.id, token]);

  async function comentar(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !novo.trim()) return;
    setOcupado(true);
    setErro("");
    try {
      await createComentario(tarefa.id, novo.trim(), token);
      setNovo("");
      await carregarComentarios();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao comentar");
    } finally {
      setOcupado(false);
    }
  }

  async function apagarComentario(comentario: ComentarioTarefa) {
    if (!token) return;
    setErro("");
    try {
      await deleteComentario(comentario.id, token);
      await carregarComentarios();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao apagar o comentário");
    }
  }

  async function salvarEdicao(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (responsavelIds.length === 0) {
      setErro("Escolha ao menos um responsável.");
      return;
    }
    setOcupado(true);
    setErro("");
    try {
      await updateTarefa(
        tarefa.id,
        { titulo: titulo.trim(), responsavel_ids: responsavelIds, prazo },
        token,
      );
      await onMudou();
      setEditando(false);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setOcupado(false);
    }
  }

  async function excluir() {
    if (!token) return;
    setOcupado(true);
    try {
      await deleteTarefa(tarefa.id, token);
      await onMudou();
      onClose();
    } catch (err) {
      setOcupado(false);
      throw err;
    }
  }

  return (
    <ModalOverlay onClick={onClose} role="presentation">
      <WideModalContent onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="tarefa-detalhe">
        <ModalHeader>
          <ModalTitle id="tarefa-detalhe">{editando ? "Editar tarefa" : tarefa.titulo}</ModalTitle>
          <ModalClose type="button" aria-label="Fechar" onClick={onClose}>
            <X size={18} />
          </ModalClose>
        </ModalHeader>

        <ModalBody>
          {sinal && !editando && (
            <SinalLinha $cor={sinal.cor}>
              {sinal.glifo} {sinal.rotulo(tarefa.dias_para_prazo)}
            </SinalLinha>
          )}

          {editando ? (
            <form onSubmit={salvarEdicao} id="form-editar-tarefa">
              <FieldGroup>
                <FieldLabel htmlFor="edit-titulo">Título</FieldLabel>
                <FieldInput
                  id="edit-titulo"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  required
                />
              </FieldGroup>
              {ehParte ? (
                <FieldGroup>
                  <FieldLabel htmlFor="edit-responsavel">Responsável por esta parte</FieldLabel>
                  <FieldSelect
                    id="edit-responsavel"
                    value={String(responsavelIds[0] ?? "")}
                    onChange={(e) => setResponsavelIds([Number(e.target.value)])}
                    pesquisavel
                    aria-label="Responsável por esta parte"
                  >
                    {opcoesResponsavel.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nome}
                      </option>
                    ))}
                  </FieldSelect>
                </FieldGroup>
              ) : (
                <FieldGroup>
                  <FieldLabel>Responsáveis</FieldLabel>
                  <MultiSelect
                    valores={responsavelIds.map(String)}
                    onChange={(v) => setResponsavelIds(v.map(Number))}
                    opcoes={opcoesResponsavel.map((u) => ({ value: String(u.id), label: u.nome }))}
                    rotuloVazio="Escolher pessoas…"
                    resumo={(n) => `${n} responsáveis`}
                    aria-label="Responsáveis pela tarefa"
                  />
                  {idsConsultores.length > 0 && (
                    <PageButtonSm
                      type="button"
                      $variant="outline"
                      onClick={() => setResponsavelIds(idsConsultores)}
                      style={{ marginTop: "0.4rem", alignSelf: "flex-start" }}
                    >
                      Todos os consultores
                    </PageButtonSm>
                  )}
                </FieldGroup>
              )}
              <FieldGroup>
                <FieldLabel htmlFor="edit-prazo">Prazo</FieldLabel>
                <FieldInput
                  id="edit-prazo"
                  type="date"
                  value={prazo}
                  onChange={(e) => setPrazo(e.target.value)}
                  required
                />
              </FieldGroup>
            </form>
          ) : (
            <DetalheGrid>
              <DetalheItem>
                <DetalheRotulo>
                  {tarefa.responsavel_ids.length > 1 ? "Responsáveis" : "Responsável"}
                </DetalheRotulo>
                <DetalheValor>
                  {tarefa.responsavel_ids.map(nomeUsuario).join(", ")}
                </DetalheValor>
              </DetalheItem>
              <DetalheItem>
                <DetalheRotulo>Prazo</DetalheRotulo>
                <DetalheValor>{formatarData(tarefa.prazo)}</DetalheValor>
              </DetalheItem>
              <DetalheItem>
                <DetalheRotulo>Coluna</DetalheRotulo>
                <DetalheValor>{coluna?.nome ?? "—"}</DetalheValor>
              </DetalheItem>
              {ehParte && irmasDoGrupo.length > 0 && (
                <DetalheItem style={{ gridColumn: "1 / -1" }}>
                  <DetalheRotulo>Outras partes desta tarefa</DetalheRotulo>
                  <DetalheValor>
                    {irmasDoGrupo.map((irma) => (
                      <div key={irma.id}>
                        {irma.responsavel_ids.map(nomeUsuario).join(", ")} — {nomeColuna(irma.coluna_id)}
                      </div>
                    ))}
                  </DetalheValor>
                </DetalheItem>
              )}
              <DetalheItem>
                <DetalheRotulo>Criada por</DetalheRotulo>
                <DetalheValor>{nomeUsuario(tarefa.criado_por)}</DetalheValor>
              </DetalheItem>
              <DetalheItem>
                <DetalheRotulo>Criada em</DetalheRotulo>
                <DetalheValor>{formatarDataHora(tarefa.criado_em)}</DetalheValor>
              </DetalheItem>
              <DetalheItem>
                <DetalheRotulo>Última movimentação</DetalheRotulo>
                <DetalheValor>{formatarDataHora(tarefa.movida_em)}</DetalheValor>
              </DetalheItem>
            </DetalheGrid>
          )}

          <SecaoTitulo>Comentários ({comentarios.length})</SecaoTitulo>
          <ListaComentarios>
            {comentarios.length === 0 && (
              <EmptyText>Nenhum comentário. Use o campo abaixo para registrar o que ficou combinado.</EmptyText>
            )}
            {comentarios.map((c) => (
              <Comentario key={c.id}>
                <Autor>
                  <strong>{nomeUsuario(c.autor_id)}</strong>
                  <small>{formatarDataHora(c.criado_em)}</small>
                  {(c.autor_id === usuario?.id || ehDiretoriaDeProjetos(usuario)) && (
                    <button
                      type="button"
                      aria-label="Apagar comentário"
                      onClick={() => apagarComentario(c)}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </Autor>
                <ComentarioTexto>{c.texto}</ComentarioTexto>
              </Comentario>
            ))}
          </ListaComentarios>

          {/* Comentar é de quem enxerga o projeto, não só de quem criou. */}
          <form onSubmit={comentar}>
            <ComposerLinha>
              <FieldTextarea
                value={novo}
                onChange={(e) => setNovo(e.target.value)}
                placeholder="Escrever um comentário…"
                rows={2}
              />
              <PageButtonSm type="submit" disabled={ocupado || !novo.trim()}>
                <Send size={14} />
              </PageButtonSm>
            </ComposerLinha>
          </form>

          {erro && <FormErrorText>{erro}</FormErrorText>}
        </ModalBody>

        <ModalFooter>
          {podeEditar && !editando && (
            <PageButton
              type="button"
              $variant="outline"
              disabled={ocupado}
              onClick={() => setConfirmandoExclusao(true)}
            >
              Excluir
            </PageButton>
          )}
          {editando ? (
            <>
              <PageButton type="button" $variant="outline" onClick={() => setEditando(false)}>
                Cancelar
              </PageButton>
              <PageButton type="submit" form="form-editar-tarefa" disabled={ocupado}>
                {ocupado ? "Salvando…" : "Salvar"}
              </PageButton>
            </>
          ) : podeEditar ? (
            <PageButton type="button" onClick={() => setEditando(true)}>
              Editar
            </PageButton>
          ) : (
            // Quem não pode editar vê o motivo, em vez de um botão ausente
            // e inexplicado.
            <EmptyText style={{ fontSize: "0.7rem" }}>
              Só a diretoria e quem criou a tarefa podem editá-la. Mover no kanban e comentar
              seguem liberados.
            </EmptyText>
          )}
        </ModalFooter>
      </WideModalContent>

      {confirmandoExclusao && (
        <ConfirmarModal
          titulo="Excluir tarefa"
          mensagem={`Excluir a tarefa "${tarefa.titulo}"?`}
          onCancelar={() => setConfirmandoExclusao(false)}
          onConfirmar={excluir}
        />
      )}
    </ModalOverlay>
  );
}
