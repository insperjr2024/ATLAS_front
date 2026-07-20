import { useState } from "react";
import type { FormEvent } from "react";
import insperJrLogo from "@/assets/insperjr2.png";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Envelope, Lock, ArrowRight, Eye, EyeSlash } from "@phosphor-icons/react";
import toast from "react-hot-toast";
import {
  AuthPageWrapper,
  LoginGlow,
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
  LoginFooterNote,
} from "./Auth.styled";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
      <LoginGlow $position="top" aria-hidden />
      <LoginGlow $position="bottom" aria-hidden />

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

        <LoginFooterNote>Sistema de Bancas · Insper Jr</LoginFooterNote>
      </LoginFormWrapper>
    </AuthPageWrapper>
  );
}
