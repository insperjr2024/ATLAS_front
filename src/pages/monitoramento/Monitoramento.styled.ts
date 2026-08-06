import styled from "styled-components";
import { Link as RouterLink, NavLink } from "react-router-dom";
import { theme } from "@/styles/theme";
import { PALETA } from "@/components/cronograma-pintado/cores";
import { DataTable as DataTableBase } from "../Bancas.styled";

export {
  PageHeaderRow,
  PageHeaderText,
  PageHeading,
  PageSubheading,
  FieldSelect,
  TableHead,
  TableHeadCell,
  TableBody,
  TableRow,
  TableCell,
  NameCell,
} from "../Bancas.styled";

/**
 * A tabela das abas, um degrau acima da `DataTable` genérica.
 *
 * O cabeçalho vira caixa alta pequena para sair da frente dos números — numa
 * tela de monitoramento o dado é o assunto, o rótulo é só referência. E a
 * linha ganha realce no hover: são tabelas em que a pessoa percorre a linha
 * inteira da esquerda para a direita, e sem realce o olho pula de linha no
 * meio do caminho.
 */
export const DataTable = styled(DataTableBase)`
  th {
    font-size: ${theme.fontSize.xs};
    text-transform: uppercase;
    letter-spacing: 0.04em;
    white-space: nowrap;
  }

  tbody tr {
    transition: background ${theme.transitions.fast};
  }

  tbody tr:hover {
    background: ${theme.alpha(theme.colors.foreground, 0.035)};
  }

  @media (prefers-reduced-motion: reduce) {
    tbody tr {
      transition: none;
    }
  }
`;

/**
 * As tabelas largas (Execução tem 7 colunas) rolam na horizontal em vez de
 * espremer as colunas até o texto quebrar em cada célula. O `min-width` é o
 * ponto em que a tabela ainda é legível; abaixo dele, rolar é melhor do que
 * encolher.
 */
export const TabelaRolagem = styled.div<{ $min?: string }>`
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  table {
    min-width: ${({ $min = "38rem" }) => $min};
  }
`;

/**
 * As abas do §7 como controle segmentado, não como sublinhado.
 *
 * São 4 recortes da MESMA população de projetos, e o segmentado diz isso: um
 * trilho, uma peça acesa por vez. O sublinhado antigo lia como 4 links soltos
 * e sumia contra o resto da página, que também é branco sobre branco.
 *
 * `inline-flex` de propósito — a barra abraça o conteúdo em vez de esticar
 * quatro pílulas gigantes num monitor largo.
 */
