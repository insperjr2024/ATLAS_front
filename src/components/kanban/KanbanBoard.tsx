import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { AlertTriangle, X } from "lucide-react";
import { formatarData } from "@/lib/projetos";
import { tonsDaColuna, type ColunaTarefa, type TonsColuna } from "@/lib/colunas-tarefa";
import type { Tarefa } from "@/types/tarefa";
import {
  BadgeVencida,
  BotaoExcluir,
  Board,
  Card,
  CardMeta,
  CardTitulo,
  CardTopo,
  Coluna,
  ColunaPilula,
  ColunaTitulo,
  ColunaVazia,
  Contador,
  ContadorVencidas,
  Ponto,
} from "./Kanban.styled";

interface KanbanBoardProps {
  /** Vêm da API — a diretoria configura em /config. */
  colunas: ColunaTarefa[];
  tarefas: Tarefa[];
  nomeUsuario: (id: number) => string;
  onMover: (tarefaId: number, colunaId: number) => void;
  onExcluir?: (tarefa: Tarefa) => void;
}

/**
 * O kanban (§4, §6.4). As colunas são dados, não código: quantidade, nome,
 * cor e ordem vêm de `tarefa_coluna`.
 *
 * `@dnd-kit` e não `react-beautiful-dnd`: o segundo está sem manutenção e
 * quebra sob StrictMode do React 18+, que é o caso aqui (React 19). O dnd-kit
 * também traz arrasto por teclado de graça — `KeyboardSensor` abaixo.
 */
export function KanbanBoard({
  colunas,
  tarefas,
  nomeUsuario,
  onMover,
  onExcluir,
}: KanbanBoardProps) {
  const [arrastando, setArrastando] = useState<Tarefa | null>(null);

  // Os tons saem de UMA cor por coluna; memo porque a conversão hex→HSL roda
  // por card a cada render.
  const tons = useMemo(() => {
    const mapa = new Map<number, TonsColuna>();
    for (const coluna of colunas) mapa.set(coluna.id, tonsDaColuna(coluna.cor));
    return mapa;
  }, [colunas]);

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
    const destino = evento.over?.id;
    if (destino == null) return;
    const colunaId = Number(destino);
    const tarefa = tarefas.find((t) => t.id === Number(evento.active.id));
    if (!tarefa || tarefa.coluna_id === colunaId) return;
    onMover(tarefa.id, colunaId);
  }

  return (
    <DndContext sensors={sensores} onDragStart={aoIniciar} onDragEnd={aoSoltar}>
      <Board $colunas={colunas.length}>
        {colunas.map((coluna) => (
          <ColunaDrop
            key={coluna.id}
            coluna={coluna}
            tons={tons.get(coluna.id)!}
            tarefas={tarefas.filter((t) => t.coluna_id === coluna.id)}
            nomeUsuario={nomeUsuario}
            onExcluir={onExcluir}
          />
        ))}
      </Board>

      {/* O overlay segue o ponteiro; o card original fica esmaecido no lugar. */}
      <DragOverlay>
        {arrastando && (
          <Card $vencida={arrastando.vencida} $cor={tons.get(arrastando.coluna_id)}>
            <CardTitulo>{arrastando.titulo}</CardTitulo>
          </Card>
        )}
      </DragOverlay>
    </DndContext>
  );
}

function ColunaDrop({
  coluna,
  tons,
  tarefas,
  nomeUsuario,
  onExcluir,
}: {
  coluna: ColunaTarefa;
  tons: TonsColuna;
  tarefas: Tarefa[];
  nomeUsuario: (id: number) => string;
  onExcluir?: (tarefa: Tarefa) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: coluna.id });
  const vencidas = tarefas.filter((t) => t.vencida).length;

  return (
    <Coluna ref={setNodeRef} $sobre={isOver} $cor={tons}>
      <ColunaTitulo>
        <ColunaPilula
          $cor={tons}
          title={
            coluna.encerra_tarefa
              ? "Tarefa nesta coluna está encerrada: não fica vencida"
              : undefined
          }
        >
          <Ponto $cor={tons.ponto} />
          {coluna.nome}
          {coluna.encerra_tarefa && " ✓"}
        </ColunaPilula>
        <Contador>{tarefas.length}</Contador>
        {vencidas > 0 && (
          <ContadorVencidas>
            {vencidas} vencida{vencidas > 1 ? "s" : ""}
          </ContadorVencidas>
        )}
      </ColunaTitulo>

      {tarefas.length === 0 && <ColunaVazia>—</ColunaVazia>}
      {tarefas.map((tarefa) => (
        <CardArrastavel
          key={tarefa.id}
          tarefa={tarefa}
          tons={tons}
          nomeUsuario={nomeUsuario}
          onExcluir={onExcluir}
        />
      ))}
    </Coluna>
  );
}

function CardArrastavel({
  tarefa,
  tons,
  nomeUsuario,
  onExcluir,
}: {
  tarefa: Tarefa;
  tons: TonsColuna;
  nomeUsuario: (id: number) => string;
  onExcluir?: (tarefa: Tarefa) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: tarefa.id });

  return (
    <Card
      ref={setNodeRef}
      $vencida={tarefa.vencida}
      $arrastando={isDragging}
      $cor={tons}
      {...listeners}
      {...attributes}
    >
      <CardTopo>
        <CardTitulo>{tarefa.titulo}</CardTitulo>
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
