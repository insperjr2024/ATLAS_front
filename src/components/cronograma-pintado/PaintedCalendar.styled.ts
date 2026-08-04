import styled, { css } from "styled-components";
import { theme } from "@/styles/theme";
import { DayCell, MonthGrid } from "@/components/calendario/CalendarGrid.styled";
import { COR_NAO_UTIL } from "./cores";

export const CronogramaScroll = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.lg};
  max-height: 60vh;
  overflow-y: auto;
  padding-right: ${theme.spacing.sm};

  /* Enquanto arrasta, a seleção de texto nativa sobre a grade é o item nº 1
     que faz um drag caseiro parecer quebrado. O touch-action impede o
     navegador móvel de rolar em vez de pintar. */
  user-select: none;
  touch-action: none;

  /* Durante o export, o container não pode estar cortado nem rolado.
     ⚠ Seletor de DESCENDENTE, e não "&.exportando": a classe é aplicada no
     wrapper que envolve grade + legenda (CronogramaLayout), não neste
     elemento. Com "&.exportando" a regra nunca casava, e o PNG saía cortado
     na altura do scroll. */
  .exportando & {
    max-height: none;
    overflow: visible;
  }
`;

export const BlocoMes = styled(MonthGrid)`
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.lg};
  overflow: hidden;
  background: ${theme.colors.background};
`;

export const TituloMes = styled.h3`
  margin: 0;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.semibold};
  text-transform: capitalize;
  color: ${theme.colors.foreground};
  background: ${theme.colors.secondary};
  border-bottom: 1px solid ${theme.colors.border};
`;

/**
 * A célula pintável. Herda a grade compartilhada e acrescenta só o que é do
 * cronograma — a primitiva continua limpa para a tela de bancas.
 */
export const PaintedDayCell = styled(DayCell)<{
  $cor?: string;
  $texto?: string;
  $naoUtil?: boolean;
  $preview?: boolean;
  $pintavel?: boolean;
  $vazia?: boolean;
}>`
  min-height: 3rem;
  align-items: flex-start;
  justify-content: flex-start;
  position: relative;
  cursor: ${({ $pintavel }) => ($pintavel ? "cell" : "default")};

  ${({ $vazia }) =>
    $vazia &&
    css`
      /* Dia de mês vizinho: some por completo. Com meses empilhados, a mesma
         data apareceria em DOIS blocos — o que quebra o hit-test e fica feio
         no PNG. */
      background: transparent;
      border-color: transparent;
      pointer-events: none;
    `}

  ${({ $naoUtil }) =>
    $naoUtil &&
    css`
      /* A hachura é o que sobrevive à impressão em preto-e-branco e ao PNG
         exportado — cor sozinha não. */
      background-color: ${COR_NAO_UTIL};
      background-image: repeating-linear-gradient(
        45deg,
        transparent,
        transparent 3px,
        rgba(0, 0, 0, 0.05) 3px,
        rgba(0, 0, 0, 0.05) 6px
      );
      cursor: not-allowed;
    `}

  ${({ $cor, $naoUtil }) =>
    $cor &&
    !$naoUtil &&
    css`
      background-color: ${$cor};
    `}

  ${({ $preview }) =>
    $preview &&
    css`
      outline: 2px dashed ${theme.colors.foreground};
      outline-offset: -3px;
    `}
`;

export const NumeroDia = styled.span<{ $texto?: string; $hoje?: boolean }>`
  font-size: ${theme.fontSize.xs};
  font-weight: ${({ $hoje }) => ($hoje ? theme.fontWeight.bold : theme.fontWeight.medium)};
  color: ${({ $texto }) => $texto ?? theme.colors.foreground};
  ${({ $hoje }) =>
    $hoje &&
    css`
      text-decoration: underline;
      text-underline-offset: 2px;
    `}
`;

/** Os glifos de marco sobrepostos ao preenchimento — ★ banca, ● entrega… */
export const MarcoGlifo = styled.span`
  position: absolute;
  right: 0.2rem;
  bottom: 0.15rem;
  font-size: 0.7rem;
  line-height: 1;
`;

/* ------------------------------------------------------------------ */
/* Barra de ferramentas e legenda                                      */
/* ------------------------------------------------------------------ */

export const Barra = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding-bottom: ${theme.spacing.md};
`;

export const PincelAtivo = styled.span<{ $cor: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  border-radius: ${theme.borderRadius.full};
  border: 1px solid ${({ $cor }) => $cor};
  background: color-mix(in srgb, ${({ $cor }) => $cor} 12%, white);
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.foreground};
`;

export const ContadorDias = styled.span`
  font-size: ${theme.fontSize.xs};
  font-variant-numeric: tabular-nums;
  color: ${theme.colors.mutedForeground};
`;

export const CronogramaLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${theme.spacing.lg};

  @media (min-width: ${theme.breakpoints.lg}px) {
    grid-template-columns: 1fr 15rem;
    align-items: start;
  }
`;

export const LegendaBox = styled.aside`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.lg};
  background: ${theme.colors.card};

  @media (min-width: ${theme.breakpoints.lg}px) {
    position: sticky;
    top: ${theme.spacing.md};
  }

  .exportando & {
    position: static;
  }
`;

export const LegendaGrupo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`;

export const LegendaTitulo = styled.h4`
  margin: 0;
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.semibold};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${theme.colors.mutedForeground};
`;

export const LegendaItem = styled.button<{ $ativa?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.3rem 0.375rem;
  border: 1px solid ${({ $ativa }) => ($ativa ? theme.colors.ring : "transparent")};
  border-radius: ${theme.borderRadius.md};
  background: ${({ $ativa }) => ($ativa ? theme.colors.secondary : "transparent")};
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.foreground};
  text-align: left;
  cursor: pointer;

  &:hover {
    background: ${theme.colors.muted};
  }
`;

export const Amostra = styled.span<{ $cor: string }>`
  width: 0.75rem;
  height: 0.75rem;
  flex-shrink: 0;
  border-radius: ${theme.borderRadius.sm};
  background: ${({ $cor }) => $cor};
`;

export const LegendaTexto = styled.span`
  display: flex;
  flex-direction: column;
  min-width: 0;

  strong {
    font-weight: ${theme.fontWeight.medium};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  small {
    font-size: 0.65rem;
    color: ${theme.colors.mutedForeground};
  }
`;

export const AmostraHachurada = styled.span`
  width: 0.75rem;
  height: 0.75rem;
  flex-shrink: 0;
  border-radius: ${theme.borderRadius.sm};
  background-color: ${COR_NAO_UTIL};
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.12) 2px,
    rgba(0, 0, 0, 0.12) 4px
  );
`;
