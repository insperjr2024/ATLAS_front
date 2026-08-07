import styled from "styled-components";
import { theme } from "@/styles/theme";

/** O topo do card de Cadastro: avatar + nome + posição, como cabeçalho de
 *  perfil de verdade — em vez de o nome só aparecer perdido dentro da
 *  mesma grade rótulo/valor que e-mail e cargo. */
export const PerfilCabecalho = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  padding-bottom: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.lg};
  border-bottom: 1px solid ${theme.colors.border};
`;

/** Sem foto ainda — as iniciais em círculo já dão o "isto é uma pessoa" que
 *  a lista de dados sozinha não dava, e deixam o lugar reservado pronto pro
 *  dia em que upload de foto entrar. */
export const Avatar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: ${theme.borderRadius.full};
  background: ${theme.colors.primary};
  color: ${theme.colors.primaryForeground};
  font-size: ${theme.fontSize.lg};
  font-weight: ${theme.fontWeight.semibold};
  letter-spacing: 0.02em;
`;

export const PerfilNome = styled.p`
  margin: 0;
  font-size: ${theme.fontSize.lg};
  font-weight: ${theme.fontWeight.semibold};
  color: ${theme.colors.foreground};
`;

export const PerfilSubtitulo = styled.p`
  margin: 0.125rem 0 0;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.mutedForeground};
`;

/** Os dados do pré-cadastro em pares rótulo/valor, lado a lado. */
export const DadosGrid = styled.dl`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: ${theme.spacing.md};
  margin: 0;
`;

export const DadoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
`;

export const DadoRotulo = styled.dt`
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.mutedForeground};
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

export const DadoValor = styled.dd`
  margin: 0;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.cardForeground};
  overflow-wrap: anywhere;
`;

/** Explicação curta acima do quadro — o membro precisa saber para que serve
 *  marcar isso, senão o campo fica vazio para sempre. */
export const Explicacao = styled.p`
  margin: 0 0 ${theme.spacing.md};
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.mutedForeground};
`;
