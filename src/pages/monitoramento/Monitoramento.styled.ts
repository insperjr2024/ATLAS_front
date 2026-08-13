import styled, { css } from "styled-components";
import { Link as RouterLink, NavLink } from "react-router-dom";
import { theme } from "@/styles/theme";
import { PALETA } from "@/components/cronograma-pintado/cores";
import { DataTable as DataTableBase } from "../Bancas.styled";
import { PageButtonSm } from "@/styles/page.styled";

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

/** O grid de cards, reaproveitado pelo board macro de cronogramas
 * , mesma grade responsiva da listagem de projetos. */
export { CardGrid, ProjetoCard, CardTitle, CardCliente } from "../projetos/Projetos.styled";

/**
 * A tabela das abas, um degrau acima da `DataTable` genérica.
 *
 * O cabeçalho vira caixa alta pequena para sair da frente dos números, numa
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
 *
 * **As duas rolagens moram no MESMO elemento, de propósito.**
 *
 * A tentação é aninhar: um container para a horizontal, outro por fora para a
 * vertical. Não funciona. `overflow-x: auto` faz o `overflow-y` computar para
 * `auto` também (o CSS não deixa um eixo recortar e o outro transbordar), então
 * o container de dentro já é um contexto de rolagem vertical. O `position:
 * sticky` do cabeçalho se ancora nele, que nunca rola, porque não tem altura
 * limitada, e o cabeçalho simplesmente não gruda em nada.
 *
 * Com `$max`, a tabela ganha rolagem vertical e o cabeçalho gruda no topo. Sem
 * ele, o comportamento é o de antes: só horizontal, altura livre.
 *
 * Rolagem aqui, e páginas nos cards de alerta (ver `usePaginacao`): nestas
 * tabelas a pessoa procura ALGUÉM ESPECÍFICO, e mandá-la adivinhar em qual
 * página está o colega seria pior do que rolar.
 */
export const TabelaRolagem = styled.div<{ $min?: string; $max?: string }>`
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  ${({ $max }) =>
    $max &&
    css`
      max-height: ${$max};
      overflow-y: auto;

      /* Sem isto, três telas de rolagem adentro ninguém lembra qual coluna é
         qual. O fundo é obrigatório: sticky não recorta o que passa por baixo. */
      thead th {
        position: sticky;
        top: 0;
        z-index: 1;
        background: ${theme.colors.card};
      }
    `}

  table {
    min-width: ${({ $min = "38rem" }) => $min};
  }
`;

/* ─── Linha de card com destaque à esquerda ──────────────────────────────── */

/**
 * Uma linha clicável com um valor em destaque à esquerda, duas linhas de texto
 * e a seta. Usada pelos cards de **bancas próximas** e **tempo parado**.
 *
 * A linha INTEIRA é o link: o alvo útil é o item todo, e um trecho clicável no
 * meio do texto é difícil de acertar, ainda mais no celular.
 */
export const LinhaItem = styled(RouterLink)`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  padding: 0.4rem 0.5rem;
  margin: 0 -0.5rem;
  border-radius: ${theme.borderRadius.md};
  color: ${theme.colors.mutedForeground};
  text-decoration: none;

  &:hover {
    background: ${theme.colors.muted};
    color: ${theme.colors.foreground};
  }

  &:focus-visible {
    outline: 2px solid ${theme.colors.ring};
    outline-offset: -2px;
  }
`;

/** A coluna da esquerda: dois valores empilhados, largura fixa. É ela que
 *  alinha as linhas umas sob as outras e deixa a lista ser lida na vertical —
 *  "seg 11 / 14:00" nas bancas, "145 / dias" no tempo parado. */
export const ItemDestaque = styled.span`
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 3.25rem;
  line-height: 1.2;

  strong {
    font-size: ${theme.fontSize.xs};
    font-weight: ${theme.fontWeight.semibold};
    text-transform: capitalize;
    color: ${theme.colors.foreground};
  }

  span {
    font-size: ${theme.fontSize.xs};
    font-variant-numeric: tabular-nums;
    color: ${theme.colors.mutedForeground};
  }
`;

