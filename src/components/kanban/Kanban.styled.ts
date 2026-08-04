import styled, { css } from "styled-components";
import { theme } from "@/styles/theme";

export const Board = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(11rem, 1fr));
  gap: ${theme.spacing.sm};
  overflow-x: auto;
  padding-bottom: ${theme.spacing.sm};
  align-items: start;
`;

export const Coluna = styled.div<{ $sobre?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
  min-height: 8rem;
  padding: ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${({ $sobre }) => ($sobre ? theme.colors.ring : theme.colors.border)};
  background: ${({ $sobre }) => ($sobre ? theme.colors.secondary : theme.colors.background)};
  transition: background ${theme.transitions.fast}, border-color ${theme.transitions.fast};
`;

export const ColunaTitulo = styled.h3`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0;
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.semibold};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${theme.colors.mutedForeground};
`;

export const Contador = styled.span`
  font-variant-numeric: tabular-nums;
  font-weight: ${theme.fontWeight.normal};
`;

export const Card = styled.div<{ $vencida?: boolean; $arrastando?: boolean; $bloqueada?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  padding: ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${({ $vencida }) => ($vencida ? theme.colors.destructive : theme.colors.border)};
  background: ${theme.colors.card};
  box-shadow: ${theme.shadows.sm};
  cursor: grab;
  touch-action: none;

  ${({ $arrastando }) =>
    $arrastando &&
    css`
      opacity: 0.4;
      cursor: grabbing;
    `}

  /* Card sem transição manual válida (ex.: Vendido) ou cujo destino é
     ambíguo pra arrastar (Pausado — retoma pelo botão da página do
     projeto): mesma cor de sempre, só sem convite a arrastar. */
  ${({ $bloqueada }) =>
    $bloqueada &&
    css`
      cursor: default;
      opacity: 0.75;
    `}

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px color-mix(in srgb, ${theme.colors.ring} 30%, transparent);
  }
`;

export const CardTopo = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.25rem;
`;

export const BotaoExcluir = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0.1rem;
  border: none;
  border-radius: ${theme.borderRadius.sm};
  background: transparent;
  color: ${theme.colors.mutedForeground};
  cursor: pointer;
  opacity: 0;
  transition: opacity ${theme.transitions.fast};

  ${Card}:hover &,
  &:focus-visible {
    opacity: 1;
  }

  &:hover {
    color: ${theme.colors.destructive};
    background: ${theme.colors.muted};
  }
`;

export const CardTitulo = styled.span`
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.foreground};
  line-height: 1.35;
`;

export const CardMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.25rem;
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
`;

/** 🚨 O badge de vencida — derivado do prazo, sem campo booleano no banco. */
export const BadgeVencida = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0.05rem 0.375rem;
  border-radius: ${theme.borderRadius.full};
  background: color-mix(in srgb, ${theme.colors.destructive} 12%, white);
  color: ${theme.colors.destructive};
  font-weight: ${theme.fontWeight.medium};
`;

export const ColunaVazia = styled.p`
  margin: 0;
  padding: ${theme.spacing.sm} 0;
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
  text-align: center;
`;

/* ------------------------------------------------------------------ */
/* Faixa da reunião semanal (§6.4)                                     */
/* ------------------------------------------------------------------ */

export const FaixaSemana = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: ${theme.spacing.sm};
`;

export const DiaSemana = styled.button<{ $registrado?: boolean; $padrao?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: ${theme.spacing.sm} 0.25rem;
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid
    ${({ $registrado, $padrao }) =>
      $registrado
        ? theme.colors.success
        : $padrao
          ? theme.colors.ring
          : theme.colors.border};
  background: ${({ $registrado }) =>
    $registrado ? `color-mix(in srgb, ${theme.colors.success} 12%, white)` : theme.colors.background};
  cursor: pointer;
  transition: background ${theme.transitions.fast}, border-color ${theme.transitions.fast};

  &:hover:not(:disabled) {
    background: ${theme.colors.muted};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

export const DiaRotulo = styled.span`
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.mutedForeground};
`;

export const DiaNumero = styled.span<{ $hoje?: boolean }>`
  font-size: ${theme.fontSize.base};
  font-weight: ${({ $hoje }) => ($hoje ? theme.fontWeight.bold : theme.fontWeight.medium)};
  color: ${theme.colors.foreground};
`;

export const DiaMarca = styled.span`
  font-size: ${theme.fontSize.xs};
  line-height: 1;
  min-height: 1rem;
`;

export const NavegacaoSemana = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing.sm};
  margin-bottom: ${theme.spacing.md};
`;

export const SemanaRotulo = styled.span`
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.foreground};
`;
