import styled, { keyframes, css } from "styled-components";
import { Link } from "react-router-dom";
import { theme } from "@/styles/theme";
import { Button } from "@/components/ui/button";

/* =========================================================================
   Login — painel dividido (imagem da equipe + formulário), inspirado na
   página de login do GP II. Exports namespaced "Login*" pra não colidir
   com nada — só o Login.tsx importa deste arquivo.
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

const loginCursorBlink = keyframes`
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
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
  min-height: 100vh;
  display: flex;
`;

/* Some abaixo de 1024px — em telas estreitas só o formulário aparece */
export const LoginLeftPanel = styled.div`
  display: none;
  width: 50%;
  position: relative;
  overflow: hidden;
  background: ${theme.colors.primary};

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
`;

export const LoginPanelOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(0, 0, 0, 0.65) 0%,
    rgba(0, 0, 0, 0.55) 40%,
    rgba(0, 0, 0, 0.5) 70%,
    rgba(0, 0, 0, 0.45) 100%
  );
  pointer-events: none;
`;

export const LoginPanelContent = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: 100%;
  padding: ${theme.spacing["2xl"]};
`;

export const LoginPanelTextContainer = styled.div`
  max-width: 560px;
  width: 100%;
  text-align: left;
`;

export const LoginPanelTitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5), 0 1px 2px rgba(0, 0, 0, 0.4);
`;

export const LoginPanelTitle = styled.h1`
  /* GP II carrega a família estática como "Inter"; aqui ela vem do
     @fontsource-variable/inter, registrada como "Inter Variable" — pedir
     "Inter" literal não casava com nada instalado e caía pro fallback
     (system-ui/Segoe UI), uma tipografia bem diferente. */
  font-family: "Inter Variable", system-ui, -apple-system, sans-serif;
  font-size: clamp(2rem, 4vw, 2.75rem);
  /* GP II carrega só até o peso 700 (Google Fonts wght@400;500;600;700) — aqui a
     fonte é variável e tem 800 de verdade, o que ficava visivelmente mais grosso
     que o original. 700 é o que o GP II realmente renderiza. */
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.02em;
  color: #ffffff;
  margin: 0;
`;

export const LoginPanelTitleAccent = styled.span`
  color: ${theme.colors.accent};
`;

export const LoginPanelTitleCursor = styled.span`
  display: inline-block;
  width: 3px;
  height: 1em;
  margin-left: 2px;
  vertical-align: text-bottom;
  background: ${theme.colors.accent};
  animation: ${loginCursorBlink} 0.8s step-end infinite;
`;

export const LoginPanelSubtitle = styled.p`
  font-size: ${theme.fontSize.lg};
  font-weight: 400;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1.7;
  letter-spacing: 0.01em;
  margin: 0;
`;

export const LoginRightPanel = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.md};
  background: ${theme.colors.background};

  @media (min-width: ${theme.breakpoints.sm}px) {
    padding: ${theme.spacing.xl};
  }
`;

export const LoginFormWrapper = styled.div`
  width: 100%;
  max-width: 28rem;
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xl};
  ${loginRevealStagger};

  & > * {
    width: 100%;
  }
`;

/* ---------- Cabeçalho ---------- */

/* Bloco único do header: logo grande + subtítulo no mesmo eixo, igual ao GP II —
   sem título de página separado, o logo já ocupa esse lugar. */
export const LoginHeaderBlock = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.125rem;
`;

export const LoginFormLogoWrap = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  width: 100%;
  margin-top: 0.5rem;

  @media (min-width: ${theme.breakpoints.sm}px) {
    margin-left: -3rem;
    margin-top: 1.5rem;
  }
`;

export const LoginBrandLogo = styled.img`
  display: block;
  max-height: 160px;
  width: auto;
  max-width: 100%;
  object-fit: contain;
  object-position: left center;
  margin: 0;
  padding: 0;
  vertical-align: top;
`;

export const LoginFormSubtitle = styled.p`
  width: 100%;
  color: ${theme.colors.mutedForeground};
  margin: 0;
  padding: 0;
  text-align: left;
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

export const LoginFieldRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const LoginForgotLink = styled(Link)`
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.accent};
  text-decoration: none;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

/*
 * O Input deste projeto (shadcn mais novo) tem h-8 por padrão — bem menor que
 * o h-11 (2.75rem) do Input do GP II. Pra ficar no mesmo formato/altura,
 * fixamos aqui o que lá vem de graça do componente; o resto (padding-left só
 * pro ícone) é o mesmo wrapper do GP II.
 */
export const LoginInputWrapper = styled.div`
  position: relative;

  & input {
    height: 2.75rem;
    border-radius: ${theme.borderRadius.lg};
    padding-left: 2.5rem;
  }
`;

export const LoginInputWrapperWithRight = styled(LoginInputWrapper)`
  & input {
    padding-right: 2.5rem;
  }
`;

export const LoginIconWrapper = styled.span`
  position: absolute;
  left: ${theme.spacing.md};
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.mutedForeground};
  pointer-events: none;
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

/*
 * Mesmo botão do GP II: outline vermelho que vira preenchido no hover. O
 * Button daqui não tem variant "accent" (nem precisa — tudo abaixo é
 * !important), mas o size="lg" dele é h-9 (36px) contra o h-11 (44px) do
 * GP II, então a altura vem fixa aqui pra bater com a altura dos inputs.
 */
export const LoginSubmitButton = styled(Button)`
  width: 100%;
  height: 2.75rem;
  gap: 0.5rem;
  background: transparent !important;
  border: 1.5px solid ${theme.colors.accent} !important;
  color: ${theme.colors.accent} !important;
  transition: background ${theme.transitions.fast}, color ${theme.transitions.fast} !important;

  &:hover:not(:disabled) {
    background: ${theme.colors.accent} !important;
    color: #ffffff !important;
  }
`;

export const LoginErrorMessage = styled.p`
  font-size: 0.85rem;
  color: ${theme.colors.destructive};
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  margin: 0;
  text-align: center;
`;

