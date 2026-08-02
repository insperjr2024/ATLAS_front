import styled from "styled-components";

export const GreetingHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

export const GreetingTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.01em;
`;

export const GreetingSubtitle = styled.p`
  font-size: 0.9rem;
  color: var(--muted-foreground);
`;

export const ChartCaption = styled.p`
  margin-top: 1rem;
  font-size: 0.875rem;
  color: var(--muted-foreground);
`;