export const TabBar = styled.nav`
  display: inline-flex;
  align-self: flex-start;
  max-width: 100%;
  gap: 0.125rem;
  padding: 0.25rem;
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.muted};
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

export const TabLink = styled(NavLink)`
  flex-shrink: 0;
  padding: 0.375rem 0.875rem;
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.mutedForeground};
  text-decoration: none;
  white-space: nowrap;
  transition: background ${theme.transitions.fast}, color ${theme.transitions.fast};

  &:hover:not(.active) {
    color: ${theme.colors.foreground};
    background: ${theme.alpha(theme.colors.background, 0.7)};
  }

  &.active {
    color: ${theme.colors.primary};
    background: ${theme.colors.card};
    box-shadow: ${theme.shadows.sm};
  }

  &:focus-visible {
    outline: 2px solid ${theme.colors.ring};
    outline-offset: 1px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

/**
 * O link para a página do projeto, em todas as abas.
 *
 * O sublinhado é PERMANENTE, não só no hover: numa tabela densa quem passa o
 * olho não descobre que a linha é clicável sem antes acertar o mouse nela. A
 * espessura fica baixa para o sublinhado não competir com os números, que são
 * o assunto da tela.
 *
 * **Em repouso o link é NEUTRO, não vermelho.** O `primary` é o mesmo vermelho
 * da rampa de severidade, e na aba de Atrasos isso empilhava três vermelhos na
 * mesma linha — o bloco de dias, o nome do projeto e a tag do motivo — sem que
 * dois deles quisessem dizer "urgente". Quando tudo é vermelho, nada é: o olho
 * perde justamente o único que carrega gravidade. Aqui o vermelho fica
 * reservado para SIGNIFICADO (severidade, alerta); a pista de que isto é um
 * link é o sublinhado, que já era permanente por decisão anterior. O hover
 * traz o vermelho de volta como resposta à interação, onde ele não compete com
 * a leitura de relance.
 */
export const LinkProjeto = styled(RouterLink)`
  color: ${theme.colors.foreground};
  font-weight: ${theme.fontWeight.medium};
  text-decoration: underline;
  text-decoration-color: ${theme.alpha(theme.colors.foreground, 0.3)};
  text-decoration-thickness: 1px;
  text-underline-offset: 0.15em;
  border-radius: ${theme.borderRadius.sm};
  transition: color ${theme.transitions.fast}, text-decoration-color ${theme.transitions.fast};

  &:hover {
    color: ${theme.colors.primary};
    text-decoration-color: currentColor;
  }

  &:focus-visible {
    outline: 2px solid ${theme.colors.ring};
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
  gap: ${theme.spacing.md};
`;

export const KpiCard = styled.div<{ $destaque?: "alerta" | "ok" }>`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.xl};
  border: 1px solid
    ${({ $destaque }) =>
      $destaque === "alerta"
        ? `color-mix(in srgb, ${theme.colors.destructive} 35%, transparent)`
        : theme.colors.border};
  /* O card em alerta recebe um véu da própria cor. Só a borda vermelha some
     no meio de cinco cards iguais; o fundo é o que faz o olho parar nele. */
  background: ${({ $destaque }) =>
    $destaque === "alerta"
      ? `color-mix(in srgb, ${theme.colors.destructive} 4%, ${theme.colors.card})`
      : theme.colors.card};
  box-shadow: ${theme.shadows.sm};
`;

export const KpiValor = styled.strong<{ $destaque?: "alerta" | "ok" }>`
  font-size: ${theme.fontSize["2xl"]};
  font-weight: ${theme.fontWeight.bold};
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  line-height: 1.1;
  color: ${({ $destaque }) =>
    $destaque === "alerta"
      ? theme.colors.destructive
      : $destaque === "ok"
        ? theme.colors.success
        : theme.colors.foreground};
`;

export const KpiRotulo = styled.span`
  font-size: ${theme.fontSize.xs};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${theme.colors.mutedForeground};
`;

/**
 * Esmaece o conteúdo enquanto a semana nova carrega.
 *
 * Os dados anteriores continuam na tela de propósito — trocar tudo por um
 * esqueleto desmonta a tabela e o navegador perde a posição do scroll, jogando
 * a pessoa de volta ao topo a cada clique. Mas sem NENHUM sinal o clique
 * parece não ter funcionado até os números trocarem; o esmaecido preenche esse
 * intervalo.
 */
export const ConteudoCarregando = styled.div<{ $carregando: boolean }>`
  opacity: ${({ $carregando }) => ($carregando ? 0.55 : 1)};
  transition: opacity ${theme.transitions.fast};

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

/** Os botões de semana anterior / hoje / próxima, no cabeçalho do card. */
export const NavegacaoSemana = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-shrink: 0;
`;

/**
 * Marca a coluna cujo valor é de HOJE, mesmo olhando uma semana passada.
 *
 * `total`, `ativas` e `ultima_movimentacao` dependem da coluna em que a tarefa
 * está agora — reconstruir o passado exigiria histórico de movimentação entre
 * colunas, que o sistema não guarda (`tarefa.movida_em` é só o carimbo da
 * última mudança). Sem a marcação, a linha mistura passado e presente em
 * silêncio: alguém lê "não distribuiu naquela semana, mas tem 5 ativas" e tira
 * a conclusão errada.
 */
export const ValorDeHoje = styled.span`
  color: ${theme.colors.mutedForeground};

  &::after {
    content: "hoje";
    margin-left: 0.3rem;
    padding: 0.05rem 0.3rem;
    border-radius: ${theme.borderRadius.sm};
    border: 1px dashed ${theme.colors.border};
    font-size: ${theme.fontSize.xs};
    white-space: nowrap;
  }
`;

/** A linha fina embaixo de um KPI, quando o número sozinho não se explica
 *  (ex.: "12/15 com bancas em dia" sob o placar da gestão). */
export const KpiNota = styled.span`
  font-size: ${theme.fontSize.xs};
  line-height: 1.35;
  color: ${theme.colors.mutedForeground};
`;

export const PainelGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${theme.spacing.lg};

  @media (min-width: ${theme.breakpoints.lg}px) {
    grid-template-columns: 1fr 1fr;
  }
`;

export const ListaSimples = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const ItemLista = styled.li`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${theme.spacing.sm};
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.foreground};

  small {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    font-size: ${theme.fontSize.xs};
    color: ${theme.colors.mutedForeground};
    white-space: nowrap;
  }
`;

/**
 * Rampa de severidade.
 *
 * O `theme.colors.destructive` é a MESMA cor do `primary`, o vermelho
 * institucional. Usar só ele para atraso faz o urgente se confundir com a
 * navegação e os links, e nada se destaca. A rampa abaixo abre âmbar → vermelho
 * profundo para que a gravidade seja legível pela cor, e não só pelo número.
 * Em OKLCH porque a luminosidade fica perceptualmente uniforme entre os três
 * degraus, coisa que HSL não garante.
 */
export const SEVERIDADE = {
  leve: "oklch(0.75 0.15 75)",
  media: "oklch(0.65 0.19 45)",
  critica: "oklch(0.55 0.21 25)",
} as const;

export type NivelSeveridade = keyof typeof SEVERIDADE;

/**
 * A mesma rampa, escurecida para uso em TEXTO.
 *
 * As cores acima foram escolhidas para PREENCHIMENTO — ponto de legenda, barra,
 * fundo tingido — onde a área é grande e a saturação é o que identifica o
 * degrau. Como texto elas reprovam em contraste: o `leve` fica perto de 2:1
 * sobre branco, quando o mínimo é 4.5:1, e some para quem lê em tela clara.
 *
 * Descer a luminosidade para a faixa 0.48–0.55 preserva a identidade de matiz
 * (âmbar → laranja → vermelho) e devolve a legibilidade. É o mesmo raciocínio
 * já aplicado no `TEXTO_PILULA.atencao`, que escurece o warning pelo mesmo
 * motivo.
 */
export const SEVERIDADE_TEXTO: Record<NivelSeveridade, string> = {
  leve: "oklch(0.55 0.13 75)",
  media: "oklch(0.52 0.17 45)",
  critica: "oklch(0.48 0.19 25)",
};

/** Cor sozinha não é informação: quem não distingue âmbar de vermelho fica sem
 *  a escala. A legenda escreve o corte de cada degrau uma vez, no cabeçalho da
 *  seção, e aí os pontos coloridos da lista passam a significar algo. */
export const Legenda = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem ${theme.spacing.md};
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
`;

