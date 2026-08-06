import { Outlet } from "react-router-dom";
import { NotificacoesProvider } from "@/context/NotificacoesContext";
import { Sidebar } from "./Sidebar";
import { LayoutWrapper, Main } from "./Layout.styled";

export function Layout() {
  // O provider mora aqui, e não no App: o Layout só é renderizado dentro do
  // PrivateRoute, então o polling do sino nunca roda na tela de login.
  return (
    <NotificacoesProvider>
      <LayoutWrapper>
        <Sidebar />
        <Main>
          <Outlet />
        </Main>
      </LayoutWrapper>
    </NotificacoesProvider>
  );
}
