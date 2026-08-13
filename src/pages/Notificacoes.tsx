import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeftRight,
  Bell,
  CalendarCheck,
  CalendarClock,
  CalendarPlus,
  CalendarSync,
  CalendarX,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Flag,
  GraduationCap,
  ListChecks,
  Megaphone,
  NotebookPen,
  SlidersHorizontal,
  Star,
  Truck,
  UserPlus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNotificacoes } from "@/context/NotificacoesContext";
import { getNotificacoes, marcarNotificacaoLida, marcarTodasLidas } from "@/lib/notificacoes";
import type { Usuario } from "@/types/auth";
import type { Notificacao, TipoNotificacao } from "@/types/notificacao";
import {
  PageStack,
  PageCard,
  PageCardHeader,
  PageCardTitle,
  PageButtonSm,
  PageLoadingBlock,
  ErrorBlock,
  ErrorText,
  EmptyText,
} from "@/styles/page.styled";
import {
  PageHeaderRow,
  PageHeaderText,
  PageHeading,
  PageSubheading,
  FiltroBar,
  SegGroup,
  SegButton,
  DropdownWrap,
  DropdownBotao,
  DropdownContagem,
  DropdownPainel,
  OpcaoLinha,
  OpcaoCaixa,
  OpcaoTexto,
  OpcaoContagem,
  PainelRodape,
  PainelLimpar,
  Lista,
  Item,
  ItemIcone,
  ItemCorpo,
  ItemTitulo,
  ItemMeta,
  ItemAcao,
  NotaRodape,
  VazioBloco,
} from "./Notificacoes.styled";

/** O ícone e o rótulo de cada tipo. `alerta` pinta de vermelho o que é
 *  cobrança; o que é notícia boa ou neutra fica cinza.
 *
 *  O rótulo é o nome COMPLETO do alerta, não uma palavra solta: "Banca" servia
 *  para três tipos diferentes, e o chip de filtro ficava ambíguo. */
const APARENCIA: Record<TipoNotificacao, { icone: LucideIcon; rotulo: string; alerta: boolean }> = {
  kickoff_pendente: { icone: Flag, rotulo: "Kickoff pendente", alerta: true },
  tarefa_vencida: { icone: AlertTriangle, rotulo: "Tarefa vencida", alerta: true },
  banca_nao_marcada: { icone: CalendarX, rotulo: "Banca não marcada", alerta: true },
  projeto_sem_reuniao: { icone: CalendarClock, rotulo: "Projeto sem reunião", alerta: true },
  escalacao_banca: { icone: Star, rotulo: "Escalação em banca", alerta: false },
  banca_hoje: { icone: CalendarClock, rotulo: "Banca hoje", alerta: false },
  alocado_em_projeto: { icone: UserPlus, rotulo: "Alocado em projeto", alerta: false },
  entrega_registrada: { icone: CheckCircle2, rotulo: "Entrega registrada", alerta: false },
  // Alguém pediu para entrar num projeto. Alerta porque espera decisão de quem
  // recebe — parado, o pedido segura a pessoa fora do time.
  solicitacao_projeto: { icone: UserPlus, rotulo: "Pedido para entrar", alerta: true },
  // Pedido de dias de ajuste no cronograma (§13). O pedido é alerta pelo mesmo
  // motivo; a resposta não é, já foi resolvida.
  reajuste_solicitado: { icone: CalendarPlus, rotulo: "Pedido de dias", alerta: true },
  reajuste_respondido: { icone: CalendarCheck, rotulo: "Pedido de dias respondido", alerta: false },
  // Vindos do módulo de bancas, que passou a escrever nesta mesma central.
  troca_banca: { icone: ArrowLeftRight, rotulo: "Troca de banca", alerta: false },
  avaliacao_pendente: { icone: ClipboardCheck, rotulo: "Avaliação pendente", alerta: true },
  descricao_coordenador_pendente: { icone: NotebookPen, rotulo: "Descrição de banca pendente", alerta: true },
  banca_aviso: { icone: Megaphone, rotulo: "Aviso de banca", alerta: false },
  // O plano mudou depois de combinado, pintados como alerta porque exigem
  // replanejamento de quem já tinha a data antiga na agenda.
  banca_remarcada: { icone: CalendarSync, rotulo: "Banca remarcada", alerta: true },
  entrega_alterada: { icone: Truck, rotulo: "Entrega alterada", alerta: true },
  lote_desempenho_aberto: {
    icone: ListChecks,
    rotulo: "Avaliação de Desempenho",
    alerta: true,
  },
  pdi_prazo_proximo: { icone: GraduationCap, rotulo: "Prazo de PDI próximo", alerta: true },
  pdi_prazo_vencido: { icone: GraduationCap, rotulo: "Prazo de PDI vencido", alerta: true },
};

