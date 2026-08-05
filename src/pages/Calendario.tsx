import { useEffect, useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  format,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { PageButtonSm } from "@/styles/page.styled";
import { getBancas, getBancasFrentes, getCandidaturas, getEquipesProjeto, getEscopos, getFrentes } from "@/lib/bancas";
import { getUsuarios } from "@/lib/usuarios";
import {
  avaliadoresDaBanca,
  frentesDaBanca,
  membrosDaBanca,
  nomeEscopo,
  nomeUsuario,
} from "@/lib/nucleo";
import type { Banca, BancaFrente, Candidatura, EquipeProjeto, Escopo, Frente } from "@/types/banca";
import type { UsuarioResumo } from "@/types/auth";
import {
  PageStack,
  Breadcrumb,
  PageTitle,
  PageDescription,
  CalendarCard,
  CalendarCardIntro,
  CalendarCardTitle,
  CalendarCardDesc,
  CalendarToolbar,
  ToolbarMonth,
  ToolbarGroup,
  ViewToggle,
  ViewButton,
  NavButton,
  TodayButton,
  MonthGrid,
  WeekdayRow,
  WeekdayCell,
  WeekRow,
  DayCell,
  DayNumber,
  DayEvents,
  EventPill,
  MoreEvents,
  WeekGrid,
  DayViewPanel,
  DayViewTitle,
  UpcomingSection,
  UpcomingTitle,
  UpcomingMonth,
  UpcomingList,
  UpcomingEventCard,
  UpcomingEventName,
  UpcomingEventMeta,
  EmptyUpcoming,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalClose,
  ModalBody,
  ModalDetailList,
  DetailRow,
  DetailTerm,
  DetailValue,
  ModalFooter,
  RetryButton,
  LoadingBlock,
  ErrorBlock,
  ErrorText,
  StatusBadge,
} from "./Calendario.styled";
import {
  chaveData,
  diasDaSemana as diasDaSemanaBase,
  rotulosDiaSemana,
  semanasDoMes as semanasDoMesBase,
} from "@/components/calendario/semanas";

// O calendário geral segue em domingo-primeiro; o cronograma e a faixa de
// reunião usam seg–dom (§6.4). Cabeçalho e grade saem do MESMO parâmetro.
const INICIO_SEMANA = 0;
const DIAS_SEMANA = rotulosDiaSemana(INICIO_SEMANA);
const MAX_PILLS = 2;

type Vista = "mes" | "semana" | "dia";

interface Contexto {
  usuarios: UsuarioResumo[];
  escopos: Escopo[];
  frentes: Frente[];
  bancasFrentes: BancaFrente[];
  equipesProjeto: EquipeProjeto[];
  candidaturas: Candidatura[];
}

function statusBanca(banca: Banca): { label: string; tone: "success" | "warning" | "muted" } {
  if (banca.status === "realizada") return { label: "Realizada", tone: "muted" };
  if (banca.alocados >= banca.vagas) return { label: "Lotada", tone: "warning" };
  return { label: "Aberta", tone: "success" };
}

const semanasDoMes = (mes: Date) => semanasDoMesBase(mes, INICIO_SEMANA);
const diasDaSemana = (ref: Date) => diasDaSemanaBase(ref, INICIO_SEMANA);

export function Calendario() {
  const { token } = useAuth();
  const [bancas, setBancas] = useState<Banca[]>([]);
  const [contexto, setContexto] = useState<Contexto | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mesAtual, setMesAtual] = useState(() => startOfMonth(new Date()));
  const [vista, setVista] = useState<Vista>("mes");
  const [diaFoco, setDiaFoco] = useState(() => startOfDay(new Date()));
  const [bancaDetalhe, setBancaDetalhe] = useState<Banca | null>(null);

  async function buscar() {
    if (!token) return;
    setCarregando(true);
    setErro("");
    try {
      const [bancasResp, usuarios, escopos, frentes, bancasFrentes, equipesProjeto, candidaturas] =
        await Promise.all([
          getBancas(token),
          getUsuarios(token),
          getEscopos(token),
          getFrentes(token),
          getBancasFrentes(token),
          getEquipesProjeto(token),
          getCandidaturas(token),
        ]);
      setBancas(bancasResp);
      setContexto({ usuarios, escopos, frentes, bancasFrentes, equipesProjeto, candidaturas });
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar calendário");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    buscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const bancasPorDia = useMemo(() => {
    const mapa = new Map<string, Banca[]>();
    for (const banca of bancas) {
      const chave = chaveData(new Date(banca.data_hora));
      const lista = mapa.get(chave) ?? [];
      lista.push(banca);
      mapa.set(chave, lista);
    }
    for (const [, lista] of mapa) {
      lista.sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());
    }
    return mapa;
  }, [bancas]);

  const bancasDoMes = useMemo(
    () =>
      bancas
        .filter((b) => isSameMonth(new Date(b.data_hora), mesAtual))
        .sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime()),
    [bancas, mesAtual],
  );

  const proximasDoMes = useMemo(() => {
    const agora = Date.now();
    return bancasDoMes.filter((b) => new Date(b.data_hora).getTime() >= agora);
  }, [bancasDoMes]);

  function irHoje() {
    const hoje = new Date();
    setMesAtual(startOfMonth(hoje));
    setDiaFoco(startOfDay(hoje));
  }

  function navegar(delta: number) {
    if (vista === "mes") {
      setMesAtual((m) => startOfMonth(addMonths(m, delta)));
    } else if (vista === "semana") {
      setDiaFoco((d) => addDays(d, delta * 7));
      setMesAtual((m) => startOfMonth(addDays(diaFoco, delta * 7)));
    } else {
      setDiaFoco((d) => addDays(d, delta));
      setMesAtual(startOfMonth(addDays(diaFoco, delta)));
    }
  }

  function rotuloToolbar(): string {
    if (vista === "mes") return format(mesAtual, "MMMM yyyy", { locale: ptBR });
    if (vista === "semana") {
      const dias = diasDaSemana(diaFoco);
      return `${format(dias[0], "d MMM", { locale: ptBR })} – ${format(dias[6], "d MMM yyyy", { locale: ptBR })}`;
    }
    return format(diaFoco, "d 'de' MMMM yyyy", { locale: ptBR });
  }

  if (erro) {
    return (
      <ErrorBlock>
        <ErrorText>Não foi possível carregar o calendário: {erro}</ErrorText>
        <RetryButton type="button" onClick={buscar}>
          Tentar novamente
        </RetryButton>
      </ErrorBlock>
    );
  }

  if (carregando || !contexto) return <LoadingBlock />;

  return (
    <PageStack>
      <Breadcrumb>
        Núcleo de Bancas &gt; <span>Calendário</span>
      </Breadcrumb>

      <PageButtonSm as={Link} to="/calendario" $variant="outline" style={{ alignSelf: "flex-start" }}>
        <ArrowLeft size={14} />
        Calendário geral
      </PageButtonSm>

      <PageTitle>Calendário</PageTitle>
      <PageDescription>
        Todas as bancas agendadas pelo núcleo. Visualize por mês, semana ou dia e clique em uma banca para ver os
        detalhes.
      </PageDescription>

      <CalendarCard>
        <CalendarCardIntro>
          <CalendarCardTitle>Calendário unificado</CalendarCardTitle>
          <CalendarCardDesc>
            Todas as bancas em um único calendário. Clique em uma banca para ver detalhes.
          </CalendarCardDesc>
        </CalendarCardIntro>

        <CalendarToolbar>
          <ToolbarMonth>{rotuloToolbar()}</ToolbarMonth>

          <ToolbarGroup>
            <ViewToggle>
              <ViewButton type="button" $active={vista === "mes"} onClick={() => setVista("mes")}>
                Mês
              </ViewButton>
              <ViewButton type="button" $active={vista === "semana"} onClick={() => setVista("semana")}>
                Semana
              </ViewButton>
              <ViewButton type="button" $active={vista === "dia"} onClick={() => setVista("dia")}>
                Dia
              </ViewButton>
            </ViewToggle>
          </ToolbarGroup>

          <ToolbarGroup>
            <NavButton type="button" aria-label="Anterior" onClick={() => navegar(-1)}>
              <ChevronLeft size={16} />
            </NavButton>
            <TodayButton type="button" onClick={irHoje}>
              Hoje
            </TodayButton>
            <NavButton type="button" aria-label="Próximo" onClick={() => navegar(1)}>
              <ChevronRight size={16} />
            </NavButton>
          </ToolbarGroup>
        </CalendarToolbar>

        {vista === "mes" && (
          <VistaMes
            mes={mesAtual}
            bancasPorDia={bancasPorDia}
            onBanca={(b) => setBancaDetalhe(b)}
            onDia={(d) => {
              setDiaFoco(d);
              setVista("dia");
            }}
          />
        )}

        {vista === "semana" && (
          <VistaSemana diaFoco={diaFoco} bancasPorDia={bancasPorDia} onBanca={(b) => setBancaDetalhe(b)} />
        )}

        {vista === "dia" && (
          <VistaDia
            dia={diaFoco}
            bancas={bancasPorDia.get(chaveData(diaFoco)) ?? []}
            contexto={contexto}
            onBanca={(b) => setBancaDetalhe(b)}
          />
        )}
      </CalendarCard>

      <UpcomingSection>
        <UpcomingTitle>Próximas bancas deste mês</UpcomingTitle>
        <UpcomingMonth>{format(mesAtual, "MMMM yyyy", { locale: ptBR })}</UpcomingMonth>
        <UpcomingList>
          {proximasDoMes.length === 0 && <EmptyUpcoming>Nenhuma banca futura neste mês.</EmptyUpcoming>}
          {proximasDoMes.map((banca) => (
            <UpcomingEventCard key={banca.id} type="button" onClick={() => setBancaDetalhe(banca)}>
              <UpcomingEventName>Banca {banca.nome_projeto}</UpcomingEventName>
              <UpcomingEventMeta>
                {format(new Date(banca.data_hora), "dd/MM")} às{" "}
                {format(new Date(banca.data_hora), "HH:mm")} · {nomeEscopo(contexto.escopos, banca.escopo_id)}
              </UpcomingEventMeta>
            </UpcomingEventCard>
          ))}
        </UpcomingList>
      </UpcomingSection>

      {bancaDetalhe && (
        <DetalheModal banca={bancaDetalhe} contexto={contexto} onClose={() => setBancaDetalhe(null)} />
      )}
    </PageStack>
  );
}

