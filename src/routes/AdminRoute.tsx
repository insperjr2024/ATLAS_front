import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { PageLoadingBlock } from "@/styles/page.styled";
import type { Permissoes } from "@/types/auth";

/** As caixas de permissão que valem como booleano. */
type PermissaoCampo = keyof Permissoes;

/**
 * Guarda de rota por permissão (da posição, ver `types/auth.ts`).
 *
 * Cada área administrativa tem a sua caixa própria, dar acesso ao Núcleo não
 * dá acesso a Membros. Esconder o item na Sidebar não protege nada: sem este
 * guard, digitar /membros na barra de endereço abre a tela. E o backend
 * revalida tudo, porque o front só esconde.
 */
export function AdminRoute({ permissao }: { permissao: PermissaoCampo }) {
  const { usuario, carregando } = useAuth();

  if (carregando) return <PageLoadingBlock />;
  if (!usuario?.permissoes[permissao]) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
