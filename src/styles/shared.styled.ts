import styled from "styled-components";
import { Skeleton } from "@/components/ui/skeleton";
import { CardContent } from "@/components/ui/card";

// Empilhamento vertical de seções — repetido em toda página com múltiplos Cards.
export const PageStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

// Grid de 2 colunas em telas grandes — usado por Desempenho e Calendário.
export const TopGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;

  @media (min-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

// CardContent em coluna, usado por qualquer card que renderiza uma lista de linhas.
export const ListCardContent = styled(CardContent)`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const ListRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border);
  padding-bottom: 0.5rem;

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
  border-radius: 999px;
  background: var(--destructive);
`;

export const RowLabel = styled.span`
  font-weight: 500;
`;

export const RowMeta = styled.span`
  font-size: 0.875rem;
  color: var(--muted-foreground);
`;

// Texto de estado vazio ("Nenhuma banca aqui.", etc).
export const EmptyText = styled.p`
  font-size: 0.875rem;
  color: var(--muted-foreground);
`;

// Placeholder de carregamento de página inteira.
export const PageLoadingSkeleton = styled(Skeleton)`
  height: 16rem;
  width: 100%;
`;

// Estado de erro de carregamento (ex: backend fora do ar).
export const ErrorState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 2rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--background);
`;

export const ErrorMessage = styled.p`
  font-size: 0.9rem;
  color: var(--muted-foreground);
`;
