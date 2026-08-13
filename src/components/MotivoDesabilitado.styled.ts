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
 * 📐 Acima do botão e não abaixo: estes controles vivem no rodapé de cards, e
 * abaixo o aviso cairia fora da área visível do card ou por cima do card
 * seguinte.
 *
 * ⚠ **A largura é `min()` com a janela, e não um valor fixo.** Num celular de
 * 360px um balão de 17rem já nasce maior que a tela, e nenhum empurrão o traz
 * de volta inteiro — a conta do `MotivoDesabilitado` só reposiciona, não
 * encolhe.
 */
export const Balao = styled.span<{ $aberto: boolean; $deslocamento: number }>`
  position: absolute;
  bottom: calc(100% + ${theme.spacing.xs});
  left: 50%;
  /* O primeiro translateX centraliza no botão; o segundo é o empurrão que traz
     o balão de volta para dentro da janela quando o botão está perto da borda. */
  transform: translateX(-50%) translateX(${({ $deslocamento }) => $deslocamento}px);
  z-index: 20;

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
