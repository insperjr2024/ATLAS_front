import styled from "styled-components";
import { theme } from "@/styles/theme";

export {
  ModalOverlay,
  ModalHeader,
  ModalTitle,
  ModalClose,
  ModalBody,
  ModalFooter,
  WideModalContent,
  DetailList,
  DetailRow,
  DetailTerm,
  DetailValue,
} from "./Bancas.styled";

export const GreetingHeader = styled.header`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xs};
`;

export const GreetingTitle = styled.h1`
  margin: 0;
  font-size: ${theme.fontSize["2xl"]};
  font-weight: ${theme.fontWeight.bold};
  letter-spacing: -0.01em;
`;

export const GreetingSubtitle = styled.p`
  margin: 0;
  font-size: 0.9rem;
  color: ${theme.colors.mutedForeground};
`;

export const ChartCaption = styled.p`
  margin: ${theme.spacing.md} 0 0;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.mutedForeground};
`;

export const HistoricoRow = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0 0 ${theme.spacing.sm};
  border: none;
  border-bottom: 1px solid ${theme.colors.border};
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease;
  border-radius: ${theme.borderRadius.md};

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  &:hover {
    background: color-mix(in srgb, ${theme.colors.primary} 4%, transparent);
  }

  &:focus-visible {
    outline: 2px solid ${theme.colors.ring};
    outline-offset: 2px;
  }
`;

export const HistoricoVerLabel = styled.span`
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.primary};
  white-space: nowrap;
`;

export const SectionTitle = styled.h3`
  margin: ${theme.spacing.md} 0 ${theme.spacing.sm};
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.semibold};
  color: ${theme.colors.foreground};
`;

export const RespostaItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: ${theme.spacing.sm} 0;
  border-bottom: 1px solid ${theme.colors.border};

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
`;

export const RespostaPergunta = styled.span`
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.foreground};
`;

export const RespostaValor = styled.span`
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.mutedForeground};
`;

export const ComentarioBlock = styled.div`
  margin-top: ${theme.spacing.sm};
  padding: ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.lg};
  background: ${theme.colors.secondary};
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.foreground};
  line-height: 1.5;
`;
