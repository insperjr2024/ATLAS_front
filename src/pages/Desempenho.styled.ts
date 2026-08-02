import styled from "styled-components";
import { theme } from "@/styles/theme";

export const GreetingHeader = styled.header`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xs};
`;

export const GreetingTitle = styled.h1`
  margin: 0;
  font-size: ${theme.fontSize["2xl"]};
  font-weight: ${theme.fontWeight.bold};
  letter-spacing: -0.01em;
`;

export const GreetingSubtitle = styled.p`
  margin: 0;
  font-size: 0.9rem;
  color: ${theme.colors.mutedForeground};
`;

export const ChartCaption = styled.p`
  margin: ${theme.spacing.md} 0 0;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.mutedForeground};
`;
