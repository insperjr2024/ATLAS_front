import styled from "styled-components";
import { theme } from "@/styles/theme";

/** Os dados do pré-cadastro em pares rótulo/valor, lado a lado. */
export const DadosGrid = styled.dl`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: ${theme.spacing.md};
  margin: 0;
`;

export const DadoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
`;

export const DadoRotulo = styled.dt`
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.mutedForeground};
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

export const DadoValor = styled.dd`
  margin: 0;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.cardForeground};
  overflow-wrap: anywhere;
`;

/** Explicação curta acima do quadro — o membro precisa saber para que serve
 *  marcar isso, senão o campo fica vazio para sempre. */
export const Explicacao = styled.p`
  margin: 0 0 ${theme.spacing.md};
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.mutedForeground};
`;
