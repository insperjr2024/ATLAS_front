import styled from "styled-components";
import { Link as RouterLink } from "react-router-dom";
import { theme } from "@/styles/theme";
import { FUNDO_COR, SOLIDO_COR, TEXTO_COR } from "@/components/health-track/HealthTrack.styled";
import type { CorHealthTrack } from "@/lib/health-track";

/** Os quatro cards de contagem do topo, mais os de alerta. */
export const Placar = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: ${theme.spacing.sm};
`;

export const PlacarItem = styled.div<{ $cor?: CorHealthTrack }>`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${({ $cor }) => ($cor ? SOLIDO_COR[$cor] : theme.colors.border)};
  background: ${({ $cor }) => ($cor ? FUNDO_COR[$cor] : theme.colors.card)};
  color: ${({ $cor }) => ($cor ? TEXTO_COR[$cor] : theme.colors.foreground)};
  min-width: 0;

  strong {
    font-size: ${theme.fontSize["2xl"]};
    font-weight: ${theme.fontWeight.bold};
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
    line-height: 1.15;
  }

  span {
    font-size: ${theme.fontSize.sm};
    font-weight: ${theme.fontWeight.semibold};
  }

  small {
    font-size: ${theme.fontSize.xs};
    opacity: 0.85;
  }
`;

/** A tabela do mapa: um projeto por linha, um pilar por coluna. */
export const Rolagem = styled.div`
  overflow: auto;
  max-height: 70vh;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.lg};
`;

export const Mapa = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: ${theme.fontSize.sm};

  th,
  td {
    padding: 0.5rem 0.6rem;
    border-bottom: 1px solid ${theme.colors.border};
    white-space: nowrap;
    vertical-align: middle;
  }

  th {
    position: sticky;
    top: 0;
    z-index: 1;
    background: ${theme.colors.muted};
    color: ${theme.colors.mutedForeground};
    font-size: ${theme.fontSize.xs};
    font-weight: ${theme.fontWeight.semibold};
    text-transform: uppercase;
    letter-spacing: 0.04em;
    text-align: left;
  }

  th.pilar,
  td.pilar {
    text-align: center;
    width: 3.5rem;
  }

  tbody tr {
    cursor: pointer;
  }

  tbody tr:hover td {
    background: ${theme.colors.muted};
  }

  tbody tr:last-child td {
    border-bottom: none;
  }
`;

export const NomeProjeto = styled(RouterLink)`
  color: ${theme.colors.foreground};
  font-weight: ${theme.fontWeight.medium};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

export const Secundario = styled.span`
  display: block;
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
  white-space: normal;
`;

/** A célula do heatmap: o fundo é a cor, o ícone é a forma. */
export const Celula = styled.span<{ $cor: CorHealthTrack | null; $persistente?: boolean }>`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: ${theme.borderRadius.md};
  background: ${({ $cor }) => ($cor ? SOLIDO_COR[$cor] : theme.colors.muted)};
  color: ${({ $cor }) => ($cor ? "white" : theme.colors.mutedForeground)};
  border: 1px dashed ${({ $cor }) => ($cor ? "transparent" : theme.colors.border)};
  /* Persistente (§7): um anel escuro em volta, além do número no canto. */
  box-shadow: ${({ $persistente }) => ($persistente ? `0 0 0 2px ${theme.colors.foreground}` : "none")};

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

export const Tendencia = styled.span<{ $rumo: "melhorou" | "piorou" | "igual" }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
  color: ${({ $rumo }) =>
    $rumo === "melhorou"
      ? TEXTO_COR.verde
      : $rumo === "piorou"
        ? TEXTO_COR.vermelho
        : theme.colors.mutedForeground};

  svg {
    width: 0.9rem;
    height: 0.9rem;
  }
`;

export const Legenda = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing.md};
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};

  span {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }
`;

export const Voltar = styled(RouterLink)`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.mutedForeground};
  text-decoration: none;

  &:hover {
    color: ${theme.colors.foreground};
  }

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

// ---------------------------------------------------------------- rodada

export const Progresso = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${theme.spacing.md};
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.mutedForeground};

  strong {
    color: ${theme.colors.foreground};
  }
`;

export const BarraProgresso = styled.div<{ $pct: number }>`
  flex: 1 1 12rem;
  height: 0.5rem;
  border-radius: 999px;
  background: ${theme.colors.muted};
  overflow: hidden;

  &::after {
    content: "";
    display: block;
    height: 100%;
    width: ${({ $pct }) => $pct}%;
    background: ${theme.colors.success};
    transition: width ${theme.transitions.fast};
  }
`;

export const FilaRodada = styled.ul`
  list-style: none;
  margin: ${theme.spacing.sm} 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

export const ItemRodada = styled.li<{ $situacao: "pendente" | "avaliada" | "justificada" }>`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding: 0.45rem 0.6rem;
  border-radius: ${theme.borderRadius.md};
  border: 1px solid
    ${({ $situacao }) =>
      $situacao === "pendente" ? SOLIDO_COR.vermelho : $situacao === "avaliada" ? SOLIDO_COR.verde : theme.colors.border};
  background: ${({ $situacao }) =>
    $situacao === "pendente" ? FUNDO_COR.vermelho : $situacao === "avaliada" ? FUNDO_COR.verde : theme.colors.card};
  font-size: ${theme.fontSize.sm};

  > a {
    font-weight: ${theme.fontWeight.medium};
    color: ${theme.colors.foreground};
    text-decoration: none;
  }

  > a:hover {
    text-decoration: underline;
  }

  .acoes {
    margin-left: auto;
    display: flex;
    gap: ${theme.spacing.xs};
  }
