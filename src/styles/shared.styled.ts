import styled, { css } from "styled-components";
import { theme } from "@/styles/theme";

export {
  PageStack,
  PageGrid,
  EmptyText,
  PageLoadingBlock as PageLoadingSkeleton,
  ErrorBlock as ErrorState,
  ErrorText as ErrorMessage,
} from "@/styles/page.styled";

/** Máximo de linhas visíveis em listas/tabelas antes de ativar scroll. */
export const LIST_MAX_VISIVEIS = 4;

/** Bloco de texto livre (relato, descrição) em destaque, nunca `DetailValue`,
 *  que é para pares chave/valor curtos e alinha à direita: um parágrafo ali
 *  fica torto. Usado em Bancas (descrição do coordenador) e Avaliações
 *  (o mesmo texto, lido pela diretoria). */
export const DescricaoQuote = styled.p`
  margin: 0;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  background: ${theme.colors.muted};
  border-left: 3px solid ${theme.colors.primary};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.fontSize.sm};
  line-height: 1.5;
  color: ${theme.colors.foreground};
  white-space: pre-wrap;
`;

/**
 * O cabeçalho de coluna clicável para ordenar.
 *
 * Herda o tipo do `th` (caixa alta pequena) para não virar um botão colado
 * dentro do cabeçalho, e ganha a seta só quando é a coluna ativa — seta em
 * toda coluna vira ruído e some com a informação de qual está valendo.
 *
 * Mora aqui, e não na pasta de uma tela, porque é o MESMO controle no
 * Histórico de Projetos e no Dashboard de Bancas: duas cópias iam divergir
 * no primeiro ajuste de hover ou de foco.
 */
export const BotaoOrdenar = styled.button<{ $ativo: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  font: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  color: ${({ $ativo }) => ($ativo ? theme.colors.foreground : "inherit")};

  &:hover {
    color: ${theme.colors.foreground};
  }

  &:focus-visible {
    outline: 2px solid ${theme.colors.ring};
    outline-offset: 2px;
    border-radius: ${theme.borderRadius.sm};
  }

  .seta {
    font-size: 0.7em;
    line-height: 1;
  }
`;

const TABLE_HEADER_HEIGHT = "2.75rem";
const ROW_HEIGHT = "3.35rem";

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
 *
 * Veio de `monitoramento/Monitoramento.styled.ts`, que a re-exporta por compat:
 * virou a primitiva de tabela de TODO o app no trabalho de responsividade.
 * Escolha o `$min` pelo nº de colunas — 7 col ≈ 56rem, 5 col ≈ 44rem,
 * 3 col ≈ 30rem.
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

/**
 * Wrapper com scroll para tabelas (cabeçalho fixo).
 *
 * O `overflow-x` não estava aqui e as tabelas de Membros (7 colunas), Config e
 * Calendários base estouravam a largura da tela no celular em vez de rolar. A
 * `$min` é o mesmo critério da `TabelaRolagem` acima; sem ela as colunas
 * continuam espremendo até o texto quebrar letra a letra.
 *
 * Para tabela nova, prefira `TabelaRolagem`: esta existe pelos ~19 usos que já
 * dependem da API `$scrollable`/`$maxVisiveis`.
 */
export const TableScrollWrap = styled.div<{
  $scrollable?: boolean;
  $maxVisiveis?: number;
  $min?: string;
}>`
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  ${({ $scrollable, $maxVisiveis = LIST_MAX_VISIVEIS }) =>
    $scrollable &&
    `
    max-height: calc(${TABLE_HEADER_HEIGHT} + ${$maxVisiveis} * ${ROW_HEIGHT});
    overflow-y: auto;
  `}

  thead {
    position: sticky;
    top: 0;
    z-index: 1;
    background: ${theme.colors.card};
  }

  ${({ $min }) =>
    $min &&
    css`
      table {
        min-width: ${$min};
      }
    `}
`;

/** Wrapper com scroll para listas em cards (sem cabeçalho de tabela). */
export const ListScrollWrap = styled.div<{ $scrollable?: boolean }>`
  ${({ $scrollable }) =>
    $scrollable &&
    `
    max-height: calc(${LIST_MAX_VISIVEIS} * ${ROW_HEIGHT});
    overflow-y: auto;
  `}
`;

// Grid de 2 colunas, alias semântico usado por Desempenho.
export const TopGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${theme.spacing.lg};

  @media (min-width: ${theme.breakpoints.lg}px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

export const ListCardContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.lg};
`;

export const ListRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid ${theme.colors.border};
  padding-bottom: ${theme.spacing.sm};

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
`;

export const RowGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

export const RowDot = styled.span`
  width: 0.5rem;
  height: 0.5rem;
  flex-shrink: 0;
  border-radius: ${theme.borderRadius.full};
  background: ${theme.colors.primary};
`;

export const RowLabel = styled.span`
  font-weight: ${theme.fontWeight.medium};
`;

export const RowMeta = styled.span`
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.mutedForeground};
`;

/* ------------------------------------------------------------------ */
/* Segmented control                                                   */
/* ------------------------------------------------------------------ */

/**
 * Um grupo de opções mutuamente exclusivas, todas visíveis.
 *
 * ⭐ **Por que existe.** Escolher entre 3 e 7 opções curtas num dropdown custa
 * dois cliques e esconde as alternativas até o segundo. Com as opções na tela,
 * custa um clique e a pessoa vê o que existe sem abrir nada — e some a espera
 * de abrir o menu, que era a queixa que originou esta repaginação.
 *
 * 📐 **Quando NÃO usar.** Acima de ~8 opções, ou com rótulos longos, isto vira
 * uma parede de botões que estoura a linha: aí o `SelectCustom` (com
 * `pesquisavel`) continua sendo a escolha certa. O corte não é estético, é de
 * largura.
 *
 * ⚠ Quem usa precisa pôr `role="group"` e `aria-label` aqui, e `aria-pressed`
 * em cada `SegmentedButton` — sem isso o leitor de tela anuncia uma fileira de
 * botões soltos, sem dizer qual está valendo.
 *
 * Veio de `GrupoVisao`/`BotaoVisao` (`cronograma-pintado/PaintedCalendar.styled.ts`),
 * que já era este controle, mas só o Cronograma alcançava.
 */
export const SegmentedGroup = styled.div<{ $bloco?: boolean; $semQuebra?: boolean }>`
  display: ${({ $bloco }) => ($bloco ? "flex" : "inline-flex")};
  /* Sem quebra para os grupos que só fazem sentido numa fileira: partir
     cinco dias da semana em 3 + 2 lê como defeito, não como layout. */
  flex-wrap: ${({ $semQuebra }) => ($semQuebra ? "nowrap" : "wrap")};
  align-items: stretch;
  min-height: 2.25rem;
  border: 1px solid ${theme.colors.input};
  border-radius: ${theme.borderRadius.lg};
  background: ${theme.colors.background};
  overflow: hidden;

  /* Alvo de toque de 44px no celular. No desktop 2.25rem casa com a métrica
     dos campos e botões da mesma linha; no toque, 36px erra demais. */
  @media (max-width: ${theme.breakpoints.md}px) {
    min-height: 2.75rem;
  }