export const ItemTexto = styled.span`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  line-height: 1.3;

  /* Projeto e escopo em duas linhas, cada um truncando sozinho: juntos numa
     linha só, o escopo empurrava o nome do projeto para fora. */
  strong,
  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    font-size: ${theme.fontSize.sm};
    font-weight: ${theme.fontWeight.medium};
    color: ${theme.colors.foreground};
  }

  span {
    font-size: ${theme.fontSize.xs};
    color: ${theme.colors.mutedForeground};
  }
`;

/** O contexto do pior caso na tabela por coordenador: projeto em cima, motivo
 *  embaixo. Largura limitada e truncando, senão a descrição do motivo, que é
 *  frase inteira, estica a coluna e espreme as outras quatro. */
export const PiorCaso = styled.span`
  display: flex;
  flex-direction: column;
  max-width: 20rem;
  line-height: 1.3;

  strong,
  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    font-size: ${theme.fontSize.sm};
    font-weight: ${theme.fontWeight.medium};
    color: ${theme.colors.foreground};
  }

  span {
    font-size: ${theme.fontSize.xs};
    color: ${theme.colors.mutedForeground};
  }
`;

/** O campo de busca por projeto, na aba de Tarefas.
 *
 *  Largura contida: é filtro de uma coluna, não busca global da plataforma —
 *  esticado na largura toda ele prometeria procurar em tudo. */
export const BarraBusca = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  max-width: 22rem;
  padding: 0.375rem 0.625rem;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.card};
  color: ${theme.colors.mutedForeground};

  &:focus-within {
    border-color: ${theme.colors.ring};
  }

  input {
    flex: 1;
    min-width: 0;
    border: none;
    background: transparent;
    font-size: ${theme.fontSize.sm};
    color: ${theme.colors.foreground};

    /* O anel de foco fica na barra inteira, via focus-within, e não no input:
       dois anéis concêntricos poluem. */
    &:focus {
      outline: none;
    }
  }
`;

export const BotaoLimparBusca = styled.button`
  display: inline-flex;
  align-items: center;
  padding: 0;
  border: none;
  background: transparent;
  color: ${theme.colors.mutedForeground};
  cursor: pointer;

  &:hover {
    color: ${theme.colors.foreground};
  }

  &:focus-visible {
    outline: 2px solid ${theme.colors.ring};
    outline-offset: 2px;
    border-radius: ${theme.borderRadius.sm};
  }
`;

/** A linha do filtro de frente, no topo de cada aba.
 *
 *  Alinhado à direita para não competir com o primeiro card: é um controle de
 *  recorte, e o assunto da aba é o conteúdo abaixo dele. */
export const BarraFiltro = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
`;

/** O rodapé de navegação entre páginas de um card. Discreto e centrado: é
 *  rodapé, não ação principal da tela. */
export const BarraPaginacao = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing.sm};
  margin-top: ${theme.spacing.md};
  padding-top: ${theme.spacing.sm};
  border-top: 1px solid ${theme.colors.border};
`;

export const BotaoPagina = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  background: transparent;
  color: ${theme.colors.foreground};
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${theme.colors.muted};
  }

  /* Desabilitado continua ocupando o lugar em vez de sumir: o contador entre
     as duas setas saltaria de posição a cada troca de página. */
  &:disabled {
    opacity: 0.35;
    cursor: default;
  }

  &:focus-visible {
    outline: 2px solid ${theme.colors.ring};
    outline-offset: 2px;
  }
`;

export const ContadorPagina = styled.span`
  min-width: 7rem;
  font-size: ${theme.fontSize.xs};
  font-variant-numeric: tabular-nums;
  color: ${theme.colors.mutedForeground};
  text-align: center;
`;

/**
 * As abas do  como controle segmentado, não como sublinhado.
 *
 * São 4 recortes da MESMA população de projetos, e o segmentado diz isso: um
 * trilho, uma peça acesa por vez. O sublinhado antigo lia como 4 links soltos
 * e sumia contra o resto da página, que também é branco sobre branco.
 *
 * `inline-flex` de propósito, a barra abraça o conteúdo em vez de esticar
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
 * mesma linha, o bloco de dias, o nome do projeto e a tag do motivo, sem que
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
 * Os dados anteriores continuam na tela de propósito, trocar tudo por um
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
 * está agora, reconstruir o passado exigiria histórico de movimentação entre
 * colunas, que o sistema não guarda (`tarefa.movida_em` é só o carimbo da
 * última mudança). Sem a marcação, a linha mistura passado e presente em
 * silêncio: alguém lê "não distribuiu naquela semana, mas tem 5 ativas" e tira
 * a conclusão errada.
 */
