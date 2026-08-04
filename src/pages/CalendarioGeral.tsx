import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { addMonths, endOfMonth, format, isSameMonth, isToday, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  COR_TIPO,
  getEventos,
  GLIFO_TIPO,
  ROTULO_TIPO,
  type EventoCalendario,
  type TipoEvento,
} from "@/lib/calendario";
import { formatarDataHora } from "@/lib/projetos";
import {
  DayCell,
  DayEvents,
  DayNumber,
  MonthGrid,
  WeekdayCell,
  WeekdayRow,
  WeekRow,
} from "@/components/calendario/CalendarGrid.styled";
import { chaveData, rotulosDiaSemana, semanasDoMes } from "@/components/calendario/semanas";
import {
  PageStack,
  PageBadge,
  PageButton,
  PageButtonSm,
  PageLoadingBlock,
  ErrorBlock,
  ErrorText,
} from "@/styles/page.styled";
import {
  Cabecalho,
  Chip,
  DetailList,
  DetailRow,
  DetailTerm,
  DetailValue,
  FiltroChips,
  GradeWrap,
  MaisEventos,
  MesAtual,
  ModalBody,
  ModalClose,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalTitle,
  NarrowModalContent,
  PageHeaderRow,
  PageHeaderText,
  PageHeading,
  PageSubheading,
  Pilula,
} from "./CalendarioGeral.styled";

const INICIO_SEMANA = 0;
const ROTULOS = rotulosDiaSemana(INICIO_SEMANA);
const TIPOS: TipoEvento[] = ["banca", "kickoff", "reuniao", "entrega"];
const MAX_PILULAS = 3;

/**
 * O calendário geral do §6.5 — bancas, kickoffs, reuniões e entregas de
 * TODOS os projetos, acessível a todos.
 *
 * 🔓 **Sem recorte de visão**, e é o único lugar do sistema assim (§6.5 é
 * explícito). Consequência: uma pessoa pode ver aqui um evento de projeto
 * que ela não pode abrir. Por isso o clique abre um modal com os dados que a
 * própria listagem já trouxe — navegar direto daria 404.
 */
