import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { addMonths, endOfMonth, format, isSameMonth, isToday, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
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
import { DayEvents, DayNumber, WeekdayCell, WeekdayRow } from "@/components/calendario/CalendarGrid.styled";
import { chaveData, rotulosDiaSemana, semanasDoMes } from "@/components/calendario/semanas";
import {
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
  CorpoCalendario,
  DayCellPreenche,
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
  MonthGridPreenche,
  NarrowModalContent,
  PageHeaderRow,
  PageHeaderText,
  PageHeading,
  PageSubheading,
  PaginaCalendario,
  Pilula,
  PilulaGlifo,
  PilulaTexto,
  WeekRowPreenche,
} from "./CalendarioGeral.styled";

const INICIO_SEMANA = 0;
const ROTULOS = rotulosDiaSemana(INICIO_SEMANA);
const TIPOS: TipoEvento[] = ["banca", "kickoff", "reuniao", "entrega"];
/** Reunião é semanal, POR PROJETO, com o portfólio inteiro junto numa grade
 *  só, ela sozinha lota todos os dias úteis de todas as semanas. Isso é
 *  exatamente o "tem tudo, mas não faz sentido": marco raro (banca, kickoff,
 *  entrega) e rotina recorrente (reunião) pesando igual afogam os marcos que
 *  a pessoa realmente veio procurar. Reunião começa OFF; quem quiser ligar,
 *  liga no filtro. */
const TIPOS_PADRAO: TipoEvento[] = TIPOS.filter((t) => t !== "reuniao");
/** A célula agora tem altura FLEXÍVEL (encolhe pra caber as 5-6 semanas do
 *  mês na tela, sem empurrar a página), 3, não 4, porque numa célula mais
 *  baixa é o que sobra de espaço com folga pro "+N mais" sempre caber
 *  embaixo, em vez de arriscar cortar o próprio texto do evento. */
const MAX_PILULAS = 3;

/**
 * O calendário geral do , bancas, kickoffs, reuniões e entregas.
 *
 * Recorta por posição, como o resto do site: diretor vê o portfólio
 * inteiro, gerente só a própria frente, coordenador/consultor só os
 * projetos em que estão alocados. O  original pedia "acessível a todos,
 * sem recorte", decisão revista depois: só quem já enxerga tudo em toda
 * tela (a diretoria) tira proveito de ver o portfólio inteiro aqui também;
 * pra quem está em poucos projetos, o resto vira ruído. O recorte é feito
 * no backend (`GetEventosCalendarioUseCase`), a página só mostra o que
 * chega.
 */
export function CalendarioGeral() {
  const { token, usuario } = useAuth();
  // Só diretor e gerente enxergam o portfólio inteiro, o texto
  // reflete o que a pessoa está de fato vendo, em vez de prometer "todos os
  // projetos" pra quem só vê os próprios.
  const veTudo = usuario?.posicao === "diretor" || usuario?.posicao === "gerente";
  const [mes, setMes] = useState(() => startOfMonth(new Date()));
  const [eventos, setEventos] = useState<EventoCalendario[]>([]);
  const [tiposAtivos, setTiposAtivos] = useState<TipoEvento[]>(TIPOS_PADRAO);
  const [detalhe, setDetalhe] = useState<EventoCalendario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregar() {
    if (!token) return;
    setCarregando(true);
    setErro("");
    try {
      // Busca o mês inteiro (com as bordas das semanas), e o filtro por tipo
      // é aplicado no cliente, evita ida ao servidor a cada chip clicado.
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
    <PaginaCalendario>
      <PageHeaderRow>
        <PageHeaderText>
          <PageHeading>Calendário</PageHeading>
          <PageSubheading>
            Bancas, kickoffs, reuniões e entregas {veTudo ? "de todos os projetos" : "dos seus projetos"} ·{" "}
            {visiveis.length} neste mês
          </PageSubheading>
        </PageHeaderText>
      </PageHeaderRow>

      <CorpoCalendario>
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
            <MonthGridPreenche>
              <WeekdayRow>
                {ROTULOS.map((r) => (
                  <WeekdayCell key={r}>{r}</WeekdayCell>
                ))}
              </WeekdayRow>
              {semanasDoMes(mes, INICIO_SEMANA).map((semana) => (
                <WeekRowPreenche key={chaveData(semana[0])}>
                  {semana.map((dia) => {
                    const chave = chaveData(dia);
                    const doDia = porDia.get(chave) ?? [];
                    return (
                      <DayCellPreenche key={chave} $outside={!isSameMonth(dia, mes)}>
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
                              <PilulaGlifo>{GLIFO_TIPO[e.tipo]}</PilulaGlifo>
                              <PilulaTexto>{e.projeto_nome || e.titulo}</PilulaTexto>
                            </Pilula>
                          ))}
                          {doDia.length > MAX_PILULAS && (
                            <MaisEventos>+{doDia.length - MAX_PILULAS} mais</MaisEventos>
                          )}
                        </DayEvents>
                      </DayCellPreenche>
                    );
                  })}
                </WeekRowPreenche>
              ))}
            </MonthGridPreenche>
          </GradeWrap>
        )}
      </CorpoCalendario>

      {detalhe && <DetalheModal evento={detalhe} onClose={() => setDetalhe(null)} />}
    </PaginaCalendario>
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
