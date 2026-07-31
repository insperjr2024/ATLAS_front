import { Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function Layout() {
  const { usuario, logout } = useAuth();

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r p-4 flex flex-col gap-2">
        <span className="font-bold">IJR</span>
        <nav className="flex flex-col gap-1 mt-4">
          <a href="/dashboard">Desempenho</a>
          <a href="/bancas">Bancas</a>
          <a href="/calendario">Calendário</a>
          {usuario?.cargo?.pode_gerenciar_cargos && (
            <>
              <a href="/nucleo">Núcleo</a>
              <a href="/avaliacoes">Avaliações</a>
              <a href="/config">Config</a>
            </>
          )}
        </nav>
        <button onClick={logout} className="mt-auto text-sm text-left">
          Sair
        </button>
      </aside>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}