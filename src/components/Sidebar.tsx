import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useNotificacoes } from "@/context/NotificacoesContext";
import { rotuloProjetos } from "@/utils/permissoes";
import { getNotificacoes, marcarNotificacaoLida } from "@/lib/notificacoes";
import type { Notificacao } from "@/types/notificacao";
import insperJrLogo from "@/assets/insperjr.png";
import { BarChart3, Bell, FolderKanban, ClipboardList, Calendar, CalendarCog, Users, ClipboardCheck, Settings, LogOut, Star, GraduationCap, User, UserPlus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { FotoCircular } from "@/components/Avatar";
import {
  SidebarContainer,
  LogoContainer,
  LogoImg,
  Nav,
  NavItem,
  SectionLabel,
  Footer,
  UserRow,
  UserAvatar,
  UserName,
  LogoutButton,
  NotificacoesWrap,
  SinoButton,
  SinoBadge,
  NotificacoesPainel,
  NotificacaoItem,
  NotificacaoVazia,
  VerTodas,
} from "./Sidebar.styled";

type UsuarioLogado = NonNullable<ReturnType<typeof useAuth>["usuario"]>;

/** "Ana Souza" -> "AS". Só entra em jogo quando a pessoa não tem foto. */
function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

interface NavItemConfig {
  icon: LucideIcon;
  label: string;
  path: string;
  section?: "admin";
  /** Marca o item como ativo também nas sub-rotas (ex.: /projetos/42/tarefas). */
  prefixo?: boolean;
  /** Visibilidade por PERMISSÃO (da posição, ver `types/auth.ts`). */
  visible?: (permissoes: UsuarioLogado["permissoes"]) => boolean;
  /** Visibilidade por POSIÇÃO direto, pra regra que não é uma caixa
   *  de permissão, como o item de Monitoramento restrito a certas posições. */
  visiblePorPosicao?: (usuario: UsuarioLogado) => boolean;
}

const navItems: NavItemConfig[] = [
  // O rótulo é definido no componente: para coord e consultor é "Meus
  // projetos", porque eles só enxergam onde estão alocados.
  { icon: FolderKanban, label: "Projetos", path: "/projetos", prefixo: true },
  {
    icon: Star,
    label: "Avaliação de Desempenho",
    path: "/avaliacao-desempenho",
    prefixo: true,
    // Só quem pode ser avaliado por um colega (regra 2.3 é sempre via
    // `projeto_membro.papel` = coordenador/consultor, diretor e gerente
    // nunca entram nessa tabela, então nunca teriam nada pra responder aqui;
    // sem isso, diretor via 2 botões "Avaliação de Desempenho" na sidebar —
    // este e o painel admin, que já usa o mesmo rótulo).
    visiblePorPosicao: (u) => u.posicao === "coordenador" || u.posicao === "consultor",
  },
  {
    icon: GraduationCap,
    label: "Meus Mentorados",
    path: "/avaliacao-desempenho/mentorados",
    // Vínculo independente do projeto, escolhido pela diretoria — mentor
    // pode ser coordenador, gerente ou diretor (2026-08-06). Fica FORA do
    // item "Avaliação de Desempenho" de propósito: mentoria não é processo
    // de avaliação, é acompanhamento; juntar os dois também colidia com o
    // rótulo do painel admin, que a diretoria já vê.
    visiblePorPosicao: (u) => u.posicao === "coordenador" || u.posicao === "gerente" || u.posicao === "diretor",
  },
  { icon: ClipboardList, label: "Bancas", path: "/bancas" },
  // Sem trava: a página serve os dois lados e decide o que mostrar pelas
  // flags que o back manda, consultor pede para entrar, quem coordena ou
  // monta equipe responde aos pedidos.
  { icon: UserPlus, label: "Vagas em projetos", path: "/vagas" },
  { icon: Calendar, label: "Calendário", path: "/calendario" },
  // Sem trava: a grade de aulas é de todo mundo, e cada um só vê a sua.
  { icon: User, label: "Meu perfil", path: "/meu-perfil" },
  // Notificações NÃO entram aqui: o acesso é pelo sino no rodapé, que já
  // mostra as últimas sem trocar de página. Ter os dois seria duas portas
  // para a mesma coisa.
  // A partir daqui, tudo é admin, item de Monitoramento entra na mesma
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
    icon: Users,
    label: "Membros",
    path: "/membros",
    section: "admin",
    visible: (c) => c.pode_gerir_membros,
  },
  {
    icon: ClipboardCheck,
    label: "Dashboard Bancas",
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
    visible: (c) => c.pode_administrar_desempenho,
  },
  {
    icon: CalendarCog,
    label: "Calendários base",
    path: "/calendarios-base",
    section: "admin",
    visible: (c) => c.pode_administrar_configuracoes,
  },
  {
    icon: Settings,
    label: "Configurações",
    path: "/config",
    section: "admin",
    visible: (c) => c.pode_administrar_configuracoes,
  },
];