export const LegendaItem = styled.li<{ $nivel: NivelSeveridade }>`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  white-space: nowrap;

  &::before {
    content: "";
    width: 0.5rem;
    height: 0.5rem;
    border-radius: ${theme.borderRadius.full};
    background: ${({ $nivel }) => SEVERIDADE[$nivel]};
  }
`;

/** §7.1: cada item traz o MOTIVO e há quanto tempo — nunca rótulo genérico.
 *
 * O marcador é um ponto, não uma barra lateral: a faixa colorida à esquerda
 * pinta a linha inteira de urgência e, numa lista com 15 itens, tudo grita
 * igual. O ponto marca sem tingir, e a cor dele carrega a gravidade. */
export const ItemAtencao = styled.li<{ $nivel?: NivelSeveridade }>`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.5rem 0 0.5rem 1.125rem;

  & + & {
    border-top: 1px solid ${theme.colors.border};
  }

  &::before {
    content: "";
    position: absolute;
    left: 0.25rem;
    top: 0.95rem;
    width: 0.4rem;
    height: 0.4rem;
    border-radius: ${theme.borderRadius.full};
    background: ${({ $nivel }) => SEVERIDADE[$nivel ?? "media"]};
  }

  strong {
    font-size: ${theme.fontSize.sm};
    font-weight: ${theme.fontWeight.medium};
  }

  span {
    font-size: ${theme.fontSize.xs};
    color: ${theme.colors.mutedForeground};
  }
`;

/** A tendência de entregas — barras simples, sem lib de gráfico nova. */
export const GraficoTendencia = styled.div`
  margin-top: ${theme.spacing.md};
  padding-top: ${theme.spacing.md};
  border-top: 1px solid ${theme.colors.border};
`;

export const Sparkline = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 0.25rem;
  height: 3.5rem;
  padding-top: ${theme.spacing.sm};
`;

/** A coluna inteira é a área de hover, não a barra. Uma barra de 2px de altura
 *  numa semana sem entrega praticamente não recebe o mouse, e aí o `title` com
 *  o total nunca aparece justamente na semana que interessa explicar. */
export const SparkColuna = styled.div`
  flex: 1;
  display: flex;
  align-items: flex-end;
  height: 100%;
  border-radius: ${theme.borderRadius.sm};

  &:hover > div {
    background: color-mix(in srgb, ${theme.colors.success} 80%, black);
  }
`;

export const SparkBarra = styled.div<{ $altura: number }>`
  width: 100%;
  min-height: 2px;
  height: ${({ $altura }) => Math.max(2, $altura)}%;
  border-radius: ${theme.borderRadius.sm} ${theme.borderRadius.sm} 0 0;
  background: ${theme.colors.success};
  transition: background ${theme.transitions.fast};

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const SparkRotulos = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 0.35rem;
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
`;

/** `atencao` (âmbar) fica entre `ok` e `alerta`: sinaliza o que merece olhada
 *  sem ser falha — um quadro zerado, por exemplo, não é o mesmo problema que
 *  um projeto que nunca recebeu tarefa. */
export type TomPilula = "ok" | "alerta" | "atencao" | "neutro";

/* As porcentagens acompanham o `PageBadge` de `page.styled.ts`, que é o badge
   padrão do sistema: 14% para success/destructive, 20% para warning. Antes eram
   12% e 18% aqui, sem motivo — duas famílias de pílula quase iguais na mesma
   tela é o tipo de diferença que ninguém nota e todo mundo sente. */
const FUNDO_PILULA: Record<TomPilula, string> = {
  ok: `color-mix(in srgb, ${theme.colors.success} 14%, white)`,
  alerta: `color-mix(in srgb, ${theme.colors.destructive} 14%, white)`,
  atencao: `color-mix(in srgb, ${theme.colors.warning} 20%, white)`,
  neutro: theme.colors.muted,
};

const TEXTO_PILULA: Record<TomPilula, string> = {
  ok: theme.colors.success,
  alerta: theme.colors.destructive,
  // O warning puro não passa contraste sobre fundo claro; escurecer só o
  // texto mantém a leitura acessível sem perder o âmbar do fundo.
  atencao: `color-mix(in srgb, ${theme.colors.warning} 70%, black)`,
  neutro: theme.colors.mutedForeground,
};

export const Pilula = styled.span<{ $tom: TomPilula }>`
  display: inline-flex;
  align-items: center;
  padding: 0.1rem 0.5rem;
  border-radius: ${theme.borderRadius.full};
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
  line-height: 1.4;
  white-space: nowrap;
  background: ${({ $tom }) => FUNDO_PILULA[$tom]};
  color: ${({ $tom }) => TEXTO_PILULA[$tom]};