export const ValorDeHoje = styled.span`
  color: ${theme.colors.mutedForeground};

  &::after {
    content: "Hoje";
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
 * navegação e os links, e nada se destaca. A rampa abaixo abre âmbar vermelho
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
 * As cores acima foram escolhidas para PREENCHIMENTO, ponto de legenda, barra,
 * fundo tingido, onde a área é grande e a saturação é o que identifica o
 * degrau. Como texto elas reprovam em contraste: o `leve` fica perto de 2:1
 * sobre branco, quando o mínimo é 4.5:1, e some para quem lê em tela clara.
 *
 * Descer a luminosidade para a faixa 0.48–0.55 preserva a identidade de matiz
 * (âmbar laranja vermelho) e devolve a legibilidade. É o mesmo raciocínio
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

/**
 * Duas ou mais colunas: uma lista de 15+ itens empilhados numa coluna só
 * cresce demais verticalmente. Cada `ItemAtencao` já tem borda própria (não
 * mais uma linha entre vizinhos empilhados), então funciona igual em 1, 2 ou
 * 3 colunas.
 */
export const ListaAtencaoGrid = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
`;

/** cada item traz o MOTIVO e há quanto tempo, nunca rótulo genérico.
 *
 * O marcador é um ponto, não uma barra lateral: a faixa colorida à esquerda
 * pinta a linha inteira de urgência e, numa lista com 15 itens, tudo grita
 * igual. O ponto marca sem tingir, e a cor dele carrega a gravidade. */
export const ItemAtencao = styled.li<{ $nivel?: NivelSeveridade }>`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.5rem 0.75rem 0.5rem 1.125rem;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};

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

/** `atencao` (âmbar) fica entre `ok` e `alerta`: sinaliza o que merece olhada
 *  sem ser falha, um quadro zerado, por exemplo, não é o mesmo problema que
 *  um projeto que nunca recebeu tarefa. */
export type TomPilula = "ok" | "alerta" | "atencao" | "neutro";

/* As porcentagens acompanham o `PageBadge` de `page.styled.ts`, que é o badge
   padrão do sistema: 14% para success/destructive, 20% para warning. Antes eram
   12% e 18% aqui, sem motivo, duas famílias de pílula quase iguais na mesma
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

/** O travessão de "não se aplica". Era um `EmptyText`, que é `<p>`, dentro de
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
   por filetes, e não uma grade de cards, cards sugeririam assuntos
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

/* ─── Atrasos ──────────────────────────────────────────────────────
   A régua desta seção é UMA: dias. Por isso ela não vira grade de cards —
   linhas ranqueadas, todas medidas contra o mesmo máximo. Card por projeto
   quebraria justamente a comparação que a diretoria precisa fazer de
   relance. */

export const LinhaAtraso = styled.li`
  display: grid;
  grid-template-columns: 3.75rem 1fr;
  align-items: start;
  gap: 0 ${theme.spacing.md};
  padding: 0.85rem 0.5rem;
  margin: 0 -0.5rem;
  border-radius: ${theme.borderRadius.lg};
  transition: background ${theme.transitions.fast};

  /* Zebra bem sutil: cada projeto pode ter 1 ou vários motivos, então a
     carga visual da lista varia de linha em linha, a faixa alternada marca
     onde um projeto termina e o outro começa sem depender só do filete. */
  &:nth-of-type(even) {
    background: ${theme.alpha(theme.colors.foreground, 0.015)};
  }

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

/**
 * O número vem primeiro: é o que ordena a lista e o que a diretoria lê antes
 * do nome do projeto. Mas quem carrega a gravidade agora é só o `AtrasoDot`
 *, o MESMO ponto de 0.5rem que a `Legenda` usa (`SEVERIDADE[$nivel]`, igual
 * token, igual tamanho). Antes era um bloco inteiro tingido com o número em
 * `xl`/bold na cor da gravidade: competia visualmente com o nome do projeto
 * ao lado e, como usava a cor "cheia" (`SEVERIDADE`) enquanto o resto da
 * linha (`MotivoDias`) usa a versão escurecida para texto pequeno
 * (`SEVERIDADE_TEXTO`), a paleta parecia bater diferente em cada lugar. Com
 * o número em cinza-escuro comum e só o ponto colorido, a legenda no topo
 * ("● até 3 · ● 4 a 10 · ● mais de 10") e esta coluna leem literalmente a
 * mesma cor.
 */
