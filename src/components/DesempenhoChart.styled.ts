import styled from "styled-components";

// Cores fixas na ordem categórica validada (ver skill de dataviz) — nunca
// cicladas, sempre a mesma frente = mesma cor. Luz apenas: o app ainda não
// tem dark mode ativo (as variáveis --primary/--foreground/etc. do
// index.css também só definem o tema claro em uso hoje).
export const ChartWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  --chart-series-1: #2a78d6;
  --chart-series-2: #eb6834;
  --chart-series-3: #1baf7a;
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
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1;
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
