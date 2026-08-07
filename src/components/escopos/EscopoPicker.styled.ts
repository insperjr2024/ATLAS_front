import styled from "styled-components";
import { theme } from "@/styles/theme";
import { FieldInput } from "@/pages/Bancas.styled";

export const EscopoLista = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
`;

export const EscopoLinha = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${theme.spacing.sm};
  align-items: center;

  @media (min-width: ${theme.breakpoints.md}px) {
    grid-template-columns: 1.75rem minmax(0, 2fr) minmax(0, 1fr) 6rem 2rem;
  }
`;

/** As duas setinhas empilhadas — reordena a lista antes de criar o projeto,
 *  não depois: mudar a ordem de escopo já salvo é outra tela, outro botão. */
export const MoverBotoes = styled.div`
  display: flex;
  flex-direction: row;
  gap: 0.125rem;

  @media (min-width: ${theme.breakpoints.md}px) {
    flex-direction: column;
  }
`;

export const MoverBotao = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 1.1rem;
  width: 1.75rem;
  border: none;
  border-radius: ${theme.borderRadius.sm};
  background: transparent;
  color: ${theme.colors.mutedForeground};
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${theme.colors.muted};
    color: ${theme.colors.foreground};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.3;
  }
`;

export const DiasInput = styled(FieldInput)`
  text-align: right;
`;

export const RemoverBotao = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 2.25rem;
  width: 2rem;
  border: none;
  border-radius: ${theme.borderRadius.lg};
  background: transparent;
  color: ${theme.colors.mutedForeground};
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${theme.colors.muted};
    color: ${theme.colors.destructive};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

export const PickerRodape = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding-top: ${theme.spacing.sm};
  border-top: 1px dashed ${theme.colors.border};

  select {
    flex: 1;
    min-width: 12rem;
  }
`;
