import { useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import insperJrLogo from "@/assets/insperjr.png";
import { Gauge, ClipboardList, Calendar, Users, ClipboardCheck, Settings, LogOut } from "lucide-react";
import {
  SidebarContainer,
  LogoContainer,
  LogoImg,
  Nav,
  NavItem,
  SectionLabel,
  Footer,
  UserName,
  LogoutButton,
} from "./Sidebar.styled";

const navItems = [
  { icon: Gauge, label: "Desempenho", path: "/dashboard", adminOnly: false },
  { icon: ClipboardList, label: "Bancas", path: "/bancas", adminOnly: false },
  { icon: Calendar, label: "Calendário", path: "/calendario", adminOnly: false },
  { icon: Users, label: "Núcleo", path: "/nucleo", adminOnly: true },
  { icon: ClipboardCheck, label: "Avaliações", path: "/avaliacoes", adminOnly: true },
  { icon: Settings, label: "Config", path: "/config", adminOnly: true },
];

export function Sidebar() {
  const { usuario, logout } = useAuth();
  const location = useLocation();
  const isAdmin = !!usuario?.cargo?.pode_gerenciar_cargos;

  return (
    <SidebarContainer>
      <LogoContainer>
        <LogoImg src={insperJrLogo} alt="Insper Jr." />
      </LogoContainer>

      <Nav>
        {navItems
          .filter((item) => !item.adminOnly || isAdmin)
          .flatMap((item, index, visibleItems) => {
            const entries = [];
            if (item.adminOnly && !visibleItems[index - 1]?.adminOnly) {
              entries.push(<SectionLabel key="admin-section">Administração</SectionLabel>);
            }
            entries.push(
              <NavItem key={item.path} to={item.path} $isActive={location.pathname === item.path}>
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavItem>,
            );
            return entries;
          })}
      </Nav>

      <Footer>
        {usuario && <UserName>{usuario.nome}</UserName>}
        <LogoutButton onClick={logout} type="button">
          <LogOut size={20} />
          <span>Sair</span>
        </LogoutButton>
      </Footer>
    </SidebarContainer>
  );
}
