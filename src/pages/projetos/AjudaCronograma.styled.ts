import styled from "styled-components";
import { theme } from "@/styles/theme";

export const PassoLista = styled.ol`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

/** Cada passo com um fio à esquerda: lê-se como sequência, não como lista
 *  de tópicos soltos. */
export const PassoItem = styled.li`
  padding-left: ${theme.spacing.md};
  border-left: 2px solid ${theme.colors.border};
`;

export const PassoTitulo = styled.h4`
  margin: 0 0 0.25rem;
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.semibold};
  color: ${theme.colors.cardForeground};
`;

export const PassoTexto = styled.p`
  margin: 0;
  font-size: ${theme.fontSize.sm};
  line-height: 1.5;
  color: ${theme.colors.mutedForeground};
`;
