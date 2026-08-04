import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { Posicao } from "@/types/auth";
import { PageLoadingBlock } from "@/styles/page.styled";

/**
 * Guard por **posição** (§3) — no molde do `AdminRoute`, que guarda por
 * `cargo` (as permissões do módulo de bancas). São dimensões diferentes: um
 * gerente de frente não é necessariamente Diretor de Projetos no cargo.
 *
 * Quem não passa cai em `/projetos`, a nova home — não em `/login`, porque
 * está logado, só não tem a posição.
 */
export function RequirePosicao({ posicoes }: { posicoes: Posicao[] }) {
  const { usuario, carregando } = useAuth();

  if (carregando) return <PageLoadingBlock />;
  if (!usuario || !posicoes.includes(usuario.posicao)) return <Navigate to="/projetos" replace />;

  return <Outlet />;
}
