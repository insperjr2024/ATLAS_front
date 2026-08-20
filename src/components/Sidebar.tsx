import { Fragment, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useNotificacoes } from "@/context/NotificacoesContext";
import { pode, rotuloProjetos } from "@/utils/permissoes";
import { getNotificacoes, marcarNotificacaoLida } from "@/lib/notificacoes";
import type { Notificacao } from "@/types/notificacao";
import insperJrLogo from "@/assets/insperjr.png";
import { BarChart3, Bell, FolderKanban, ClipboardList, Calendar, CalendarCog, Users, ClipboardCheck, Settings, LogOut, Star, GraduationCap, UserPlus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { FotoCircular } from "@/components/Avatar";
import { ID_MENU_LATERAL } from "./Layout.styled";
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

/**
 * Os blocos da navegação, na ordem em que aparecem.
 *
 * ⭐ Esta lista é a ÚNICA fonte da ordem e dos rótulos. O agrupamento não vem
 * mais da posição do item em `navItems` — vem do campo `grupo`. Antes o
 * rótulo "Administração" nascia de uma comparação com o item anterior
 * (`visibleItems[index - 1]?.section !== "admin"`), então quem inserisse um
 * item no meio do array, ou reordenasse, desmanchava as seções sem erro
 * nenhum aparecer. Aconteceu.
 *
 * A divisão responde a "que pergunta esta pessoa veio fazer":
 *
 * - **Trabalho** — o dia a dia de quem executa projeto;
 * - **Desempenho** — avaliação e mentoria, que são ciclo próprio, não tarefa;
 * - **Gestão** — olhar o núcleo de cima (quem está atrasado, quem é membro);
 * - **Sistema** — configurar a plataforma.
 *
 * Gestão e Sistema eram uma seção só, "Administração", com seis itens. Elas
 * respondem a perguntas diferentes: a diretoria varria a lista inteira para
 * achar Configurações no fim.
 */
const GRUPOS = [
  { chave: "trabalho", rotulo: "Trabalho" },
  { chave: "desempenho", rotulo: "Desempenho" },
  { chave: "gestao", rotulo: "Gestão" },
  { chave: "sistema", rotulo: "Sistema" },
] as const;

type ChaveGrupo = (typeof GRUPOS)[number]["chave"];

interface NavItemConfig {
  icon: LucideIcon;
  label: string;
  path: string;
  /** Em que bloco o item aparece. OBRIGATÓRIO de propósito: quem adicionar um
   *  item novo e não escolher grupo leva erro de compilação, em vez de um item
   *  silenciosamente no lugar errado. É o que impede a bagunça de voltar. */
  grupo: ChaveGrupo;
  /** Marca o item como ativo também nas sub-rotas (ex.: /projetos/42/tarefas). */
  prefixo?: boolean;
  /** Visibilidade por PERMISSÃO (da posição, ver `types/auth.ts`). */
  visible?: (permissoes: UsuarioLogado["permissoes"]) => boolean;
  /** Visibilidade por POSIÇÃO direto, pra regra que não é uma caixa
   *  de permissão, como o item de Monitoramento restrito a certas posições. */
  visiblePorPosicao?: (usuario: UsuarioLogado) => boolean;
}

// A ordem DENTRO desta lista só decide a ordem dentro do próprio grupo — o
// bloco em que cada item cai vem do campo `grupo`, não da posição aqui.
const navItems: NavItemConfig[] = [
  // O rótulo é definido no componente: para coord e consultor é "Meus
  // projetos", porque eles só enxergam onde estão alocados.
  { icon: FolderKanban, label: "Projetos", path: "/projetos", grupo: "trabalho", prefixo: true },
  { icon: ClipboardList, label: "Bancas", path: "/bancas", grupo: "trabalho" },
  // Sem trava: a página serve os dois lados e decide o que mostrar pelas
  // flags que o back manda, consultor pede para entrar, quem coordena ou
  // monta equipe responde aos pedidos.
  { icon: UserPlus, label: "Vagas em projetos", path: "/vagas", grupo: "trabalho" },
  { icon: Calendar, label: "Calendário", path: "/calendario", grupo: "trabalho" },
  {
    icon: Star,
    label: "Avaliação de Desempenho",
    path: "/avaliacao-desempenho",
    grupo: "desempenho",
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
    grupo: "desempenho",
    // Vínculo independente do projeto, escolhido pela diretoria — mentor
    // pode ser coordenador, gerente ou diretor (2026-08-06). Fica FORA do
    // item "Avaliação de Desempenho" de propósito: mentoria não é processo
    // de avaliação, é acompanhamento; juntar os dois também colidia com o
    // rótulo do painel admin, que a diretoria já vê.
    visiblePorPosicao: (u) => pode(u, "ser_mentor"),
  },
  // "Meu perfil" NÃO é item de navegação: o acesso é pelo nome e pela foto no
  // rodapé, que já estão lá. Notificações também não — o sino do rodapé mostra
  // as últimas sem trocar de página. Nos dois casos, ter item E atalho seria
  // duas portas para a mesma coisa.
  {
    icon: BarChart3,
    label: "Monitoramento",
    path: "/monitoramento",
    grupo: "gestao",
    prefixo: true,
    visible: (c) => c.pode_ver_monitoramento,
  },
  {
    icon: Users,
    label: "Membros",
    path: "/membros",
    grupo: "gestao",
    visible: (c) => c.pode_gerir_membros,
  },
  {
    icon: ClipboardCheck,
    label: "Dashboard Bancas",
    path: "/avaliacoes",
    grupo: "gestao",
    visiblePorPosicao: (u) => pode(u, "ver_dashboard_bancas"),
  },
  {
    icon: Star,
    label: "Avaliação de Desempenho",
    path: "/avaliacao-desempenho/painel",
    grupo: "gestao",
    prefixo: true,
    visible: (c) => c.pode_administrar_desempenho,
  },
  {
    icon: CalendarCog,
    label: "Calendários base",
    path: "/calendarios-base",
    grupo: "sistema",
    visible: (c) => c.pode_administrar_configuracoes,
  },
  {
    icon: Settings,
    label: "Configurações",
    path: "/config",
    grupo: "sistema",
    visible: (c) => c.pode_administrar_configuracoes,
  },
];

interface SidebarProps {
  /** Só tem efeito abaixo de `lg`, onde a sidebar é um drawer que desliza. No
   *  desktop ela é sempre visível e a prop é ignorada pelo CSS. Quem controla é
   *  o `Layout` — ver `SidebarContainer` no .styled. */
  aberta?: boolean;
}

export function Sidebar({ aberta = false }: SidebarProps) {
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
    <SidebarContainer id={ID_MENU_LATERAL} $aberta={aberta} aria-label="Navegação principal">
      <LogoContainer>
        <LogoImg src={insperJrLogo} alt="Insper Jr." />
      </LogoContainer>

      <Nav>
        {GRUPOS.map((grupo) => {
          const itensDoGrupo = itensVisiveis.filter((item) => item.grupo === grupo.chave);
          // Grupo sem nenhum item visível não desenha rótulo: é o que faz um
          // consultor não ver "Gestão" e "Sistema" vazios pendurados na lista.
          if (itensDoGrupo.length === 0) return null;
          return (
            <Fragment key={grupo.chave}>
              <SectionLabel>{grupo.rotulo}</SectionLabel>
              {itensDoGrupo.map((item) => (
                <NavItem key={item.path} to={item.path} $isActive={item === itemAtivo}>
                  <item.icon size={20} />
                  <span>{item.path === "/projetos" ? rotuloProjetos(usuario) : item.label}</span>
                </NavItem>
              ))}
            </Fragment>
          );
        })}
      </Nav>

      <Footer>
        {/* A identidade É o link para o perfil — ver `UserRow` no .styled. */}
        {usuario && (
          <UserRow to="/meu-perfil" $isActive={location.pathname === "/meu-perfil"} title="Meu perfil">
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