// $nivel/$externo chegam do chamador mas não pintam nada aqui de propósito
// (ver o comentário acima), quem carrega a gravidade agora é só o
// `AtrasoDot`. Aceitos e ignorados só para o styled-components não brigar
// com o TypeScript.
export const AtrasoDias = styled.div<{ $nivel?: NivelSeveridade; $externo?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  padding-top: 0.2rem;
  line-height: 1;

  @media (max-width: ${theme.breakpoints.sm}px) {
    flex-direction: row;
    align-items: baseline;
    gap: 0.4rem;
    padding-top: 0;
    align-self: flex-start;
  }
`;

export const AtrasoDiasTopo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3rem;

  strong {
    font-size: ${theme.fontSize.base};
    font-weight: ${theme.fontWeight.semibold};
    font-variant-numeric: tabular-nums;
    color: ${theme.colors.foreground};
  }
`;

/* Sem caixa alta: o  reserva uppercase para label de CATEGORIZAÇÃO, e
   "dias" é unidade de medida, não categoria. */
export const AtrasoDiasRotulo = styled.span`
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
`;

/** O único lugar da linha que carrega cor de gravidade, mesmo diâmetro e
 *  mesma paleta do `LegendaItem::before`, de propósito: são o mesmo sinal. */
export const AtrasoDot = styled.span<{ $nivel: NivelSeveridade; $externo?: boolean }>`
  flex-shrink: 0;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: ${theme.borderRadius.full};
  background: ${({ $nivel, $externo }) =>
    $externo ? theme.colors.mutedForeground : SEVERIDADE[$nivel]};
`;

export const AtrasoCorpo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 0;
`;

export const AtrasoTitulo = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${theme.spacing.sm};
  font-size: ${theme.fontSize.sm};
`;

/** O flag secundário do projeto (hoje só "espera do cliente"), ícone com
 *  `title` de tooltip, não uma segunda pílula ao lado do status operacional.
 *  Duas pílulas do mesmo tamanho ao lado do nome competiam por atenção sem
 *  dizer qual é a principal; o status (`Pilula`) continua sendo a única cor
 *  "de peso" da linha, o resto é só contexto disponível a quem passar o
 *  mouse. */
export const AtrasoFlagIcone = styled.span`
  display: inline-flex;
  align-items: center;
  color: color-mix(in srgb, ${theme.colors.warning} 70%, black);
  cursor: help;
`;

export const MotivoLista = styled.ul`
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
`;

/**
 * Colunas de largura FIXA (tag · escopo · dias · data · ação), não `auto`:
 * cada `<li>` é a sua própria grade, e `auto` deixava cada coluna do tamanho
 * do conteúdo DAQUELE motivo específico, a régua de dias/data/ação flutuava
 * solta à direita, numa posição diferente a cada linha, com bordas
 * serrilhadas em vez de uma coluna de verdade. Largura fixa é o que faz a
 * régua inteira (de todo motivo, de todo projeto da lista) alinhar na mesma
 * posição, só aí "escanear a coluna de baixo pra cima" funciona.
 */
export const MotivoItem = styled.li`
  display: grid;
  grid-template-columns: 9.5rem minmax(0, 1fr) 3.75rem 7rem 6.5rem;
  align-items: baseline;
  column-gap: 0.6rem;
  padding: 0.4rem 0;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.mutedForeground};

  & + & {
    border-top: 1px dashed ${theme.colors.border};
  }
`;

/**
 * "Justificar" por motivo: o botão de VERDADE do site (`PageButtonSm`), não
 * uma pílula contornada inventada só pra esta linha, mesmo componente que
 * "Cancelar"/"Tentar novamente"/etc. já usam em qualquer outra tela. Largura
 * mínima igual à de `MotivoJustificadoBadge`, os dois `justify-self: end`
 * dentro da MESMA coluna fixa da grade: "Justificar" (mais curto) e
 * "Justificado" (mais longo, com o ✓) paravam em posições diferentes antes,
 * porque cada botão só tinha a largura do próprio texto.
 */
export const MotivoJustificarBtn = styled(PageButtonSm)`
  justify-self: end;
  min-width: 6rem;
`;

/** O "justificado" por motivo, link de texto (não selo cheio), pra
 *  `/projetos/{id}/historico#justificativa-{id}`. `AtrasosAba` decide se
 *  renderiza como link ou como span puro (quando não tem `justificativa_id`
 *  pra apontar). Mesma largura mínima do botão ao lado, ver o comentário em
 *  `MotivoJustificarBtn`. */
export const MotivoJustificadoBadge = styled(RouterLink)`
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.3rem;
  justify-self: end;
  min-width: 6rem;
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.success};
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }

  &::before {
    content: "✓";
  }
`;

/** A data que venceu. Entra em `tabular-nums` e um pouco mais escura que o
 *  resto do motivo porque é o dado acionável da linha: com ela a diretoria
 *  cruza o atraso com o que mais aconteceu naquela semana. */
export const MotivoData = styled.span`
  font-variant-numeric: tabular-nums;
  color: ${theme.colors.foreground};
`;

/**
 * Os dias DESTE motivo, mesma paleta escurecida (`SEVERIDADE_TEXTO`) que a
 * legenda referencia pra texto pequeno; o `AtrasoDot` ao lado do nome do
 * projeto é quem carrega a cor "cheia" (`SEVERIDADE`) da mesma escala.
 *
 * O número grande da linha é a SOMA de todos os motivos do projeto (é assim
 * que o backend ordena a lista), e soma não é duração: três escopos com 4
 * dias cada viram "12" e leem como um atraso de 12 dias, que não existe. Com
 * o valor de cada motivo à vista a composição fica explícita e ninguém
 * precisa deduzir.
 */
export const MotivoDias = styled.span<{ $nivel: NivelSeveridade; $externo?: boolean }>`
  font-variant-numeric: tabular-nums;
  font-weight: ${theme.fontWeight.medium};
  white-space: nowrap;
  color: ${({ $nivel, $externo }) =>
    $externo ? theme.colors.mutedForeground : SEVERIDADE_TEXTO[$nivel]};
`;

/** O nome do escopo, coluna flexível da grade (`1fr`), truncada com "…" em
 *  vez de empurrar as colunas de dias/data/ação pra fora quando o nome é
 *  comprido. */
export const MotivoEscopoNome = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
`;

/**
 * Distingue o atraso do TIME (banca, entrega interna) do que veio da agenda
 * do cliente. O  é explícito que o externo não pode pesar contra o time,
 * então ele não pode ter o mesmo peso visual.
 *
 * Rótulo puro (maiúsculas + espaçamento), sem caixinha nem borda, mesmo
 * tratamento de `DemandaAltaTitulo`/`TableHeadCell`. A linha já tem o ponto
 * de gravidade, o status do projeto e os selos de Justificado/Justificar;
 * mais uma caixa só pra dizer "banca" era badge empilhado em cima de badge.
 * O contraste interno/externo continua por COR do texto: o do time é
 * escuro, o do cliente é apagado.
 */
export const MotivoTag = styled.span<{ $externo?: boolean }>`
  flex-shrink: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.semibold};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ $externo }) => ($externo ? theme.colors.mutedForeground : theme.colors.foreground)};
