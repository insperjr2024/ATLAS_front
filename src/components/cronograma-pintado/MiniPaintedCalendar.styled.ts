import styled from "styled-components";
import { theme } from "@/styles/theme";

/**
 * A moldura visível do mini-calendário: a altura é calculada em JS a partir
 * do conteúdo medido (ver `MiniPaintedCalendar.tsx`), nunca um chute fixo —
 * é o que garante o mês inteiro visível, sem cortar semana nenhuma, tanto
 * num mês de 5 quanto de 6 linhas.
 */
export const MiniFrameOuter = styled.div`
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.background};
  /* Só leitura: o clique de navegação é do card por fora, não de uma célula. */
  pointer-events: none;
`;

/**
 * O calendário renderizado em TAMANHO NATURAL, numa largura de referência
 * fixa, é dela que medimos a altura real do mês antes de encolher. O
 * `transform: scale` (e não `zoom`) tem comportamento padronizado entre
 * navegadores para essa medição continuar confiável.
 */
export const MiniFrameInner = styled.div`
  transform-origin: top left;
`;