`;

export const SegmentedButton = styled.button<{ $ativo?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0 0.75rem;
  border: none;
  border-right: 1px solid ${theme.colors.border};
  background: ${({ $ativo }) => ($ativo ? theme.colors.secondary : "transparent")};
  font-size: ${theme.fontSize.xs};
  font-weight: ${({ $ativo }) =>
    $ativo ? theme.fontWeight.semibold : theme.fontWeight.medium};
  color: ${({ $ativo }) => ($ativo ? theme.colors.foreground : theme.colors.mutedForeground)};
  cursor: pointer;
  white-space: nowrap;

  /* Só cor: animar transform aqui deslocaria os vizinhos no hover, porque os
     botões dividem a mesma caixa. */
  transition:
    background-color ${theme.transitions.fast},
    color ${theme.transitions.fast};

  &:last-child {
    border-right: none;
  }

  &:hover:not(:disabled) {
    background: ${({ $ativo }) => ($ativo ? theme.colors.secondary : theme.colors.muted)};
    color: ${theme.colors.foreground};
  }

  /* Dentro do grupo o outline seria recortado pelo overflow: hidden, então o
     foco vem por dentro, com offset negativo. */
  &:focus-visible {
    outline: 2px solid ${theme.colors.ring};
    outline-offset: -2px;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

/**
 * A variante solta: pills independentes, sem a caixa em volta.
 *
 * Para filtro de seleção MÚLTIPLA (as etapas do Histórico) ou quando as opções
 * nascem dos dados e podem ser muitas — a caixa fechada do `SegmentedGroup`
 * pressupõe "escolha uma", e com várias marcadas ela mente.
 */
export const PillGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  /* ≥8px entre alvos de toque: colados, o dedo erra o vizinho. */
  gap: 0.5rem;
`;
