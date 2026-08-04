import styled from "styled-components";
import { theme } from "@/styles/theme";

export {
  PageHeaderRow,
  PageHeaderText,
  PageHeading,
  PageSubheading,
  ModalOverlay,
  ModalHeader,
  ModalTitle,
  ModalClose,
  ModalBody,
  ModalFooter,
  NarrowModalContent,
  DetailList,
  DetailRow,
  DetailTerm,
  DetailValue,
} from "./Bancas.styled";

export const Cabecalho = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-bottom: none;
  border-radius: ${theme.borderRadius.xl} ${theme.borderRadius.xl} 0 0;
  background: ${theme.colors.card};
`;

export const MesAtual = styled.strong`
  font-size: ${theme.fontSize.base};
  font-weight: ${theme.fontWeight.semibold};
  text-transform: capitalize;
  color: ${theme.colors.foreground};
`;

export const GradeWrap = styled.div`
  border: 1px solid ${theme.colors.border};
  border-radius: 0 0 ${theme.borderRadius.xl} ${theme.borderRadius.xl};
  overflow: hidden;
  background: ${theme.colors.card};
`;

export const FiltroChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
`;

/** Filtro por tipo — glifo + cor, para funcionar impresso também. */
export const Chip = styled.button<{ $ativo: boolean; $cor: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.625rem;
  border-radius: ${theme.borderRadius.full};
  border: 1px solid ${({ $ativo, $cor }) => ($ativo ? $cor : theme.colors.border)};
  background: ${({ $ativo, $cor }) =>
    $ativo ? `color-mix(in srgb, ${$cor} 14%, white)` : theme.colors.background};
  color: ${({ $ativo, $cor }) => ($ativo ? $cor : theme.colors.mutedForeground)};
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
  cursor: pointer;

  &:hover {
    border-color: ${({ $cor }) => $cor};
  }
`;

export const Pilula = styled.button<{ $cor: string }>`
  display: flex;
  align-items: center;
  gap: 0.2rem;
  width: 100%;
  padding: 0.15rem 0.3rem;
  border: 1px solid color-mix(in srgb, ${({ $cor }) => $cor} 40%, transparent);
  border-radius: ${theme.borderRadius.sm};
  background: color-mix(in srgb, ${({ $cor }) => $cor} 12%, white);
  color: ${({ $cor }) => $cor};
  font-size: 0.68rem;
  font-weight: ${theme.fontWeight.medium};
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  line-height: 1.3;

  &:hover {
    background: color-mix(in srgb, ${({ $cor }) => $cor} 22%, white);
  }
`;

export const MaisEventos = styled.span`
  font-size: 0.62rem;
  color: ${theme.colors.mutedForeground};
`;
