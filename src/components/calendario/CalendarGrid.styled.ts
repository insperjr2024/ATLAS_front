/**
 * As primitivas da grade de calendário, compartilhadas pelo calendário geral
 * (`pages/Calendario.tsx`) e pelo cronograma pintado.
 *
 * Saíram de `Calendario.styled.ts`, que passou a re-exportá-las, por isso
 * `Calendario.tsx` não precisou mudar uma linha. Código novo importa DAQUI
 * direto, nunca de `Calendario.styled`, senão a aba de cronograma arrasta a
 * cadeia inteira de modais de bancas junto.
 *
 * `EventPill` **não** veio: é a pílula de banca, não primitiva de grade, o
 * cronograma pinta a célula, não empilha pílulas.
 */

import styled, { css } from "styled-components";
import { theme } from "@/styles/theme";

export const MonthGrid = styled.div`
  display: flex;
  flex-direction: column;
`;

export const WeekdayRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-bottom: 1px solid ${theme.colors.border};
`;

export const WeekdayCell = styled.div`
  padding: 0.625rem 0.5rem;
  text-align: center;
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.mutedForeground};
  background: ${theme.colors.secondary};
`;

export const WeekRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  flex: 1;
  min-height: 0;
`;

/**
 * `$compacto` existe para o cronograma, cujas células são pintadas e não
 * empilham pílulas, sem ele, um bloco de mês ocuparia meia tela. O default
 * mantém exatamente o comportamento antigo da tela de bancas.
 */
export const DayCell = styled.div<{ $outside?: boolean; $today?: boolean; $compacto?: boolean }>`
  min-height: ${({ $compacto }) => ($compacto ? "2.75rem" : "7.5rem")};
  padding: 0.375rem;
  border-right: 1px solid ${theme.colors.border};
  border-bottom: 1px solid ${theme.colors.border};
  background: ${({ $outside }) => ($outside ? theme.colors.muted : theme.colors.background)};
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  overflow: hidden;

  /* nth-child é índice de coluna, não dia da semana, continua correto com
     qualquer início de semana. */
  &:nth-child(7n) {
    border-right: none;
  }

  ${WeekRow}:last-child & {
    border-bottom: none;
  }
`;

export const DayNumber = styled.span<{ $today?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.625rem;
  height: 1.625rem;
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: ${({ $today }) => ($today ? theme.colors.primaryForeground : theme.colors.foreground)};

  ${({ $today }) =>
    $today &&
    css`
      border-radius: ${theme.borderRadius.full};
      background: ${theme.colors.primary};
    `}
`;

export const DayEvents = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  flex: 1;
  min-height: 0;
`;

export const WeekGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  min-height: 12rem;
`;
