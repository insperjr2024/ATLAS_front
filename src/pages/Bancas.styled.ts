import styled from "styled-components";
import { TableCell } from "@/components/ui/table";
import { DialogContent } from "@/components/ui/dialog";

export const NameCell = styled(TableCell)`
  font-weight: 500;
`;

export const ActionsCell = styled(TableCell)`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
`;

export const DetailList = styled.dl`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  font-size: 0.875rem;
`;

export const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
`;

export const DetailTerm = styled.dt`
  color: var(--muted-foreground);
`;

export const DetailValue = styled.dd`
  text-align: right;
`;

export const NarrowDialogContent = styled(DialogContent)`
  @media (min-width: 640px) {
    max-width: 28rem;
  }
`;

export const FormStack = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const ErrorText = styled.p`
  font-size: 0.875rem;
  color: #ef4444;
`;
