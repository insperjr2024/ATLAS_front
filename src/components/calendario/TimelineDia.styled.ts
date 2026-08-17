import styled from "styled-components";
import { theme } from "@/styles/theme";

/** Altura de UMA hora na grade — todo cálculo de posição (`top`/`height` dos
 *  blocos, linha do agora) parte deste número, mudar aqui redimensiona a
 *  timeline inteira de uma vez. */
export const ALTURA_HORA_REM = 3.75;

export const TimelineWrap = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
`;

/** Só aparece quando existe pelo menos um evento sem hora (kickoff, reunião,
 *  entrega) — banca sempre tem hora, então no calendário de bancas esta
 *  linha nunca renderiza. */
export const DiaInteiroWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border-bottom: 1px solid ${theme.colors.border};
`;

export const DiaInteiroRotulo = styled.span`
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.mutedForeground};
`;

export const GradeHoraria = styled.div`
  position: relative;
  display: flex;
`;

export const ColunaHoras = styled.div`
  flex-shrink: 0;
  width: 3.25rem;
`;

export const RotuloHora = styled.div`
  position: relative;
  height: ${ALTURA_HORA_REM}rem;
  padding-right: 0.5rem;
  text-align: right;
  font-size: 0.65rem;
  color: ${theme.colors.mutedForeground};

  /* O número fica colado na LINHA da hora (o topo da célula), não centrado
     nela — é onde a hora realmente começa. */
  span {
    position: relative;
    top: -0.5em;
  }
`;

export const ColunaEventos = styled.div`
  position: relative;
  flex: 1;
  min-width: 0;
`;

export const LinhaHora = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  height: ${ALTURA_HORA_REM}rem;
  border-top: 1px solid ${theme.colors.border};
`;

/** A linha vermelha do "agora" — só desenhada quando o dia mostrado É hoje. */
export const LinhaAgora = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  z-index: 5;
  height: 0;
  border-top: 2px solid ${theme.colors.destructive};
  pointer-events: none;

  &::before {
    content: "";
    position: absolute;
    left: -4px;
    top: -4px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${theme.colors.destructive};
  }
`;

/**
 * O contêiner de UM evento na grade. Só posiciona (`top`/`height`/`left`/
 * `width`, vindos de fora via `style`) — o CONTEÚDO de dentro é o que cada
 * tela já usa em outro lugar (`Pilula` no calendário geral, `PilulaBanca`
 * no de bancas), passado como children. É o que faz esta timeline não
 * precisar saber o que é um evento de calendário ou uma banca.
 */
export const BlocoEvento = styled.div`
  position: absolute;
  z-index: 1;
  min-height: 1.1rem;
  padding: 0 2px;
  overflow: hidden;

  /* Preenche a largura/altura calculadas por fora e deixa o conteúdo (a
     pílula de cada tela) ocupar o espaço inteiro do bloco. */
  > * {
    width: 100%;
    height: 100%;
  }
`;
