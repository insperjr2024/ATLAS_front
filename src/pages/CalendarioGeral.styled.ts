import styled from "styled-components";
import { theme } from "@/styles/theme";
import { PageStack } from "@/styles/page.styled";
import { DayCell, MonthGrid, WeekRow } from "@/components/calendario/CalendarGrid.styled";

export {
  PageHeaderRow,
  PageHeaderText,
  PageHeading,
  PageSubheading,
  ModalOverlay,
  ModalHeader,
  ModalTitle,
  ModalClose,
  ModalBody,
  ModalFooter,
  NarrowModalContent,
  DetailList,
  DetailRow,
  DetailTerm,
  DetailValue,
} from "./Bancas.styled";

/**
 * O calendário deve caber na altura da tela, não empurrar a página pra
 * rolar — é a diferença entre "abrir e já ver o mês inteiro" e "abrir e
 * primeiro descobrir que o mês continua mais embaixo". `100vh` menos o
 * padding vertical do `<Main>` (1.5rem em cima, 1.5rem embaixo — ver
 * `Layout.styled.ts`) é a altura de verdade disponível; o cabeçalho e a
 * barra de filtros ficam do tamanho que precisam, e só a grade do mês
 * (`GradeWrap`, com `flex: 1`) usa o resto.
 */
export const PaginaCalendario = styled(PageStack)`
  height: calc(100vh - 3rem);
  min-height: 0;
`;

export const MonthGridPreenche = styled(MonthGrid)`
  flex: 1;
  min-height: 0;
`;

/** A grade de 7 dias precisa de uma altura de LINHA de verdade (não `auto`)
 *  pra sobrar espaço pro `DayCell` esticar — sem isto, `flex: 1` no
 *  container não desce pras células, e a grade continua do tamanho do
 *  conteúdo mesmo com espaço livre embaixo. */
export const WeekRowPreenche = styled(WeekRow)`
  grid-template-rows: 1fr;
`;

/** Sem o piso de `7.5rem` do `DayCell` padrão — aqui a célula encolhe ou
 *  cresce pra caber exatamente nas 5 ou 6 semanas do mês dentro da altura
 *  disponível, em vez de empurrar a página quando o mês tem 6 linhas. */
export const DayCellPreenche = styled(DayCell)`
  min-height: 0;
`;

export const Cabecalho = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-bottom: none;
  border-radius: ${theme.borderRadius.xl} ${theme.borderRadius.xl} 0 0;
  background: ${theme.colors.card};
`;

export const MesAtual = styled.strong`
  font-size: ${theme.fontSize.base};
  font-weight: ${theme.fontWeight.semibold};
  text-transform: capitalize;
  color: ${theme.colors.foreground};
`;

/** Envolve `Cabecalho` + `GradeWrap`: precisa ser flex-column com `flex: 1`
 *  pra que o `flex: 1` do `GradeWrap` logo abaixo tenha um pai que de fato
 *  sobra espaço pra distribuir — sem isto, "crescer" não tem o que crescer
 *  dentro de. */
export const CorpoCalendario = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
`;

export const GradeWrap = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  border: 1px solid ${theme.colors.border};
  border-radius: 0 0 ${theme.borderRadius.xl} ${theme.borderRadius.xl};
  overflow: hidden;
  background: ${theme.colors.card};
`;

export const FiltroChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
`;

/** Filtro por tipo — glifo + cor, para funcionar impresso também. */
export const Chip = styled.button<{ $ativo: boolean; $cor: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.625rem;
  border-radius: ${theme.borderRadius.full};
  border: 1px solid ${({ $ativo, $cor }) => ($ativo ? $cor : theme.colors.border)};
  background: ${({ $ativo, $cor }) =>
    $ativo ? `color-mix(in srgb, ${$cor} 14%, white)` : theme.colors.background};
  color: ${({ $ativo, $cor }) => ($ativo ? $cor : theme.colors.mutedForeground)};
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
  cursor: pointer;

  &:hover {
    border-color: ${({ $cor }) => $cor};
  }
`;

/**
 * A linha de um evento dentro da célula do dia — pintada com a cor do tipo
 * (fundo tingido + friso à esquerda), não mais uma caixa cheia com borda
 * inteira. O calendário é a única tela do site em que a cor É o conteúdo —
 * é ela que deixa ver, sem clicar em nada, "essa semana tem duas bancas e
 * uma entrega". Neutralizar isso (como uma versão anterior desta tela
 * chegou a fazer) tira exatamente o que faz um calendário ser lido de
 * relance. O glifo (★■▲●) continua vindo junto: é ele, não a cor sozinha,
 * que faz o calendário funcionar impresso ou pra quem não distingue cor.
 */
export const Pilula = styled.button<{ $cor: string }>`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  width: 100%;
  padding: 0.1rem 0.4rem;
  border: none;
  border-radius: ${theme.borderRadius.full};
  /* Forte só na extremidade esquerda — um corte seco, não um degradê. Os
     dois stops repetidos na MESMA posição (3px, 3px) são o que faz o
     "gradiente" parar de misturar e virar duas cores lado a lado. */
  background: linear-gradient(
    to right,
    ${({ $cor }) => $cor} 3px,
    color-mix(in srgb, ${({ $cor }) => $cor} 16%, white) 3px
  );
  color: color-mix(in srgb, ${({ $cor }) => $cor} 85%, black);
  font-size: 0.68rem;
  font-weight: ${theme.fontWeight.medium};
  text-align: left;
  cursor: pointer;
  line-height: 1.3;

  &:hover {
    background: linear-gradient(
      to right,
      ${({ $cor }) => $cor} 3px,
      color-mix(in srgb, ${({ $cor }) => $cor} 26%, white) 3px
    );
  }
`;

export const PilulaGlifo = styled.span`
  flex-shrink: 0;
  font-weight: ${theme.fontWeight.semibold};
`;

export const PilulaTexto = styled.span`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

export const MaisEventos = styled.span`
  font-size: 0.62rem;
  color: ${theme.colors.mutedForeground};
`;
