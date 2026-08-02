import styled from "styled-components";
import { theme } from "@/styles/theme";

const THUMB_SIZE = "1.125rem";

export const NotaSliderSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

export const NotaSliderHeading = styled.h3`
  margin: 0;
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.normal};
  color: ${theme.colors.foreground};
`;

export const NotaScaleLabels = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0 calc(${THUMB_SIZE} / 2);
  margin-bottom: -${theme.spacing.sm};
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
  user-select: none;
`;

export const NotaSliderList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.lg};
`;

export const NotaSliderItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
`;

export const NotaSliderLabel = styled.label`
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.foreground};
  line-height: 1.4;
`;

export const NotaSliderValue = styled.span`
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
  min-width: 1.75rem;
  text-align: right;
`;

export const NotaSliderRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

export const NotaRangeInput = styled.input<{ $fillPercent: number }>`
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 0.25rem;
  border-radius: ${theme.borderRadius.full};
  background: linear-gradient(
    to right,
    ${theme.colors.primary} 0%,
    ${theme.colors.primary} ${({ $fillPercent }) => $fillPercent}%,
    ${theme.colors.border} ${({ $fillPercent }) => $fillPercent}%,
    ${theme.colors.border} 100%
  );
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: ${THUMB_SIZE};
    height: ${THUMB_SIZE};
    border-radius: ${theme.borderRadius.full};
    background: ${theme.colors.primary};
    border: 2px solid ${theme.colors.background};
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.2);
    cursor: pointer;
  }

  &::-moz-range-thumb {
    width: ${THUMB_SIZE};
    height: ${THUMB_SIZE};
    border-radius: ${theme.borderRadius.full};
    background: ${theme.colors.primary};
    border: 2px solid ${theme.colors.background};
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.2);
    cursor: pointer;
  }

  &:disabled::-webkit-slider-thumb,
  &:disabled::-moz-range-thumb {
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid ${theme.colors.ring};
    outline-offset: 2px;
  }
`;

export const NotaPreviewBlock = styled.div`
  margin-top: ${theme.spacing.lg};
  padding: ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.lg};
  background: ${theme.colors.muted};
`;

export const NotaPreviewTitle = styled.h4`
  margin: 0 0 ${theme.spacing.md};
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.semibold};
  color: ${theme.colors.mutedForeground};
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;
