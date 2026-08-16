import styled from "styled-components";
import { theme } from "@/styles/theme";

/* ------------------------------------------------------------------ */
/* Faixa de indicadores                                                 */
/* ------------------------------------------------------------------ */

/**
 * Os quatro números do topo. `auto-fit` em vez de 4 colunas fixas: no notebook
 * de 13" da sala eles ficariam estreitos demais e o número quebraria linha.
 */
export const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
  gap: ${theme.spacing.md};
`;

export const KpiCard = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.card};
  box-shadow: ${theme.shadows.sm};
`;

/** O tom vive no ícone, não mais pintando o card inteiro — um card neutro
 *  ao lado de um card em alerta precisa continuar parecendo do mesmo
 *  produto, só o ícone é que muda de cor. */
export const KpiIcone = styled.span<{ $tone?: "neutro" | "atencao" | "risco" }>`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: ${theme.borderRadius.md};
  background: ${({ $tone = "neutro" }) =>
    $tone === "risco"
      ? `color-mix(in srgb, ${theme.colors.destructive} 14%, transparent)`
      : $tone === "atencao"
        ? `color-mix(in srgb, ${theme.colors.warning} 20%, transparent)`
        : `color-mix(in srgb, ${theme.colors.foreground} 6%, transparent)`};
  color: ${({ $tone = "neutro" }) =>
    $tone === "risco"
      ? theme.colors.destructive
      : $tone === "atencao"
        ? theme.colors.warning
        : theme.colors.mutedForeground};
`;

export const KpiTexto = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
`;

export const KpiRotulo = styled.span`
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.semibold};
  color: ${theme.colors.foreground};
`;

export const KpiValor = styled.strong`
  font-size: ${theme.fontSize["2xl"]};
  font-weight: ${theme.fontWeight.bold};
  line-height: 1.15;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  color: ${theme.colors.cardForeground};
`;

export const KpiNota = styled.span`
  font-size: ${theme.fontSize.xs};
  line-height: 1.3;
  color: ${theme.colors.mutedForeground};
`;

/* ------------------------------------------------------------------ */
/* Listas de acompanhamento                                             */
/* ------------------------------------------------------------------ */

/** Linha de lista com o rótulo à esquerda e o selo/prazo à direita. */
export const InsightLinha = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.sm} ${theme.spacing.lg};

  & + & {
    border-top: 1px solid ${theme.colors.border};
  }
`;

export const InsightTexto = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
`;

export const InsightNome = styled.span`
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.cardForeground};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const InsightMeta = styled.span`
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
`;

export const InsightAcoes = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  flex-shrink: 0;
`;
