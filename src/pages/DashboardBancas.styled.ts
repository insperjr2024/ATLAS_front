import styled, { css } from "styled-components";
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

export const KpiCard = styled.div<{ $tone?: "neutro" | "atencao" | "risco" }>`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.xl};
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.card};
  box-shadow: ${theme.shadows.sm};

  ${({ $tone = "neutro" }) =>
    $tone === "risco"
      ? css`
          border-color: color-mix(in srgb, ${theme.colors.destructive} 35%, transparent);
          background: color-mix(in srgb, ${theme.colors.destructive} 5%, ${theme.colors.card});
        `
      : $tone === "atencao"
        ? css`
            border-color: color-mix(in srgb, ${theme.colors.warning} 45%, transparent);
            background: color-mix(in srgb, ${theme.colors.warning} 8%, ${theme.colors.card});
          `
        : css``}
`;

export const KpiRotulo = styled.span`
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.mutedForeground};
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

export const KpiValor = styled.strong`
  font-size: 1.75rem;
  font-weight: ${theme.fontWeight.semibold};
  line-height: 1.1;
  color: ${theme.colors.cardForeground};
`;

export const KpiNota = styled.span`
  font-size: ${theme.fontSize.xs};
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