export function CalendarioGeral() {
  const { token } = useAuth();
  const [mes, setMes] = useState(() => startOfMonth(new Date()));
  const [eventos, setEventos] = useState<EventoCalendario[]>([]);
  const [tiposAtivos, setTiposAtivos] = useState<TipoEvento[]>(TIPOS);
  const [detalhe, setDetalhe] = useState<EventoCalendario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregar() {
    if (!token) return;
    setCarregando(true);
    setErro("");
    try {
      // Busca o mês inteiro (com as bordas das semanas), e o filtro por tipo
      // é aplicado no cliente — evita ida ao servidor a cada chip clicado.
      const semanas = semanasDoMes(mes, INICIO_SEMANA);
      const inicio = chaveData(semanas[0][0]);
      const fim = chaveData(semanas[semanas.length - 1][6]);
      setEventos(await getEventos(inicio, fim, token));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar o calendário");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, mes]);

  const porDia = useMemo(() => {
    const mapa = new Map<string, EventoCalendario[]>();
    for (const e of eventos) {
      if (!tiposAtivos.includes(e.tipo)) continue;
      const chave = e.data.slice(0, 10);
      const lista = mapa.get(chave) ?? [];
      lista.push(e);
      mapa.set(chave, lista);
    }
    return mapa;
  }, [eventos, tiposAtivos]);

  function alternarTipo(tipo: TipoEvento) {
    setTiposAtivos((atuais) =>
      atuais.includes(tipo) ? atuais.filter((t) => t !== tipo) : [...atuais, tipo],
    );
  }

  if (erro) {
    return (
      <ErrorBlock>
        <ErrorText>{erro}</ErrorText>
        <PageButton $variant="outline" onClick={carregar}>
          Tentar novamente
        </PageButton>
      </ErrorBlock>
    );
  }

  const visiveis = eventos.filter(
    (e) => tiposAtivos.includes(e.tipo) && isSameMonth(new Date(`${e.data.slice(0, 10)}T12:00:00`), mes),
  );

  return (
    <PageStack>
      <PageHeaderRow>
        <PageHeaderText>
          <PageHeading>Calendário</PageHeading>
          <PageSubheading>
            Bancas, kickoffs, reuniões e entregas de todos os projetos · {visiveis.length} neste mês
          </PageSubheading>
        </PageHeaderText>
        <PageButtonSm as={Link} to="/bancas/calendario" $variant="outline">
          <CalendarDays size={14} />
          Só bancas
        </PageButtonSm>
      </PageHeaderRow>

      <div>
        <Cabecalho>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <PageButtonSm type="button" $variant="ghost" onClick={() => setMes((m) => addMonths(m, -1))}>
              <ChevronLeft size={14} />
            </PageButtonSm>
            <MesAtual>{format(mes, "MMMM 'de' yyyy", { locale: ptBR })}</MesAtual>
            <PageButtonSm type="button" $variant="ghost" onClick={() => setMes((m) => addMonths(m, 1))}>
              <ChevronRight size={14} />
            </PageButtonSm>
            <PageButtonSm type="button" $variant="outline" onClick={() => setMes(startOfMonth(new Date()))}>
              Hoje
            </PageButtonSm>
          </div>

          <FiltroChips>
            {TIPOS.map((tipo) => (
              <Chip
                key={tipo}
                type="button"
                $ativo={tiposAtivos.includes(tipo)}
                $cor={COR_TIPO[tipo]}
                onClick={() => alternarTipo(tipo)}
              >
                {GLIFO_TIPO[tipo]} {ROTULO_TIPO[tipo]}
              </Chip>
            ))}
          </FiltroChips>
        </Cabecalho>

        {carregando ? (
          <PageLoadingBlock />
        ) : (
          <GradeWrap>
            <MonthGrid>
              <WeekdayRow>
                {ROTULOS.map((r) => (
                  <WeekdayCell key={r}>{r}</WeekdayCell>
                ))}
              </WeekdayRow>
              {semanasDoMes(mes, INICIO_SEMANA).map((semana) => (
                <WeekRow key={chaveData(semana[0])}>
                  {semana.map((dia) => {
                    const chave = chaveData(dia);
                    const doDia = porDia.get(chave) ?? [];
                    return (
                      <DayCell key={chave} $outside={!isSameMonth(dia, mes)}>
                        <DayNumber $today={isToday(dia)}>{format(dia, "d")}</DayNumber>
                        <DayEvents>
                          {doDia.slice(0, MAX_PILULAS).map((e, i) => (
                            <Pilula
                              key={`${e.tipo}-${e.referencia_id}-${i}`}
                              type="button"
                              $cor={COR_TIPO[e.tipo]}
                              title={e.titulo}
                              onClick={() => setDetalhe(e)}
                            >
                              {GLIFO_TIPO[e.tipo]} {e.projeto_nome || e.titulo}
                            </Pilula>
                          ))}
                          {doDia.length > MAX_PILULAS && (
                            <MaisEventos>+{doDia.length - MAX_PILULAS} mais</MaisEventos>
                          )}
                        </DayEvents>
                      </DayCell>
                    );
                  })}
                </WeekRow>
              ))}
            </MonthGrid>
          </GradeWrap>
        )}
      </div>

      {detalhe && <DetalheModal evento={detalhe} onClose={() => setDetalhe(null)} />}
    </PageStack>
  );
}

function DetalheModal({ evento, onClose }: { evento: EventoCalendario; onClose: () => void }) {
  return (
    <ModalOverlay onClick={onClose} role="presentation">
      <NarrowModalContent onClick={(e) => e.stopPropagation()} role="dialog">
        <ModalHeader>
          <ModalTitle>
            {GLIFO_TIPO[evento.tipo]} {ROTULO_TIPO[evento.tipo]}
          </ModalTitle>
          <ModalClose type="button" aria-label="Fechar" onClick={onClose}>
            <X size={18} />
          </ModalClose>
        </ModalHeader>
        <ModalBody>
          <DetailList>
            <DetailRow>
              <DetailTerm>Projeto</DetailTerm>
              <DetailValue>{evento.projeto_nome || "—"}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailTerm>Quando</DetailTerm>
              <DetailValue>{formatarDataHora(evento.data)}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailTerm>Descrição</DetailTerm>
              <DetailValue>{evento.titulo}</DetailValue>
            </DetailRow>
            {evento.status && (
              <DetailRow>
                <DetailTerm>Situação</DetailTerm>
                <DetailValue>
                  <PageBadge $tone={evento.status === "atrasada" ? "danger" : "default"}>
                    {evento.status}
                  </PageBadge>
                </DetailValue>
              </DetailRow>
            )}
          </DetailList>
        </ModalBody>
        <ModalFooter>
          <PageButton $variant="outline" type="button" onClick={onClose}>
            Fechar
          </PageButton>
          {/* Só oferece o link quando há projeto: quem não enxerga o projeto
              levaria 404 do `exigir_acesso_ao_projeto`. */}
          {evento.projeto_id && (
            <PageButton as={Link} to={`/projetos/${evento.projeto_id}`}>
              Abrir projeto
            </PageButton>
          )}
        </ModalFooter>
      </NarrowModalContent>
    </ModalOverlay>
  );
}
