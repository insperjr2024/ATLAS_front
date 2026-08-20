import styled from "styled-components";
import { theme } from "@/styles/theme";

/* O gatilho, o painel e o wrap vêm do `SelectCustom` de propósito: os dois
   campos ficam LADO A LADO na mesma barra de filtros, e uma borda ou altura
   própria aqui faria a linha parecer desalinhada. O que muda entre um e outro
   é só o miolo do painel, que é o que este arquivo acrescenta. */
export { SelectWrap, SelectTrigger, SelectPanel } from "./SelectCustom.styled";

/**
 * Uma opção marcável do painel.
 *
 * `<label>` com `<input type="checkbox">` de verdade dentro, e não um `<button
 * role="option">` como no `SelectCustom`: aqui o estado é "marcado ou não", e
 * é isso que o leitor de tela precisa anunciar. Um botão anunciaria "opção,
 * selecionada", sem dizer que dá para marcar mais de uma.
 */
export const OpcaoMarcavel = styled.label<{ $marcada: boolean }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding: 0.5rem 0.625rem;
  border-radius: ${theme.borderRadius.md};
  background: ${({ $marcada }) =>
    $marcada
      ? "color-mix(in srgb, " + theme.colors.primary + " 10%, transparent)"
      : "transparent"};
  color: ${({ $marcada }) => ($marcada ? theme.colors.primary : theme.colors.foreground)};
  font-size: ${theme.fontSize.sm};
  font-weight: ${({ $marcada }) =>
    $marcada ? theme.fontWeight.medium : theme.fontWeight.normal};
  cursor: pointer;
  user-select: none;

  &:hover {
    background: ${theme.colors.secondary};
  }

  input {
    flex-shrink: 0;
    width: 0.875rem;
    height: 0.875rem;
    margin: 0;
    accent-color: ${theme.colors.primary};
    cursor: pointer;
  }

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

/**
 * O "Limpar", no RODAPÉ e não no topo.
 *
 * No topo ele ocuparia a primeira linha do painel, que é onde o dedo cai ao
 * abrir a lista no celular — desmarcar tudo por engano é o erro mais caro
 * aqui, porque é silencioso: a tela volta a mostrar o núcleo inteiro e parece
 * que o filtro nunca foi aplicado.
 */
export const LimparSelecao = styled.button`
  margin-top: ${theme.spacing.xs};
  padding: 0.375rem 0.625rem;
  border: none;
  border-top: 1px solid ${theme.colors.border};
  border-radius: 0;
  background: transparent;
  color: ${theme.colors.mutedForeground};
  font-size: ${theme.fontSize.xs};
  text-align: left;
  cursor: pointer;

  &:hover {
    color: ${theme.colors.foreground};
  }
`;
