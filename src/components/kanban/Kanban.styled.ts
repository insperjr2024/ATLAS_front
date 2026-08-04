import styled, { css } from "styled-components";
import { theme } from "@/styles/theme";
import type { TonsColuna } from "@/lib/colunas-tarefa";

/** O número de colunas é dado, não constante: a diretoria pode criar mais. */
export const Board = styled.div<{ $colunas: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $colunas }) => Math.max(1, $colunas)}, minmax(11rem, 1fr));
  gap: ${theme.spacing.sm};
  overflow-x: auto;
  padding-bottom: ${theme.spacing.sm};
  align-items: start;
`;

export const Coluna = styled.div<{ $sobre?: boolean; $cor?: TonsColuna }>`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
  min-height: 8rem;
  padding: ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.lg};
  /* Ao arrastar por cima, a coluna acende na PRÓPRIA cor — assim o alvo do
     drop diz para onde a tarefa está indo, não só que há um alvo. */
  border: 1px solid
    ${({ $sobre, $cor }) => ($sobre ? ($cor?.ponto ?? theme.colors.ring) : theme.colors.border)};
  background: ${({ $sobre, $cor }) =>
    $sobre ? ($cor?.fundo ?? theme.colors.secondary) : theme.colors.background};
  transition: background ${theme.transitions.fast}, border-color ${theme.transitions.fast};
`;

export const ColunaTitulo = styled.h3`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  margin: 0;
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
`;

/** A pílula do cabeçalho: ponto colorido + rótulo, no molde do board. */
export const ColunaPilula = styled.span<{ $cor: TonsColuna }>`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.15rem 0.5rem;
  border-radius: ${theme.borderRadius.md};
  background: ${({ $cor }) => $cor.fundo};
  color: ${({ $cor }) => $cor.texto};
  white-space: nowrap;
`;

export const Ponto = styled.span<{ $cor: string }>`
  width: 0.5rem;
  height: 0.5rem;
  flex-shrink: 0;
  border-radius: ${theme.borderRadius.full};
  background: ${({ $cor }) => $cor};
`;

export const Contador = styled.span`
  font-variant-numeric: tabular-nums;
  font-weight: ${theme.fontWeight.normal};
  color: ${theme.colors.mutedForeground};
`;

/** A contagem de vencidas, separada — vermelho não pode virar cor de coluna. */
export const ContadorVencidas = styled.span`
  margin-left: auto;
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.destructive};
  white-space: nowrap;
`;

export const Card = styled.div<{ $vencida?: boolean; $arrastando?: boolean; $cor?: TonsColuna }>`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  padding: ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.md};
  /* A borda vermelha de VENCIDA vence a cor da coluna: é sinal de problema,
     não de estado — precisa continuar aparecendo sobre qualquer tinta. */
  border: 1px solid
    ${({ $vencida, $cor }) =>
      $vencida ? theme.colors.destructive : ($cor?.borda ?? theme.colors.border)};
  background: ${({ $cor }) => $cor?.fundo ?? theme.colors.card};
  box-shadow: ${theme.shadows.sm};
  cursor: grab;
  touch-action: none;

  ${({ $arrastando }) =>
    $arrastando &&
    css`
      opacity: 0.4;
      cursor: grabbing;
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

/**
 * ⏰ O sinal de urgência no card.
 *
 * O card mostra só NOME e RESPONSÁVEL; a data fica no detalhe. Este glifo é
 * o único indício de prazo na face — some quando falta tempo (`normal`) e
 * fica mais forte conforme aperta.
 */
export const SinalUrgencia = styled.span<{ $cor: string }>`
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  font-size: 0.8rem;
  line-height: 1;
  color: ${({ $cor }) => $cor};
  cursor: help;
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
