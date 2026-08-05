import styled, { css } from "styled-components";
import { theme } from "@/styles/theme";
import { DayCell, MonthGrid } from "@/components/calendario/CalendarGrid.styled";
import { COR_NAO_UTIL } from "./cores";

export const CronogramaScroll = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.lg};
  max-height: 60vh;
  overflow-y: auto;
  padding-right: ${theme.spacing.sm};

  /* Enquanto arrasta, a seleção de texto nativa sobre a grade é o item nº 1
     que faz um drag caseiro parecer quebrado. O touch-action impede o
     navegador móvel de rolar em vez de pintar. */
  user-select: none;
  touch-action: none;

  /* Durante o export, o container não pode estar cortado nem rolado.
     Atenção: seletor de DESCENDENTE, e não "&.exportando": a classe é aplicada no
     wrapper que envolve grade + legenda (CronogramaLayout), não neste
     elemento. Com "&.exportando" a regra nunca casava, e o PNG saía cortado
     na altura do scroll. */
  .exportando & {
    max-height: none;
    overflow: visible;
  }
`;

export const BlocoMes = styled(MonthGrid)`
  /* Atenção: "CronogramaScroll" é um flex column com max-height. Sem o shrink: 0, o
     flex COMPRIME os blocos para caberem em 60vh em vez de deixar o container
     rolar — as semanas viram tiras de poucos pixels e os números do dia se
     sobrepõem. O bloco tem altura de conteúdo; quem rola é o pai. */
  flex-shrink: 0;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.lg};
  overflow: hidden;
  background: ${theme.colors.background};
`;

/**
 * As linhas da grade do cronograma têm colunas variáveis: 7 nas visões de mês
 * e semana, 1 na de dia.
 *
 * Atenção: não reaproveitam a `WeekRow` da primitiva de propósito. Ela traz
 * "flex: 1; min-height: 0", que serve ao calendário de bancas (um mês
 * preenchendo altura fixa) e aqui só faz a linha colapsar abaixo do conteúdo.
 */
export const CabecalhoDias = styled.div<{ $colunas: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $colunas }) => $colunas}, 1fr);
  border-bottom: 1px solid ${theme.colors.border};
`;

export const LinhaDias = styled.div<{ $colunas: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $colunas }) => $colunas}, 1fr);
`;

export const TituloMes = styled.h3`
  margin: 0;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.semibold};
  text-transform: capitalize;
  color: ${theme.colors.foreground};
  background: ${theme.colors.secondary};
  border-bottom: 1px solid ${theme.colors.border};
`;

/**
 * A célula pintável. Herda a grade compartilhada e acrescenta só o que é do
 * cronograma — a primitiva continua limpa para a tela de bancas.
 */
/** A altura da célula em cada visão — é o "expandir" ao descer o zoom.
 *
 *  O mês tem 6rem para o box de marco caber com o número do dia. A §6.4 pede um
 *  calendário "compacto", e 6rem ainda é compacto perto das 7.5rem da grade de
 *  bancas — mas é o preço de o marco ter nome escrito em vez de um glifo. */
const ALTURA_CELULA: Record<string, string> = {
  mes: "6rem",
  semana: "9rem",
  dia: "14rem",
};

export const PaintedDayCell = styled(DayCell)<{
  $cor?: string;
  $texto?: string;
  $naoUtil?: boolean;
  $preview?: boolean;
  $pintavel?: boolean;
  $vazia?: boolean;
  $visao?: string;
}>`
  min-height: ${({ $visao }) => ALTURA_CELULA[$visao ?? "mes"] ?? ALTURA_CELULA.mes};
  align-items: flex-start;
  justify-content: flex-start;
  position: relative;
  cursor: ${({ $pintavel }) => ($pintavel ? "cell" : "default")};

  /* A última linha do bloco não repete a borda do container arredondado. */
  ${LinhaDias}:last-child & {
    border-bottom: none;
  }

  ${({ $vazia }) =>
    $vazia &&
    css`
      /* Dia de mês vizinho: some por completo. Com meses empilhados, a mesma
         data apareceria em DOIS blocos — o que quebra o hit-test e fica feio
         no PNG. */
      background: transparent;
      border-color: transparent;
      pointer-events: none;
    `}

  ${({ $naoUtil }) =>
    $naoUtil &&
    css`
      /* A hachura é o que sobrevive à impressão em preto-e-branco e ao PNG
         exportado — cor sozinha não. */
      background-color: ${COR_NAO_UTIL};
      background-image: repeating-linear-gradient(
        45deg,
        transparent,
        transparent 3px,
        rgba(0, 0, 0, 0.05) 3px,
        rgba(0, 0, 0, 0.05) 6px
      );
      cursor: not-allowed;
    `}

  /* "background" (e não "background-color"): o valor pode ser um hex chapado
     ou um linear-gradient de fatias, quando mais de uma etapa disputa o dia. */
  ${({ $cor, $naoUtil }) =>
    $cor &&
    !$naoUtil &&
    css`
      background: ${$cor};
    `}

  ${({ $preview }) =>
    $preview &&
    css`
      outline: 2px dashed ${theme.colors.foreground};
      outline-offset: -3px;
    `}
