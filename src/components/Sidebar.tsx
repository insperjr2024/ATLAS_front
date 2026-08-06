import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { rotuloProjetos } from "@/utils/permissoes";
import { getNotificacoes, marcarNotificacaoLida } from "@/lib/notificacoes";
import type { Notificacao } from "@/types/notificacao";
import insperJrLogo from "@/assets/insperjr.png";
import { BarChart3, Bell, FolderKanban, Gauge, ClipboardList, Calendar, CalendarCog, LayoutDashboard, Users, ClipboardCheck, Settings, LogOut, Star, GraduationCap } from "lucide-react";
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
  NotificacoesWrap,
  SinoButton,
  SinoBadge,
  NotificacoesPainel,
  NotificacaoItem,
  NotificacaoVazia,
} from "./Sidebar.styled";

type UsuarioLogado = NonNullable<ReturnType<typeof useAuth>["usuario"]>;

interface NavItemConfig {
  icon: LucideIcon;
  label: string;
  path: string;
  section?: "admin";
  /** Marca o item como ativo também nas sub-rotas (ex.: /projetos/42/tarefas). */
  prefixo?: boolean;
  /** Visibilidade por CARGO — as 3 flags do módulo de bancas. */
  visible?: (cargo: UsuarioLogado["cargo"]) => boolean;
  /** Visibilidade por POSIÇÃO (§3) — dimensão diferente do cargo. É o que o
   *  item de Monitoramento precisa, e o mecanismo antigo não cobria. */
  visiblePorPosicao?: (usuario: UsuarioLogado) => boolean;
}

const navItems: NavItemConfig[] = [
  // O rótulo é definido no componente: para coord e consultor é "Meus
  // projetos", porque eles só enxergam onde estão alocados (§6.1).
  { icon: FolderKanban, label: "Projetos", path: "/projetos", prefixo: true },
  { icon: Gauge, label: "Desempenho em Bancas", path: "/dashboard" },
  {
    icon: Star,
    label: "Avaliação de Desempenho",
    path: "/avaliacao-desempenho",
    prefixo: true,
    // Só quem pode ser avaliado por um colega (regra 2.3 é sempre via
    // `projeto_membro.papel` = coordenador/consultor — diretor e gerente
    // nunca entram nessa tabela, então nunca teriam nada pra responder aqui;
    // sem isso, diretor via 2 botões "Avaliação de Desempenho" na sidebar).
    visiblePorPosicao: (u) => u.posicao === "coordenador" || u.posicao === "consultor",
  },
  {
    icon: GraduationCap,
    label: "Meus Mentorados",
    path: "/avaliacao-desempenho/mentorados",
    // Regra 2.5 — mentor é sempre coordenador.
    visiblePorPosicao: (u) => u.posicao === "coordenador",
  },
  { icon: ClipboardList, label: "Bancas", path: "/bancas" },
  { icon: Calendar, label: "Calendário", path: "/calendario" },
  // A partir daqui, tudo é admin — item de Monitoramento entra na mesma
  // seção que os outros (antes ficava solto lá em cima, com o rótulo
  // "Administração" só aparecendo mais abaixo, o que dava a entender que
  // Monitoramento não era restrito).
  {
    icon: BarChart3,
    label: "Monitoramento",
    path: "/monitoramento",
    prefixo: true,
    section: "admin",
    visible: (c) => c.pode_ver_monitoramento,
  },
  {
    icon: LayoutDashboard,
    label: "Núcleo",
    path: "/nucleo",
    section: "admin",
    visiblePorPosicao: (u) => u.posicao === "diretor",
  },
  {
    icon: Users,
    label: "Membros",
    path: "/membros",
    section: "admin",
    visible: (c) => c.pode_gerir_membros,
  },
  {
    icon: ClipboardCheck,
    label: "Avaliação de Banca",
    path: "/avaliacoes",
    section: "admin",
    visiblePorPosicao: (u) => u.posicao === "diretor",
  },
  {
    icon: Star,
    label: "Avaliação de Desempenho",
    path: "/avaliacao-desempenho/painel",
    section: "admin",
    prefixo: true,
    visiblePorPosicao: (u) => u.posicao === "diretor" || u.posicao === "gerente",
  },
  {
    icon: CalendarCog,
    label: "Calendários base",
    path: "/calendarios-base",
    section: "admin",
    visiblePorPosicao: (u) => u.posicao === "diretor",
  },
  {
    icon: Settings,
    label: "Configurações",
    path: "/config",
    section: "admin",
    visiblePorPosicao: (u) => u.posicao === "diretor",
  },
];

export function Sidebar() {
  const { usuario, token, logout } = useAuth();
  const location = useLocation();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [painelAberto, setPainelAberto] = useState(false);

  useEffect(() => {
    if (!token) return;
    getNotificacoes(token).then(setNotificacoes).catch(() => setNotificacoes([]));
  }, [token]);

  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  async function abrirNotificacao(notificacao: Notificacao) {
    if (notificacao.lida || !token) return;
    try {
      await marcarNotificacaoLida(notificacao.id, token);
      setNotificacoes((lista) =>
        lista.map((n) => (n.id === notificacao.id ? { ...n, lida: true } : n)),
      );
    } catch {
      // Silencioso: marcar como lida é conveniência, não vale travar a UI.
    }
  }

  const itensVisiveis = navItems.filter((item) => {
    if (item.visiblePorPosicao) {
      return !!usuario && item.visiblePorPosicao(usuario);
    }
    if (!item.visible) return true;
    if (!usuario?.cargo) return false;
    return item.visible(usuario.cargo);
  });

  // Dois itens de prefixo podem casar com a mesma rota (ex.: "Avaliação de
  // Desempenho" em "/avaliacao-desempenho" e "Meus Mentorados" em
  // "/avaliacao-desempenho/mentorados") — só o path mais específico deve
  // acender, senão os dois ficam vermelhos ao mesmo tempo.
  const itemAtivo = itensVisiveis.reduce<NavItemConfig | null>((melhor, item) => {
    const corresponde = item.prefixo
      ? location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
      : location.pathname === item.path;
    if (!corresponde) return melhor;
    if (!melhor || item.path.length > melhor.path.length) return item;
    return melhor;
  }, null);

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
          const ativo = item === itemAtivo;
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
        <NotificacoesWrap>
          <SinoButton type="button" onClick={() => setPainelAberto((v) => !v)} aria-expanded={painelAberto}>
            <Bell size={16} />
            Notificações
            {naoLidas > 0 && <SinoBadge>{naoLidas}</SinoBadge>}
          </SinoButton>
          {painelAberto && (
            <NotificacoesPainel role="menu">
              {notificacoes.length === 0 && <NotificacaoVazia>Nenhuma notificação ainda.</NotificacaoVazia>}
              {notificacoes.map((notificacao) => (
                <NotificacaoItem
                  key={notificacao.id}
                  type="button"
                  $lida={notificacao.lida}
                  onClick={() => abrirNotificacao(notificacao)}
                >
                  {notificacao.mensagem}
                </NotificacaoItem>
              ))}
            </NotificacoesPainel>
          )}
        </NotificacoesWrap>
        <LogoutButton onClick={logout} type="button">
          <LogOut size={20} />
          <span>Sair</span>
        </LogoutButton>
      </Footer>
    </SidebarContainer>
  );
}
