import styled from "styled-components";
import { Link } from "react-router-dom";
import { DRAWER_ATE } from "./Layout.styled";

/**
 * Acima de `lg` é a coluna fixa de sempre. Abaixo, vira drawer: 16rem de menu
 * mais a página ao lado não cabem em 375px — sobravam ~71px de conteúdo, e era
 * essa a causa raiz do app ser inutilizável no celular.
 *
 * O estado de aberto/fechado vive no `Layout`, que é o dono do shell, e chega
 * aqui como `$aberta`. `Sidebar.tsx` só repassa a prop: a lista de navegação e
 * suas regras de permissão continuam intocadas.
 */
export const SidebarContainer = styled.aside<{ $aberta: boolean }>`
  width: 16rem;
  flex-shrink: 0;
  background: var(--background);
  border-right: 1px solid var(--sidebar-border);
  display: flex;
  flex-direction: column;
  /* sticky (e não fixed) no desktop: fica parada na viewport SEM sair do
     fluxo, então o Main continua com o offset de 16rem. fixed cobriria o
     conteúdo. No drawer (abaixo) vira fixed, porque aí a página fica atrás. */
  position: sticky;
  top: 0;
  height: 100dvh;
  /* Fallback: em altura extrema o menu ainda rola. No uso normal o Nav
     cabe e esta barra não aparece — o scroll da lista, se precisar, é
     só no <nav>, com o rodapé sempre visível. */
  overflow-y: auto;

  @media (max-width: ${DRAWER_ATE - 1}px) {
    /* fixed e não absolute: o menu tem de ficar parado na tela enquanto a
       página rola por baixo dele. Acima do Overlay (z 50) e da Topbar (z 40)
       — ver Layout.styled.ts. */
    position: fixed;
    top: 0;
    left: 0;
    z-index: 60;
    height: 100dvh;
    transform: translateX(${({ $aberta }) => ($aberta ? "0" : "-100%")});

    /* visibility junto com o transform: fora da tela o painel continuaria
       alcançável por Tab, e o foco desapareceria dentro de um menu fechado.
       Sendo propriedade discreta, ela só troca no fim da transição — o menu
       não pisca ao sair. */
    visibility: ${({ $aberta }) => ($aberta ? "visible" : "hidden")};
    transition: transform 200ms ease, visibility 200ms ease;
    box-shadow: 4px 0 16px -4px rgb(0 0 0 / 0.25);
  }

  @media (max-width: ${DRAWER_ATE - 1}px) and (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const LogoContainer = styled.div`
  flex-shrink: 0;
  height: 3.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--sidebar-border);

  @media (max-height: 800px) {
    height: 3.25rem;
  }
`;

export const LogoImg = styled.img`
  max-height: 2.25rem;
  width: auto;
  object-fit: contain;

  @media (max-height: 800px) {
    max-height: 2rem;
  }
`;

export const Nav = styled.nav`
  flex: 1 1 auto;
  min-height: 0;
  padding: 0.5rem 0 0.25rem;
  display: flex;
  flex-direction: column;
  overflow-y: auto;

  @media (max-height: 800px) {
    padding: 0.35rem 0 0.15rem;
  }
`;

export const NavItem = styled(Link)<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.625rem;
  min-height: 38px;
  padding: 7px 1.25rem;
  font-size: 15px;
  line-height: 1.3;
  text-decoration: none;
  color: ${({ $isActive }) => ($isActive ? "var(--destructive)" : "var(--sidebar-foreground)")};
  font-weight: ${({ $isActive }) => ($isActive ? 500 : 400)};
  transition: color 150ms ease;

  & svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }

  &:hover {
    color: var(--destructive);
  }

  @media (max-height: 800px) {
    min-height: 34px;
    padding: 6px 1.25rem;
    font-size: 14px;

    & svg {
      width: 18px;
      height: 18px;
    }
  }
`;

export const SectionLabel = styled.div`
  /* margin-top: auto reparte o espaço sobrando ENTRE as seções, em vez de
     deixar um buraco único acima do rodapé. padding-top é o mínimo de
     hierarquia quando não há folga (telas baixas). */
  margin-top: auto;
  padding: 14px 1.25rem 5px;
  font-size: 0.7rem;
  font-weight: 600;
  line-height: 1.2;
  color: var(--muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.05em;

  /* O primeiro rótulo encosta no logo se levar a folga de separação, que
     existe para afastar um grupo do grupo ANTERIOR. Aqui não há anterior. */
  &:first-child {
    margin-top: 0;
    padding-top: 8px;
  }

  @media (max-height: 800px) {
    padding: 10px 1.25rem 4px;

    &:first-child {
      padding-top: 4px;
    }
  }
`;

export const Footer = styled.div`
  flex-shrink: 0;
  margin-top: auto;
  padding-top: 0.75rem;
  padding-bottom: 0.5rem;
  border-top: 1px solid var(--sidebar-border);

  @media (max-height: 800px) {
    padding-top: 0.5rem;
    padding-bottom: 0.35rem;
  }
`;

