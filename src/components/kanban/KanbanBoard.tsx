import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { AlertTriangle, X } from "lucide-react";
import { COLUNAS } from "@/lib/tarefas";
import { formatarData } from "@/lib/projetos";
import type { StatusTarefa, Tarefa } from "@/types/tarefa";
import {
  BadgeVencida,
  Board,
  Card,
  CardMeta,
  CardTitulo,
  BotaoExcluir,
  CardTopo,
  Coluna,
  ColunaTitulo,
  ColunaVazia,
  Contador,
} from "./Kanban.styled";

interface KanbanBoardProps {
  tarefas: Tarefa[];
  nomeUsuario: (id: number) => string;
  onMover: (tarefaId: number, status: StatusTarefa) => void;
  onExcluir?: (tarefa: Tarefa) => void;
}

/**
 * O kanban de 5 colunas (§4, §6.4).
 *
 * `@dnd-kit` e não `react-beautiful-dnd`: o segundo está sem manutenção e
 * quebra sob StrictMode do React 18+, que é o caso aqui (React 19). O dnd-kit
 * também traz arrasto por teclado de graça — `KeyboardSensor` abaixo.
 */
export function KanbanBoard({ tarefas, nomeUsuario, onMover, onExcluir }: KanbanBoardProps) {
  const [arrastando, setArrastando] = useState<Tarefa | null>(null);

  const sensores = useSensors(
    // A distância mínima evita que um clique (no botão de excluir, por
    // exemplo) seja interpretado como início de arrasto.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  function aoIniciar(evento: DragStartEvent) {
    setArrastando(tarefas.find((t) => t.id === Number(evento.active.id)) ?? null);
  }

  function aoSoltar(evento: DragEndEvent) {
    setArrastando(null);
    const destino = evento.over?.id as StatusTarefa | undefined;
    if (!destino) return;
    const tarefa = tarefas.find((t) => t.id === Number(evento.active.id));
    if (!tarefa || tarefa.status === destino) return;
    onMover(tarefa.id, destino);
  }

  return (
    <DndContext sensors={sensores} onDragStart={aoIniciar} onDragEnd={aoSoltar}>
      <Board>
        {COLUNAS.map((coluna) => (
          <ColunaDrop
            key={coluna.status}
            status={coluna.status}
            rotulo={coluna.rotulo}
            tarefas={tarefas.filter((t) => t.status === coluna.status)}
            nomeUsuario={nomeUsuario}
            onExcluir={onExcluir}
          />
        ))}
      </Board>

      {/* O overlay segue o ponteiro; o card original fica esmaecido no lugar. */}
      <DragOverlay>
        {arrastando && (
          <Card $vencida={arrastando.vencida}>
            <CardTitulo>{arrastando.titulo}</CardTitulo>
          </Card>
        )}
      </DragOverlay>
    </DndContext>
  );
}

function ColunaDrop({
  status,
  rotulo,
  tarefas,
  nomeUsuario,
  onExcluir,
}: {
  status: StatusTarefa;
  rotulo: string;
  tarefas: Tarefa[];
  nomeUsuario: (id: number) => string;
  onExcluir?: (tarefa: Tarefa) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const vencidas = tarefas.filter((t) => t.vencida).length;

  return (
    <Coluna ref={setNodeRef} $sobre={isOver}>
      <ColunaTitulo>
        {rotulo}
        <Contador>
          {tarefas.length}
          {vencidas > 0 && ` · ${vencidas} ⚠`}
        </Contador>
      </ColunaTitulo>

      {tarefas.length === 0 && <ColunaVazia>—</ColunaVazia>}
      {tarefas.map((tarefa) => (
        <CardArrastavel
          key={tarefa.id}
          tarefa={tarefa}
          nomeUsuario={nomeUsuario}
          onExcluir={onExcluir}
        />
      ))}
    </Coluna>
  );
}

function CardArrastavel({
  tarefa,
  nomeUsuario,
  onExcluir,
}: {
  tarefa: Tarefa;
  nomeUsuario: (id: number) => string;
  onExcluir?: (tarefa: Tarefa) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: tarefa.id });

  return (
    <Card
      ref={setNodeRef}
      $vencida={tarefa.vencida}
      $arrastando={isDragging}
      {...listeners}
      {...attributes}
    >
      <CardTopo>
        <CardTitulo>{tarefa.titulo}</CardTitulo>
        {/* Botão explícito: antes a exclusão era um duplo-clique no card,
            gesto que ninguém adivinha e que colide com o arrasto. */}
        {onExcluir && (
          <BotaoExcluir
            type="button"
            aria-label={`Excluir ${tarefa.titulo}`}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onExcluir(tarefa)}
          >
            <X size={12} />
          </BotaoExcluir>
        )}
      </CardTopo>
      <CardMeta>
        <span>{nomeUsuario(tarefa.responsavel_id)}</span>
        {tarefa.vencida ? (
          <BadgeVencida>
            <AlertTriangle size={10} />
            {formatarData(tarefa.prazo)}
          </BadgeVencida>
        ) : (
          <span>{formatarData(tarefa.prazo)}</span>
        )}
      </CardMeta>
    </Card>
  );
}
