/**
 * O chrome de modal compartilhado do app, overlay, caixa, cabeçalho, corpo e
 * rodapé.
 *
 * Saiu de `pages/Calendario.styled.ts`, que passou a re-exportá-lo, por isso
 * os 11 arquivos que já importavam de lá não precisaram mudar uma linha. É o
 * mesmo movimento que `components/calendario/CalendarGrid.styled.ts` fez com
 * as primitivas de grade, e pelo mesmo motivo: código novo importa DAQUI, e
 * não de `Calendario.styled`, senão puxa junto a cadeia de modais de bancas.
 *
 * Aqui mora só o chrome. Os padrões de CONTEÚDO (`ModalDetailList`,
 * `DetailRow`…) ficaram em `Calendario.styled` de propósito: são a forma de
 * exibir um evento de calendário, não estrutura de modal.
 */

import styled from "styled-components";
import { theme } from "@/styles/theme";

export const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.md};
  background: rgb(0 0 0 / 45%);
`;

export const ModalContent = styled.div`
  width: 100%;
  max-width: 28rem;
  max-height: min(90vh, 640px);
  overflow-y: auto;
  border-radius: ${theme.borderRadius.xl};
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.card};
  box-shadow: ${theme.shadows.lg};
`;

export const ModalHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.lg};
  border-bottom: 1px solid ${theme.colors.border};
`;

export const ModalTitle = styled.h2`
  margin: 0;
  font-size: ${theme.fontSize.lg};
  font-weight: ${theme.fontWeight.semibold};
`;

export const ModalClose = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: ${theme.borderRadius.md};
  background: transparent;
  color: ${theme.colors.mutedForeground};
  cursor: pointer;

  &:hover {
    background: ${theme.colors.muted};
    color: ${theme.colors.foreground};
  }

  /* 32px é confortável com um mouse e pequeno demais para o polegar — e este é
     o botão que tira a pessoa de um modal em tela cheia, ou seja, o pior lugar
     para errar o alvo. O ícone dentro não muda de tamanho, só a área de toque. */
  @media (max-width: ${theme.breakpoints.md}px) {
    width: 2.75rem;
    height: 2.75rem;
  }
`;

export const ModalBody = styled.div`
  padding: ${theme.spacing.lg};
`;

export const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  border-top: 1px solid ${theme.colors.border};
`;
