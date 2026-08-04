import styled from "styled-components";
import { NavLink } from "react-router-dom";
import { theme } from "@/styles/theme";

export {
  PageHeaderRow,
  PageHeaderText,
  PageHeading,
  PageSubheading,
  FieldSelect,
  DataTable,
  TableHead,
  TableHeadCell,
  TableBody,
  TableRow,
  TableCell,
  NameCell,
} from "../Bancas.styled";

export const TabBar = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  border-bottom: 1px solid ${theme.colors.border};
`;

export const TabLink = styled(NavLink)`
  padding: 0.5rem 0.875rem;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.mutedForeground};
  text-decoration: none;

  &:hover {
    color: ${theme.colors.foreground};
  }

  &.active {
    color: ${theme.colors.primary};
    border-bottom-color: ${theme.colors.primary};
  }
`;

export const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
  gap: ${theme.spacing.md};
`;

export const KpiCard = styled.div<{ $destaque?: "alerta" | "ok" }>`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.xl};
  border: 1px solid
    ${({ $destaque }) =>
      $destaque === "alerta"
        ? `color-mix(in srgb, ${theme.colors.destructive} 35%, transparent)`
        : theme.colors.border};
  background: ${theme.colors.card};
  box-shadow: ${theme.shadows.sm};
`;

export const KpiValor = styled.strong<{ $destaque?: "alerta" | "ok" }>`
  font-size: ${theme.fontSize["2xl"]};
  font-weight: ${theme.fontWeight.bold};
  font-variant-numeric: tabular-nums;
  color: ${({ $destaque }) =>
    $destaque === "alerta"
      ? theme.colors.destructive
      : $destaque === "ok"
        ? theme.colors.success
        : theme.colors.foreground};
`;

export const KpiRotulo = styled.span`
  font-size: ${theme.fontSize.xs};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${theme.colors.mutedForeground};
`;

export const PainelGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${theme.spacing.lg};

  @media (min-width: ${theme.breakpoints.lg}px) {
    grid-template-columns: 1fr 1fr;
  }
`;

export const ListaSimples = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const ItemLista = styled.li`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${theme.spacing.sm};
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.foreground};

  small {
    font-size: ${theme.fontSize.xs};
    color: ${theme.colors.mutedForeground};
    white-space: nowrap;
  }
`;

/** §7.1: cada item traz o MOTIVO e há quanto tempo — nunca rótulo genérico. */
export const ItemAtencao = styled.li`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  padding: 0.5rem 0.625rem;
  border-left: 3px solid ${theme.colors.destructive};
  border-radius: 0 ${theme.borderRadius.md} ${theme.borderRadius.md} 0;
  background: color-mix(in srgb, ${theme.colors.destructive} 5%, white);

  strong {
    font-size: ${theme.fontSize.sm};
    font-weight: ${theme.fontWeight.medium};
  }

  span {
    font-size: ${theme.fontSize.xs};
    color: ${theme.colors.mutedForeground};
  }
`;

/** A tendência de entregas — barras simples, sem lib de gráfico nova. */
export const Sparkline = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 0.25rem;
  height: 3.5rem;
  padding-top: ${theme.spacing.sm};
`;

export const SparkBarra = styled.div<{ $altura: number }>`
  flex: 1;
  min-height: 2px;
  height: ${({ $altura }) => Math.max(2, $altura)}%;
  border-radius: ${theme.borderRadius.sm} ${theme.borderRadius.sm} 0 0;
  background: ${theme.colors.success};
`;

export const SparkRotulos = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.65rem;
  color: ${theme.colors.mutedForeground};
`;

export const Pilula = styled.span<{ $tom: "ok" | "alerta" | "neutro" }>`
  display: inline-flex;
  padding: 0.05rem 0.5rem;
  border-radius: ${theme.borderRadius.full};
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
  background: ${({ $tom }) =>
    $tom === "ok"
      ? `color-mix(in srgb, ${theme.colors.success} 14%, white)`
      : $tom === "alerta"
        ? `color-mix(in srgb, ${theme.colors.destructive} 12%, white)`
        : theme.colors.muted};
  color: ${({ $tom }) =>
    $tom === "ok"
      ? theme.colors.success
      : $tom === "alerta"
        ? theme.colors.destructive
        : theme.colors.mutedForeground};
`;

export const FrenteTravadaAviso = styled.span`
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
`;
