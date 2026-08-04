import { useState } from "react";
import styled from "styled-components";
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
import { podePausar, proximoStatusManual, ROTULO_STATUS, statusAnteriorManual } from "@/lib/projetos";
import type { ProjetoResumo, StatusProjeto } from "@/types/projeto";
import { Board, Card, CardMeta, CardTitulo, CardTopo, Coluna, ColunaTitulo, ColunaVazia, Contador } from "./Kanban.styled";

const COLUNAS = (Object.keys(ROTULO_STATUS) as StatusProjeto[]).map((status) => ({
  status,
  rotulo: ROTULO_STATUS[status],
}));

const BoardProjetos = styled(Board)`
  grid-template-columns: repeat(${COLUNAS.length}, minmax(11rem, 1fr));
`;

/**
 * Pra onde um projeto no status `atual` pode ir num arrasto — espelha as
 * mesmas três regras dos botões de `ProjetoPage` (avançar/voltar/pausar).
 * `pausado` não entra: o alvo do retomar é decidido no backend, não dá pra
 * adivinhar arrastando pra uma coluna específica.
 */
function statusAlvoValidos(atual: StatusProjeto): StatusProjeto[] {
  const alvos: StatusProjeto[] = [];
  const proximo = proximoStatusManual(atual);
  if (proximo) alvos.push(proximo);
  const anterior = statusAnteriorManual(atual);
  if (anterior) alvos.push(anterior);
  if (podePausar(atual)) alvos.push("pausado");
  return alvos;
}

interface ProjetoKanbanBoardProps {
  projetos: ProjetoResumo[];
  podeArrastar: boolean;
  nomeFrente: (id: number) => string;
  onMover: (projetoId: number, statusNovo: StatusProjeto) => void;
}

export function ProjetoKanbanBoard({ projetos, podeArrastar, nomeFrente, onMover }: ProjetoKanbanBoardProps) {
  const [arrastando, setArrastando] = useState<ProjetoResumo | null>(null);

  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  function aoIniciar(evento: DragStartEvent) {
    setArrastando(projetos.find((p) => p.id === Number(evento.active.id)) ?? null);
  }

  function aoSoltar(evento: DragEndEvent) {
    setArrastando(null);
    const destino = evento.over?.id as StatusProjeto | undefined;
    if (!destino) return;
    const projeto = projetos.find((p) => p.id === Number(evento.active.id));
    if (!projeto || projeto.status === destino) return;
    if (!statusAlvoValidos(projeto.status).includes(destino)) return;
    onMover(projeto.id, destino);
  }

  return (
    <DndContext sensors={sensores} onDragStart={aoIniciar} onDragEnd={aoSoltar}>
      <BoardProjetos>
        {COLUNAS.map((coluna) => (
          <ColunaDrop
            key={coluna.status}
            status={coluna.status}
            rotulo={coluna.rotulo}
            projetos={projetos.filter((p) => p.status === coluna.status)}
            podeArrastar={podeArrastar}
            nomeFrente={nomeFrente}
          />
        ))}
      </BoardProjetos>

      <DragOverlay>
        {arrastando && (
          <Card>
            <CardTitulo>{arrastando.nome}</CardTitulo>
          </Card>
        )}
      </DragOverlay>
    </DndContext>
  );
}

function ColunaDrop({
  status,
  rotulo,
  projetos,
  podeArrastar,
  nomeFrente,
}: {
  status: StatusProjeto;
  rotulo: string;
  projetos: ProjetoResumo[];
  podeArrastar: boolean;
  nomeFrente: (id: number) => string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <Coluna ref={setNodeRef} $sobre={isOver}>
      <ColunaTitulo>
        {rotulo}
        <Contador>{projetos.length}</Contador>
      </ColunaTitulo>

      {projetos.length === 0 && <ColunaVazia>—</ColunaVazia>}
      {projetos.map((projeto) => (
        <CardArrastavel
          key={projeto.id}
          projeto={projeto}
          podeArrastar={podeArrastar}
          nomeFrente={nomeFrente}
        />
      ))}
    </Coluna>
  );
}

function CardArrastavel({
  projeto,
  podeArrastar,
  nomeFrente,
}: {
  projeto: ProjetoResumo;
  podeArrastar: boolean;
  nomeFrente: (id: number) => string;
}) {
  const arrastavel = podeArrastar && statusAlvoValidos(projeto.status).length > 0;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: projeto.id,
    disabled: !arrastavel,
  });

  return (
    <Card
      ref={setNodeRef}
      $arrastando={isDragging}
      $bloqueada={!arrastavel}
      {...(arrastavel ? listeners : {})}
      {...(arrastavel ? attributes : {})}
    >
      <CardTopo>
        <CardTitulo>{projeto.nome}</CardTitulo>
      </CardTopo>
      <CardMeta>
        <span>{projeto.cliente}</span>
        <span>{projeto.frente_ids.map(nomeFrente).join(" · ")}</span>
      </CardMeta>
    </Card>
  );
}