export function Sidebar() {
  const { usuario, token, logout } = useAuth();
  // O contador vem do contexto, não desta lista: ele é atualizado a cada ~60s
  // e também pela página /notificacoes. Contar `notificacoes.filter(...)` aqui
  // deixaria o badge congelado no que foi carregado quando o painel abriu.
  const { naoLidas, recarregar } = useNotificacoes();
  const location = useLocation();
  const navigate = useNavigate();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [painelAberto, setPainelAberto] = useState(false);

  // Só busca a lista quando o painel abre. O sino sozinho precisa apenas do
  // número, e esse já vem do contexto por uma rota bem mais barata.
  useEffect(() => {
    if (!painelAberto || !token) return;
    getNotificacoes(token)
      .then((lista) => setNotificacoes(lista.itens))
      .catch(() => setNotificacoes([]));
  }, [painelAberto, token]);

  async function abrirNotificacao(notificacao: Notificacao) {
    if (!notificacao.lida && token) {
      try {
        await marcarNotificacaoLida(token, notificacao);
        setNotificacoes((lista) =>
          lista.map((n) => (n.chave === notificacao.chave ? { ...n, lida: true } : n)),
        );
        recarregar();
      } catch {
        // Silencioso: marcar como lida é conveniência, não vale travar a UI.
      }
    }
    // Cada item abre DIRETO na rota do problema, é para isso que as abas do
    // projeto são sub-rotas.
    if (notificacao.rota) {
      setPainelAberto(false);
      navigate(notificacao.rota);
    }
  }

  const itensVisiveis = navItems.filter((item) => {
    if (item.visiblePorPosicao) {
      return !!usuario && item.visiblePorPosicao(usuario);
    }
    if (!item.visible) return true;
    if (!usuario?.permissoes) return false;
    return item.visible(usuario.permissoes);
  });

  // Dois itens de prefixo podem casar com a mesma rota (ex.: "Avaliação de
  // Desempenho" em "/avaliacao-desempenho" e o painel admin dela em
  // "/avaliacao-desempenho/painel"), só o path mais específico deve
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
        {usuario && (
          <UserRow>
            <UserAvatar>
              {usuario.foto ? <FotoCircular src={usuario.foto} /> : iniciais(usuario.nome)}
            </UserAvatar>
            <UserName>{usuario.nome}</UserName>
          </UserRow>
        )}
        <NotificacoesWrap>
          <SinoButton type="button" onClick={() => setPainelAberto((v) => !v)} aria-expanded={painelAberto}>
            <Bell size={16} />
            Notificações
            {/* 99+ em vez do número cru: acima disso o badge estoura a largura
                do botão e empurra o rótulo. */}
            {naoLidas > 0 && <SinoBadge>{naoLidas > 99 ? "99+" : naoLidas}</SinoBadge>}
          </SinoButton>
          {painelAberto && (
            <NotificacoesPainel role="menu">
              {notificacoes.length === 0 && <NotificacaoVazia>Nenhuma notificação ainda.</NotificacaoVazia>}
              {/* O painel mostra as primeiras; filtro por tipo e "marcar todas"
                  ficam na página, que é onde há espaço para eles. */}
              {notificacoes.slice(0, 6).map((notificacao) => (
                <NotificacaoItem
                  // `chave` e não `id`: condição derivada não tem linha no
                  // banco, e portanto não tem id.
                  key={notificacao.chave}
                  type="button"
                  $lida={notificacao.lida}
                  onClick={() => abrirNotificacao(notificacao)}
                >
                  {notificacao.titulo}
                </NotificacaoItem>
              ))}
              <VerTodas
                type="button"
                onClick={() => {
                  setPainelAberto(false);
                  navigate("/notificacoes");
                }}
              >
                Ver todas
              </VerTodas>
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
