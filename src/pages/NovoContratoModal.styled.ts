import styled from "styled-components";
import { theme } from "@/styles/theme";

/** A lista de projetos do passo "escolher projeto" — antes era uma pilha de
 *  `PageButton` outline, uma caixa inteira por linha (borda + respiro dos
 *  dois lados de cada botão), o que faz uma lista de 15+ projetos virar uma
 *  parede de retângulos idênticos. Uma caixa só por fora, linhas por dentro. */
export const ListaProjetos = styled.div`
  display: flex;
  flex-direction: column;
  max-height: 16rem;
  overflow-y: auto;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
`;

export const ProjetoOpcao = styled.button`
  display: flex;
  align-items: baseline;
  gap: 0.375rem;
  padding: 0.625rem 0.875rem;
  border: none;
  border-bottom: 1px solid ${theme.colors.border};
  background: transparent;
  text-align: left;
  cursor: pointer;

  &:last-child {
    border-bottom: none;
  }

  &:hover:not(:disabled) {
    background: ${theme.colors.muted};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

export const ProjetoNome = styled.span`
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.foreground};
`;

export const ProjetoCliente = styled.span`
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
`;
