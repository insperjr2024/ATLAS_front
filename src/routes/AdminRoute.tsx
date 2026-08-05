import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { PageLoadingBlock } from "@/styles/page.styled";
import type { Cargo } from "@/types/auth";

/** As caixas do cargo que valem como permissão booleana. */
type PermissaoCargo = {
  [K in keyof Cargo]: Cargo[K] extends boolean ? K : never;
}[keyof Cargo];

/**
 * Guarda de rota por permissão de cargo.
 *
 * Cada área administrativa tem a sua caixa própria — dar acesso ao Núcleo não
 * dá acesso a Membros. Esconder o item na Sidebar não protege nada: sem este
 * guard, digitar /membros na barra de endereço abre a tela. E o backend
 * revalida tudo, porque o front só esconde.
 */
export function AdminRoute({ permissao }: { permissao: PermissaoCargo }) {
  const { usuario, carregando } = useAuth();

  if (carregando) return <PageLoadingBlock />;
  if (!usuario?.cargo[permissao]) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
