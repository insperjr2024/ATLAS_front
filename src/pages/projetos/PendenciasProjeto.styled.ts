import styled from "styled-components";
import { theme } from "@/styles/theme";
import type { GravidadePendencia } from "@/lib/pendencias-projeto";

const COR: Record<GravidadePendencia, string> = {
  travado: theme.colors.destructive,
  atencao: theme.colors.warning,
  espera: theme.colors.mutedForeground,
};

export const Lista = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
`;

/**
 * ⭐ **Uma linha por pendência, em colunas fixas.**
 *
 * ⚠ A primeira versão era um card com título e duas linhas de explicação. Com
 * quatro pendências viravam nove linhas de prosa, e ninguém lê isso numa tela
 * que se abre para dar uma olhada rápida.
 *
 * ⚠ **Cinco filhos, cinco colunas.** A versão anterior declarava só quatro
 * (`auto 1fr auto auto`) para sinal · ação · onde · prazo, mas a linha
 * renderiza CINCO elementos — o dono vem depois do prazo. Sem coluna para ele,
 * o grid empurrava "quem resolve" para uma segunda linha implícita, e é
 * exatamente o "COORDENAÇÃO" caindo sozinho embaixo que apareceu na tela.
 *
 * ⚠ **Larguras fixas em onde/prazo/quem, não `1fr` solto.** Com `1fr` só na
 * coluna de ação, ela ocupava todo o espaço livre do card — que numa tela
 * larga é muito — e arremessava as colunas seguintes para a borda direita,
 * a uma distância do texto que parecia coisa desalinhada, não colunas de
 * tabela. Com largura própria, onde/prazo/quem ficam sempre à mesma distância
 * da ação, em qualquer linha e em qualquer largura de tela.
 *
 * 📐 As colunas são sempre as mesmas — **sinal · o que falta · onde · prazo ·
 * quem** — e é isso que torna a lista varrível: o olho desce pela segunda
 * coluna e sabe o que precisa ser feito, sem ler frase nenhuma.
 *
 * A explicação não sumiu: virou tooltip (ver `MotivoDesabilitado` no
 * componente). Quem já entende não lê; quem não entende, alcança.
 */
export const Linha = styled.li`
  display: grid;
  grid-template-columns: 0.5rem minmax(9rem, 1fr) minmax(0, 14rem) 3.5rem 6.5rem;
  align-items: center;
  gap: ${theme.spacing.md};

  padding: ${theme.spacing.sm} 0;
  border-bottom: 1px solid ${theme.colors.border};

  &:last-child {
    border-bottom: none;
  }

  a {
    text-decoration: none;
    color: inherit;
  }

  a:hover {
    text-decoration: underline;
  }

  @media (max-width: 40rem) {
    /* Onde não cabem cinco colunas lado a lado, a linha troca de grid para
     * flex-wrap: cada pedaço quebra para a linha de baixo por conta própria,
     * sem precisar prever posição fixa para cada um. */
    display: flex;
    flex-wrap: wrap;
    row-gap: 0.15rem;
  }
`;

/** O sinal de gravidade. Bolinha, não ícone: três estados não precisam de
 *  desenho, e um ponto de cor lê-se mais rápido que um glifo. */
export const Sinal = styled.span<{ $gravidade: GravidadePendencia }>`
  width: 0.5rem;
  height: 0.5rem;
  border-radius: ${theme.borderRadius.full};
  background: ${({ $gravidade }) => COR[$gravidade]};
  flex-shrink: 0;
`;

/** O que falta — a coluna que a pessoa varre. Curta por contrato. */
export const Acao = styled.span`
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.foreground};

  @media (max-width: 40rem) {
    /* Fecha a primeira linha do flex-wrap: onde/prazo/dono sempre começam
       numa linha nova, embaixo da ação — nunca espremidos ao lado dela. */
    flex-basis: 100%;
  }
`;

/** Onde: o escopo, ou o projeto quando a pendência é dele. */
export const Onde = styled.span`
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.mutedForeground};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const Prazo = styled.span<{ $vencido: boolean }>`
  font-size: ${theme.fontSize.xs};
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  color: ${({ $vencido }) =>
    $vencido ? theme.colors.destructive : theme.colors.mutedForeground};
`;

export const Quem = styled.span`
  font-size: ${theme.fontSize.xs};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${theme.colors.mutedForeground};
  white-space: nowrap;
`;

/** Sem pendência: uma linha, não um parágrafo. */
export const Tudocerto = styled.p`
  margin: 0;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.mutedForeground};
`;