`;

/** Barra dentro da célula da tabela, a coluna vira comparação visual sem
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

/* ─── Alocação ─────────────────────────────────────────────────────
   A carga de uma pessoa só significa alguma coisa contra a das outras: 4
   projetos é muito ou pouco depende de quantos os colegas carregam. Por isso
   a coluna vira barra, medida contra o maior da tabela. */

/* ─── Card "com demanda alta" ──────────────────────────────────────
   Duas colunas lado a lado, coordenadores e consultores, porque as escalas
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

/** O número de vagas livres de uma frente.
 *
 *  Zero fica apagado em vez de vermelho: "não cabe mais ninguém aqui" é um
 *  fato de planejamento, não um problema a resolver, a frente pode estar
 *  cheia justamente porque vendeu bem. */
export const VagaLivre = styled.span<{ $vazio: boolean }>`
  font-variant-numeric: tabular-nums;
  font-weight: ${({ $vazio }) =>
    $vazio ? theme.fontWeight.normal : theme.fontWeight.semibold};
  color: ${({ $vazio }) => ($vazio ? theme.colors.mutedForeground : theme.colors.foreground)};
`;

export const ChipsProjetos = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  min-width: 12rem;
`;

/** O chip virou link quando o projeto passou a chegar com id, a tabela dizia
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
/* Board macro de tarefas, swimlanes por projeto                 */
/* ------------------------------------------------------------------ */

