import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { PageLoadingBlock } from "@/styles/page.styled";

export function FormularioRoute() {
  const { usuario, carregando } = useAuth();

  if (carregando) return <PageLoadingBlock />;

  // O formulário de banca não está na tabela das 10 permissões, então
  // continua restrito à diretoria, como era antes das caixas de cargo.
  if (usuario?.posicao !== "diretor") return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
