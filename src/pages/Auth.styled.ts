import styled, { keyframes, css } from "styled-components";
import { theme } from "@/styles/theme";
import { Button } from "@/components/ui/button";

export const AuthPageWrapper = styled.div`
  min-height: 100vh;
  display: flex;
`;

/* =========================================================================
   Login — exports namespaced "Login*", motion apenas em CSS.
   ========================================================================= */

const loginFadeUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(22px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const loginFadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const loginSlowDrift = keyframes`
  0%   { transform: scale(1.08) translate3d(0, 0, 0); }
  50%  { transform: scale(1.14) translate3d(-1.5%, -1.5%, 0); }
  100% { transform: scale(1.08) translate3d(0, 0, 0); }
`;

const loginAuroraShift = keyframes`
  0%   { transform: translate3d(-8%, -6%, 0) rotate(0deg); opacity: 0.55; }
  50%  { transform: translate3d(6%, 8%, 0) rotate(8deg); opacity: 0.8; }
  100% { transform: translate3d(-8%, -6%, 0) rotate(0deg); opacity: 0.55; }
`;

const loginShine = keyframes`
  0%   { transform: translateX(-130%) skewX(-18deg); }
  60%  { transform: translateX(230%) skewX(-18deg); }
  100% { transform: translateX(230%) skewX(-18deg); }
`;

const loginCursorBlink = keyframes`
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
`;

const loginProgressFill = keyframes`
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
`;

const loginStatusPulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5); }
  50%      { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
`;

/* Staggered reveal: cada filho anima um tempo depois */
const loginRevealStagger = css`
  & > * {
    opacity: 0;
    animation: ${loginFadeUp} 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  & > *:nth-child(1) { animation-delay: 0.08s; }
  & > *:nth-child(2) { animation-delay: 0.18s; }
  & > *:nth-child(3) { animation-delay: 0.28s; }
  & > *:nth-child(4) { animation-delay: 0.38s; }
  & > *:nth-child(5) { animation-delay: 0.48s; }

  @media (prefers-reduced-motion: reduce) {
    & > * {
      opacity: 1;
      animation: none;
    }
  }
`;

/* ---------- Esquerda: painel cinematográfico da marca ---------- */

export const LoginLeftPanel = styled.div`
  display: none;
  position: relative;
  width: 52%;
  overflow: hidden;
  background: #1a0606;

  @media (min-width: 1024px) {
    display: flex;
  }
`;

export const LoginPanelImage = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: grayscale(0.25) contrast(1.08) brightness(0.92);
  transform: scale(1.08);
  animation: ${loginSlowDrift} 26s ease-in-out infinite;
  will-change: transform;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    transform: scale(1.05);
  }
`;

export const LoginPanelOverlay = styled.div`
  position: absolute;
  inset: 0;
  background:
    linear-gradient(
      180deg,
      rgba(10, 2, 2, 0.25) 0%,
      rgba(10, 2, 2, 0.55) 45%,
      rgba(8, 1, 1, 0.86) 100%
    ),
    radial-gradient(
      120% 90% at 15% 100%,
      rgba(190, 30, 30, 0.42) 0%,
      rgba(190, 30, 30, 0) 55%
    );
  pointer-events: none;
`;

export const LoginPanelAurora = styled.div`
  position: absolute;
  top: -20%;
  right: -25%;
  width: 70%;
  height: 70%;
  background: radial-gradient(
    closest-side,
    rgba(239, 68, 68, 0.55),
    rgba(239, 68, 68, 0) 70%
  );
  filter: blur(40px);
  mix-blend-mode: screen;
  animation: ${loginAuroraShift} 18s ease-in-out infinite;
  pointer-events: none;
  will-change: transform, opacity;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const LoginPanelGrain = styled.div`
  position: absolute;
  inset: 0;
  opacity: 0.18;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
`;

export const LoginPanelContent = styled.div`
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 100%;
  padding: 3.5rem;
`;

export const LoginPanelLockup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  opacity: 0;
  animation: ${loginFadeIn} 0.9s ease forwards;
  animation-delay: 0.2s;

  @media (prefers-reduced-motion: reduce) {
    opacity: 1;
    animation: none;
  }
`;

export const LoginPanelLockupLogo = styled.img`
  display: block;
  height: 24px;
  width: auto;
  object-fit: contain;
`;

export const LoginPanelLockupDivider = styled.span`
  width: 1px;
  height: 20px;
  background: rgba(255, 255, 255, 0.25);
`;

export const LoginPanelMiddle = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

export const LoginPanelKicker = styled.span`
  font-size: 0.78rem;
  font-weight: ${theme.fontWeight.semibold};
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.82);
`;

export const LoginPanelTextContainer = styled.div`
  max-width: 26ch;
  ${loginRevealStagger};
`;

export const LoginPanelTitle = styled.h2`
  font-family: "Inter", system-ui, -apple-system, sans-serif;
  font-size: clamp(1.9rem, 3.4vw, 2.75rem);
  font-weight: 800;
  line-height: 1.08;
  letter-spacing: -0.025em;
  color: #ffffff;
  margin: 0 0 1.5rem 0;
  text-shadow: 0 2px 18px rgba(0, 0, 0, 0.45);
`;

export const LoginPanelTitleAccent = styled.span`
  color: ${theme.colors.accent};
`;

export const LoginPanelTitleCursor = styled.span`
  display: inline-block;
  width: 3px;
  height: 0.92em;
  margin-left: 4px;
  vertical-align: text-bottom;
  background: ${theme.colors.accent};
  animation: ${loginCursorBlink} 0.8s step-end infinite;
`;

export const LoginPanelTrustRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding-top: 1.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.16);
  opacity: 0;
  animation: ${loginFadeUp} 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  animation-delay: 0.6s;

  @media (prefers-reduced-motion: reduce) {
    opacity: 1;
    animation: none;
  }
`;

export const LoginPanelTrustItem = styled.span`
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.78);
  white-space: nowrap;