/**
 * Uma grade só (cabeçalho + uma linha por projeto), não um `Board` por
 * projeto: é o que deixa a coluna "Validação" do projeto A alinhada com a
 * "Validação" do projeto B, faixa embaixo da outra.
 */
/** As colunas do quadro, na mesma medida no cabeçalho e no corpo, é o que
 *  mantém a pílula alinhada com os cards dela. */
const colunasDoQuadro = css<{ $colunas: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $colunas }) => Math.max(1, $colunas)}, minmax(11rem, 1fr));
  column-gap: ${theme.spacing.md};
`;

/**
 * O cabeçalho do quadro: GRUDA no topo da página enquanto se percorre a lista.
 *
 * **Fica fora do container que rola na horizontal, de propósito.**
 * `position: sticky` se ancora no ancestral que rola, e o corpo do quadro tem
 * `overflow-x: auto`, dentro dele o cabeçalho grudaria no quadro, não na
 * página. Já foi tentado limitar a altura do quadro para ele virar a própria
 * janela: funciona, mas cria uma caixa de rolagem dentro da página, e aí a
 * lista deixa de acompanhar o resto da tela.
 *
 * Separado, o alinhamento com as colunas passa a ser responsabilidade do JS,
 * que espelha o `scrollLeft` do corpo aqui, ver `TarefasGeraisAba`.
 */
export const CabecalhoQuadro = styled.div`
  position: sticky;
  top: 0;
  z-index: 20;
  overflow: hidden;
  padding: ${theme.spacing.sm} 0;
  border-bottom: 1px solid ${theme.colors.border};
  background: ${theme.colors.card};
`;

export const LinhaColunas = styled.div<{ $colunas: number }>`
  ${colunasDoQuadro}
`;

/** O corpo: uma faixa por projeto. Rola só na horizontal, a vertical é a da
 *  página, para o quadro não virar uma janela dentro de outra. */
export const SwimGrid = styled.div<{ $colunas: number }>`
  ${colunasDoQuadro}
  row-gap: ${theme.spacing.md};
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

/** Uma célula do cabeçalho. Sem posicionamento próprio, quem gruda é a
 *  `CabecalhoQuadro` inteira. */
export const SwimHeaderCell = styled.div`
  display: flex;
  align-items: center;
  /* A pílula tem a largura do texto, e a coluna de cards embaixo é bem mais
     larga: encostada à esquerda ela não parece o título daquela coluna, parece
     estar sobrando entre duas. Centralizada, cada card fica claramente sob o
     seu rótulo. */
  justify-content: center;
`;

/**
 * A etiqueta do projeto, gruda na esquerda ao rolar pro lado, senão some a
 * única pista de qual linha é qual assim que a coluna A fazer sai da tela.
 *
 * `$cor` é a identidade fixa do projeto: uma barra fininha que não muda
 * mesmo se a ordem das linhas mudar ou a etiqueta sair da tela ao rolar.
 */
/**
 * O nome do projeto: uma FAIXA de seção, largura toda, abrindo o grupo de
 * cards dele.
 *
 * Já foi coluna congelada à esquerda e não podia continuar sendo: com
 * `position: sticky`, os cards passam POR BAIXO ao rolar para o lado, é o que
 * o recurso faz, não um defeito de estilo, e nenhuma sombra conserta.
 *
 * Como linha SEM fundo, porém, ela se lia como conteúdo da primeira coluna:
 * o nome aparecia logo abaixo de "A fazer" e parecia pertencer a ela. Aqui a
 * faixa tem fundo, altura própria e uma barra colorida na ponta, a leitura
 * passa a ser "começou um projeto novo", que é a de um cabeçalho de grupo.
 * É ela que separa uma faixa da outra, então não há mais divisor.
 */
