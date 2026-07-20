import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import equipeJrImg from "@/assets/EquipeJr.png";
import insperJrLogo from "@/assets/insperjr2.png";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Envelope,
  Lock,
  ArrowRight,
  Eye,
  EyeSlash,
  Users,
  ListChecks,
  ChatCircleText,
} from "@phosphor-icons/react";
import toast from "react-hot-toast";
import {
  AuthPageWrapper,
  LoginLeftPanel,
  LoginPanelImage,
  LoginPanelOverlay,
  LoginPanelAurora,
  LoginPanelGrain,
  LoginPanelContent,
  LoginPanelLockup,
  LoginPanelLockupLogo,
  LoginPanelLockupDivider,
  LoginPanelKicker,
  LoginPanelMiddle,
  LoginPanelTextContainer,
  LoginPanelTitle,
  LoginPanelTitleAccent,
  LoginPanelTitleCursor,
  LoginBancaCard,
  LoginBancaStatus,
  LoginBancaStatusDot,
  LoginBancaProject,
  LoginBancaMeta,
  LoginBancaDivider,
  LoginBancaFooter,
  LoginBancaAvatars,
  LoginBancaAvatar,
  LoginBancaProgressBlock,
  LoginBancaProgressLabel,
  LoginBancaProgressTrack,
  LoginBancaProgressFill,
  LoginPanelCapabilityRow,
  LoginPanelCapabilityItem,
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

const WELCOME_TITLE = "Onde os projetos da Insper Jr são avaliados.";
const ACCENT_START = WELCOME_TITLE.indexOf("avaliados");
const TYPEWRITER_DELAY_MS = 80;

/** Amostra ilustrativa — não é dado real, serve só para comunicar o domínio na tela de login. */
const BANCA_EXEMPLO = {
  projeto: "Projeto Alfa",
  data: "12 mar · 14h30",
  iniciais: ["AM", "BR", "CL"],
  avaliadores: 3,
  enviadas: 2,
} as const;

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
          <LoginPanelLockup>
            <LoginPanelLockupLogo src={insperJrLogo} alt="Insper Jr." />
            <LoginPanelLockupDivider aria-hidden />
            <LoginPanelKicker>Sistema de Bancas</LoginPanelKicker>
          </LoginPanelLockup>

          <LoginPanelMiddle>
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
            </LoginPanelTextContainer>

            <LoginBancaCard aria-hidden="true">
              <LoginBancaStatus>
                <LoginBancaStatusDot />
                Banca em andamento
              </LoginBancaStatus>

              <LoginBancaProject>{BANCA_EXEMPLO.projeto}</LoginBancaProject>
              <LoginBancaMeta>{BANCA_EXEMPLO.data}</LoginBancaMeta>

              <LoginBancaDivider />

              <LoginBancaFooter>
                <LoginBancaAvatars>
                  {BANCA_EXEMPLO.iniciais.map((inicial) => (
                    <LoginBancaAvatar key={inicial}>{inicial}</LoginBancaAvatar>
                  ))}
                </LoginBancaAvatars>

                <LoginBancaProgressBlock>
                  <LoginBancaProgressLabel>
                    {BANCA_EXEMPLO.enviadas} de {BANCA_EXEMPLO.avaliadores} avaliações
                  </LoginBancaProgressLabel>
                  <LoginBancaProgressTrack>
                    <LoginBancaProgressFill
                      $ratio={BANCA_EXEMPLO.enviadas / BANCA_EXEMPLO.avaliadores}
                    />
                  </LoginBancaProgressTrack>
                </LoginBancaProgressBlock>
              </LoginBancaFooter>
            </LoginBancaCard>
          </LoginPanelMiddle>

          <LoginPanelCapabilityRow>
            <LoginPanelCapabilityItem>
              <Users size={18} weight="duotone" />
              Bancas
            </LoginPanelCapabilityItem>
            <LoginPanelCapabilityItem>
              <ListChecks size={18} weight="duotone" />
              Critérios
            </LoginPanelCapabilityItem>
            <LoginPanelCapabilityItem>
              <ChatCircleText size={18} weight="duotone" />
              Feedback
            </LoginPanelCapabilityItem>
          </LoginPanelCapabilityRow>
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
