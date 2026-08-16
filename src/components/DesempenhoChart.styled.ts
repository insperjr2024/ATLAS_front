import styled from "styled-components";
import { theme } from "@/styles/theme";

// Cores fixas na ordem categórica validada (ver skill de dataviz), nunca
// cicladas, sempre a mesma frente = mesma cor. Luz apenas: o app ainda não
// tem dark mode ativo (as variáveis --primary/--foreground/etc. do
// index.css também só definem o tema claro em uso hoje).
export const ChartWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  /* Cor por FRENTE, fixa (ver CORES_POR_FRENTE em DesempenhoChart.tsx):
     Business = preto, Direito = vermelho claro (fixo), Tech = azul,
     Engenharia de Processos = cinza. */
  --chart-series-1: #000000;
  --chart-series-2: ${theme.colors.primary};
  --chart-series-3: #2a78d6;
  --chart-series-4: #71717a;
`;

export const DonutBox = styled.div`
  position: relative;
  flex-shrink: 0;
  width: 128px;
  height: 128px;
`;

export const DonutCenter = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

export const DonutValue = styled.span`
  font-size: 1.15rem;
  font-weight: 700;
  line-height: 1;
`;

/** A caixinha que segue o mouse em cima do donut — `left`/`top` vêm inline
 *  (posição calculada a cada `mousemove`, ver DesempenhoChart.tsx), então só
 *  a aparência mora aqui. `translate(-50%, -140%)` centraliza horizontalmente
 *  no cursor e sobe a caixa pra ficar ACIMA do dedo/ponteiro, não embaixo
 *  escondida por ele. `pointer-events: none` pra ela nunca roubar o
 *  `mouseleave` do SVG por baixo. */
export const Tooltip = styled.div`
  position: absolute;
  transform: translate(-50%, -140%);
  padding: 0.3rem 0.55rem;
  border-radius: 0.375rem;
  background: #18181b;
  color: #ffffff;
  font-size: 0.7rem;
  font-weight: 500;
  white-space: nowrap;
  pointer-events: none;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
`;

export const Legend = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  font-size: 0.875rem;
`;

export const LegendItem = styled.li`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const LegendSwatch = styled.span<{ $cor: string }>`
  width: 0.625rem;
  height: 0.625rem;
  flex-shrink: 0;
  border-radius: 999px;
  background: ${({ $cor }) => $cor};
`;

export const LegendEmpty = styled.li`
  color: var(--muted-foreground);
`;
