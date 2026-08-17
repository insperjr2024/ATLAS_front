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

export const TipoBotoes = styled.div`
  display: flex;
  gap: ${theme.spacing.xs};
  flex-wrap: wrap;
`;

/**
 * O aviso de que as categorias se sobrepõem, entre o título e o gráfico.
 *
 * ⭐ **Fica ANTES das barras de propósito.** Ninguém olha um gráfico chamado
 * "Projetos por frente" sem somar as barras, e a soma dá um número que não
 * existe — 66 onde há 61 projetos. Dito só no rodapé, o aviso chega depois de
 * a conta errada já ter sido feita.
 *
 * Uma linha, não um parágrafo: é ressalva, não documentação.
 */
export const AvisoSobreposicao = styled.p`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin: 0 0 ${theme.spacing.sm};
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};

  svg {
    flex-shrink: 0;
  }
`;

export const ResumoLinha = styled.p`
  margin: ${theme.spacing.sm} 0 0;
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
  text-align: right;
`;
