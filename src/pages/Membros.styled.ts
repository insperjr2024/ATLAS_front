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
  FieldSelect,
  CheckboxGrid,
  CheckboxLabel,
  FormErrorText,
  ModalOverlay,
  ModalHeader,
  ModalTitle,
  ModalClose,
  ModalBody,
  ModalFooter,
  WideModalContent,
} from "./Bancas.styled";

export const StatusBadge = styled.span<{ $ativo?: boolean }>`
  display: inline-flex;
  padding: 0.125rem 0.5rem;
  border-radius: ${theme.borderRadius.full};
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
  background: ${({ $ativo }) =>
    $ativo ? "color-mix(in srgb, #1baf7a 14%, white)" : theme.colors.muted};
  color: ${({ $ativo }) => ($ativo ? "#1baf7a" : theme.colors.mutedForeground)};
`;

export const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${theme.spacing.sm};
  padding-top: ${theme.spacing.sm};
`;

export const EditSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
  padding-top: ${theme.spacing.md};
  border-top: 1px solid ${theme.colors.border};
`;

export const EditSectionTitle = styled.h3`
  margin: 0;
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.semibold};
  color: ${theme.colors.foreground};
`;

export const ToggleRow = styled.label`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.foreground};
  cursor: pointer;

  input {
    accent-color: ${theme.colors.primary};
  }
`;
