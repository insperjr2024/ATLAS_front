import styled from "styled-components";
import { theme } from "@/styles/theme";

export {
  PageHeaderRow,
  PageHeaderText,
  PageHeading,
  PageSubheading,
  DataTable,
  TableHead,
  TableHeadCell,
  TableBody,
  TableRow,
  NameCell,
  TableCell,
  ActionsCell,
  DetailList,
  DetailRow,
  DetailTerm,
  DetailValue,
  FormStack,
  FieldGroup,
  FieldLabel,
  FieldInput,
  FieldTextarea,
  FieldSelect,
  FormErrorText,
  ModalOverlay,
  ModalHeader,
  ModalTitle,
  ModalClose,
  ModalBody,
  ModalFooter,
  WideModalContent,
} from "./Bancas.styled";

export { NotaCell } from "./Nucleo.styled";

export const FiltersRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing.sm};
  margin-bottom: ${theme.spacing.md};
`;

export const FilterSelect = styled.select`
  height: 2rem;
  padding: 0 0.625rem;
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${theme.colors.input};
  background: ${theme.colors.background};
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.foreground};
  min-width: 10rem;

  &:focus {
    outline: none;
    border-color: ${theme.colors.ring};
  }
`;

export const FormularioLista = styled.ol`
  margin: 0;
  padding-left: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.foreground};
`;

export const FormularioItem = styled.li`
  line-height: 1.4;
`;

export const FormularioTipo = styled.span`
  color: ${theme.colors.mutedForeground};
  font-size: ${theme.fontSize.xs};
`;

export const FormHint = styled.p`
  margin: ${theme.spacing.sm} 0 0;
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
`;

export const CardActions = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: ${theme.spacing.md};
`;

export const PerguntaEditorList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
`;

export const PerguntaEditorRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: ${theme.spacing.sm};
  align-items: start;

  @media (max-width: ${theme.breakpoints.sm}px) {
    grid-template-columns: 1fr;
  }
`;

export const RemoveButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 2.25rem;
  padding: 0 0.625rem;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.lg};
  background: ${theme.colors.background};
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.destructive};
  cursor: pointer;

  &:hover {
    background: color-mix(in srgb, ${theme.colors.destructive} 8%, white);
  }
`;

export const AvaliacaoBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  padding: ${theme.spacing.sm} 0;
  border-bottom: 1px solid ${theme.colors.border};

  &:last-child {
    border-bottom: none;
  }
`;

export const AvaliacaoTitulo = styled.h4`
  margin: 0;
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.semibold};
`;

export const AvaliacaoMeta = styled.p`
  margin: 0;
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
`;

export const SectionTitle = styled.h3`
  margin: ${theme.spacing.md} 0 ${theme.spacing.sm};
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.semibold};
  color: ${theme.colors.foreground};
`;

export const NotaFinalDestaque = styled.p`
  margin: 0 0 ${theme.spacing.md};
  font-size: ${theme.fontSize.base};
  color: ${theme.colors.foreground};

  strong {
    font-size: ${theme.fontSize.lg};
    color: ${theme.colors.primary};
  }
`;