`;

/** A célula que carrega o número de dias úteis. `tabular-nums` alinha os
 *  dígitos na vertical, que é o que faz a coluna ser lida de relance. */
export const CelulaDias = styled.span<{ $tom?: TomPilula }>`
  font-variant-numeric: tabular-nums;
  font-weight: ${({ $tom }) =>
    $tom && $tom !== "neutro" ? theme.fontWeight.semibold : theme.fontWeight.normal};
  color: ${({ $tom }) => ($tom ? TEXTO_PILULA[$tom] : theme.colors.foreground)};
  white-space: nowrap;

  small {
    margin-left: 0.25rem;
    font-weight: ${theme.fontWeight.normal};
    font-size: ${theme.fontSize.xs};
    color: ${theme.colors.mutedForeground};
  }
`;

/** O travessão de "não se aplica". Era um `EmptyText`, que é `<p>` — dentro de
 *  `<td>` isso rendia um bloco com margem própria e desalinhava a linha. */
export const SemDado = styled.span`
  color: ${theme.colors.mutedForeground};
`;

export const FrenteTravadaAviso = styled.span`
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
`;

/* ─── Faixa de números ────────────────────────────────────────────────────
   Usada por Atrasos, Execução e Alocação. São recortes da MESMA população de
   projetos, então precisam ser lidos lado a lado: uma faixa contínua, dividida
   por filetes, e não uma grade de cards — cards sugeririam assuntos
   independentes. O filete sai do `gap: 1px` sobre o fundo da borda, que é o
   único jeito de a divisória continuar certa quando a faixa quebra em duas
   linhas no celular. */

export const FaixaResumo = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(8.5rem, 1fr));
  gap: 1px;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.xl};
  background: ${theme.colors.border};
  box-shadow: ${theme.shadows.sm};
  overflow: hidden;
`;

export const ResumoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  background: ${theme.colors.card};
`;

export const ResumoValor = styled.strong<{ $nivel?: NivelSeveridade }>`
  font-size: ${theme.fontSize["3xl"]};
  font-weight: ${theme.fontWeight.bold};
  line-height: 1.05;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  color: ${({ $nivel }) => ($nivel ? SEVERIDADE[$nivel] : theme.colors.foreground)};

  small {
    margin-left: 0.2rem;
    font-size: ${theme.fontSize.sm};
    font-weight: ${theme.fontWeight.medium};
    letter-spacing: 0;
    color: ${theme.colors.mutedForeground};
  }
`;

export const ResumoRotulo = styled.span`
  font-size: ${theme.fontSize.xs};
  line-height: 1.35;
  color: ${theme.colors.mutedForeground};
