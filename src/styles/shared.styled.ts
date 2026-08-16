import styled from "styled-components";
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

/** Wrapper com scroll para tabelas (cabeçalho fixo). */
export const TableScrollWrap = styled.div<{ $scrollable?: boolean; $maxVisiveis?: number }>`
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
