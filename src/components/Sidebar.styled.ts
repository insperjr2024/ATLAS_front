import styled from "styled-components";
import { Link } from "react-router-dom";

export const SidebarContainer = styled.aside`
  width: 16rem;
  flex-shrink: 0;
  background: var(--background);
  border-right: 1px solid var(--sidebar-border);
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
`;

export const LogoContainer = styled.div`
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--sidebar-border);
`;

export const LogoImg = styled.img`
  max-height: 40px;
  width: auto;
  object-fit: contain;
`;

export const Nav = styled.nav`
  flex: 1;
  padding: 0.5rem 0 1.5rem;
  display: flex;
  flex-direction: column;
`;

export const NavItem = styled(Link)<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem 1.25rem;
  font-size: 0.875rem;
  text-decoration: none;
  color: ${({ $isActive }) => ($isActive ? "var(--destructive)" : "var(--sidebar-foreground)")};
  font-weight: ${({ $isActive }) => ($isActive ? 500 : 400)};
  transition: color 150ms ease;

  &:hover {
    color: var(--destructive);
  }
`;

export const SectionLabel = styled.div`
  margin-top: 0.75rem;
  padding: 0.5rem 1.25rem 0.25rem;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

export const Footer = styled.div`
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid var(--sidebar-border);
`;

export const UserName = styled.div`
  padding: 0 1.25rem 0.5rem;
  font-size: 0.75rem;
  color: var(--muted-foreground);
`;

export const NotificacoesWrap = styled.div`
  position: relative;
  padding: 0 1.25rem 0.5rem;
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
  padding: 0.625rem 1.25rem;
  font-size: 0.875rem;
  color: var(--sidebar-foreground);
  background: none;
  border: none;
  cursor: pointer;
  transition: color 150ms ease;

  &:hover {
    color: var(--destructive);
  }
`;