`;

/* ─── Atrasos (§7.4) ──────────────────────────────────────────────────────
   A régua desta seção é UMA: dias. Por isso ela não vira grade de cards —
   linhas ranqueadas, todas medidas contra o mesmo máximo. Card por projeto
   quebraria justamente a comparação que a diretoria precisa fazer de
   relance. */

export const LinhaAtraso = styled.li`
  display: grid;
  grid-template-columns: 3.75rem 1fr;
  align-items: start;
  gap: 0 ${theme.spacing.md};
  padding: 0.625rem 0.5rem;
  margin: 0 -0.5rem;
  border-radius: ${theme.borderRadius.lg};
  transition: background ${theme.transitions.fast};

  &:hover {
    background: ${theme.alpha(theme.colors.foreground, 0.03)};
  }

  & + & {
    border-top: 1px solid ${theme.colors.border};
    border-top-left-radius: 0;
    border-top-right-radius: 0;
  }

  @media (max-width: ${theme.breakpoints.sm}px) {
    grid-template-columns: 1fr;
    gap: ${theme.spacing.xs};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

/** O número vem primeiro e grande: é o que ordena a lista e o que a diretoria
 *  lê antes do nome do projeto. Vai dentro de um bloco tingido da própria
 *  gravidade — o texto colorido sozinho, em corpo grande, fica lavado sobre
 *  branco, e o bloco também dá à coluna uma largura fixa contra a qual os
 *  dígitos se alinham.
 *
 *  `$externo` desliga a cor de gravidade. O §7.4 é explícito que a agenda do
 *  cliente não pesa contra o time; um projeto atrasado SÓ por isso pintado de
 *  vermelho cobra do coordenador o que não é dele. O bloco fica cinza e o
 *  motivo, logo ao lado, diz de quem é a espera. */
export const AtrasoDias = styled.div<{ $nivel: NivelSeveridade; $externo?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.1rem;
  padding: 0.3rem 0.25rem;
  border-radius: ${theme.borderRadius.lg};
  line-height: 1;
  color: ${({ $nivel, $externo }) =>
    $externo ? theme.colors.mutedForeground : SEVERIDADE[$nivel]};
  background: ${({ $nivel, $externo }) =>
    $externo
      ? theme.colors.muted
      : `color-mix(in srgb, ${SEVERIDADE[$nivel]} 12%, transparent)`};

  strong {
    font-size: ${theme.fontSize.xl};
    font-weight: ${theme.fontWeight.bold};
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
  }

  /* Sem caixa alta: o §4.5 reserva uppercase para label de CATEGORIZAÇÃO, e
     "dias" é unidade de medida, não categoria. Em caixa baixa também cabe na
     coluna de 3.75rem sem quebrar em duas linhas. */
  span {
    font-size: ${theme.fontSize.xs};
    color: ${theme.colors.mutedForeground};
  }

  @media (max-width: ${theme.breakpoints.sm}px) {
    flex-direction: row;
    align-items: baseline;
    justify-content: flex-start;
    gap: 0.3rem;
    padding: 0.2rem 0.5rem;
    align-self: flex-start;
  }
`;

export const AtrasoCorpo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
`;

export const AtrasoTitulo = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${theme.spacing.sm};
  font-size: ${theme.fontSize.sm};
`;

export const MotivoLista = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const MotivoItem = styled.li`
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.4rem;
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
`;

/** A data que venceu. Entra em `tabular-nums` e um pouco mais escura que o
 *  resto do motivo porque é o dado acionável da linha: com ela a diretoria
 *  cruza o atraso com o que mais aconteceu naquela semana. */
export const MotivoData = styled.span`
  font-variant-numeric: tabular-nums;
  color: ${theme.colors.foreground};
`;

/** Os dias DESTE motivo.
 *
 *  O número grande da linha é a SOMA de todos os motivos do projeto (é assim
 *  que o backend ordena a lista), e soma não é duração: três escopos com 4
 *  dias cada viram "12" e leem como um atraso de 12 dias, que não existe. Com
 *  o valor de cada motivo à vista a composição fica explícita e ninguém
 *  precisa deduzir. */
export const MotivoDias = styled.span<{ $nivel: NivelSeveridade; $externo?: boolean }>`
  font-variant-numeric: tabular-nums;
  font-weight: ${theme.fontWeight.medium};
  white-space: nowrap;
  color: ${({ $nivel, $externo }) =>
    $externo ? theme.colors.mutedForeground : SEVERIDADE_TEXTO[$nivel]};
`;

/** Distingue o atraso do TIME (banca, entrega interna) do que veio da agenda
 *  do cliente. O §7.4 é explícito que o externo não pode pesar contra o time,
 *  então ele não pode ter o mesmo peso visual.
 *
 *  A tag diz QUE TIPO de marco venceu — banca, entrega, agenda do cliente. É
 *  categoria, não gravidade, e por isso saiu da rampa de severidade: antes ela
 *  vinha em `SEVERIDADE.critica` fixo, o que pintava de vermelho-crítico a tag
 *  de uma banca atrasada há 2 dias. Quem carrega a gravidade do motivo é o
 *  `MotivoDias` ao lado, que reage ao número de verdade. O contraste
 *  interno/externo continua, agora por preenchimento: o do time tem fundo, o
 *  do cliente é só contorno. */
export const MotivoTag = styled.span<{ $externo?: boolean }>`
  flex-shrink: 0;
  padding: 0.05rem 0.4rem;
  border-radius: ${theme.borderRadius.sm};
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: 1px solid ${theme.colors.border};
  background: ${({ $externo }) => ($externo ? "transparent" : theme.colors.muted)};
  color: ${({ $externo }) =>
    $externo ? theme.colors.mutedForeground : theme.colors.foreground};
`;

/** Barra dentro da célula da tabela — a coluna vira comparação visual sem
 *  virar um gráfico separado. O número fica ANTES da barra, com largura fixa,
 *  para que todas as barras comecem no mesmo x; é isso que torna os
 *  comprimentos comparáveis de uma linha para a outra. */
export const BarraCelula = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  min-width: 8rem;

  strong {
    font-variant-numeric: tabular-nums;
    font-weight: ${theme.fontWeight.semibold};
    min-width: 1.75rem;
    text-align: right;
  }
`;

export const BarraCelulaTrilho = styled.div`
  flex: 1;
  height: 0.45rem;
  border-radius: ${theme.borderRadius.full};
  background: ${theme.colors.muted};
  overflow: hidden;
`;

/** O piso é 2px, não uma porcentagem: um mínimo de 3% faz um caso de 1 dia
 *  desenhar o mesmo traço que um de 5, e a barra passa a mentir na faixa em
 *  que a diferença ainda importa. */
export const BarraCelulaPreenchida = styled.div<{ $pct: number; $nivel: NivelSeveridade }>`
  height: 100%;
  min-width: 2px;
  width: ${({ $pct }) => Math.max(0, Math.min(100, $pct))}%;
  border-radius: inherit;
  background: ${({ $nivel }) => SEVERIDADE[$nivel]};
`;

/** Nada atrasado é uma notícia boa e a tela precisa dizer isso com clareza,
 *  em vez de devolver a mesma frase cinza de "lista vazia". */
export const EstadoLimpo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: ${theme.spacing.xl} ${theme.spacing.md};
  text-align: center;

  strong {
    font-size: ${theme.fontSize.base};
    font-weight: ${theme.fontWeight.semibold};
    color: ${theme.colors.foreground};
  }

  span {
    font-size: ${theme.fontSize.sm};
    color: ${theme.colors.mutedForeground};
    max-width: 34ch;
  }
`;

export const EstadoLimpoIcone = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  margin-bottom: 0.15rem;
  border-radius: ${theme.borderRadius.full};
  background: color-mix(in srgb, ${theme.colors.success} 12%, transparent);
  color: ${theme.colors.success};

  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`;

export const NotaRodape = styled.p`
  margin: ${theme.spacing.md} 0 0;
  padding-top: ${theme.spacing.sm};
  border-top: 1px solid ${theme.colors.border};
  font-size: ${theme.fontSize.xs};
  line-height: 1.5;
  color: ${theme.colors.mutedForeground};
  max-width: 70ch;
`;

/* ─── Alocação (§7.3) ─────────────────────────────────────────────────────
   A carga de uma pessoa só significa alguma coisa contra a das outras: 4
   projetos é muito ou pouco depende de quantos os colegas carregam. Por isso
   a coluna vira barra, medida contra o maior da tabela. */

/* ─── Card "com demanda alta" (§7.3) ──────────────────────────────────────
   Duas colunas lado a lado — coordenadores e consultores — porque as escalas
   são diferentes por papel e comparar um com o outro não faz sentido. Em tela
   estreita empilha. */

export const DemandaAltaGrupo = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${theme.spacing.lg};

  @media (min-width: ${theme.breakpoints.md}px) {
    grid-template-columns: 1fr 1fr;
  }
`;

export const DemandaAltaTitulo = styled.h3`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  margin: 0 0 ${theme.spacing.sm};
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.semibold};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${theme.colors.mutedForeground};

  /* Uma linha fina puxando o título até a borda da coluna: separa os dois
     papéis sem precisar de moldura, que engordaria o card. */
  &::after {
    content: "";
    flex: 1;
    height: 1px;
    background: ${theme.colors.border};
  }
`;

export const DemandaAltaLista = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xs};
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const DemandaAltaPessoa = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing.md};
  padding: 0.4rem 0.625rem;
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.muted};
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.foreground};

  /* O nome pode ser longo e não pode empurrar a contagem para fora: ele
     encolhe e trunca, a contagem nunca. */
  strong {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: ${theme.fontWeight.medium};
  }
`;

/** Os projetos da pessoa, listados abaixo do nome dela no card.
 *
 *  Saber QUAIS projetos é o que torna o card acionável: "Ana está com 4"
 *  sozinho não diz de onde tirar carga. */
export const DemandaAltaProjetos = styled.span`
  display: block;
  margin-top: 0.15rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.normal};
  color: ${theme.colors.mutedForeground};
`;

export const ChipsProjetos = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  min-width: 12rem;
`;

/** O chip virou link quando o projeto passou a chegar com id — a tabela dizia
 *  em quais projetos a pessoa está e não deixava abrir nenhum deles. */
export const ChipProjeto = styled(RouterLink)`
  padding: 0.05rem 0.45rem;
  border-radius: ${theme.borderRadius.sm};
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.muted};
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.foreground};
  white-space: nowrap;
  text-decoration: none;

  &:hover {
    border-color: ${theme.colors.primary};
    color: ${theme.colors.primary};
  }

  &:focus-visible {
    outline: 2px solid ${theme.colors.ring};
    outline-offset: 2px;
  }