`;

export const LoginPanelTrustStrong = styled.strong`
  color: #ffffff;
  font-weight: ${theme.fontWeight.bold};
`;

export const LoginPanelTrustDivider = styled.span`
  width: 1px;
  height: 22px;
  background: rgba(255, 255, 255, 0.2);
`;

/* ---------- Card de banca: amostra ilustrativa sobre a foto ---------- */

export const LoginBancaCard = styled.div`
  width: 100%;
  max-width: 20rem;
  margin-top: 2rem;
  padding: 1.25rem;
  border-radius: ${theme.borderRadius.xl};
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(16px) saturate(140%);
  -webkit-backdrop-filter: blur(16px) saturate(140%);
  box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.5);
  opacity: 0;
  animation: ${loginFadeUp} 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  animation-delay: 0.9s;

  @media (prefers-reduced-motion: reduce) {
    opacity: 1;
    animation: none;
  }
`;

export const LoginBancaStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.72rem;
  font-weight: ${theme.fontWeight.medium};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.72);
`;

export const LoginBancaStatusDot = styled.span`
  width: 7px;
  height: 7px;
  border-radius: ${theme.borderRadius.full};
  background: ${theme.colors.accent};
  flex-shrink: 0;
  animation: ${loginStatusPulse} 2.4s ease-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const LoginBancaProject = styled.p`
  margin: 0.6rem 0 0.15rem 0;
  font-size: 1rem;
  font-weight: ${theme.fontWeight.bold};
  color: #ffffff;
`;

export const LoginBancaMeta = styled.p`
  margin: 0;
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.6);
`;

export const LoginBancaDivider = styled.div`
  height: 1px;
  margin: 0.95rem 0;
  background: rgba(255, 255, 255, 0.14);
`;

export const LoginBancaFooter = styled.div`
  display: flex;
  align-items: center;
  gap: 0.85rem;
`;

export const LoginBancaAvatars = styled.div`
  display: flex;
  flex-shrink: 0;
`;

export const LoginBancaAvatar = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: ${theme.borderRadius.full};
  background: rgba(255, 255, 255, 0.18);
  border: 1.5px solid rgba(20, 6, 6, 0.55);
  font-size: 0.62rem;
  font-weight: ${theme.fontWeight.semibold};
  color: #ffffff;

  & + & {
    margin-left: -8px;
  }
`;

export const LoginBancaProgressBlock = styled.div`
  flex: 1;
  min-width: 0;
`;

export const LoginBancaProgressLabel = styled.p`
  margin: 0 0 0.4rem 0;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.78);
`;

