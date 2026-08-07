import styled from "styled-components";
import { theme } from "@/styles/theme";

/** Os selects do montador. `auto-fit` porque o número de campos muda: métrica
 *  só aparece em soma/média, período só quando a dimensão é data. */
export const MontadorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
  gap: ${theme.spacing.md};
`;

export const CampoMontador = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
`;

export const RotuloMontador = styled.label`
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.mutedForeground};
`;

export const SelectMontador = styled.select`
  padding: 0.375rem 0.5rem;
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.card};
  color: ${theme.colors.foreground};
  font-size: ${theme.fontSize.sm};

  &:disabled {
    background: ${theme.colors.muted};
    color: ${theme.colors.mutedForeground};
    cursor: not-allowed;
  }
`;

/** A explicação da tabela escolhida. É o que dispensa conhecer o banco. */
export const DescricaoFonte = styled.p`
  margin: ${theme.spacing.md} 0 0;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border-left: 3px solid ${theme.colors.border};
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.mutedForeground};
`;

export const TipoBotoes = styled.div`
  display: flex;
  gap: ${theme.spacing.xs};
  flex-wrap: wrap;
`;

export const ResumoLinha = styled.p`
  margin: ${theme.spacing.sm} 0 0;
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
  text-align: right;
`;
