import { useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { rotuloProjetos } from "@/utils/permissoes";
import insperJrLogo from "@/assets/insperjr.png";
import { FolderKanban, Gauge, ClipboardList, Calendar, LayoutDashboard, Users, ClipboardCheck, Settings, LogOut } from "lucide-react";
import type { LucideIcon } from "lucide-react";
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

interface NavItemConfig {
  icon: LucideIcon;
  label: string;
  path: string;
  section?: "admin";
  /** Marca o item como ativo também nas sub-rotas (ex.: /projetos/42/tarefas). */
  prefixo?: boolean;
  visible?: (cargo: NonNullable<ReturnType<typeof useAuth>["usuario"]>["cargo"]) => boolean;
}

const navItems: NavItemConfig[] = [
  // O rótulo é definido no componente: para coord e consultor é "Meus
  // projetos", porque eles só enxergam onde estão alocados (§6.1).
  { icon: FolderKanban, label: "Projetos", path: "/projetos", prefixo: true },
  { icon: Gauge, label: "Desempenho", path: "/dashboard" },
  { icon: ClipboardList, label: "Bancas", path: "/bancas" },
  { icon: Calendar, label: "Calendário", path: "/calendario" },
  {
    icon: LayoutDashboard,
    label: "Núcleo",
    path: "/nucleo",
    section: "admin",
    visible: (c) => c.pode_gerenciar_cargos,
  },
  {
    icon: Users,
    label: "Membros",
    path: "/membros",
    section: "admin",
    visible: (c) => c.pode_gerenciar_cargos,
  },
  {
    icon: ClipboardCheck,
    label: "Avaliações",
    path: "/avaliacoes",
    section: "admin",
    visible: (c) => c.pode_definir_formulario || c.pode_gerenciar_cargos,
  },
  {
    icon: Settings,
    label: "Config",
    path: "/config",
    section: "admin",
    visible: (c) => c.pode_gerenciar_cargos,
  },
];

export function Sidebar() {
  const { usuario, logout } = useAuth();
  const location = useLocation();

  const itensVisiveis = navItems.filter((item) => {
    if (!item.visible) return true;
    if (!usuario?.cargo) return false;
    return item.visible(usuario.cargo);
  });

  return (
    <SidebarContainer>
      <LogoContainer>
        <LogoImg src={insperJrLogo} alt="Insper Jr." />
      </LogoContainer>

      <Nav>
        {itensVisiveis.flatMap((item, index, visibleItems) => {
          const entries = [];
          if (item.section === "admin" && visibleItems[index - 1]?.section !== "admin") {
            entries.push(<SectionLabel key="admin-section">Administração</SectionLabel>);
          }
          const ativo = item.prefixo
            ? location.pathname.startsWith(item.path)
            : location.pathname === item.path;
          entries.push(
            <NavItem key={item.path} to={item.path} $isActive={ativo}>
              <item.icon size={20} />
              <span>{item.path === "/projetos" ? rotuloProjetos(usuario) : item.label}</span>
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