`;

export const Justificativa = styled.span`
  flex-basis: 100%;
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
  font-style: italic;
`;

export const PendenteBadge = styled.span`
  display: inline-block;
  margin-left: 0.4rem;
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
  font-size: 0.65rem;
  font-weight: ${theme.fontWeight.semibold};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: ${SOLIDO_COR.vermelho};
  color: white;
  vertical-align: middle;
`;

export const Historico = styled.details`
  margin-top: ${theme.spacing.sm};
  font-size: ${theme.fontSize.sm};

  summary {
    cursor: pointer;
    color: ${theme.colors.mutedForeground};
  }

  ul {
    margin: ${theme.spacing.xs} 0 0;
    padding-left: 1.1rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
`;

/** A faixa no topo do painel do projeto enquanto há rodada em andamento. */
export const FaixaRodada = styled.div<{ $pendente: boolean }>`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${({ $pendente }) => ($pendente ? SOLIDO_COR.vermelho : theme.colors.border)};
  background: ${({ $pendente }) => ($pendente ? FUNDO_COR.vermelho : theme.colors.card)};
  font-size: ${theme.fontSize.sm};

  .acoes {
    margin-left: auto;
    display: flex;
    flex-wrap: wrap;
    gap: ${theme.spacing.xs};
  }
`;

// ---------------------------------------------------------------- rankings

export const Ranking = styled.ol`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-size: ${theme.fontSize.sm};
`;

export const RankingItem = styled.li`
  display: grid;
  grid-template-columns: 1.25rem minmax(0, 1fr) auto;
  align-items: center;
  gap: ${theme.spacing.sm};

  .posicao {
    color: ${theme.colors.mutedForeground};
    font-variant-numeric: tabular-nums;
  }

  .nome {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  button.nome {
    background: none;
    border: none;
    padding: 0;
    text-align: left;
    font: inherit;
    color: ${theme.colors.foreground};
    cursor: pointer;
  }

  button.nome:hover {
    text-decoration: underline;
  }
`;

/** Barra empilhada verde/amarelo/vermelho, com os números ao lado. */
export const Faixas = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  font-size: ${theme.fontSize.xs};
  font-variant-numeric: tabular-nums;
`;

export const FaixaBarra = styled.span`
  display: inline-flex;
  width: 6rem;
  height: 0.5rem;
  border-radius: 999px;
  overflow: hidden;
  background: ${theme.colors.muted};

  i {
    display: block;
    height: 100%;
  }
`;

export const Contagem = styled.span<{ $cor: CorHealthTrack }>`
  color: ${({ $cor }) => TEXTO_COR[$cor]};
  font-weight: ${theme.fontWeight.semibold};
  min-width: 1.1rem;
  text-align: right;
`;

// ---------------------------------------------------------------- evolução

export const CaixaGrafico = styled.div<{ $altura?: string }>`
  width: 100%;
  height: ${({ $altura }) => $altura ?? "14rem"};
`;

export const TituloGrafico = styled.p`
  margin: 0 0 ${theme.spacing.xs};
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.semibold};
`;

/** O número de avaliações seguidas, no canto da célula persistente. */
export const Sequencia = styled.span`
  position: absolute;
  top: -0.4rem;
  right: -0.4rem;
  min-width: 1rem;
  height: 1rem;
  padding: 0 0.2rem;
  border-radius: 999px;
  background: ${theme.colors.foreground};
  color: white;
  font-size: 0.6rem;
  font-weight: ${theme.fontWeight.bold};
  line-height: 1rem;
  text-align: center;
`;

// ---------------------------------------------------------------- ações (§15)

export const ListaAcoes = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
`;

export const ItemAcao = styled.li<{ $concluida: boolean; $atrasada: boolean }>`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${({ $atrasada }) => ($atrasada ? SOLIDO_COR.vermelho : theme.colors.border)};
  background: ${({ $atrasada }) => ($atrasada ? FUNDO_COR.vermelho : theme.colors.card)};
  opacity: ${({ $concluida }) => ($concluida ? 0.6 : 1)};
  font-size: ${theme.fontSize.sm};

  .problema {
    font-weight: ${theme.fontWeight.medium};
    text-decoration: ${({ $concluida }) => ($concluida ? "line-through" : "none")};
  }

  .acao {
    margin-top: 0.15rem;
  }

  .acoes {
    display: flex;
    flex-wrap: wrap;
    gap: ${theme.spacing.xs};
    align-items: flex-start;
    justify-content: flex-end;
  }

  @media (max-width: ${theme.breakpoints.sm - 1}px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const FormAcao = styled.form`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${theme.spacing.md};

  .cheio {
    grid-column: 1 / -1;
  }

  @media (max-width: ${theme.breakpoints.sm - 1}px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const Motivos = styled.span`
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.25rem;

  span {
    padding: 0.1rem 0.4rem;
    border-radius: 999px;
    font-size: 0.7rem;
    font-weight: ${theme.fontWeight.medium};
    background: ${theme.colors.muted};
    color: ${theme.colors.foreground};
  }
`;