`;

export const BarraCarga = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  min-width: 7rem;

  strong {
    font-variant-numeric: tabular-nums;
    font-weight: ${theme.fontWeight.semibold};
    min-width: 1rem;
    text-align: right;
  }
`;

export const BarraCargaPreenchida = styled.div<{ $pct: number; $alta: boolean }>`
  height: 0.45rem;
  min-width: 2px;
  width: ${({ $pct }) => Math.max(0, Math.min(100, $pct))}%;
  border-radius: ${theme.borderRadius.full};
  background: ${({ $alta }) => ($alta ? theme.colors.destructive : theme.colors.mutedForeground)};
`;

export const BarraCargaTrilho = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  height: 0.45rem;
  border-radius: ${theme.borderRadius.full};
  background: ${theme.colors.muted};
  overflow: hidden;
`;

export const AvisoSomenteLeitura = styled.p`
  margin: 0;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.mutedForeground};
`;

/* ------------------------------------------------------------------ */
/* Board macro de tarefas — swimlanes por projeto (§7)                 */
/* ------------------------------------------------------------------ */

/**
 * Uma grade só (cabeçalho + uma linha por projeto), não um `Board` por
 * projeto: é o que deixa a coluna "Validação" do projeto A alinhada com a
 * "Validação" do projeto B, faixa embaixo da outra.
 */
export const SwimGrid = styled.div<{ $colunas: number }>`
  display: grid;
  grid-template-columns: 10rem repeat(${({ $colunas }) => Math.max(1, $colunas)}, minmax(11rem, 1fr));
  gap: ${theme.spacing.sm};
  overflow-x: auto;
  padding-bottom: ${theme.spacing.sm};
  align-items: start;

  scrollbar-width: thin;
  scrollbar-color: ${theme.colors.border} transparent;

  &::-webkit-scrollbar {
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: ${theme.colors.border};
    border-radius: ${theme.borderRadius.full};
  }

  &::-webkit-scrollbar-thumb:hover {
    background: ${theme.colors.mutedForeground};
  }
