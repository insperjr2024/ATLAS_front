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

export const AvisoSomenteLeitura = styled.p`
  margin: 0;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.mutedForeground};
`;

/* ------------------------------------------------------------------ */
/* Board macro de tarefas — swimlanes por projeto (§7)                 */
/* ------------------------------------------------------------------ */

/**
 * Uma grade só (cabeçalho + uma linha por projeto), não um `Board` por
 * projeto: é o que deixa a coluna "Validação" do projeto A alinhada com a
 * "Validação" do projeto B, faixa embaixo da outra.
 */
export const SwimGrid = styled.div<{ $colunas: number }>`
  display: grid;
  grid-template-columns: 10rem repeat(${({ $colunas }) => Math.max(1, $colunas)}, minmax(11rem, 1fr));
  gap: ${theme.spacing.sm};
  overflow-x: auto;
  padding-bottom: ${theme.spacing.sm};
  align-items: start;

  scrollbar-width: thin;
  scrollbar-color: ${theme.colors.border} transparent;

  &::-webkit-scrollbar {
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: ${theme.colors.border};
    border-radius: ${theme.borderRadius.full};
  }

  &::-webkit-scrollbar-thumb:hover {
    background: ${theme.colors.mutedForeground};
  }
`;

export const SwimHeaderCell = styled.div`
  display: flex;
  align-items: center;
`;

/**
 * A etiqueta do projeto — gruda na esquerda ao rolar pro lado, senão some a
 * única pista de qual linha é qual assim que a coluna A fazer sai da tela.
 *
 * `$cor` é a identidade fixa do projeto: uma barra fininha que não muda
 * mesmo se a ordem das linhas mudar ou a etiqueta sair da tela ao rolar.
 */
export const SwimLabelCell = styled.div<{ $cor?: string }>`
  position: sticky;
  left: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  padding: ${theme.spacing.sm};
  padding-left: 1rem;
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid transparent;
  background: ${theme.colors.muted};
  cursor: pointer;
  transition: border-color ${theme.transitions.fast}, box-shadow ${theme.transitions.fast};

  &::before {
    content: "";
    position: absolute;
    left: 0.375rem;
    top: 0.375rem;
    bottom: 0.375rem;
    width: 3px;
    border-radius: ${theme.borderRadius.full};
    background: ${({ $cor }) => $cor ?? "transparent"};
  }

  &:hover {
    border-color: ${theme.colors.ring};
    box-shadow: ${theme.shadows.md};
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px color-mix(in srgb, ${theme.colors.ring} 30%, transparent);
  }
`;

export const SwimLabelNome = styled.span`
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.foreground};
`;

export const SwimLabelCliente = styled.span`
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
`;

export const SwimCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
  min-height: 3.5rem;
  padding: ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.background};
`;

export const SwimCellVazia = styled.p`
  margin: 0;
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
  text-align: center;
`;
