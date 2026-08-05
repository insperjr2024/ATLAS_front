import styled from "styled-components";
import { theme } from "@/styles/theme";

export const PickerStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

export const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${theme.spacing.sm};
  min-height: 2.25rem;
`;

export const Chip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.5rem 0.25rem 0.625rem;
  border-radius: ${theme.borderRadius.full};
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.secondary};
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.foreground};
`;

export const ChipRemove = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  color: ${theme.colors.mutedForeground};
  cursor: pointer;
  line-height: 0;

  &:hover:not(:disabled) {
    color: ${theme.colors.destructive};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

export const AddRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing.sm};

  select {
    flex: 1;
    min-width: 12rem;
  }
`;

/** A contagem de consultores selecionados — vira vermelha em caso de erro. */
export const CountHint = styled.p<{ $ok: boolean }>`
  margin: 0;
  font-size: ${theme.fontSize.xs};
  color: ${({ $ok }) => ($ok ? theme.colors.mutedForeground : theme.colors.destructive)};
`;