/**
 * A aparência de um tipo, com rede de proteção.
 *
 * ⚠ **Ler `APARENCIA[tipo]` direto derrubava a página inteira.** O tipo que
 * não estivesse no mapa devolvia `undefined`, o destructure estourava, e o
 * ErrorBoundary trocava a tela toda por "Algo deu errado" — uma notificação
 * desconhecida apagava as outras cinquenta.
 *
 * Foi o que aconteceu: o backend ganhou `solicitacao_projeto`,
 * `reajuste_solicitado` e `reajuste_respondido`, o `TipoNotificacao` do front
 * não foi atualizado junto, e o `Record<>` deixou de cobrar as entradas.
 *
 * ⭐ O tipo completo, corrigido, impede a próxima omissão em tempo de
 * compilação. Este fallback cobre o que ele não alcança: o backend sobe antes
 * do front, e por alguns minutos manda um tipo que esta versão não conhece.
 * Aí a notificação aparece genérica, em vez de derrubar a central.
 */
function aparenciaDe(tipo: TipoNotificacao) {
  return (
    APARENCIA[tipo] ?? { icone: Bell, rotulo: "Aviso", alerta: false }
  );
}

/** A ordem dos chips: os 5 do briefing primeiro, na ordem em que ele os
 *  lista, e depois os três que vieram na sequência. Fixa e não derivada do que
 *  chegou, assim o filtro não muda de lugar a cada recarga. */
const ORDEM_FILTROS: TipoNotificacao[] = [
  "kickoff_pendente",
  "tarefa_vencida",
  "banca_nao_marcada",
  "projeto_sem_reuniao",
  "escalacao_banca",
  "banca_hoje",
  "banca_remarcada",
  "entrega_alterada",
  "alocado_em_projeto",
  "entrega_registrada",
  "solicitacao_projeto",
  "reajuste_solicitado",
  "reajuste_respondido",
  "troca_banca",
  "avaliacao_pendente",
  "descricao_coordenador_pendente",
  "lote_desempenho_aberto",
  "pdi_prazo_proximo",
  "pdi_prazo_vencido",
  "banca_aviso",
];

/** O filtro só oferece o que aquela pessoa é capaz de receber, sem isso, o
 *  consultor via chip pra tipo que nunca chega pra ele. Os tipos fora deste
 *  switch valem pra qualquer cargo (equipe + liderança, ou individual por
 *  participação em banca), então não entram aqui. */
function tipoVisivelPara(tipo: TipoNotificacao, usuario: Usuario | null): boolean {
  if (!usuario) return true;
  switch (tipo) {
    // Quem crava a banca e registra a reunião é sempre a
    // coordenação, o consultor nunca é o alvo individual, e só vira
    // liderança se também for diretor/gerente.
    case "banca_nao_marcada":
    case "projeto_sem_reuniao":
      return usuario.posicao !== "consultor";
    // Mentor pode ser coordenador, gerente ou diretor (2026-08-06); fora
    // isso, diretoria acompanha todo PDI. Só consultor nunca recebe.
    case "pdi_prazo_proximo":
    case "pdi_prazo_vencido":
      return usuario.posicao !== "consultor";
    default:
      return true;
  }
}

