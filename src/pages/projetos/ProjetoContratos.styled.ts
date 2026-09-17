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

export const FormSecoes = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.lg};
`;

export const FormSecaoTitulo = styled.h3`
  margin: 0 0 ${theme.spacing.sm};
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.semibold};
  color: ${theme.colors.foreground};
`;

export const FormSubsecaoTitulo = styled.h4`
  margin: ${theme.spacing.md} 0 ${theme.spacing.sm};
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.mutedForeground};
  text-transform: uppercase;
  letter-spacing: 0.03em;
`;

export const FormGrid = styled.div<{ $colunas?: 2 | 3 }>`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${theme.spacing.md};

  @media (min-width: ${theme.breakpoints.sm}px) {
    grid-template-columns: repeat(${({ $colunas = 2 }) => $colunas}, minmax(0, 1fr));
  }
`;

export const ListaLinha = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};

  > *:first-child {
    flex: 1;
  }
`;

export const ListaRemoverBotao = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  flex-shrink: 0;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.background};
  color: ${theme.colors.mutedForeground};
  cursor: pointer;
  font-size: ${theme.fontSize.sm};

  &:hover {
    border-color: ${theme.colors.destructive};
    color: ${theme.colors.destructive};
  }
`;

export const ListaAdicionarBotao = styled.button`
  align-self: flex-start;
  border: none;
  background: none;
  padding: 0;
  color: ${theme.colors.primary};
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
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
