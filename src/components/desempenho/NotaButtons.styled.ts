import styled from "styled-components";
import { theme } from "@/styles/theme";

export const NotaButtonsSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

export const NotaButtonsHeading = styled.h3`
  margin: 0;
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.normal};
  color: ${theme.colors.foreground};
`;

export const NotaButtonsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.lg};
`;

export const NotaButtonsItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};

  @media (min-width: ${theme.breakpoints.md}px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
`;

export const NotaButtonsLabelGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
`;

export const NotaButtonsLabel = styled.label<{ $oculto?: boolean }>`
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.foreground};
  line-height: 1.4;

  /* Some visualmente (mas continua acessível pra leitor de tela) quando o
     rótulo do critério só repete o título da seção — comum nas seções de
     critério único do formulário de coordenador. */
  ${({ $oculto }) =>
    $oculto &&
    `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `}
`;

export const NotaButtonsDescricao = styled.span`
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
  line-height: 1.4;
`;

export const NotaButtonsRow = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
`;

export const NotaButton = styled.button<{ $selected: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  cursor: pointer;
  transition: background ${theme.transitions.fast}, color ${theme.transitions.fast},
    border-color ${theme.transitions.fast};

  ${({ $selected }) =>
    $selected
      ? `
        border: none;
        background: ${theme.colors.primary};
        color: ${theme.colors.primaryForeground};
      `
      : `
        border: 1px solid ${theme.colors.border};
        background: ${theme.colors.background};
        color: ${theme.colors.foreground};

        &:hover:not(:disabled) {
          border-color: ${theme.colors.primary};
          background: color-mix(in srgb, ${theme.colors.primary} 8%, ${theme.colors.background});
        }
      `}

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  &:focus-visible {
    outline: 2px solid ${theme.colors.ring};
    outline-offset: 2px;
  }
`;
