import styled from "styled-components";
import { Link as RouterLink } from "react-router-dom";
import { theme } from "@/styles/theme";
import { FUNDO_COR, SOLIDO_COR, TEXTO_COR } from "@/components/health-track/HealthTrack.styled";
import type { CorHealthTrack } from "@/lib/health-track";

/** Os quatro cards de contagem do topo, mais os de alerta. */
export const Placar = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: ${theme.spacing.sm};
`;

export const PlacarItem = styled.div<{ $cor?: CorHealthTrack }>`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${({ $cor }) => ($cor ? SOLIDO_COR[$cor] : theme.colors.border)};
  background: ${({ $cor }) => ($cor ? FUNDO_COR[$cor] : theme.colors.card)};
  color: ${({ $cor }) => ($cor ? TEXTO_COR[$cor] : theme.colors.foreground)};
  min-width: 0;

  strong {
    font-size: ${theme.fontSize["2xl"]};
    font-weight: ${theme.fontWeight.bold};
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
    line-height: 1.15;
  }

  span {
    font-size: ${theme.fontSize.sm};
    font-weight: ${theme.fontWeight.semibold};
  }

  small {
    font-size: ${theme.fontSize.xs};
    opacity: 0.85;
  }
`;

/** A tabela do mapa: um projeto por linha, um pilar por coluna. */
export const Rolagem = styled.div`
  overflow: auto;
  max-height: 70vh;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.lg};
`;

export const Mapa = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: ${theme.fontSize.sm};

  th,
  td {
    padding: 0.5rem 0.6rem;
    border-bottom: 1px solid ${theme.colors.border};
    white-space: nowrap;
    vertical-align: middle;
  }

  th {
    position: sticky;
    top: 0;
    z-index: 1;
    background: ${theme.colors.muted};
    color: ${theme.colors.mutedForeground};
    font-size: ${theme.fontSize.xs};
    font-weight: ${theme.fontWeight.semibold};
    text-transform: uppercase;
    letter-spacing: 0.04em;
    text-align: left;
  }

  th.pilar,
  td.pilar {
    text-align: center;
    width: 3.5rem;
  }

  tbody tr {
    cursor: pointer;
  }

  tbody tr:hover td {
    background: ${theme.colors.muted};
  }

  tbody tr:last-child td {
    border-bottom: none;
  }
`;

export const NomeProjeto = styled(RouterLink)`
  color: ${theme.colors.foreground};
  font-weight: ${theme.fontWeight.medium};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

export const Secundario = styled.span`
  display: block;
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
  white-space: normal;
`;

/** A célula do heatmap: o fundo é a cor, o ícone é a forma. */
export const Celula = styled.span<{ $cor: CorHealthTrack | null }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: ${theme.borderRadius.md};
  background: ${({ $cor }) => ($cor ? SOLIDO_COR[$cor] : theme.colors.muted)};
  color: ${({ $cor }) => ($cor ? "white" : theme.colors.mutedForeground)};
  border: 1px dashed ${({ $cor }) => ($cor ? "transparent" : theme.colors.border)};

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

export const Tendencia = styled.span<{ $rumo: "melhorou" | "piorou" | "igual" }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
  color: ${({ $rumo }) =>
    $rumo === "melhorou"
      ? TEXTO_COR.verde
      : $rumo === "piorou"
        ? TEXTO_COR.vermelho
        : theme.colors.mutedForeground};

  svg {
    width: 0.9rem;
    height: 0.9rem;
  }
`;

export const Legenda = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing.md};
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};

  span {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }
`;

export const Voltar = styled(RouterLink)`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.mutedForeground};
  text-decoration: none;

  &:hover {
    color: ${theme.colors.foreground};
  }

  svg {
    width: 1rem;
    height: 1rem;
  }
`;
