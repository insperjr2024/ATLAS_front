import styled from "styled-components";
import { theme } from "@/styles/theme";

/* ---- Avaliadores agrupados por (liderança|membro) × frente ----
 *
 * Saiu de `pages/projetos/ProjetoBanca.styled` quando o mesmo bloco passou a
 * ser usado no "ver mais" da página /bancas — código de dois lugares não pode
 * morar dentro da pasta de um deles. */

export const GrupoAvaliadores = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;

  & + & {
    margin-top: 0.5rem;
  }
`;

export const GrupoCabecalho = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  flex-wrap: wrap;
`;

export const GrupoRotulo = styled.span`
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.semibold};
  color: ${theme.colors.foreground};
`;

/**
 * "2/3" ao lado do rótulo do grupo. `$estado` pinta: falta gente
 * (destructive), lotado (warning) ou completo (mutedForeground).
 */
export const GrupoCota = styled.span<{ $estado: "falta" | "lotado" | "ok" }>`
  font-size: ${theme.fontSize.xs};
  font-variant-numeric: tabular-nums;
  color: ${({ $estado }) =>
    $estado === "falta"
      ? theme.colors.destructive
      : $estado === "lotado"
        ? theme.colors.warning
        : theme.colors.mutedForeground};
`;

export const GrupoVazio = styled.span`
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
  padding-left: 1rem;
`;

export const ListaNomes = styled.ul`
  margin: 0;
  padding-left: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.foreground};
`;