export function Notificacoes() {
  const { token, usuario } = useAuth();
  const { recarregar } = useNotificacoes();
  const navigate = useNavigate();

  const [itens, setItens] = useState<Notificacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  /** Seleção MÚLTIPLA: a pergunta é "quais eu quero ver", e ela raramente tem
   *  uma resposta só (kickoff + banca não marcada, por exemplo). Vazio = todos
   *  os tipos, que é o padrão de quem abre a tela sem intenção de filtrar. */
  const [tipos, setTipos] = useState<TipoNotificacao[]>([]);
  /** Independente dos tipos: dá para pedir "tarefas vencidas não lidas". */
  const [soNaoLidas, setSoNaoLidas] = useState(false);
  const [painelAberto, setPainelAberto] = useState(false);
  const painelRef = useRef<HTMLDivElement>(null);
  /** Contador de recarga: "Tentar de novo" e "marcar todas" incrementam, e o
   *  efeito reage. Assim nada chama setState de forma síncrona no corpo do
   *  efeito, é o que a regra `react-hooks/set-state-in-effect` cobra. */
  const [recarga, setRecarga] = useState(0);

  const recarregarLista = useCallback(() => setRecarga((n) => n + 1), []);

  useEffect(() => {
    // A flag evita gravar estado depois que a página já saiu de tela, sem
    // ela, sair no meio da requisição dispara warning de update em componente
    // desmontado.
    let vivo = true;
    getNotificacoes(token)
      .then((lista) => {
        if (!vivo) return;
        setItens(lista.itens);
        setErro(null);
      })
      .catch((e: Error) => vivo && setErro(e.message))
      .finally(() => vivo && setCarregando(false));
    return () => {
      vivo = false;
    };
  }, [token, recarga]);

  // Fechar clicando fora e no Esc. Sem os dois, um dropdown sem overlay fica
  // preso aberto e cobre a primeira notificação da lista.
  useEffect(() => {
    if (!painelAberto) return;
    function aoClicarFora(evento: MouseEvent) {
      if (!painelRef.current?.contains(evento.target as Node)) setPainelAberto(false);
    }
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") setPainelAberto(false);
    }
    document.addEventListener("mousedown", aoClicarFora);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("mousedown", aoClicarFora);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [painelAberto]);

  /** Quantas de cada tipo, o número vai ao lado de cada opção. Sem ele,
   *  filtrar vira tentativa e erro: a pessoa marca para descobrir se há algo
   *  ali. */
  const contagemPorTipo = useMemo(() => {
    const mapa = {} as Record<TipoNotificacao, number>;
    for (const item of itens) mapa[item.tipo] = (mapa[item.tipo] ?? 0) + 1;
    return mapa;
  }, [itens]);

  const visiveis = useMemo(
    () =>
      itens.filter((item) => {
        if (soNaoLidas && item.lida) return false;
        return tipos.length === 0 || tipos.includes(item.tipo);
      }),
    [itens, tipos, soNaoLidas],
  );

  function alternarTipo(tipo: TipoNotificacao) {
    setTipos((atuais) =>
      atuais.includes(tipo) ? atuais.filter((t) => t !== tipo) : [...atuais, tipo],
    );
  }

  function limparFiltros() {
    setTipos([]);
    setSoNaoLidas(false);
  }

  const semFiltro = tipos.length === 0 && !soNaoLidas;

  async function marcarUma(notificacao: Notificacao) {
    if (notificacao.lida) return;
    // Otimista: o clique precisa responder na hora. Se a chamada falhar, a
    // recarga do catch devolve o estado real do servidor.
    setItens((atuais) =>
      atuais.map((i) => (i.chave === notificacao.chave ? { ...i, lida: true } : i)),
    );
    try {
      await marcarNotificacaoLida(token, notificacao);
      recarregar();
    } catch {
      recarregarLista();
    }
  }

  async function marcarTodas() {
    try {
      await marcarTodasLidas(token);
    } finally {
      // Recarrega dos dois jeitos: mesmo com erro parcial, o servidor é quem
      // sabe o que ficou marcado.
      recarregarLista();
      recarregar();
    }
  }

  function abrir(notificacao: Notificacao) {
    void marcarUma(notificacao);
    if (notificacao.rota) navigate(notificacao.rota);
  }

  const naoLidas = itens.filter((i) => !i.lida).length;

  return (
    <PageStack>
      <PageHeaderRow>
        <PageHeaderText>
          <PageHeading>Notificações</PageHeading>
          <PageSubheading>
            {naoLidas > 0
              ? `${naoLidas} ${naoLidas === 1 ? "não lida" : "não lidas"}`
              : "Nada pendente de leitura"}
          </PageSubheading>
        </PageHeaderText>
        <PageButtonSm type="button" $variant="outline" onClick={marcarTodas} disabled={naoLidas === 0}>
          <CheckCheck size={14} />
          Marcar todas como lidas
        </PageButtonSm>
      </PageHeaderRow>

      <FiltroBar>
        {/* Estado de leitura: 2 opções exclusivas, segmentado deixa isso
            óbvio sem precisar de rótulo explicando. */}
        <SegGroup role="group" aria-label="Estado de leitura">
          <SegButton type="button" $ativo={!soNaoLidas} onClick={() => setSoNaoLidas(false)}>
            Todas
          </SegButton>
          <SegButton type="button" $ativo={soNaoLidas} onClick={() => setSoNaoLidas(true)}>
            Não lidas
          </SegButton>
        </SegGroup>

        {/* Tipo: 8 opções combináveis. Em dropdown porque cresce para BAIXO —
            oito chips numa linha quebravam e deixavam órfãos embaixo. */}
        <DropdownWrap ref={painelRef}>
          <DropdownBotao
            type="button"
            $ativo={tipos.length > 0}
            onClick={() => setPainelAberto((v) => !v)}
            aria-expanded={painelAberto}
            aria-haspopup="true"
          >
            <SlidersHorizontal size={14} />
            Tipo
            {tipos.length > 0 && <DropdownContagem>{tipos.length}</DropdownContagem>}
            <ChevronDown size={14} />
          </DropdownBotao>

          {painelAberto && (
            <DropdownPainel role="menu">
              {/* Todos os tipos aparecem sempre, mesmo zerados: esta lista é o
                  que informa QUAIS alertas existem. Mostrar só os que
                  chegaram faria o filtro sumir junto com o problema
                  resolvido. O que É filtrado por cargo é se aquele tipo
                  chega pra essa pessoa, ver `tipoVisivelPara`. */}
              {ORDEM_FILTROS.filter((tipo) => tipoVisivelPara(tipo, usuario)).map((tipo) => {
                const total = contagemPorTipo[tipo] ?? 0;
                const marcada = tipos.includes(tipo);
                return (
                  <OpcaoLinha
                    key={tipo}
                    type="button"
                    role="menuitemcheckbox"
                    aria-checked={marcada}
                    $vazio={total === 0}
                    onClick={() => alternarTipo(tipo)}
                  >
                    <OpcaoCaixa $marcada={marcada}>
                      {marcada && <Check size={11} strokeWidth={3} />}
                    </OpcaoCaixa>
                    <OpcaoTexto>{aparenciaDe(tipo).rotulo}</OpcaoTexto>
                    <OpcaoContagem>{total}</OpcaoContagem>
                  </OpcaoLinha>
                );
              })}
              <PainelRodape>
                <PainelLimpar
                  type="button"
                  onClick={() => setTipos([])}
                  disabled={tipos.length === 0}
                >
                  Limpar seleção
                </PainelLimpar>
              </PainelRodape>
            </DropdownPainel>
          )}
        </DropdownWrap>
      </FiltroBar>

      {carregando && <PageLoadingBlock />}

      {!carregando && erro && (
        <ErrorBlock>
          <ErrorText>{erro}</ErrorText>
          <PageButtonSm type="button" $variant="outline" onClick={recarregarLista}>
            Tentar de novo
          </PageButtonSm>
        </ErrorBlock>
      )}

      {!carregando && !erro && (
        <PageCard>
          <PageCardHeader>
            <PageCardTitle>
              {visiveis.length} {visiveis.length === 1 ? "notificação" : "notificações"}
            </PageCardTitle>
          </PageCardHeader>

          {visiveis.length === 0 ? (
            <VazioBloco>
              <EmptyText>
                <Bell size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />
                {/* Distinguir os dois casos importa: "não tenho nada" é uma
                    boa notícia; "meu filtro não pegou nada" é uma ação a
                    desfazer, e sem o botão a pessoa precisa clicar chip por
                    chip para voltar. */}
                {semFiltro
                  ? "Nenhuma notificação por aqui."
                  : "Nenhuma notificação com esses filtros."}
              </EmptyText>
              {!semFiltro && (
                <PageButtonSm type="button" $variant="outline" onClick={limparFiltros}>
                  Limpar filtros
                </PageButtonSm>
              )}
            </VazioBloco>
          ) : (
            <>
              <Lista>
                {visiveis.map((notificacao) => {
                  const { icone: Icone, alerta } = aparenciaDe(notificacao.tipo);
                  return (
                    <Item key={notificacao.chave} $lida={notificacao.lida}>
                      <ItemIcone $alerta={alerta}>
                        <Icone size={16} />
                      </ItemIcone>
                      <ItemCorpo>
                        <ItemTitulo type="button" onClick={() => abrir(notificacao)}>
                          {notificacao.titulo}
                        </ItemTitulo>
                        {notificacao.corpo && <ItemMeta>{notificacao.corpo}</ItemMeta>}
                        {/* O resumo da liderança aponta para o monitoramento,
                            que já mostra o detalhe item a item. */}
                        {notificacao.total !== null && (
                          <ItemMeta>Ver detalhe no monitoramento</ItemMeta>
                        )}
                      </ItemCorpo>
                      {!notificacao.lida && (
                        <ItemAcao type="button" onClick={() => void marcarUma(notificacao)}>
                          <CheckCheck size={13} />
                          Lida
                        </ItemAcao>
                      )}
                    </Item>
                  );
                })}
              </Lista>
              <NotaRodape>
                Marcar como lida só tira do contador, o alerta continua aqui até o problema ser
                resolvido (marcar o kickoff, concluir a tarefa, registrar a reunião).
              </NotaRodape>
            </>
          )}
        </PageCard>
      )}
    </PageStack>
  );
}
