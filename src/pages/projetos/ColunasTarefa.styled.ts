import styled from "styled-components";
import { theme } from "@/styles/theme";

export const ColunaLinha = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding: 0.375rem 0;

  & + & {
    border-top: 1px solid ${theme.colors.border};
  }
`;

export const Reordenar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;

  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.1rem;
    height: 0.9rem;
    padding: 0;
    border: none;
    background: transparent;
    color: ${theme.colors.mutedForeground};
    cursor: pointer;

    &:hover:not(:disabled) {
      color: ${theme.colors.foreground};
    }

    &:disabled {
      opacity: 0.25;
      cursor: not-allowed;
    }
  }
`;

/** A prévia mostra exatamente a pílula que vai aparecer no board. */
export const ColunaPreview = styled.span<{ $fundo: string; $texto: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.2rem 0.55rem;
  border-radius: ${theme.borderRadius.md};
  background: ${({ $fundo }) => $fundo};
  color: ${({ $texto }) => $texto};
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
  white-space: nowrap;
`;

export const Amostra = styled.span<{ $cor: string }>`
  width: 0.5rem;
  height: 0.5rem;
  flex-shrink: 0;
  border-radius: ${theme.borderRadius.full};
  background: ${({ $cor }) => $cor};
`;

export const ColunaNome = styled.span`
  flex: 1;
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
`;

export const PaletaGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.375rem;

  input[type="color"] {
    width: 1.75rem;
    height: 1.75rem;
    padding: 0;
    border: 1px solid ${theme.colors.border};
    border-radius: ${theme.borderRadius.md};
    background: none;
    cursor: pointer;
  }
`;

export const AmostraBotao = styled.button<{ $cor: string; $ativa: boolean }>`
  width: 1.75rem;
  height: 1.75rem;
  border-radius: ${theme.borderRadius.md};
  border: 2px solid ${({ $ativa, $cor }) => ($ativa ? $cor : "transparent")};
  outline: 1px solid ${theme.colors.border};
  outline-offset: -1px;
  background: ${({ $cor }) => $cor};
  cursor: pointer;
  transition: transform ${theme.transitions.fast};

  &:hover {
    transform: scale(1.08);
  }
`;
