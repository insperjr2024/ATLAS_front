import styled from "styled-components";
import { theme } from "@/styles/theme";

/**
 * O campo de busca no topo da lista.
 *
 * Mora DENTRO da caixa que rola, colada no topo (`sticky`): rolar a lista
 * atrás dele não pode levar embora justamente o campo que a filtra. As
 * margens negativas anulam o padding da `CheckboxGrid` para o campo encostar
 * nas bordas — sem isso as opções apareciam no vão acima dele enquanto
 * rolavam.
 */
export const Busca = styled.input`
  position: sticky;
  top: -0.625rem;
  z-index: 1;
  flex-shrink: 0;
  margin: -0.625rem -0.75rem 0;
  padding: 0.375rem 0.75rem;
  border: none;
  border-bottom: 1px solid ${theme.colors.border};
  background: ${theme.colors.background};
  color: ${theme.colors.foreground};
  font-size: ${theme.fontSize.sm};

  &:focus {
    outline: none;
    border-bottom-color: ${theme.colors.ring};
  }
`;

export const Vazio = styled.p`
  margin: 0;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.mutedForeground};
`;
