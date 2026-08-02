import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { PageLoadingBlock } from "@/styles/page.styled";

export function FormularioRoute() {
  const { usuario, carregando } = useAuth();

  if (carregando) return <PageLoadingBlock />;

  const podeAcessar =
    !!usuario?.cargo.pode_definir_formulario || !!usuario?.cargo.pode_gerenciar_cargos;

  if (!podeAcessar) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
