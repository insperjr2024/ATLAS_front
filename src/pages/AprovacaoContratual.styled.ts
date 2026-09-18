import styled from "styled-components";
import { theme } from "@/styles/theme";

export const AprovacaoWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${theme.colors.muted};
`;

export const AprovacaoHeader = styled.header`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  background: ${theme.colors.background};
  border-bottom: 1px solid ${theme.colors.border};
`;

export const AprovacaoLogo = styled.img`
  height: 2rem;
  width: auto;
`;

export const AprovacaoTitulo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;

  h1 {
    margin: 0;
    font-size: ${theme.fontSize.base};
    font-weight: ${theme.fontWeight.semibold};
  }

  span {
    font-size: ${theme.fontSize.sm};
    color: ${theme.colors.mutedForeground};
  }
`;

export const AprovacaoCorpo = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.lg};
  padding: ${theme.spacing.lg};
  max-width: 60rem;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
`;

export const VisualizadorPdf = styled.iframe`
  width: 100%;
  height: 70vh;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.lg};
  background: ${theme.colors.background};
`;

export const AprovacaoPainel = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.background};
`;

export const AprovacaoAcoes = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing.sm};
`;

export const AprovacaoCentro = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.xl};
  text-align: center;
`;