function VistaMes({
  mes,
  bancasPorDia,
  onBanca,
  onDia,
}: {
  mes: Date;
  bancasPorDia: Map<string, Banca[]>;
  onBanca: (b: Banca) => void;
  onDia: (d: Date) => void;
}) {
  const semanas = semanasDoMes(mes);

  return (
    <MonthGrid>
      <WeekdayRow>
        {DIAS_SEMANA.map((dia) => (
          <WeekdayCell key={dia}>{dia}</WeekdayCell>
        ))}
      </WeekdayRow>
      {semanas.map((semana) => (
        <WeekRow key={semana[0].toISOString()}>
          {semana.map((dia) => {
            const chave = chaveData(dia);
            const eventos = bancasPorDia.get(chave) ?? [];
            const visiveis = eventos.slice(0, MAX_PILLS);
            const restantes = eventos.length - visiveis.length;

            return (
              <DayCell key={chave} $outside={!isSameMonth(dia, mes)} $today={isToday(dia)}>
                <DayNumber $today={isToday(dia)}>{format(dia, "d")}</DayNumber>
                <DayEvents>
                  {visiveis.map((banca) => (
                    <EventPill
                      key={banca.id}
                      type="button"
                      title={banca.nome_projeto}
                      onClick={(e) => {
                        e.stopPropagation();
                        onBanca(banca);
                      }}
                    >
                      Banca {banca.nome_projeto}
                    </EventPill>
                  ))}
                  {restantes > 0 && (
                    <MoreEvents type="button" onClick={() => onDia(startOfDay(dia))}>
                      +{restantes} banca{restantes > 1 ? "s" : ""}
                    </MoreEvents>
                  )}
                </DayEvents>
              </DayCell>
            );
          })}
        </WeekRow>
      ))}
    </MonthGrid>
  );
}

