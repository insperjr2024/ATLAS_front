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

// Grid de 2 colunas — alias semântico usado por Desempenho.
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
