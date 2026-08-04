import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { LayoutWrapper, Main } from "./Layout.styled";

export function Layout() {
  return (
    <LayoutWrapper>
      <Sidebar />
      <Main>
        <Outlet />
      </Main>
    </LayoutWrapper>
  );
}