`;

export const SwimHeaderCell = styled.div`
  display: flex;
  align-items: center;
`;

/**
 * A etiqueta do projeto — gruda na esquerda ao rolar pro lado, senão some a
 * única pista de qual linha é qual assim que a coluna A fazer sai da tela.
 *
 * `$cor` é a identidade fixa do projeto: uma barra fininha que não muda
 * mesmo se a ordem das linhas mudar ou a etiqueta sair da tela ao rolar.
 */
export const SwimLabelCell = styled.div<{ $cor?: string }>`
  position: sticky;
  left: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  padding: ${theme.spacing.sm};
  padding-left: 1rem;
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid transparent;
  background: ${theme.colors.muted};
  cursor: pointer;
  transition: border-color ${theme.transitions.fast}, box-shadow ${theme.transitions.fast};

  &::before {
    content: "";
    position: absolute;
    left: 0.375rem;
    top: 0.375rem;
    bottom: 0.375rem;
    width: 3px;
    border-radius: ${theme.borderRadius.full};
    background: ${({ $cor }) => $cor ?? "transparent"};
  }

  &:hover {
    border-color: ${theme.colors.ring};
    box-shadow: ${theme.shadows.md};
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px color-mix(in srgb, ${theme.colors.ring} 30%, transparent);
  }
`;

export const SwimLabelNome = styled.span`
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.foreground};
`;

export const SwimLabelCliente = styled.span`
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
`;

export const SwimCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
  min-height: 3.5rem;
  padding: ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.background};
`;

export const SwimCellVazia = styled.p`
  margin: 0;
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
  text-align: center;
`;

/* ─── Gráficos (§7.1 e §7.3) ──────────────────────────────────────────────── */

/**
 * A cor de cada etapa do ciclo, na pizza da Visão geral.
 *
 * ⭐ **Sai da `PALETA` do cronograma, não de uma rampa própria.** Aquela paleta
 * já resolve o mesmo problema — dar cor a etapa — e já foi calibrada: 8 matizes
 * com a MESMA saturação e a MESMA luminosidade, só a matiz girando. É isso que
 * mantém as fatias com o mesmo peso visual; numa paleta ingênua o amarelo pula
 * à frente do azul e a fatia mais chamativa passa a ser a de cor mais clara, e
 * não a maior — que é a leitura que a pizza precisa entregar.
 *
 * Herda de graça a regra que o docstring de `cores.ts` defende: cor de etapa
 * não encosta na semântica de status do design system, então nenhuma fatia
 * pode ser lida como "tudo bem" ou "atrasado" por causa do tom.
 *
 * Uso `amostra`, o tom saturado — é o mesmo papel que ele tem lá: identificar a
 * etapa numa legenda. `fundo` é pálido demais para fatia.
 *
 * O índice é fixo por status, e não pela ordem de chegada: "Em andamento" tem
 * que ser a mesma cor toda vez que a tela abre.
 *
 * ⚠ Cor sozinha não é informação: a legenda escreve nome e número de cada
 * etapa, então quem não distingue os matizes continua lendo o gráfico inteiro.
 */
export const COR_ETAPA: Record<string, string> = Object.fromEntries(
  [
    "vendido",
    "ambientacao",
    "em_andamento",
    "validacao_bancas",
    "envio_tep",
    "periodo_ajustes",
  ].map((status, i) => [status, PALETA[i].amostra]),
);

/** O container do gráfico. Altura fixa porque o `ResponsiveContainer` do
 *  recharts mede o pai — em altura `auto` ele calcula 0 e o gráfico some. */
export const CaixaGrafico = styled.div<{ $altura?: string }>`
  width: 100%;
  height: ${({ $altura }) => $altura ?? "16rem"};

  /* O recharts injeta um <svg> com foco próprio; sem isto o anel de foco fica
     cortado pela borda do card ao navegar por teclado. */
  svg:focus-visible {
    outline: 2px solid ${theme.colors.primary};
    outline-offset: 2px;
  }
`;

/** O miolo do donut. Vive fora do SVG, sobreposto, porque texto em `<text>`
 *  do recharts não herda a tipografia do tema nem quebra em duas linhas. */
export const MioloDonut = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;

  strong {
    font-size: ${theme.fontSize["2xl"]};
    font-weight: ${theme.fontWeight.semibold};
    line-height: 1.1;
    color: ${theme.colors.foreground};
  }

  span {
    font-size: ${theme.fontSize.xs};
    color: ${theme.colors.mutedForeground};
  }
`;

export const EnvolveDonut = styled.div`
  position: relative;
