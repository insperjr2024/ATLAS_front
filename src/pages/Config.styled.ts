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
  FieldSelect,
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
  FieldSelect,
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

/* ------------------------------------------------------------------ */
/* Seções da página                                                     */
/* ------------------------------------------------------------------ */

/**
 * A página tem cards demais para uma pilha só: sem agrupamento, "Situações de
 * carga" e "Permissões por posição" ficam a mesma distância uma da outra que
 * "Frentes" e "Escopos", que são o mesmo assunto. O grupo é só visual, os
 * cards continuam independentes, mas separa o que se lê junto do que não.
 *
 * O respiro entre grupos (`& + &`) é maior que o de dentro do grupo, senão a
 * hierarquia depende só do título e some quando a pessoa rola a página.
 */
export const SecaoGrupo = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};

  & + & {
    margin-top: ${theme.spacing.sm};
  }
`;

export const SecaoCabecalho = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
`;

export const SecaoTitulo = styled.h2`
  margin: 0;
  font-size: ${theme.fontSize.lg};
  font-weight: ${theme.fontWeight.semibold};
  color: ${theme.colors.foreground};
`;

export const SecaoDescricao = styled.p`
  margin: 0;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.mutedForeground};
`;

/** O nome da frente acima do grupo de escopos dela — separa visualmente sem
 *  precisar de filtro: rola a lista e já sabe de qual frente é cada um. */
export const GrupoFrenteTitulo = styled.h3`
  margin: 0;
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.semibold};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${theme.colors.mutedForeground};

  &:not(:first-child) {
    margin-top: ${theme.spacing.md};
  }
`;

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
