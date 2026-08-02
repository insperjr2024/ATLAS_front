import styled from "styled-components";

// O Calendar (ui/, baseado em react-day-picker) não é nosso pra estilizar por
// dentro — marcamos os dias com banca via `modifiersClassNames` (uma classe
// semântica simples, não Tailwind) e estilizamos essa classe aqui de fora,
// mesmo truque de seletor descendente que já usamos pro <input> da Login.
export const CalendarWrapper = styled.div`
  display: flex;
  justify-content: center;

  & .tem-banca {
    position: relative;
  }

  & .tem-banca::after {
    content: "";
    position: absolute;
    bottom: 4px;
    left: 50%;
    transform: translateX(-50%);
    width: 4px;
    height: 4px;
    border-radius: 999px;
    background: var(--destructive);
  }
`;
