import styled from "styled-components";
import { theme } from "@/styles/theme";

export const SelectWrap = styled.div`
  position: relative;
  display: inline-block;
  width: 100%;
`;

export const SelectTrigger = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing.sm};
  width: 100%;
  height: 2.25rem;
  padding: 0 0.75rem;
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${theme.colors.input};
  background: ${theme.colors.background};
  color: ${theme.colors.foreground};
  font-size: ${theme.fontSize.sm};
  text-align: left;
  cursor: pointer;
  transition: border-color ${theme.transitions.fast}, box-shadow ${theme.transitions.fast};

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  svg {
    flex-shrink: 0;
    color: ${theme.colors.mutedForeground};
  }

  &:hover:not(:disabled) {
    border-color: ${theme.colors.primary};
  }

  &[aria-expanded="true"] {
    outline: none;
    border-color: ${theme.colors.ring};
    box-shadow: 0 0 0 3px color-mix(in srgb, ${theme.colors.ring} 25%, transparent);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

// Posição real (top/left/width) vem inline, calculada a partir do gatilho —
// renderizado num portal em \`document.body\`, então \`position: fixed\` aqui
// é só o modo; sem o portal, qualquer ancestral com \`overflow: hidden\`
// (todo \`PageCard\` do app) cortaria o painel pela metade.
export const SelectPanel = styled.div`
  position: fixed;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  padding: ${theme.spacing.xs};
  max-height: 16rem;
  overflow-y: auto;
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.popover};
  box-shadow: ${theme.shadows.lg};

  /* Sempre visível, não só ao passar o mouse (padrão do macOS), sem isso
     uma lista mais longa que a altura do painel parece só "acabar", sem
     nenhum indício de que dá pra rolar pra ver o resto. */
  scrollbar-width: thin;
  scrollbar-color: ${theme.colors.mutedForeground} transparent;

  &::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-thumb {
    background: color-mix(in srgb, ${theme.colors.mutedForeground} 55%, transparent);
    border-radius: ${theme.borderRadius.full};
  }
`;

export const SelectOption = styled.button<{ $selecionado: boolean }>`
  display: block;
  width: 100%;
  padding: 0.5rem 0.625rem;
  border: none;
  border-radius: ${theme.borderRadius.md};
  background: ${({ $selecionado }) =>
    $selecionado ? "color-mix(in srgb, " + theme.colors.primary + " 10%, transparent)" : "transparent"};
  color: ${({ $selecionado }) => ($selecionado ? theme.colors.primary : theme.colors.foreground)};
  font-size: ${theme.fontSize.sm};
  font-weight: ${({ $selecionado }) => ($selecionado ? theme.fontWeight.medium : theme.fontWeight.normal)};
  text-align: left;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${theme.colors.secondary};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

/** O campo de busca no topo do painel, quando `pesquisavel`. */
export const SelectBusca = styled.input`
  width: 100%;
  margin-bottom: ${theme.spacing.xs};
  padding: 0.375rem 0.625rem;
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.background};
  color: ${theme.colors.foreground};
  font-size: ${theme.fontSize.sm};

  &:focus {
    outline: none;
    border-color: ${theme.colors.ring};
  }
`;

export const SelectVazio = styled.p`
  margin: 0;
  padding: ${theme.spacing.sm} 0.625rem;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.mutedForeground};
`;
