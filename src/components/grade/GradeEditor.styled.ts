import styled from "styled-components";
import { theme } from "@/styles/theme";

/**
 * O quadro é desenhado para lembrar a grade do próprio Insper, mesma
 * disposição de "Horário Início / Horário Término" à esquerda e os dias em
 * colunas. É o formato que o membro já lê todo semestre; copiar a forma evita
 * ter que explicar como preencher.
 */

/** Rolagem própria: em tela estreita o quadro escorrega em vez de espremer as
 *  colunas até o dia virar duas letras. */
export const QuadroWrap = styled.div`
  overflow-x: auto;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.lg};
`;

export const Quadro = styled.table`
  width: 100%;
  min-width: 44rem;
  border-collapse: collapse;
  table-layout: fixed;
`;

export const CabecalhoCelula = styled.th`
  padding: ${theme.spacing.sm} ${theme.spacing.xs};
  background: ${theme.colors.muted};
  border: 1px solid ${theme.colors.border};
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.semibold};
  color: ${theme.colors.cardForeground};
  text-align: center;
`;

/** As duas colunas de horário: estreitas e fixas, como na grade original. */
export const CabecalhoHora = styled(CabecalhoCelula)`
  width: 5.5rem;
  font-size: ${theme.fontSize.xs};
`;

export const CelulaHora = styled.td`
  padding: ${theme.spacing.sm} ${theme.spacing.xs};
  background: ${theme.colors.muted};
  border: 1px solid ${theme.colors.border};
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.cardForeground};
  text-align: center;
  white-space: nowrap;
`;

export const CelulaDia = styled.td`
  padding: 0;
  border: 1px solid ${theme.colors.border};
  height: 3.5rem;
`;

/**
 * A célula clicável ocupa a área inteira, o alvo é o bloco todo, não um
 * quadradinho no meio. `button` de verdade para o quadro andar no teclado e
 * ser lido por leitor de tela.
 */
export const BotaoCelula = styled.button<{ $marcada: boolean }>`
  display: block;
  width: 100%;
  height: 100%;
  min-height: 3.5rem;
  border: none;
  cursor: pointer;
  font: inherit;
  transition: background 0.12s ease;

  background: ${({ $marcada }) =>
    $marcada ? theme.colors.primary : theme.colors.card};

  &:hover {
    background: ${({ $marcada }) =>
      $marcada
        ? `color-mix(in srgb, ${theme.colors.primary} 85%, black)`
        : `color-mix(in srgb, ${theme.colors.primary} 12%, white)`};
  }

  &:focus-visible {
    outline: 2px solid ${theme.colors.primary};
    outline-offset: -3px;
  }
`;

export const Rodape = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing.md};
  flex-wrap: wrap;
  margin-top: ${theme.spacing.md};
`;

export const Resumo = styled.span`
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.mutedForeground};
`;

export const Acoes = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
`;
