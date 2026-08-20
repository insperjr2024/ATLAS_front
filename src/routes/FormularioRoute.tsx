import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { PageLoadingBlock } from "@/styles/page.styled";
import { pode } from "@/utils/permissoes";

export function FormularioRoute() {
  const { usuario, carregando } = useAuth();

  if (carregando) return <PageLoadingBlock />;

  // O formulário de banca não está na tabela das 10 permissões, então
  // continua restrito à diretoria, como era antes das caixas de cargo.
  if (!pode(usuario, "ver_dashboard_bancas")) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
