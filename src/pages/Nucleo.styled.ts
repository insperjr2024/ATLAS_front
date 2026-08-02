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
  FieldSelect,
} from "./Bancas.styled";

export { LIST_MAX_VISIVEIS, ListScrollWrap, TableScrollWrap } from "@/styles/shared.styled";

export const CardHeaderRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing.sm};
  width: 100%;
`;

export const FilterGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

export const FilterLabel = styled.label`
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.mutedForeground};
  white-space: nowrap;
`;

export const NotaCell = styled.td`
  padding: 0.75rem;
  vertical-align: middle;
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.foreground};
`;
