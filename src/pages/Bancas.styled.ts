import styled from "styled-components";
import { theme } from "@/styles/theme";

export const DataTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: ${theme.fontSize.sm};
`;

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
  max-width: 32rem;
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
