import styled from "styled-components";
import { theme } from "@/styles/theme";

export const VagasGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(19rem, 1fr));
  gap: ${theme.spacing.md};
`;

/** Cartão do projeto. Sem vaga fica esmaecido em vez de sumir — a pessoa
 *  precisa ver que o projeto existe e está cheio. */
export const ProjetoCard = styled.button<{ $indisponivel: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.md};
  text-align: left;
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.card};
  font: inherit;
  cursor: ${({ $indisponivel }) => ($indisponivel ? "default" : "pointer")};
  opacity: ${({ $indisponivel }) => ($indisponivel ? 0.6 : 1)};
  transition: border-color 0.12s ease, box-shadow 0.12s ease;

  &:hover {
    border-color: ${({ $indisponivel }) =>
      $indisponivel ? theme.colors.border : theme.colors.primary};
    box-shadow: ${({ $indisponivel }) => ($indisponivel ? "none" : theme.shadows.sm)};
  }

  &:focus-visible {
    outline: 2px solid ${theme.colors.primary};
    outline-offset: 2px;
  }
`;

export const CardTopo = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${theme.spacing.sm};
`;

export const CardNome = styled.span`
  font-size: ${theme.fontSize.base};
  font-weight: ${theme.fontWeight.semibold};
  color: ${theme.colors.cardForeground};
`;

export const CardCliente = styled.span`
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
`;

export const CardLinha = styled.span`
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.mutedForeground};
`;

/** As bolinhas de vaga: preenchida = ocupada, vazia = livre. Um número seco
 *  ("1/3") diz o mesmo, mas isto se lê sem processar. */
export const Vagas = styled.div`
  display: flex;
  gap: 0.25rem;
  align-items: center;
`;

export const Bolinha = styled.span<{ $ocupada: boolean }>`
  width: 0.625rem;
  height: 0.625rem;
  border-radius: ${theme.borderRadius.full};
  border: 1px solid
    ${({ $ocupada }) => ($ocupada ? theme.colors.primary : theme.colors.border)};
  background: ${({ $ocupada }) => ($ocupada ? theme.colors.primary : "transparent")};
`;

/** As frentes do projeto, logo abaixo do nome: é a primeira coisa que diz
 *  se o projeto tem a ver com quem está olhando. */
export const FrentesRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
`;

export const Impedimento = styled.span`
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
  font-style: italic;
`;

/* ------------------------------------------------------------------ */
/* Solicitações recebidas                                               */
/* ------------------------------------------------------------------ */

export const PedidoCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.card};

  & + & {
    margin-top: ${theme.spacing.sm};
  }
`;

export const PedidoTopo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing.sm};
  flex-wrap: wrap;
`;

/** A justificativa é o que o coordenador vem ler — destacada, não escondida
 *  numa linha de meta. */
export const Justificativa = styled.blockquote`
  margin: 0;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border-left: 3px solid ${theme.colors.primary};
  background: ${theme.colors.muted};
  border-radius: 0 ${theme.borderRadius.md} ${theme.borderRadius.md} 0;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.cardForeground};
  white-space: pre-wrap;
`;

export const PedidoAcoes = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
  flex-wrap: wrap;
`;

export const GrupoProjeto = styled.section`
  & + & {
    margin-top: ${theme.spacing.lg};
  }
`;

export const GrupoTitulo = styled.h3`
  margin: 0 0 ${theme.spacing.sm};
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.semibold};
  color: ${theme.colors.cardForeground};
`;