export const LoginBancaProgressTrack = styled.div`
  height: 4px;
  border-radius: ${theme.borderRadius.full};
  background: rgba(255, 255, 255, 0.15);
  overflow: hidden;
`;

export const LoginBancaProgressFill = styled.span<{ $ratio: number }>`
  display: block;
  height: 100%;
  width: ${({ $ratio }) => `${Math.round($ratio * 100)}%`};
  border-radius: inherit;
  background: linear-gradient(90deg, ${theme.colors.accent}, #f87171);
  transform: scaleX(0);
  transform-origin: left center;
  animation: ${loginProgressFill} 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  animation-delay: 1.3s;

  @media (prefers-reduced-motion: reduce) {
    transform: scaleX(1);
    animation: none;
  }
`;

/* ---------- Direita: painel do formulário ---------- */

export const LoginRightPanel = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: ${theme.spacing.md};
  background:
    radial-gradient(
      120% 70% at 100% 0%,
      rgba(239, 68, 68, 0.06) 0%,
      rgba(239, 68, 68, 0) 60%
    ),
    ${theme.colors.background};

  @media (min-width: ${theme.breakpoints.sm}px) {
    padding: ${theme.spacing.xl};
  }
`;

export const LoginFormWrapper = styled.div`
  width: 100%;
  max-width: 27rem;
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xl};
  ${loginRevealStagger};

  & > * {
    width: 100%;
  }
`;

export const LoginHeaderBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.4rem;
`;

export const LoginBrandLockup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
`;

export const LoginBrandLogo = styled.img`
  display: block;
  height: 56px;
  width: auto;
  max-width: 100%;
  object-fit: contain;
`;

export const LoginBrandDivider = styled.span`
  width: 1px;
  align-self: stretch;
  min-height: 30px;
  background: ${theme.colors.border};
`;

export const LoginBrandProduct = styled.span`
  font-size: 0.95rem;
  font-weight: ${theme.fontWeight.semibold};
  letter-spacing: -0.01em;
  line-height: 1.2;
  color: ${theme.colors.foreground};
`;

export const LoginFormTitle = styled.h1`
  font-family: "Inter", system-ui, -apple-system, sans-serif;
  font-size: clamp(1.75rem, 3vw, 2.25rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.1;
  color: ${theme.colors.foreground};
  margin: 0;
`;

export const LoginFormSubtitle = styled.p`
  color: ${theme.colors.mutedForeground};
  font-size: 0.95rem;
  margin: 0;
`;

export const LoginAuthForm = styled.form`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: ${theme.spacing.lg};
`;

export const LoginFieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
`;

export const LoginInputWrapper = styled.div`
  position: relative;

  & input {
    padding-left: 2.6rem;
    height: 2.95rem;
    border-radius: ${theme.borderRadius.lg};
    transition: border-color ${theme.transitions.fast},
      box-shadow ${theme.transitions.fast};
  }

  & input:focus-visible {
    border-color: ${theme.colors.accent};
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.12);
  }

  &:focus-within svg {
    color: ${theme.colors.accent};
  }
`;

export const LoginInputWrapperWithRight = styled(LoginInputWrapper)`
  & input {
    padding-right: 2.75rem;
  }
`;

export const LoginIconWrapper = styled.span`
  position: absolute;
  left: ${theme.spacing.md};
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  color: ${theme.colors.mutedForeground};
  pointer-events: none;
  transition: color ${theme.transitions.fast};
`;

export const LoginTogglePasswordBtn = styled.button`
  position: absolute;
  right: ${theme.spacing.md};
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: ${theme.colors.mutedForeground};
  transition: color ${theme.transitions.fast};

  &:hover {
    color: ${theme.colors.foreground};
  }
`;

export const LoginSubmitButton = styled(Button)`
  position: relative;
  width: 100%;
  height: 3rem;
  gap: 0.5rem;
  overflow: hidden;
  border-radius: ${theme.borderRadius.lg};
  transition: transform ${theme.transitions.fast},
    box-shadow ${theme.transitions.normal};

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 10px 24px -8px rgba(239, 68, 68, 0.55);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 45%;
    height: 100%;
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.35) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    transform: translateX(-130%) skewX(-18deg);
  }

  &:hover:not(:disabled)::after {
    animation: ${loginShine} 0.9s ease forwards;
  }

  @media (prefers-reduced-motion: reduce) {
    &::after {
      display: none;
    }
  }
`;
