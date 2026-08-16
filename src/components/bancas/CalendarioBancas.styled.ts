import styled from "styled-components";
import { theme } from "@/styles/theme";
import { MonthGrid } from "@/components/calendario/CalendarGrid.styled";

export const CalendarioWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

export const Cabecalho = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${theme.spacing.sm};
`;

export const NavegacaoMes = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
`;

export const MesAtual = styled.strong`
  min-width: 11rem;
  text-align: center;
  font-size: ${theme.fontSize.base};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.foreground};
  text-transform: capitalize;
`;

export const ResumoMes = styled.span`
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.mutedForeground};
`;

/**
 * ⚠ Rolagem horizontal própria, não `overflow` no body.
 *
 * Sete colunas com pílulas legíveis não cabem num celular. Sem esta caixa, a
 * grade empurraria a página inteira para o lado e o menu sairia da tela.
 */
export const GradeWrap = styled.div`
  overflow-x: auto;
`;

/** Mesma largura mínima de referência do Calendário geral — a diferença é
 *  que `PilulaBanca` (hora + projeto + vagas, várias linhas) precisa de mais
 *  espaço horizontal por célula do que a pílula de uma linha só de lá. */
export const Grade = styled(MonthGrid)`
  min-width: 44rem;
`;

export const LinhaDiaNumero = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.25rem;
`;

/**
 * O "+N mais" quando um dia tem mais bancas do que cabem na célula — mesmo
 * padrão visual do Calendário geral (`AvisoMaisEventos` em
 * `CalendarioGeral.styled.ts`), para as duas telas lerem como a mesma
 * linguagem. Não mexe na pílula da banca em si: cor e estilo do evento
 * continuam os de sempre, só a CONTAGEM de pílulas visíveis por dia muda.
 */
export const AvisoMaisBancas = styled.button`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.1rem;
  height: 1.1rem;
  padding: 0 0.3rem;
  border: 1px solid ${theme.colors.primary};
  border-radius: ${theme.borderRadius.full};
  background: ${theme.colors.card};
  color: ${theme.colors.primary};
  font-size: 0.62rem;
  font-weight: ${theme.fontWeight.bold};
  line-height: 1;
  cursor: pointer;
`;

/**
 * A pílula de uma banca. A cor da borda esquerda carrega o status — é o único
 * canal que sobrevive à largura de uma célula de calendário.
 */
export const PilulaBanca = styled.button<{ $cor: string }>`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  width: 100%;
  padding: 0.2rem 0.35rem;
  border: 1px solid ${theme.colors.border};
  border-left: 3px solid ${({ $cor }) => $cor};
  border-radius: ${theme.borderRadius.sm};
  background: ${theme.colors.background};
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;

  &:hover {
    background: ${theme.colors.muted};
    border-color: ${({ $cor }) => $cor};
  }

  &:focus-visible {
    outline: 2px solid ${theme.colors.ring};
    outline-offset: 1px;
  }
`;

export const PilulaHora = styled.span`
  font-size: 0.65rem;
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.mutedForeground};
`;

export const PilulaProjeto = styled.span`
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.foreground};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const PilulaVagas = styled.span<{ $lotada: boolean }>`
  font-size: 0.65rem;
  color: ${({ $lotada }) => ($lotada ? theme.colors.success : theme.colors.warning)};
`;

/**
 * ⚠ O aviso de choque. Duas bancas no mesmo horário é exatamente o que o §8
 * proíbe, e é o motivo de esta tela existir — precisa saltar aos olhos, não
 * ficar escondido em duas pílulas parecidas empilhadas.
 */
export const AvisoChoque = styled.span`
  display: block;
  padding: 0.1rem 0.25rem;
  border-radius: ${theme.borderRadius.sm};
  background: ${theme.colors.destructive};
  color: ${theme.colors.destructiveForeground};
  font-size: 0.6rem;
  font-weight: ${theme.fontWeight.medium};
  text-align: center;
`;

export const Legenda = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing.md};
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
`;

export const LegendaItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
`;

export const LegendaCor = styled.span<{ $cor: string }>`
  width: 0.65rem;
  height: 0.65rem;
  border-radius: 2px;
  background: ${({ $cor }) => $cor};
`;
