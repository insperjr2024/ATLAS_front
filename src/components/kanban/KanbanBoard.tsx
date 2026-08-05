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

import { SINAL_URGENCIA } from "@/lib/tarefas";
import { tonsDaColuna, type ColunaTarefa, type TonsColuna } from "@/lib/colunas-tarefa";
import type { Tarefa } from "@/types/tarefa";
import {
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
  SinalUrgencia,
} from "./Kanban.styled";

interface KanbanBoardProps {
  /** Vêm da API — a diretoria configura em /config. */
  colunas: ColunaTarefa[];
  tarefas: Tarefa[];
  nomeUsuario: (id: number) => string;
  onMover: (tarefaId: number, colunaId: number) => void;
  /** Clicar no card abre o detalhe: datas, autoria e comentários. */
  onAbrir: (tarefa: Tarefa) => void;
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
  onAbrir,
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
            onAbrir={onAbrir}
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
  onAbrir,
}: {
  coluna: ColunaTarefa;
  tons: TonsColuna;
  tarefas: Tarefa[];
  nomeUsuario: (id: number) => string;
  onAbrir: (tarefa: Tarefa) => void;
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
          onAbrir={onAbrir}
        />
      ))}
    </Coluna>
  );
}

function CardArrastavel({
  tarefa,
  tons,
  nomeUsuario,
  onAbrir,
}: {
  tarefa: Tarefa;
  tons: TonsColuna;
  nomeUsuario: (id: number) => string;
  onAbrir: (tarefa: Tarefa) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: tarefa.id });
  const sinal = SINAL_URGENCIA[tarefa.urgencia];

  return (
    <Card
      ref={setNodeRef}
      $vencida={tarefa.vencida}
      $arrastando={isDragging}
      $cor={tons}
      {...listeners}
      {...attributes}
      // Depois do spread de propósito: `attributes` do dnd-kit já traz
      // role/tabIndex, e espalhar por último sobrescreveria os nossos.
      role="button"
      title="Clique para ver detalhes e comentários"
      // O clique abre o detalhe; o arrasto só começa depois de 5px de
      // movimento (activationConstraint), então os dois gestos convivem.
      onClick={() => onAbrir(tarefa)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onAbrir(tarefa);
        }
      }}
    >
      {/* A face do card tem só NOME e RESPONSÁVEL. Datas, autoria e
          comentários ficam no detalhe — o único indício de prazo aqui é o
          sinal de urgência, que só aparece quando o prazo aperta. */}
      <CardTopo>
        <CardTitulo>{tarefa.titulo}</CardTitulo>
        {sinal && (
          <SinalUrgencia $cor={sinal.cor} title={sinal.rotulo(tarefa.dias_para_prazo)}>
            {sinal.glifo}
          </SinalUrgencia>
        )}
      </CardTopo>
      <CardMeta>
        <span>{nomeUsuario(tarefa.responsavel_id)}</span>
      </CardMeta>
    </Card>
  );
}