function VistaSemana({
  diaFoco,
  bancasPorDia,
  onBanca,
}: {
  diaFoco: Date;
  bancasPorDia: Map<string, Banca[]>;
  onBanca: (b: Banca) => void;
}) {
  const dias = diasDaSemana(diaFoco);

  return (
    <MonthGrid>
      <WeekdayRow>
        {dias.map((dia) => (
          <WeekdayCell key={chaveData(dia)}>
            {format(dia, "EEE d", { locale: ptBR })}
          </WeekdayCell>
        ))}
      </WeekdayRow>
      <WeekGrid>
        {dias.map((dia) => {
          const eventos = bancasPorDia.get(chaveData(dia)) ?? [];
          return (
            <DayCell key={chaveData(dia)} $today={isToday(dia)}>
              <DayNumber $today={isToday(dia)}>{format(dia, "d")}</DayNumber>
              <DayEvents>
                {eventos.map((banca) => (
                  <EventPill key={banca.id} type="button" title={banca.nome_projeto} onClick={() => onBanca(banca)}>
                    Banca {banca.nome_projeto}
                  </EventPill>
                ))}
              </DayEvents>
            </DayCell>
          );
        })}
      </WeekGrid>
    </MonthGrid>
  );
}

function VistaDia({
  dia,
  bancas,
  contexto,
  onBanca,
}: {
  dia: Date;
  bancas: Banca[];
  contexto: Contexto;
  onBanca: (b: Banca) => void;
}) {
  return (
    <DayViewPanel>
      <DayViewTitle>{format(dia, "EEEE, d 'de' MMMM", { locale: ptBR })}</DayViewTitle>
      {bancas.length === 0 && <EmptyUpcoming>Nenhuma banca neste dia.</EmptyUpcoming>}
      <UpcomingList>
        {bancas.map((banca) => (
          <UpcomingEventCard key={banca.id} type="button" onClick={() => onBanca(banca)}>
            <UpcomingEventName>Banca {banca.nome_projeto}</UpcomingEventName>
            <UpcomingEventMeta>
              {format(new Date(banca.data_hora), "HH:mm")} · {nomeEscopo(contexto.escopos, banca.escopo_id)} ·{" "}
              {nomeUsuario(contexto.usuarios, banca.coordenador_id)}
            </UpcomingEventMeta>
          </UpcomingEventCard>
        ))}
      </UpcomingList>
    </DayViewPanel>
  );
}

