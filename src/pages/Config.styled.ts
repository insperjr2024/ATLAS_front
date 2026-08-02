import styled from "styled-components";
import { theme } from "@/styles/theme";
import {
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
  FormStack,
  FieldGroup,
  FieldLabel,
  FieldInput,
  FormErrorText,
  ModalOverlay,
  ModalHeader,
  ModalTitle,
  ModalClose,
  ModalBody,
  ModalFooter,
  WideModalContent,
  ToggleRow,
} from "./Membros.styled";

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
  FormStack,
  FieldGroup,
  FieldLabel,
  FieldInput,
  FormErrorText,
  ModalOverlay,
  ModalHeader,
  ModalTitle,
  ModalClose,
  ModalBody,
  ModalFooter,
  WideModalContent,
  ToggleRow,
};

export const PermissoesGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.sm} 0;
`;

export const PermissaoItem = styled(ToggleRow)`
  align-items: flex-start;
  padding: ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.secondary};

  input {
    margin-top: 0.125rem;
  }
`;

export const PermissaoTexto = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
`;

export const PermissaoTitulo = styled.span`
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.foreground};
`;

export const PermissaoDesc = styled.span`
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
`;

export const PermissaoBadge = styled.span`
  display: inline-flex;
  padding: 0.1rem 0.4rem;
  margin-right: 0.25rem;
  margin-bottom: 0.25rem;
  border-radius: ${theme.borderRadius.full};
  font-size: 0.65rem;
  font-weight: ${theme.fontWeight.medium};
  background: color-mix(in srgb, ${theme.colors.primary} 10%, white);
  color: ${theme.colors.primary};
`;

export const CardHeaderActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing.md};
  width: 100%;
`;
