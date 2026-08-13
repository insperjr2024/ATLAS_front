import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

/**
 * A porta de todas as telas logadas.
 *
 * Além do "tem token?", ela segura quem entrou com a senha provisória do
 * e-mail de cadastro: enquanto `senha_provisoria` for verdadeiro, o único
 * destino é `/definir-senha`. Fica AQUI, e não em cada tela, porque a trava
 * precisa valer para qualquer entrada, link direto de notificação, aba
 * antiga restaurada, sessão retomada dias depois.
 *
 * O backend recusa as outras rotas com 403 de qualquer jeito; este redirect é
 * o que transforma esse 403 numa tela que explica o que fazer, em vez de uma
 * página de erro.
 */
export function PrivateRoute() {
  const { token, usuario, carregando } = useAuth();
  const { pathname } = useLocation();

  if (carregando) return <div>Carregando...</div>;
  if (!token) return <Navigate to="/login" replace />;

  if (usuario?.senha_provisoria && pathname !== "/definir-senha") {
    return <Navigate to="/definir-senha" replace />;
  }

  return <Outlet />;
}
