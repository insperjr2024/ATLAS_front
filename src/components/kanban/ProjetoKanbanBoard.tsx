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
import { tonsDaColuna, type TonsColuna } from "@/lib/colunas-tarefa";
import { podePausar, proximoStatusManual, ROTULO_STATUS, statusAnteriorManual } from "@/lib/projetos";
import type { ProjetoResumo, StatusProjeto } from "@/types/projeto";
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
  Ponto,
} from "./Kanban.styled";

/**
 * Uma cor fixa por fase — ao contrário das colunas de tarefa, as fases do
 * projeto não são configuráveis pela diretoria, então não precisam de tela
 * de config: só reaproveitam a mesma paleta e a mesma derivação de tons
 * (`tonsDaColuna`) que o kanban de tarefas passou a usar.
 */
const CORES_STATUS: Record<StatusProjeto, string> = {
  vendido: "#9CA3AF", // cinza — ainda não começou de fato
  ambientacao: "#6366F1", // índigo
  em_andamento: "#3B82F6", // azul
  validacao_bancas: "#8B5CF6", // roxo
  envio_tep: "#14B8A6", // teal
  periodo_ajustes: "#F97316", // laranja
  finalizado: "#10B981", // verde
  pausado: "#F59E0B", // âmbar — vermelho fica reservado pro alerta de vencida
};

const COLUNAS = (Object.keys(ROTULO_STATUS) as StatusProjeto[]).map((status) => ({
  status,
  rotulo: ROTULO_STATUS[status],
}));

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

  const tons = useMemo(() => {
    const mapa = new Map<StatusProjeto, TonsColuna>();
    for (const status of Object.keys(CORES_STATUS) as StatusProjeto[]) {
      mapa.set(status, tonsDaColuna(CORES_STATUS[status]));
    }
    return mapa;
  }, []);

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
      <Board $colunas={COLUNAS.length}>
        {COLUNAS.map((coluna) => (
          <ColunaDrop
            key={coluna.status}
            status={coluna.status}
            rotulo={coluna.rotulo}
            tons={tons.get(coluna.status)!}
            projetos={projetos.filter((p) => p.status === coluna.status)}
            podeArrastar={podeArrastar}
            nomeFrente={nomeFrente}
          />
        ))}
      </Board>

      <DragOverlay>
        {arrastando && (
          <Card $cor={tons.get(arrastando.status)}>
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
  tons,
  projetos,
  podeArrastar,
  nomeFrente,
}: {
  status: StatusProjeto;
  rotulo: string;
  tons: TonsColuna;
  projetos: ProjetoResumo[];
  podeArrastar: boolean;
  nomeFrente: (id: number) => string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <Coluna ref={setNodeRef} $sobre={isOver} $cor={tons}>
      <ColunaTitulo>
        <ColunaPilula $cor={tons}>
          <Ponto $cor={tons.ponto} />
          {rotulo}
        </ColunaPilula>
        <Contador>{projetos.length}</Contador>
      </ColunaTitulo>

      {projetos.length === 0 && <ColunaVazia>—</ColunaVazia>}
      {projetos.map((projeto) => (
        <CardArrastavel
          key={projeto.id}
          projeto={projeto}
          tons={tons}
          podeArrastar={podeArrastar}
          nomeFrente={nomeFrente}
        />
      ))}
    </Coluna>
  );
}

function CardArrastavel({
  projeto,
  tons,
  podeArrastar,
  nomeFrente,
}: {
  projeto: ProjetoResumo;
  tons: TonsColuna;
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
      $cor={tons}
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
