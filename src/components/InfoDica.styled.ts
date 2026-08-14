import styled from "styled-components";
import { theme } from "@/styles/theme";

/** O "i", pequeno o bastante para não competir com o rótulo ao lado dele. */
export const Botao = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.05rem;
  height: 1.05rem;
  padding: 0;
  border: none;
  border-radius: ${theme.borderRadius.full};
  background: transparent;
  color: ${theme.colors.mutedForeground};
  cursor: pointer;
  flex-shrink: 0;

  &:hover,
  &:focus-visible {
    color: ${theme.colors.foreground};
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px color-mix(in srgb, ${theme.colors.ring} 30%, transparent);
    border-radius: ${theme.borderRadius.full};
  }
`;
