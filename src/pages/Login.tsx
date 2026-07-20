import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import equipeJrImg from "@/assets/EquipeJr.png";
import insperJrLogo from "@/assets/insperjr2.png";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Envelope, Lock, ArrowRight, Eye, EyeSlash } from "@phosphor-icons/react";
import toast from "react-hot-toast";
import {
  AuthPageWrapper,
  LoginLeftPanel,
  LoginPanelImage,
  LoginPanelOverlay,
  LoginPanelAurora,
  LoginPanelGrain,
  LoginPanelContent,
  LoginPanelTopRow,
  LoginPanelKicker,
  LoginPanelKickerDot,
  LoginPanelTextContainer,
  LoginPanelTitle,
  LoginPanelTitleAccent,
  LoginPanelTitleCursor,
  LoginPanelSubtitle,
  LoginPanelTrustRow,
  LoginPanelTrustItem,
  LoginPanelTrustStrong,
  LoginPanelTrustDivider,
  LoginRightPanel,
  LoginFormWrapper,
  LoginHeaderBlock,
  LoginBrandLockup,
  LoginBrandLogo,
  LoginBrandDivider,
  LoginBrandProduct,
  LoginFormTitle,
  LoginFormSubtitle,
  LoginAuthForm,
  LoginFieldGroup,
  LoginInputWrapper,
  LoginInputWrapperWithRight,
  LoginIconWrapper,
  LoginTogglePasswordBtn,
  LoginSubmitButton,
} from "./Auth.styled";

const WELCOME_TITLE = "Bem-vindo à Insper Jr";
const ACCENT_START = "Bem-vindo à ".length;
const TYPEWRITER_DELAY_MS = 80;

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [typedLength, setTypedLength] = useState(0);
  const isTypingComplete = typedLength >= WELCOME_TITLE.length;

  useEffect(() => {
    if (typedLength >= WELCOME_TITLE.length) return;
    const t = setTimeout(() => setTypedLength((n) => n + 1), TYPEWRITER_DELAY_MS);
    return () => clearTimeout(t);
  }, [typedLength]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    setIsLoading(true);
    try {
      // TODO: plugar a autenticação real aqui (AuthContext + services/auth).
      console.log("login", { email, password });
      toast.success("Formulário enviado (autenticação ainda não conectada).");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPageWrapper>
      <LoginLeftPanel>
        <LoginPanelImage src={equipeJrImg} alt="Equipe Insper Jr." />
        <LoginPanelOverlay />
        <LoginPanelAurora />
        <LoginPanelGrain />
        <LoginPanelContent>
          <LoginPanelTopRow>
            <LoginPanelKickerDot />
            <LoginPanelKicker>Sistema de Bancas</LoginPanelKicker>
          </LoginPanelTopRow>

          <LoginPanelTextContainer>
            <LoginPanelTitle>
              {WELCOME_TITLE.slice(0, Math.min(typedLength, ACCENT_START))}
              {typedLength > ACCENT_START && (
                <LoginPanelTitleAccent>
                  {WELCOME_TITLE.slice(ACCENT_START, typedLength)}
                </LoginPanelTitleAccent>
              )}
              {!isTypingComplete && <LoginPanelTitleCursor aria-hidden />}
            </LoginPanelTitle>
            <LoginPanelSubtitle>
              A Insper Jr é uma das maiores empresas juniores do país, com diversas
              frentes de atuação, englobando alunos de todos os cursos de faculdade.
            </LoginPanelSubtitle>
          </LoginPanelTextContainer>

          <LoginPanelTrustRow>
            <LoginPanelTrustItem>
              <LoginPanelTrustStrong>+30</LoginPanelTrustStrong> anos de história
            </LoginPanelTrustItem>
            <LoginPanelTrustDivider />
            <LoginPanelTrustItem>
              <LoginPanelTrustStrong>Multidisciplinar</LoginPanelTrustStrong> por essência
            </LoginPanelTrustItem>
          </LoginPanelTrustRow>
        </LoginPanelContent>
      </LoginLeftPanel>

      <LoginRightPanel>
        <LoginFormWrapper>
          <LoginHeaderBlock>
            <LoginBrandLockup>
              <LoginBrandLogo src={insperJrLogo} alt="Insper Jr." />
              <LoginBrandDivider aria-hidden />
              <LoginBrandProduct>Sistema de Bancas</LoginBrandProduct>
            </LoginBrandLockup>
            <LoginFormTitle>Acesse sua conta</LoginFormTitle>
            <LoginFormSubtitle>
              Entre com seu e-mail Insper Jr para acessar as bancas.
            </LoginFormSubtitle>
          </LoginHeaderBlock>

          <LoginAuthForm onSubmit={handleSubmit}>
            <LoginFieldGroup>
              <Label htmlFor="email">E-mail</Label>
              <LoginInputWrapper>
                <LoginIconWrapper>
                  <Envelope size={20} />
                </LoginIconWrapper>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu.email@insperjr.com.br"
                  required
                />
              </LoginInputWrapper>
            </LoginFieldGroup>

            <LoginFieldGroup>
              <Label htmlFor="password">Senha</Label>
              <LoginInputWrapperWithRight>
                <LoginIconWrapper>
                  <Lock size={20} />
                </LoginIconWrapper>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                />
                <LoginTogglePasswordBtn
                  type="button"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                </LoginTogglePasswordBtn>
              </LoginInputWrapperWithRight>
            </LoginFieldGroup>

            <LoginSubmitButton
              type="submit"
              variant="accent"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>Entrando...</>
              ) : (
                <>
                  Entrar
                  <ArrowRight size={16} />
                </>
              )}
            </LoginSubmitButton>
          </LoginAuthForm>
        </LoginFormWrapper>
      </LoginRightPanel>
    </AuthPageWrapper>
  );
}
