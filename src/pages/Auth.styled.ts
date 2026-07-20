import styled, { keyframes, css } from "styled-components";
import { theme } from "@/styles/theme";
import { Button } from "@/components/ui/button";

/* =========================================================================
   Login — coluna única centrada, exports namespaced "Login*".
   Toda a motion vive em CSS; o componente só compõe.
   ========================================================================= */

const loginFadeUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const loginGlowDrift = keyframes`
  0%   { transform: translate3d(0, 0, 0) scale(1); opacity: 0.55; }
  50%  { transform: translate3d(4%, 6%, 0) scale(1.12); opacity: 0.8; }
  100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.55; }
`;

const loginShine = keyframes`
  0%   { transform: translateX(-130%) skewX(-18deg); }
  60%  { transform: translateX(230%) skewX(-18deg); }
  100% { transform: translateX(230%) skewX(-18deg); }
`;

/* Staggered reveal: cada filho entra um tempo depois do anterior */
const loginRevealStagger = css`
  & > * {
    opacity: 0;
    animation: ${loginFadeUp} 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  & > *:nth-child(1) { animation-delay: 0.06s; }
  & > *:nth-child(2) { animation-delay: 0.14s; }
  & > *:nth-child(3) { animation-delay: 0.22s; }
  & > *:nth-child(4) { animation-delay: 0.3s; }
  & > *:nth-child(5) { animation-delay: 0.38s; }

  @media (prefers-reduced-motion: reduce) {
    & > * {
      opacity: 1;
      animation: none;
    }
  }
`;

/* ---------- Página ---------- */

export const AuthPageWrapper = styled.div`
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: ${theme.spacing.lg} ${theme.spacing.md};
  background: ${theme.colors.background};

  @media (min-width: ${theme.breakpoints.sm}px) {
    padding: ${theme.spacing.xl};
  }
`;

/* Dois halos suaves que respiram — dão vida ao fundo sem pedir imagem nenhuma */
export const LoginGlow = styled.div<{ $position: "top" | "bottom" }>`
  position: absolute;
  width: min(48rem, 90vw);
  height: min(48rem, 90vw);
  border-radius: ${theme.borderRadius.full};
  pointer-events: none;
  filter: blur(90px);
  will-change: transform, opacity;
  animation: ${loginGlowDrift} 16s ease-in-out infinite;

  ${({ $position }) =>
    $position === "top"
      ? css`
          top: -22rem;
          right: -14rem;
          background: radial-gradient(
            closest-side,
            rgba(239, 68, 68, 0.16),
            rgba(239, 68, 68, 0) 70%
          );
        `
      : css`
          bottom: -24rem;
          left: -16rem;
          animation-delay: -8s;
          background: radial-gradient(
            closest-side,
            rgba(239, 68, 68, 0.1),
            rgba(239, 68, 68, 0) 70%
          );
        `}

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const LoginFormWrapper = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 24rem;
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xl};
  ${loginRevealStagger};

  & > * {
    width: 100%;
  }
`;

/* ---------- Cabeçalho ---------- */

export const LoginHeaderBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.4rem;
`;

export const LoginBrandLockup = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
  margin-bottom: 1rem;
`;

export const LoginBrandLogo = styled.img`
  display: block;
  height: 44px;
  width: auto;
  max-width: 100%;
  object-fit: contain;
`;

export const LoginBrandDivider = styled.span`
  width: 1px;
  align-self: stretch;
  min-height: 26px;
  background: ${theme.colors.border};
`;

export const LoginBrandProduct = styled.span`
  font-size: 0.9rem;
  font-weight: ${theme.fontWeight.semibold};
  letter-spacing: -0.01em;
  line-height: 1.25;
  color: ${theme.colors.foreground};
`;

export const LoginFormTitle = styled.h1`
  font-size: clamp(1.6rem, 4vw, 1.9rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.15;
  color: ${theme.colors.foreground};
  margin: 0;
`;

export const LoginFormSubtitle = styled.p`
  color: ${theme.colors.mutedForeground};
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 0;
`;

/* ---------- Formulário ---------- */

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

export const LoginFooterNote = styled.p`
  font-size: 0.8rem;
  color: ${theme.colors.mutedForeground};
  text-align: center;
  margin: 0;
`;