export const SwimLabelCell = styled.div<{ $cor?: string }>`
  grid-column: 1 / -1;
  position: relative;
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  margin-top: ${theme.spacing.md};
  padding: 0.4rem ${theme.spacing.md} 0.4rem 0.75rem;
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.muted};
  cursor: pointer;
  transition: background ${theme.transitions.fast};

  /* A cor do projeto na ponta, a mesma dos cards dele, é o fio que liga o
     cabeçalho do grupo ao conteúdo abaixo. */
  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0.3rem;
    bottom: 0.3rem;
    width: 3px;
    border-radius: ${theme.borderRadius.full};
    background: ${({ $cor }) => $cor ?? "transparent"};
  }

  &:hover {
    background: ${theme.alpha(theme.colors.foreground, 0.07)};
  }

  &:focus-visible {
    outline: 2px solid ${theme.colors.ring};
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

/** O texto do rótulo gruda à esquerda enquanto a linha rola, assim o nome
 *  continua legível com o quadro deslocado, e como a linha está vazia não há
 *  card nenhum para ele tapar. */
export const SwimLabelTexto = styled.span`
  position: sticky;
  left: 0;
  display: flex;
  align-items: baseline;
  gap: ${theme.spacing.sm};
  min-width: 0;
`;

export const SwimLabelNome = styled.span`
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.foreground};
`;

/** O cliente vem depois do nome, na mesma linha, precedido de um separador.
 *  Empilhado ele dobrava a altura de cada faixa de projeto, e agora que o
 *  rótulo é uma linha inteira, sobra largura de sobra. */
export const SwimLabelCliente = styled.span`
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
  white-space: nowrap;

  &::before {
    content: "";
    margin-right: ${theme.spacing.sm};
  }
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

/* ─── Gráficos ( e ) ──────────────────────────────────────────────── */

/**
 * A cor de cada etapa do ciclo, na pizza da Visão geral.
 *
 * **Sai da `PALETA` do cronograma, não de uma rampa própria.** Aquela paleta
 * já resolve o mesmo problema, dar cor a etapa, e já foi calibrada: 8 matizes
 * com a MESMA saturação e a MESMA luminosidade, só a matiz girando. É isso que
 * mantém as fatias com o mesmo peso visual; numa paleta ingênua o amarelo pula
 * à frente do azul e a fatia mais chamativa passa a ser a de cor mais clara, e
 * não a maior, que é a leitura que a pizza precisa entregar.
 *
 * Herda de graça a regra que o docstring de `cores.ts` defende: cor de etapa
 * não encosta na semântica de status do design system, então nenhuma fatia
 * pode ser lida como "tudo bem" ou "atrasado" por causa do tom.
 *
 * Uso `amostra`, o tom saturado, é o mesmo papel que ele tem lá: identificar a
 * etapa numa legenda. `fundo` é pálido demais para fatia.
 *
 * O índice é fixo por status, e não pela ordem de chegada: "Em andamento" tem
 * que ser a mesma cor toda vez que a tela abre.
 *
 * Cor sozinha não é informação: a legenda escreve nome e número de cada
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
 *  recharts mede o pai, em altura `auto` ele calcula 0 e o gráfico some. */
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

    /* Etapa vazia continua na lista, some faria parecer que ela não existe —
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

/** O aviso de filtro ativo. Sem ele o gráfico mostra números menores que a
 *  tabela logo abaixo e parece bug, o filtro fica escondido num `select` que
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
 *  Tem sombra e fundo opaco porque flutua sobre o próprio gráfico, com fundo
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

/* ------------------------------------------------------------------ */
/* Board macro de cronogramas, mini-calendários por projeto      */
/* ------------------------------------------------------------------ */

/** O rodapé do card: o escopo que decide a posição na fila, com a `Pilula`
 *  de urgência ao lado, texto e cor juntos, para não depender só da cor. */
export const CronogramaCardRodape = styled.p`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin: 0;
  padding-top: ${theme.spacing.sm};
  border-top: 1px solid ${theme.colors.border};
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.foreground};
`;
