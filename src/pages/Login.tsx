import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import insperJrLogo from "@/assets/insperjr2.png";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
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
  LoginErrorMessage,
  LoginFooterNote,
} from "./Auth.styled";

export function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      await login(email, senha);
      // 🏠 A primeira tela depois do login é /projetos, não o desempenho pessoal.
      navigate("/projetos");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao fazer login");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <AuthPageWrapper>
      <LoginGlow $position="top" aria-hidden />
      <LoginGlow $position="bottom" aria-hidden />

      <LoginFormWrapper>
        <LoginHeaderBlock>
          <LoginBrandLockup>
            <LoginBrandLogo src={insperJrLogo} alt="Insper Jr." />
            <LoginBrandDivider aria-hidden />
            <LoginBrandProduct>Núcleo de Bancas</LoginBrandProduct>
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
                <Mail size={20} />
              </LoginIconWrapper>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@al.insper.edu.br"
                required
              />
            </LoginInputWrapper>
          </LoginFieldGroup>

          <LoginFieldGroup>
            <Label htmlFor="senha">Senha</Label>
            <LoginInputWrapperWithRight>
              <LoginIconWrapper>
                <Lock size={20} />
              </LoginIconWrapper>
              <Input
                id="senha"
                name="senha"
                type={showPassword ? "text" : "password"}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                required
              />
              <LoginTogglePasswordBtn
                type="button"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </LoginTogglePasswordBtn>
            </LoginInputWrapperWithRight>
          </LoginFieldGroup>

          {erro && <LoginErrorMessage>{erro}</LoginErrorMessage>}

          <LoginSubmitButton type="submit" size="lg" disabled={carregando}>
            {carregando ? (
              <>Entrando...</>
            ) : (
              <>
                Entrar
                <ArrowRight size={16} />
              </>
            )}
          </LoginSubmitButton>
        </LoginAuthForm>

        <LoginFooterNote>Núcleo de Bancas · Insper Jr</LoginFooterNote>
      </LoginFormWrapper>
    </AuthPageWrapper>
  );
}
