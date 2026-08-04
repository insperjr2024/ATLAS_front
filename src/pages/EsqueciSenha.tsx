import { Link } from "react-router-dom";
import insperJrLogo from "@/assets/insperjr2.png";
import {
  AuthPageWrapper,
  LoginRightPanel,
  LoginFormWrapper,
  LoginHeaderBlock,
  LoginFormLogoWrap,
  LoginBrandLogo,
  LoginFormSubtitle,
  LoginForgotLink,
} from "./Auth.styled";

/**
 * Sem endpoint de recuperação de senha no backend ainda — esta tela só
 * orienta a pedir redefinição pra diretoria, em vez de deixar o link do
 * login quebrado.
 */
export function EsqueciSenha() {
  return (
    <AuthPageWrapper>
      <LoginRightPanel>
        <LoginFormWrapper>
          <LoginHeaderBlock>
            <LoginFormLogoWrap>
              <LoginBrandLogo src={insperJrLogo} alt="Insper Jr." />
            </LoginFormLogoWrap>
            <LoginFormSubtitle>
              Ainda não temos redefinição de senha automática. Fale com a diretoria do Núcleo de
              Bancas pra redefinir a sua.
            </LoginFormSubtitle>
          </LoginHeaderBlock>

          <LoginForgotLink to="/login">Voltar para o login</LoginForgotLink>
        </LoginFormWrapper>
      </LoginRightPanel>
    </AuthPageWrapper>
  );
}