function DetalheModal({
  banca,
  contexto,
  onClose,
}: {
  banca: Banca;
  contexto: Contexto;
  onClose: () => void;
}) {
  const dataHora = new Date(banca.data_hora);
  const status = statusBanca(banca);

  return (
    <ModalOverlay onClick={onClose} role="presentation">
      <ModalContent onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="modal-banca-titulo">
        <ModalHeader>
          <ModalTitle id="modal-banca-titulo">{banca.nome_projeto}</ModalTitle>
          <ModalClose type="button" aria-label="Fechar" onClick={onClose}>
            <X size={18} />
          </ModalClose>
        </ModalHeader>
        <ModalBody>
          <ModalDetailList>
            <DetailRow>
              <DetailTerm>Status</DetailTerm>
              <DetailValue>
                <StatusBadge $tone={status.tone}>{status.label}</StatusBadge>
              </DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailTerm>Data</DetailTerm>
              <DetailValue>{format(dataHora, "dd/MM/yyyy")}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailTerm>Horário</DetailTerm>
              <DetailValue>{format(dataHora, "HH:mm")}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailTerm>Semestre</DetailTerm>
              <DetailValue>{banca.semestre_nome}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailTerm>Escopo</DetailTerm>
              <DetailValue>{nomeEscopo(contexto.escopos, banca.escopo_id)}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailTerm>Frentes</DetailTerm>
              <DetailValue>
                {frentesDaBanca(contexto.bancasFrentes, contexto.frentes, banca.id).join(", ") || "—"}
              </DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailTerm>Coordenador</DetailTerm>
              <DetailValue>{nomeUsuario(contexto.usuarios, banca.coordenador_id)}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailTerm>Membros do projeto</DetailTerm>
              <DetailValue>
                {membrosDaBanca(contexto.equipesProjeto, contexto.usuarios, banca.id).join(", ") || "—"}
              </DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailTerm>Avaliadores alocados</DetailTerm>
              <DetailValue>
                {avaliadoresDaBanca(contexto.candidaturas, contexto.usuarios, banca.id).join(", ") || "—"}
              </DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailTerm>Vagas</DetailTerm>
              <DetailValue>
                {banca.alocados}/{banca.vagas}
              </DetailValue>
            </DetailRow>
          </ModalDetailList>
        </ModalBody>
        <ModalFooter>
          <RetryButton type="button" onClick={onClose}>
            Fechar
          </RetryButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
}
