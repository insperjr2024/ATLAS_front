import styled from "styled-components";
import { theme } from "@/styles/theme";

/* ---- Avaliadores agrupados por (liderança|membro) × frente ----
 *
 * Saiu de `pages/projetos/ProjetoBanca.styled` quando o mesmo bloco passou a
 * ser usado no "ver mais" da página /bancas — código de dois lugares não pode
 * morar dentro da pasta de um deles. */

export const GrupoAvaliadores = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;

  & + & {
    margin-top: 0.5rem;
  }
`;

export const GrupoCabecalho = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  flex-wrap: wrap;
`;

export const GrupoRotulo = styled.span`
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.semibold};
  color: ${theme.colors.foreground};
`;

/**
 * "2/3" ao lado do rótulo do grupo. `$estado` pinta: falta gente
 * (destructive), lotado (warning) ou completo (mutedForeground).
 */
export const GrupoCota = styled.span<{ $estado: "falta" | "lotado" | "ok" }>`
  font-size: ${theme.fontSize.xs};
  font-variant-numeric: tabular-nums;
  color: ${({ $estado }) =>
    $estado === "falta"
      ? theme.colors.destructive
      : $estado === "lotado"
        ? theme.colors.warning
        : theme.colors.mutedForeground};
`;

export const GrupoVazio = styled.span`
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
  padding-left: 1rem;
`;

export const ListaNomes = styled.ul`
  margin: 0;
  padding-left: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.foreground};
`;

/** A linha de um avaliador quando tem ação ao lado (remover) — sem isso o
 *  botão empurra pra baixo do texto em vez de ficar na mesma linha. */
export const NomeLinha = styled.li`
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
`;

/** "remover" — só aparece pra quem tem `pode_gerir_membros`. Texto, não
 *  ícone: some entre "· avaliou" e os outros sufixos sem chamar mais
 *  atenção do que uma ação destrutiva pode chamar por engano. */
export const RemoverBotao = styled.button`
  border: none;
  background: none;
  padding: 0;
  font: inherit;
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.destructive};
  text-decoration: underline;
  cursor: pointer;
  flex-shrink: 0;

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;
