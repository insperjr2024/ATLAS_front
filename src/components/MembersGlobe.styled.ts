import styled from "styled-components";
import { theme } from "@/styles/theme";

export const Stage = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  perspective: 1400px;
`;

export const Globe = styled.div<{ $dragging: boolean }>`
  position: relative;
  transform-style: preserve-3d;
  cursor: ${({ $dragging }) => ($dragging ? "grabbing" : "grab")};
  touch-action: none;
`;

export const Wire = styled.svg`
  position: absolute;
  inset: 0;
  pointer-events: none;
`;

export const NameSlot = styled.span`
  position: absolute;
  top: 50%;
  left: 50%;
  will-change: transform, opacity;
  transform-origin: center;
  white-space: nowrap;
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: #ffffff;
  pointer-events: none;
  user-select: none;
`;
