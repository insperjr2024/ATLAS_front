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
export const Envolucro = styled.span<{ $bloco?: boolean }>`
  position: relative;
  /* inline-flex é o padrão porque o caso original é um botão no meio de uma
     linha de controles. A variante em bloco existe para o caso oposto —
     envolver um card que precisa ocupar a coluna inteira: como item de um
     flex column, um invólucro em linha entrega ao filho a largura do
     CONTEÚDO, e o card encolheria em relação aos vizinhos não envolvidos. */
  display: ${({ $bloco }) => ($bloco ? "flex" : "inline-flex")};
  ${({ $bloco }) => $bloco && "width: 100%;"}
  /* O foco é do invólucro, mas o desenho de foco tem de sair do botão que ele
     abraça — dois anéis concêntricos poluiriam. */
  outline: none;

  /* O balão fica de fora: ele é fixed e tem largura própria (max-content
     limitado pela janela); esticá-lo para 100% do invólucro o deformaria. */
  > *:not([role="tooltip"]) {
    ${({ $bloco }) => $bloco && "width: 100%;"}
  }
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
  $alturaMaxima: number;
}>`
  position: fixed;
  left: ${({ $esquerda }) => $esquerda}px;
  bottom: ${({ $baixo }) => $baixo}px;
  z-index: 100;

  width: max-content;
  max-width: min(17rem, calc(100vw - 2rem));
  /* Texto longo rola dentro do balão em vez de crescer pra fora da janela —
     ver o cálculo de alturaMaxima em MotivoDesabilitado.tsx. */
  max-height: ${({ $alturaMaxima }) => $alturaMaxima}px;
  overflow-y: auto;

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
  /* position: fixed tira o balão do lugar visual, mas ele continua
     descendente no DOM de quem o abriga — um gatilho dentro de um rótulo
     em CAIXA ALTA (ex.: DataItemLabel) herdava o text-transform e a
     explicação inteira saía maiúscula, enquanto outro gatilho, num rótulo
     sem essa regra, saía normal. Trava aqui pra nunca depender de onde o
     ícone foi colocado. */
  text-transform: none;

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