/** A identidade no rodapé É o link para o perfil.
 *
 *  "Meu perfil" saiu da lista de navegação: procurar o próprio perfil pelo
 *  nome e pela foto é o gesto que as pessoas já têm de outras plataformas, e
 *  mantê-lo como item deixava uma linha de página no meio do trabalho do dia. */
export const UserRow = styled(Link)<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 1.25rem 0.5rem;
  text-decoration: none;
  transition: color 150ms ease;
  color: ${({ $isActive }) => ($isActive ? "var(--destructive)" : "var(--muted-foreground)")};

  &:hover {
    color: var(--destructive);
  }

  @media (max-height: 800px) {
    padding: 0.3rem 1.25rem 0.375rem;
  }
`;

/** Fotinho da pessoa quando existe, iniciais quando não — ver
 *  `components/Avatar.tsx`. `overflow: hidden` é o que faz a foto (que
 *  preenche 100% x 100%) respeitar o círculo. */
export const UserAvatar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 999px;
  background: var(--primary);
  color: var(--primary-foreground);
  font-size: 0.65rem;
  font-weight: 600;
`;

/** `inherit` e não `--muted-foreground`: a cor é decidida pelo `UserRow`, que
 *  precisa acender inteiro no hover e quando a página do perfil está aberta. */
export const UserName = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.75rem;
  color: inherit;
`;

export const NotificacoesWrap = styled.div`
  position: relative;
  padding: 0 1.25rem 0.5rem;

  /* Em mobile o sino mora na Topbar, alcançável sem abrir o menu — que é o
     ponto de uma notificação. Deixar os dois criaria duas portas para a mesma
     coisa; e o painel, que abre para CIMA a partir do rodapé, ficaria preso
     dentro do drawer que rola. Lá o sino leva direto para /notificacoes. */
  @media (max-width: ${DRAWER_ATE - 1}px) {
    display: none;
  }

  @media (max-height: 800px) {
    padding: 0 1.25rem 0.35rem;
  }
`;

export const SinoButton = styled.button`
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.625rem;
  border: 1px solid var(--sidebar-border);
  border-radius: 0.5rem;
  background: none;
  color: var(--sidebar-foreground);
  font-size: 0.8rem;
  cursor: pointer;
  transition: color 150ms ease, border-color 150ms ease;

  &:hover {
    color: var(--destructive);
    border-color: var(--destructive);
  }

  @media (max-height: 800px) {
    padding: 0.3rem 0.55rem;
  }
`;

export const SinoBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.125rem;
  height: 1.125rem;
  padding: 0 0.3rem;
  border-radius: 9999px;
  background: var(--destructive);
  color: var(--primary-foreground);
  font-size: 0.65rem;
  font-weight: 600;
`;

export const NotificacoesPainel = styled.div`
  position: absolute;
  bottom: calc(100% + 0.375rem);
  left: 1rem;
  right: 1rem;
  max-height: 20rem;
  overflow-y: auto;
  border: 1px solid var(--sidebar-border);
  border-radius: 0.75rem;
  background: var(--card);
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.15);
  z-index: 20;
`;

export const NotificacaoItem = styled.button<{ $lida: boolean }>`
  display: block;
  width: 100%;
  text-align: left;
  padding: 0.625rem 0.875rem;
  border: none;
  border-bottom: 1px solid var(--sidebar-border);
  background: ${({ $lida }) => ($lida ? "none" : "color-mix(in srgb, var(--destructive) 6%, transparent)")};
  color: var(--card-foreground);
  font-size: 0.75rem;
  line-height: 1.4;
  cursor: pointer;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: var(--muted);
  }
`;

/** A ponte do painel para a página. O painel mostra as primeiras e não tem
 *  espaço para filtro por tipo nem "marcar todas", é lá que essas ações
 *  moram. */
export const VerTodas = styled.button`
  display: block;
  width: 100%;
  padding: 0.5rem 0.875rem;
  border: none;
  border-top: 1px solid var(--sidebar-border);
  background: none;
  color: var(--muted-foreground);
  font-size: 0.72rem;
  font-weight: 600;
  text-align: center;
  cursor: pointer;

  &:hover {
    color: var(--destructive);
  }
`;

export const NotificacaoVazia = styled.p`
  margin: 0;
  padding: 0.875rem;
  font-size: 0.75rem;
  color: var(--muted-foreground);
`;

export const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  min-height: 38px;
  padding: 7px 1.25rem;
  font-size: 15px;
  color: var(--sidebar-foreground);
  background: none;
  border: none;
  cursor: pointer;
  transition: color 150ms ease;

  & svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }

  &:hover {
    color: var(--destructive);
  }

  @media (max-height: 800px) {
    min-height: 34px;
    padding: 6px 1.25rem;
    font-size: 14px;

    & svg {
      width: 18px;
      height: 18px;
    }
  }
`;
