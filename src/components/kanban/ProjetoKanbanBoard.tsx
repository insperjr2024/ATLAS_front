import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { AlertTriangle } from "lucide-react";
import { tonsDaColuna, type TonsColuna } from "@/lib/colunas-tarefa";
import { CORES_STATUS, destinosValidos, formatarDataHoraBanca, podePausar, ROTULO_STATUS } from "@/lib/projetos";
import { StatusPilula } from "@/pages/projetos/Projetos.styled";
import type { ProjetoResumo, StatusProjeto } from "@/types/projeto";
import {
  AlertaKickoff,
  Board,
  Card,
  CardBanca,
  CardFrentes,
  CardFrenteTag,
  CardMeta,
  CardTitulo,
  CardTopo,
  Coluna,
  ColunaRotuloTexto,
  ColunaTitulo,
  ColunaVazia,
  Contador,
  Ponto,
} from "./Kanban.styled";

const COLUNAS = (Object.keys(ROTULO_STATUS) as StatusProjeto[]).map((status) => ({
  status,
  rotulo: ROTULO_STATUS[status],
}));

/**
 * Pra onde um projeto no status `atual` pode ir num arrasto — mesma régua
 * livre do seletor de etapa em `ProjetoPage` (qualquer etapa ativa, nos dois
 * sentidos). `pausado` não entra: o alvo do retomar é decidido no backend,
 * não dá pra adivinhar arrastando pra uma coluna específica.
 */
function statusAlvoValidos(atual: StatusProjeto, temKickoff: boolean): StatusProjeto[] {
  const alvos = destinosValidos(atual, temKickoff);
  return podePausar(atual) ? [...alvos, "pausado"] : alvos;
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
    if (!statusAlvoValidos(projeto.status, !!projeto.data_kickoff).includes(destino)) return;
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
        <StatusPilula $cor={tons}>
          <Ponto $cor={tons.ponto} />
          <ColunaRotuloTexto>{rotulo}</ColunaRotuloTexto>
        </StatusPilula>
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
  const arrastavel = podeArrastar && statusAlvoValidos(projeto.status, !!projeto.data_kickoff).length > 0;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: projeto.id,
    disabled: !arrastavel,
  });
  const navigate = useNavigate();

  return (
    <Card
      ref={setNodeRef}
      $cor={tons}
      $arrastando={isDragging}
      $bloqueada={!arrastavel}
      {...(arrastavel ? listeners : {})}
      {...(arrastavel ? attributes : {})}
      // Depois do spread de propósito: `attributes` do dnd-kit já traz
      // role/tabIndex quando arrastável, e espalhar por último sobrescreveria
      // os nossos. O clique abre o projeto; o arrasto só começa depois de 5px
      // de movimento (activationConstraint), então os dois gestos convivem.
      // `tabIndex` fica explícito pra continuar navegável por teclado mesmo
      // quando o card não é arrastável (aí `attributes` não traz nenhum).
      role="button"
      tabIndex={0}
      title="Clique para abrir o projeto"
      onClick={() => navigate(`/projetos/${projeto.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          navigate(`/projetos/${projeto.id}`);
        }
      }}
    >
      <CardTopo>
        <CardTitulo>{projeto.nome}</CardTitulo>
        {projeto.kickoff_pendente && (
          <AlertaKickoff title="Kickoff pendente">
            <AlertTriangle size={14} />
          </AlertaKickoff>
        )}
      </CardTopo>
      <CardMeta title={projeto.cliente ?? undefined}>{projeto.cliente}</CardMeta>
      <CardFrentes>
        {projeto.frente_ids.map((id) => (
          <CardFrenteTag key={id} title={nomeFrente(id)}>
            {nomeFrente(id)}
          </CardFrenteTag>
        ))}
      </CardFrentes>
      {projeto.proxima_banca && (
        <CardBanca title={`Banca: ${formatarDataHoraBanca(projeto.proxima_banca)}`}>
          Banca: {formatarDataHoraBanca(projeto.proxima_banca)}
        </CardBanca>
      )}
    </Card>
  );
}
