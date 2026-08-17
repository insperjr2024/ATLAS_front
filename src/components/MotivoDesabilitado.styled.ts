import styled from "styled-components";
import { theme } from "@/styles/theme";

/**
 * O invólucro do controle desabilitado.
 *
 * ⚠ **Precisa existir porque botão desabilitado não emite evento nenhum.**
 * O navegador engole hover, clique e foco num `<button disabled>`, então
 * pendurar o aviso no próprio botão não funcionaria — nem no mouse, nem no
 * teclado. O `tabIndex` vai no invólucro justamente para devolver ao teclado
 * o acesso que o `disabled` tirou: sem ele, quem navega por Tab passa reto e
 * nunca descobre por que não pode agir.
 */
export const Envolucro = styled.span`
  position: relative;
  display: inline-flex;
  /* O foco é do invólucro, mas o desenho de foco tem de sair do botão que ele
     abraça — dois anéis concêntricos poluiriam. */
  outline: none;
`;

/**
 * A explicação. Aparece no hover e no foco, some sozinha.
 *
 * ⚠ **`position: fixed`, e não `absolute` — por causa do `overflow: hidden`.**
 * Com `absolute`, o balão fica preso ao contexto de empilhamento do pai, e
 * qualquer ancestral com `overflow: hidden` o corta. O `PageCard` tem
 * exatamente isso (para as bordas arredondadas não vazarem), então uma dica
 * no cabeçalho de um card aparecia truncada na borda de cima. `fixed` tira o
 * balão do fluxo do card e o ancora na janela.
 *
 * O preço é que a posição não vem mais de graça do CSS: quem abre precisa
 * medir o gatilho e passar as coordenadas (ver `MotivoDesabilitado`).
 *
 * 📐 Acima do gatilho e não abaixo: estes controles costumam viver no rodapé
 * de cards, e abaixo o aviso cairia por cima do card seguinte.
 *
 * ⚠ **A largura é `min()` com a janela, e não um valor fixo.** Num celular de
 * 360px um balão de 17rem já nasce maior que a tela, e nenhum empurrão o traz
 * de volta inteiro — a conta do `MotivoDesabilitado` só reposiciona, não
 * encolhe.
 */
export const Balao = styled.span<{
  $aberto: boolean;
  $esquerda: number;
  $baixo: number;
}>`
  position: fixed;
  left: ${({ $esquerda }) => $esquerda}px;
  bottom: ${({ $baixo }) => $baixo}px;
  z-index: 100;

  width: max-content;
  max-width: min(17rem, calc(100vw - 2rem));

  padding: ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.popover};
  color: ${theme.colors.popoverForeground};
  box-shadow: ${theme.shadows.md};

  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.normal};
  line-height: 1.45;
  text-align: left;
  white-space: normal;

  opacity: ${({ $aberto }) => ($aberto ? 1 : 0)};
  /* Escondido por visibility, nunca por display: o balão precisa continuar
     tendo caixa, senão não há o que medir antes de mostrar. */
  visibility: ${({ $aberto }) => ($aberto ? "visible" : "hidden")};
  transition: opacity ${theme.transitions.fast};

  /* Não rouba o mouse de quem está tentando alcançar outra coisa. */
  pointer-events: none;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;
