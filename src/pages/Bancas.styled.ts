import styled from "styled-components";
import { theme } from "@/styles/theme";
import { ModalFooter as BaseModalFooter } from "./Calendario.styled";

export const DataTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: ${theme.fontSize.sm};
`;

export { LIST_MAX_VISIVEIS, ListScrollWrap, TableScrollWrap } from "@/styles/shared.styled";

export const TableHead = styled.thead`
  border-bottom: 1px solid ${theme.colors.border};
`;

export const TableHeadCell = styled.th`
  padding: 0.625rem 0.75rem;
  text-align: left;
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.mutedForeground};
`;

export const TableBody = styled.tbody``;

export const TableRow = styled.tr`
  border-bottom: 1px solid ${theme.colors.border};

  &:last-child {
    border-bottom: none;
  }
`;

export const TableCell = styled.td`
  padding: 0.75rem;
  vertical-align: middle;
  color: ${theme.colors.foreground};
`;

export const NameCell = styled(TableCell)`
  font-weight: ${theme.fontWeight.medium};
`;

export const ActionsCell = styled(TableCell)`
  display: flex;
  justify-content: flex-end;
  gap: ${theme.spacing.sm};
`;

export const DetailList = styled.dl`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  font-size: ${theme.fontSize.sm};
  margin: 0;
`;

export const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: ${theme.spacing.md};
`;

export const DetailTerm = styled.dt`
  margin: 0;
  color: ${theme.colors.mutedForeground};
`;

export const DetailValue = styled.dd`
  margin: 0;
  text-align: right;
`;

export const FormStack = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

export const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
`;

export const FieldLabel = styled.label`
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.foreground};
`;

/** O asterisco de campo obrigatório — mesma marcação em todo formulário. */
export const Required = styled.span`
  color: ${theme.colors.destructive};
  margin-left: 0.15rem;
`;

export const FieldInput = styled.input`
  height: 2.25rem;
  padding: 0 0.75rem;
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${theme.colors.input};
  background: ${theme.colors.background};
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.foreground};

  &:focus {
    outline: none;
    border-color: ${theme.colors.ring};
    box-shadow: 0 0 0 3px color-mix(in srgb, ${theme.colors.ring} 25%, transparent);
  }
`;

export const FieldTextarea = styled.textarea`
  min-height: 5rem;
  padding: 0.625rem 0.75rem;
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${theme.colors.input};
  background: ${theme.colors.background};
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.foreground};
  resize: vertical;

  &:focus {
    outline: none;
    border-color: ${theme.colors.ring};
    box-shadow: 0 0 0 3px color-mix(in srgb, ${theme.colors.ring} 25%, transparent);
  }
`;

export const FormErrorText = styled.p`
  margin: 0;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.destructive};
`;

export {
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalClose,
  ModalBody,
  ModalFooter,
  DetailRow as ModalDetailRow,
  DetailTerm as ModalDetailTerm,
  DetailValue as ModalDetailValue,
} from "./Calendario.styled";

export const NarrowModalContent = styled.div`
  width: 100%;
  max-width: 28rem;
  max-height: min(90vh, 640px);
  overflow-y: auto;
  border-radius: ${theme.borderRadius.xl};
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.card};
  box-shadow: ${theme.shadows.lg};
`;

export const WideModalContent = styled(NarrowModalContent)`
  max-width: 36rem;
`;

export const ModalFooterSplit = styled(BaseModalFooter)`
  justify-content: space-between;
`;

export const PageHeaderRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${theme.spacing.md};
`;

export const PageHeaderText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

export const PageHeading = styled.h1`
  margin: 0;
  font-size: ${theme.fontSize["2xl"]};
  font-weight: ${theme.fontWeight.bold};
  color: ${theme.colors.foreground};
`;

export const PageSubheading = styled.p`
  margin: 0;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.mutedForeground};
`;

export const CardHeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing.md};
  width: 100%;
`;

export const FieldSelect = styled.select`
  height: 2.25rem;
  padding: 0 0.75rem;
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${theme.colors.input};
  background: ${theme.colors.background};
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.foreground};

  &:focus {
    outline: none;
    border-color: ${theme.colors.ring};
    box-shadow: 0 0 0 3px color-mix(in srgb, ${theme.colors.ring} 25%, transparent);
  }
`;

export const CheckboxGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 10rem;
  overflow-y: auto;
  padding: 0.625rem 0.75rem;
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${theme.colors.input};
  background: ${theme.colors.background};
`;

export const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.foreground};
  cursor: pointer;

  input {
    accent-color: ${theme.colors.primary};
  }
`;

export const DateTimeRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${theme.spacing.sm};
`;

export const SectionGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.lg};
`;

export const SectionTitle = styled.h2`
  margin: 0;
  font-size: ${theme.fontSize.lg};
  font-weight: ${theme.fontWeight.semibold};
  color: ${theme.colors.foreground};
`;

export const BancaLinha = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: ${theme.spacing.md};
  padding: 0.625rem 0.25rem;
  border-bottom: 1px solid ${theme.colors.border};
  transition: background ${theme.transitions.fast};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${theme.colors.muted};
  }
`;

export const BancaData = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  flex-shrink: 0;
  border-radius: ${theme.borderRadius.lg};
  background: ${theme.colors.muted};
  line-height: 1.15;
`;

export const BancaDataDiaSemana = styled.span`
  font-size: 0.625rem;
  font-weight: ${theme.fontWeight.semibold};
  color: ${theme.colors.mutedForeground};
  text-transform: uppercase;
  letter-spacing: 0.03em;
`;

export const BancaDataDia = styled.span`
  font-size: ${theme.fontSize.lg};
  font-weight: ${theme.fontWeight.bold};
  color: ${theme.colors.foreground};
`;

export const BancaInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.1875rem;
  min-width: 0;
`;

export const BancaNomeLinha = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

export const BancaNome = styled.span`
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.foreground};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const BancaMeta = styled.span`
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
`;

export const BancaAcoes = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  flex-wrap: wrap;
  justify-content: flex-end;
`;

export const TabCount = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.125rem;
  height: 1.125rem;
  padding: 0 0.3rem;
  margin-left: 0.375rem;
  border-radius: ${theme.borderRadius.full};
  background: ${theme.colors.muted};
  color: ${theme.colors.mutedForeground};
  font-size: 0.6875rem;
  font-weight: ${theme.fontWeight.semibold};
`;

export const TabBar = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  border-bottom: 1px solid ${theme.colors.border};
`;

export const TabButton = styled.button<{ $ativa: boolean }>`
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 0.875rem;
  border: none;
  background: none;
  border-bottom: 2px solid ${({ $ativa }) => ($ativa ? theme.colors.primary : "transparent")};
  margin-bottom: -1px;
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: ${({ $ativa }) => ($ativa ? theme.colors.primary : theme.colors.mutedForeground)};
  cursor: pointer;

  &:hover {
    color: ${theme.colors.foreground};
  }
`;
