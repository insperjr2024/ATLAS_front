import styled from "styled-components";
import { theme } from "@/styles/theme";

export const MentoradosList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
`;

export const MentoradoButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.card};
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.foreground};
  text-align: left;
  cursor: pointer;

  &:hover {
    border-color: ${theme.colors.primary};
  }
`;

export const MentoradoNome = styled.span`
  flex: 1;
`;

/** Título de cabeçalho com a bolinha de iniciais na frente do nome — o
 *  mesmo rosto que já aparece na lista, carregado pelas telas seguintes do
 *  drill-down (mentorado -> relatório), pra não virar texto puro no meio
 *  do caminho. */
export const TituloComAvatar = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;