`;

/** A legenda da pizza. Cada item é um botão: clicar seleciona a etapa, igual a
 *  clicar na fatia. A fatia é alvo pequeno e difícil de acertar no celular —
 *  sem a legenda clicável, o recurso não existe em tela estreita. */
export const LegendaEtapas = styled.ul`
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.15rem;
  margin: ${theme.spacing.md} 0 0;
  padding: 0;
  list-style: none;

  @media (min-width: ${theme.breakpoints.sm}px) {
    grid-template-columns: 1fr 1fr;
  }
`;

export const ItemLegendaEtapa = styled.li<{ $ativo: boolean; $vazio: boolean }>`
  button {
    display: flex;
    align-items: center;
    gap: ${theme.spacing.sm};
    width: 100%;
    padding: 0.25rem 0.4rem;
    border: none;
    border-radius: ${theme.borderRadius.sm};
    background: ${({ $ativo }) => ($ativo ? theme.colors.muted : "transparent")};
    font-size: ${theme.fontSize.sm};
    text-align: left;
    cursor: pointer;

    /* Etapa vazia continua na lista — some faria parecer que ela não existe —
       mas recuada, para não competir com as que têm projeto. */
    color: ${({ $vazio }) =>
      $vazio ? theme.colors.mutedForeground : theme.colors.foreground};

    &:hover {
      background: ${theme.colors.muted};
    }

    &:focus-visible {
      outline: 2px solid ${theme.colors.primary};
      outline-offset: -2px;
    }
  }

  /* O número encosta na direita para a coluna ser lida na vertical. */
  b {
    margin-left: auto;
    font-variant-numeric: tabular-nums;
    font-weight: ${theme.fontWeight.medium};
  }
`;

export const PontoEtapa = styled.span<{ $cor: string }>`
  flex-shrink: 0;
  width: 0.6rem;
  height: 0.6rem;
  border-radius: ${theme.borderRadius.full};
  background: ${({ $cor }) => $cor};
`;

/** A barra de controles acima de um gráfico: toggle de papel, filtro de etapa
 *  e o rótulo de filtro ativo. Quebra em coluna no celular. */
export const ControlesGrafico = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${theme.spacing.sm};
  margin-bottom: ${theme.spacing.md};
`;

export const GrupoBotoes = styled.div`
  display: inline-flex;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  overflow: hidden;
`;

export const BotaoAlternativa = styled.button<{ $ativo: boolean }>`
  padding: 0.3rem 0.75rem;
  border: none;
  background: ${({ $ativo }) => ($ativo ? theme.colors.primary : "transparent")};
  color: ${({ $ativo }) =>
    $ativo ? theme.colors.primaryForeground : theme.colors.foreground};
  font-size: ${theme.fontSize.sm};
  font-weight: ${({ $ativo }) =>
    $ativo ? theme.fontWeight.medium : theme.fontWeight.normal};
  cursor: pointer;

  & + & {
    border-left: 1px solid ${theme.colors.border};
  }

  &:focus-visible {
    outline: 2px solid ${theme.colors.primary};
    outline-offset: -2px;
  }
`;

/** ⚠ O aviso de filtro ativo. Sem ele o gráfico mostra números menores que a
 *  tabela logo abaixo e parece bug — o filtro fica escondido num `select` que
 *  ninguém relê depois de escolher. */
export const FiltroAtivo = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.15rem 0.5rem;
  border-radius: ${theme.borderRadius.full};
  background: ${theme.colors.muted};
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
`;

/** O balão que aparece ao passar o mouse numa fatia: a etapa no topo, os
 *  projetos dela embaixo.
 *
 *  Tem sombra e fundo opaco porque flutua sobre o próprio gráfico — com fundo
 *  translúcido as fatias atravessariam o texto. */
export const BalaoEtapa = styled.div`
  max-width: 18rem;
  padding: ${theme.spacing.sm} 0.625rem;
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.card};
  box-shadow: ${theme.shadows.md};
`;

export const BalaoTitulo = styled.p`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  margin: 0 0 0.35rem;
  padding-bottom: 0.35rem;
  border-bottom: 1px solid ${theme.colors.border};
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.semibold};
  color: ${theme.colors.foreground};

  /* A contagem encosta na direita, separada do nome da etapa. */
  b {
    margin-left: auto;
    font-variant-numeric: tabular-nums;
    font-weight: ${theme.fontWeight.normal};
    color: ${theme.colors.mutedForeground};
  }
`;

export const BalaoLista = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    font-size: ${theme.fontSize.xs};
    line-height: 1.6;
    color: ${theme.colors.foreground};
    /* Nome longo de projeto não pode esticar o balão até fora da tela. */
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* O "e mais N" fecha a lista quando ela foi cortada. */
  li[data-resto="true"] {
    margin-top: 0.15rem;
    color: ${theme.colors.mutedForeground};
    font-style: italic;
  }
`;

/** Os projetos da etapa clicada na pizza. */
export const ProjetosDaEtapa = styled.div`
  margin-top: ${theme.spacing.md};
  padding-top: ${theme.spacing.md};
  border-top: 1px solid ${theme.colors.border};
`;

