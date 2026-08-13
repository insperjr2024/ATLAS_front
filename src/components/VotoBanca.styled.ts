import styled from "styled-components";
import { theme } from "@/styles/theme";

export const VotoSecao = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.muted};
`;

export const VotoTitulo = styled.h3`
  margin: 0;
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.foreground};
`;

export const VotoAjuda = styled.p`
  margin: 0;
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
  line-height: 1.5;
`;

export const VotoBotoesRow = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
  margin-top: ${theme.spacing.xs};
`;

/**
 * Verde e vermelho só quando SELECIONADO.
 *
 * Pintar as duas opções o tempo todo faria a mais chamativa puxar o clique —
 * e este é um voto, não um botão de ação principal. Sem seleção as duas ficam
 * neutras e idênticas em peso visual.
 */
export const VotoBotao = styled.button<{ $selecionado: boolean; $tom: "aprova" | "reprova" }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing.xs};
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid
    ${({ $selecionado, $tom }) =>
      !$selecionado
        ? theme.colors.border
        : $tom === "aprova"
          ? theme.colors.success
          : theme.colors.destructive};
  background: ${({ $selecionado, $tom }) =>
    !$selecionado
      ? theme.colors.background
      : $tom === "aprova"
        ? theme.colors.success
        : theme.colors.destructive};
  color: ${({ $selecionado, $tom }) =>
    !$selecionado
      ? theme.colors.foreground
      : $tom === "aprova"
        ? theme.colors.successForeground
        : theme.colors.destructiveForeground};
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;

  &:hover:not(:disabled) {
    border-color: ${({ $tom }) => ($tom === "aprova" ? theme.colors.success : theme.colors.destructive)};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }

  &:focus-visible {
    outline: 2px solid ${theme.colors.ring};
    outline-offset: 2px;
  }
`;
