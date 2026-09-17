import styled from "styled-components";
import { theme } from "@/styles/theme";

export const DocumentoLista = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
`;

export const DocumentoLinha = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing.md};
  width: 100%;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.background};
  cursor: pointer;
  text-align: left;
  font: inherit;
  color: inherit;

  &:hover {
    border-color: ${theme.colors.primary};
  }
`;

export const DocumentoTipo = styled.span`
  font-weight: ${theme.fontWeight.medium};
`;

export const DocumentoMeta = styled.span`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.mutedForeground};
`;

export const TiposDisponiveisRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing.sm};
`;

export const DadosTextarea = styled.textarea`
  width: 100%;
  box-sizing: border-box;
  min-height: 18rem;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${theme.colors.input};
  background: ${theme.colors.background};
  color: ${theme.colors.foreground};
  font-family: ui-monospace, "SF Mono", Menlo, monospace;
  font-size: ${theme.fontSize.xs};
  resize: vertical;

  &:focus {
    outline: none;
    border-color: ${theme.colors.ring};
  }
`;

export const AcoesLinha = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing.sm};
  align-items: center;
`;

export const VersaoLinha = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.xs} 0;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.mutedForeground};

  & + & {
    border-top: 1px solid ${theme.colors.border};
  }
`;