`;

export const NumeroDia = styled.span<{ $texto?: string; $hoje?: boolean }>`
  font-size: ${theme.fontSize.xs};
  font-weight: ${({ $hoje }) => ($hoje ? theme.fontWeight.bold : theme.fontWeight.medium)};
  color: ${({ $texto }) => $texto ?? theme.colors.foreground};
  ${({ $hoje }) =>
    $hoje &&
    css`
      text-decoration: underline;
      text-underline-offset: 2px;
    `}
`;

/** A pilha de boxes de marco dentro da célula. */
export const MarcosDoDia = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  width: 100%;
  min-width: 0;
  margin-top: 0.15rem;
`;

/**
 * O box do marco — borda colorida, fundo quase branco e o nome escrito.
 *
 * Substituiu os antigos glifos de símbolo. O motivo original deles era o export
 * impresso em preto-e-branco, e o nome escrito atende isso melhor do que um
 * símbolo: texto sobrevive ao P&B, símbolo depende da legenda ao lado.
 */
export const MarcoBox = styled.span<{ $borda: string; $fundo: string; $texto: string }>`
  display: block;
  padding: 0.1rem 0.3rem;
  border: 1px solid ${({ $borda }) => $borda};
  border-radius: ${theme.borderRadius.sm};
  background: ${({ $fundo }) => $fundo};
  color: ${({ $texto }) => $texto};
  font-size: 0.7rem;
  font-weight: ${theme.fontWeight.medium};
  line-height: 1.3;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/**
 * O que a célula ganha quando há espaço (semana e dia): o nome da etapa e os
 * marcos por extenso. Na visão de mês a célula tem 3rem e nada disso cabe —
 * lá o título fica no `title` e a cor faz o trabalho, com a legenda ao lado.
 */
export const DetalheCelula = styled.div<{ $texto?: string }>`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  margin-top: 0.15rem;
  min-width: 0;
  font-size: ${theme.fontSize.xs};
  line-height: 1.25;
  color: ${({ $texto }) => $texto ?? theme.colors.mutedForeground};

  strong {
    font-weight: ${theme.fontWeight.medium};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  small {
    font-size: 0.7rem;
    opacity: 0.85;
  }
`;

/* ------------------------------------------------------------------ */
/* Barra de ferramentas e legenda                                      */
/* ------------------------------------------------------------------ */

export const Barra = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding-bottom: ${theme.spacing.md};
`;

/** O seletor de visão — dia · semana · mês, como um segmented control. */
export const GrupoVisao = styled.div`
  display: inline-flex;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  overflow: hidden;
`;

export const BotaoVisao = styled.button<{ $ativo?: boolean }>`
  padding: 0.3rem 0.7rem;
  border: none;
  border-right: 1px solid ${theme.colors.border};
  background: ${({ $ativo }) => ($ativo ? theme.colors.secondary : "transparent")};
  font-size: ${theme.fontSize.xs};
  font-weight: ${({ $ativo }) =>
    $ativo ? theme.fontWeight.semibold : theme.fontWeight.medium};
  color: ${({ $ativo }) => ($ativo ? theme.colors.foreground : theme.colors.mutedForeground)};
  cursor: pointer;

  &:last-child {
    border-right: none;
  }

  &:hover:not(:disabled) {
    background: ${theme.colors.muted};
  }
`;

export const NavPeriodo = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
`;

export const BotaoNav = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  background: transparent;
  color: ${theme.colors.foreground};
  cursor: pointer;

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background: ${theme.colors.muted};
  }
`;

export const RotuloPeriodo = styled.span`
  min-width: 12rem;
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.foreground};
`;

export const PincelAtivo = styled.span<{ $cor: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  border-radius: ${theme.borderRadius.full};
  border: 1px solid ${({ $cor }) => $cor};
  background: color-mix(in srgb, ${({ $cor }) => $cor} 12%, white);
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.foreground};
`;

export const ContadorDias = styled.span`
  font-size: ${theme.fontSize.xs};
  font-variant-numeric: tabular-nums;
  color: ${theme.colors.mutedForeground};
`;

export const CronogramaLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${theme.spacing.lg};

  @media (min-width: ${theme.breakpoints.lg}px) {
    grid-template-columns: 1fr 15rem;
    align-items: start;
  }
`;

export const LegendaBox = styled.aside`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.lg};
  background: ${theme.colors.card};

  @media (min-width: ${theme.breakpoints.lg}px) {
    position: sticky;
    top: ${theme.spacing.md};
  }

  .exportando & {
    position: static;
  }
`;

export const LegendaGrupo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`;

export const LegendaTitulo = styled.h4`
  margin: 0;
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.semibold};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${theme.colors.mutedForeground};
`;

/**
 * A linha da legenda: o botão do pincel e, ao lado, o de excluir.
 *
 * São irmãos, e não aninhados, porque botão dentro de botão é HTML inválido —
 * o clique no interno dispararia o externo, e escolher excluir também trocaria
 * o pincel.
 */
export const LegendaLinha = styled.div`
  display: flex;
  align-items: center;
  gap: 0.125rem;

  /* O excluir só aparece no hover ou com foco, para a legenda não virar uma
     parede de lixeiras. O :focus-within não é opcional: sem ele o botão fica
     invisível para quem navega por teclado. */
  &:hover [data-excluir],
  &:focus-within [data-excluir] {
    opacity: 1;
  }
