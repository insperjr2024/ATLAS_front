import { useCallback, useEffect, useState } from "react";
import { Columns3, Plus, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { pode } from "@/utils/permissoes";
import { createTarefa, getTarefas, updateTarefa } from "@/lib/tarefas";
import type { Tarefa } from "@/types/tarefa";
import { getColunas, type ColunaTarefa } from "@/lib/colunas-tarefa";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { TarefaDetalheModal } from "@/components/kanban/TarefaDetalheModal";
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
  HeaderAcoes,
} from "./Projetos.styled";
import { useProjeto } from "./ProjetoPage";
import { ColunasTarefaCard } from "./ColunasTarefaCard";

export function ProjetoTarefas() {
  const { projeto, usuarios } = useProjeto();
  const { token, usuario } = useAuth();
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [colunas, setColunas] = useState<ColunaTarefa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [criando, setCriando] = useState(false);
  const [aberta, setAberta] = useState<Tarefa | null>(null);
  const [configurando, setConfigurando] = useState(false);

  const carregar = useCallback(async () => {
    if (!token) return;
    setErro("");
    try {
      // As colunas vêm da API e são DESTE projeto: quantidade, nome, cor e
      // ordem são configuráveis pela diretoria aqui mesmo, no botão
      // "Colunas" — cada projeto tem o seu fluxo.
      const [resTarefas, resColunas] = await Promise.all([
        getTarefas(projeto.id, token),
        getColunas(projeto.id, token),
      ]);
      setTarefas(resTarefas);
      setColunas(resColunas);
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
  async function mover(tarefaId: number, colunaId: number) {
    if (!token) return;
    const anterior = tarefas;
    setTarefas((lista) =>
      lista.map((t) => (t.id === tarefaId ? { ...t, coluna_id: colunaId } : t)),
    );
    setAviso("");
    try {
      await updateTarefa(tarefaId, { coluna_id: colunaId }, token);
      await carregar();
    } catch (err) {
      setTarefas(anterior);
      setAviso(err instanceof Error ? err.message : "Erro ao mover a tarefa");
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
          <HeaderAcoes>
            {/* 🔒 Configurar o board é da diretoria (§3), e só deste projeto. */}
            {pode(usuario, "configurar_colunas") && (
              <PageButtonSm
                type="button"
                $variant="outline"
                aria-expanded={configurando}
                onClick={() => setConfigurando((v) => !v)}
              >
                <Columns3 size={14} />
                Colunas
              </PageButtonSm>
            )}
            {/* §3: os QUATRO perfis criam e movem tarefa — sem gate de posição. */}
            <PageButtonSm type="button" onClick={() => setCriando(true)}>
              <Plus size={14} />
              Nova tarefa
            </PageButtonSm>
          </HeaderAcoes>
        </PageCardHeader>
        <PageCardContent>
          {aviso && <FormErrorText>{aviso}</FormErrorText>}
          {tarefas.length === 0 ? (
            <EmptyText>
              Nenhuma tarefa ainda. O coordenador distribui, mas qualquer pessoa da equipe pode criar.
            </EmptyText>
          ) : (
            <KanbanBoard
              colunas={colunas}
              tarefas={tarefas}
              nomeUsuario={nomeUsuario}
              onMover={mover}
              onAbrir={setAberta}
            />
          )}
        </PageCardContent>
      </PageCard>

      {configurando && <ColunasTarefaCard projetoId={projeto.id} onMudou={carregar} />}

      {aberta && (
        <TarefaDetalheModal
          // A tarefa vem da lista recarregada, não do estado do clique: assim
          // o modal reflete a edição que acabou de acontecer.
          tarefa={tarefas.find((t) => t.id === aberta.id) ?? aberta}
          colunas={colunas}
          usuarios={usuarios}
          onClose={() => setAberta(null)}
          onMudou={carregar}
        />
      )}

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
