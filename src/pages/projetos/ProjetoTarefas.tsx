import { useCallback, useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { createTarefa, deleteTarefa, getTarefas, updateTarefa } from "@/lib/tarefas";
import type { StatusTarefa, Tarefa } from "@/types/tarefa";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
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
  FieldGroup,
  FieldInput,
  FieldLabel,
  FieldSelect,
  FormErrorText,
  ModalOverlay,
  ModalHeader,
  ModalTitle,
  ModalClose,
  ModalBody,
  ModalFooter,
  WideModalContent,
  FormFields,
} from "./Projetos.styled";
import { useProjeto } from "./ProjetoPage";

export function ProjetoTarefas() {
  const { projeto, usuarios } = useProjeto();
  const { token } = useAuth();
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [criando, setCriando] = useState(false);

  const carregar = useCallback(async () => {
    if (!token) return;
    setErro("");
    try {
      setTarefas(await getTarefas(projeto.id, token));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar as tarefas");
    } finally {
      setCarregando(false);
    }
  }, [projeto.id, token]);

  useEffect(() => {
    setCarregando(true);
    carregar();
  }, [carregar]);

  const nomeUsuario = (id: number) => usuarios.find((u) => u.id === id)?.nome ?? `Usuário ${id}`;

  /**
   * Otimista: o card já aparece na coluna nova antes da resposta. Se o PATCH
   * falhar, recarrega do servidor — a fonte da verdade nunca é o estado local.
   */
  async function mover(tarefaId: number, status: StatusTarefa) {
    if (!token) return;
    const anterior = tarefas;
    setTarefas((lista) => lista.map((t) => (t.id === tarefaId ? { ...t, status } : t)));
    setAviso("");
    try {
      await updateTarefa(tarefaId, { status }, token);
      await carregar();
    } catch (err) {
      setTarefas(anterior);
      setAviso(err instanceof Error ? err.message : "Erro ao mover a tarefa");
    }
  }

  async function excluir(tarefa: Tarefa) {
    if (!token) return;
    if (!confirm(`Excluir a tarefa "${tarefa.titulo}"?`)) return;
    setAviso("");
    try {
      await deleteTarefa(tarefa.id, token);
      await carregar();
    } catch (err) {
      setAviso(err instanceof Error ? err.message : "Erro ao excluir a tarefa");
    }
  }

  if (erro) {
    return (
      <ErrorBlock>
        <ErrorText>Não foi possível carregar as tarefas: {erro}</ErrorText>
        <PageButton $variant="outline" onClick={() => carregar()}>
          Tentar novamente
        </PageButton>
      </ErrorBlock>
    );
  }

  if (carregando) return <PageLoadingBlock />;

  const vencidas = tarefas.filter((t) => t.vencida).length;

  return (
    <PageStack>
      <PageCard>
        <PageCardHeader>
          <PageCardTitle>
            {tarefas.length} {tarefas.length === 1 ? "tarefa" : "tarefas"}
            {vencidas > 0 && ` · ${vencidas} vencida${vencidas > 1 ? "s" : ""}`}
          </PageCardTitle>
          {/* §3: os QUATRO perfis criam e movem tarefa — sem gate de posição. */}
          <PageButtonSm type="button" onClick={() => setCriando(true)}>
            <Plus size={14} />
            Nova tarefa
          </PageButtonSm>
        </PageCardHeader>
        <PageCardContent>
          {aviso && <FormErrorText>{aviso}</FormErrorText>}
          {tarefas.length === 0 ? (
            <EmptyText>
              Nenhuma tarefa ainda. O coordenador distribui, mas qualquer pessoa da equipe pode criar.
            </EmptyText>
          ) : (
            <KanbanBoard tarefas={tarefas} nomeUsuario={nomeUsuario} onMover={mover} onExcluir={excluir} />
          )}
        </PageCardContent>
      </PageCard>

      {criando && token && (
        <NovaTarefaModal
          projetoId={projeto.id}
          usuarios={usuarios.filter((u) => u.ativo)}
          token={token}
          onClose={() => setCriando(false)}
          onCriada={async () => {
            setCriando(false);
            await carregar();
          }}
        />
      )}
    </PageStack>
  );
}

function NovaTarefaModal({
  projetoId,
  usuarios,
  token,
  onClose,
  onCriada,
}: {
  projetoId: number;
  usuarios: { id: number; nome: string }[];
  token: string;
  onClose: () => void;
  onCriada: () => void;
}) {
  const [titulo, setTitulo] = useState("");
  const [responsavel, setResponsavel] = useState(String(usuarios[0]?.id ?? ""));
  const [prazo, setPrazo] = useState(() => new Date().toISOString().slice(0, 10));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro("");
    try {
      await createTarefa(
        projetoId,
        { titulo: titulo.trim(), responsavel_id: Number(responsavel), prazo },
        token,
      );
      onCriada();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao criar a tarefa");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <ModalOverlay onClick={onClose} role="presentation">
      <WideModalContent onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="nova-tarefa">
        <ModalHeader>
          <ModalTitle id="nova-tarefa">Nova tarefa</ModalTitle>
          <ModalClose type="button" aria-label="Fechar" onClick={onClose}>
            <X size={18} />
          </ModalClose>
        </ModalHeader>
        <form onSubmit={salvar}>
          <ModalBody>
            <FormFields>
              <FieldGroup>
                <FieldLabel htmlFor="tarefa-titulo">Título</FieldLabel>
                <FieldInput
                  id="tarefa-titulo"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Levantar concorrentes"
                  required
                />
              </FieldGroup>
              <FieldGroup>
                <FieldLabel htmlFor="tarefa-responsavel">Responsável</FieldLabel>
                <FieldSelect
                  id="tarefa-responsavel"
                  value={responsavel}
                  onChange={(e) => setResponsavel(e.target.value)}
                  required
                >
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nome}
                    </option>
                  ))}
                </FieldSelect>
              </FieldGroup>
              <FieldGroup>
                <FieldLabel htmlFor="tarefa-prazo">Prazo</FieldLabel>
                <FieldInput
                  id="tarefa-prazo"
                  type="date"
                  value={prazo}
                  onChange={(e) => setPrazo(e.target.value)}
                  required
                />
              </FieldGroup>
              {erro && <FormErrorText>{erro}</FormErrorText>}
            </FormFields>
          </ModalBody>
          <ModalFooter>
            <PageButton type="button" $variant="outline" onClick={onClose}>
              Cancelar
            </PageButton>
            <PageButton type="submit" disabled={salvando}>
              {salvando ? "Criando…" : "Criar tarefa"}
            </PageButton>
          </ModalFooter>
        </form>
      </WideModalContent>
    </ModalOverlay>
  );
}