`;

export const BotaoExcluir = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
  border: none;
  border-radius: ${theme.borderRadius.sm};
  background: transparent;
  color: ${theme.colors.mutedForeground};
  opacity: 0;
  cursor: pointer;

  &:hover {
    background: ${theme.colors.muted};
    color: ${theme.colors.destructive};
  }
`;

export const LegendaItem = styled.button<{ $ativa?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
  width: 100%;
  padding: 0.3rem 0.375rem;
  border: 1px solid ${({ $ativa }) => ($ativa ? theme.colors.ring : "transparent")};
  border-radius: ${theme.borderRadius.md};
  background: ${({ $ativa }) => ($ativa ? theme.colors.secondary : "transparent")};
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.foreground};
  text-align: left;
  cursor: pointer;

  &:hover {
    background: ${theme.colors.muted};
  }
`;

export const Amostra = styled.span<{ $cor: string }>`
  width: 0.75rem;
  height: 0.75rem;
  flex-shrink: 0;
  border-radius: ${theme.borderRadius.sm};
  background: ${({ $cor }) => $cor};
`;

/**
 * O seletor de cor da etapa: as 8 amostras da `PALETA`, e só elas.
 *
 * Sem color picker livre de propósito — a paleta é fechada justamente para o
 * cronograma não virar arco-íris e para nenhuma etapa cair na matiz que o
 * design system reserva para status (vermelho = atrasado, verde = ok).
 */
export const PaletaGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

export const AmostraBotao = styled.button<{ $cor: string; $ativa: boolean }>`
  width: 2rem;
  height: 2rem;
  border-radius: ${theme.borderRadius.md};
  background: ${({ $cor }) => $cor};
  cursor: pointer;

  /* A seleção é um anel POR FORA, e não uma borda: borda encolheria a amostra
     e faria a cor selecionada parecer diferente das outras. */
  border: 2px solid ${theme.colors.card};
  outline: 2px solid ${({ $cor, $ativa }) => ($ativa ? $cor : "transparent")};
  outline-offset: 0;

  &:focus-visible {
    outline-color: ${theme.colors.ring};
  }
`;

export const LegendaTexto = styled.span`
  display: flex;
  flex-direction: column;
  min-width: 0;

  strong {
    font-weight: ${theme.fontWeight.medium};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  small {
    font-size: 0.65rem;
    color: ${theme.colors.mutedForeground};
  }
`;

export const AmostraHachurada = styled.span`
  width: 0.75rem;
  height: 0.75rem;
  flex-shrink: 0;
  border-radius: ${theme.borderRadius.sm};
  background-color: ${COR_NAO_UTIL};
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.12) 2px,
    rgba(0, 0, 0, 0.12) 4px
  );
`;
