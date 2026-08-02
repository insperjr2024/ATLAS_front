import styled from "styled-components";
import { theme } from "@/styles/theme";

export { GreetingHeader, GreetingTitle, GreetingSubtitle, ChartCaption } from "./Desempenho.styled";

export {
  DataTable,
  TableHead,
  TableHeadCell,
  TableBody,
  TableRow,
  NameCell,
  TableCell,
} from "./Bancas.styled";

export const TablesGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${theme.spacing.lg};

  @media (min-width: ${theme.breakpoints.lg}px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

export const NotaCell = styled.td`
  padding: 0.75rem;
  vertical-align: middle;
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.foreground};
`;
