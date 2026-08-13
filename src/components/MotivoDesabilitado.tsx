import { useId, useRef, useState, type ReactNode } from "react";
import { Balao, Envolucro } from "./MotivoDesabilitado.styled";

/** Respiro mínimo entre o balão e a borda da janela, em pixels. */
const MARGEM = 8;

interface Props {
  /**
   * Por que o controle está desabilitado.
   *
   * ⭐ Escreva as três coisas, nessa ordem: **o que está bloqueado, por quê, e
   * o que fazer agora.** É a terceira que faz a pessoa parar de perguntar —
   * "Prazo esgotado" diz o estado e deixa quem leu no mesmo lugar de antes.
   *
   * Vazio (ou nulo) = não há motivo a explicar, e o componente sai de cena
   * devolvendo o filho puro. É o que permite usá-lo em botão que só às vezes
   * está desabilitado, sem `if` na chamada.
   */
  motivo?: string | null;
  children: ReactNode;
}

/**
 * O porquê de um botão estar cinza, no lugar onde a dúvida nasce.
 *
 * ⚠ **Botão desabilitado não emite evento** — o navegador engole hover,
 * clique e foco. Por isso o aviso mora num invólucro em volta, e não no
 * próprio botão; e por isso o invólucro entra na ordem do Tab, para quem
 * navega por teclado também alcançar a explicação.
 *
 * 📐 Balão, e não modal: não existe clique para abrir modal aqui, e a dúvida
 * é passageira — quem já sabe por que não pode agir não deveria ter de fechar
 * nada. Para a recusa que acontece DEPOIS de agir, o componente é o
 * `AvisoRegra`, que fica na tela até ser dispensado.
 */
export function MotivoDesabilitado({ motivo, children }: Props) {
  const id = useId();
  const balaoRef = useRef<HTMLSpanElement>(null);
  const [aberto, setAberto] = useState(false);

  /**
   * ⭐ **O empurrão que mantém o balão dentro da tela.**
   *
   * Centralizado no botão, ele estoura a janela sempre que o botão está perto
   * de uma borda — e estes controles vivem no canto direito de cards, então
   * era o caso comum, não a exceção. Em telas estreitas estoura dos dois
   * lados.
   *
   * Só o eixo horizontal precisa disto: o balão abre para cima, e a altura de
   * um card nunca chega ao topo da janela.
   */
  const [deslocamento, setDeslocamento] = useState(0);

  /**
   * ⚠ Medido no evento, não num efeito — a regra `set-state-in-effect` do lint
   * proíbe o segundo, e aqui o primeiro é melhor de qualquer forma: dá para
   * corrigir a posição ANTES de o balão ficar visível, sem o pulo de um quadro
   * mal posicionado.
   *
   * O balão fica sempre no DOM (escondido por `visibility`) justamente para
   * poder ser medido antes de aparecer — elemento com `display: none` não tem
   * caixa, e não haveria o que medir.
   */
  function abrir() {
    const balao = balaoRef.current;
    if (balao) {
      const caixa = balao.getBoundingClientRect();
      // Desconta o empurrão que já está aplicado: sem isso cada abertura
      // corrigiria em cima da correção anterior e o balão iria embora andando.
      const esquerdaNeutra = caixa.left - deslocamento;
      const direitaNeutra = caixa.right - deslocamento;

      let ajuste = 0;
      if (direitaNeutra > window.innerWidth - MARGEM) {
        ajuste = window.innerWidth - MARGEM - direitaNeutra;
      }
      // A esquerda vem depois de propósito: numa janela estreita demais para o
      // balão, os dois lados estouram e encostar na esquerda é o que mantém o
      // começo da frase legível.
      if (esquerdaNeutra + ajuste < MARGEM) {
        ajuste = MARGEM - esquerdaNeutra;
      }
      setDeslocamento(ajuste);
    }
    setAberto(true);
  }

  if (!motivo) return <>{children}</>;

  return (
    <Envolucro
      tabIndex={0}
      aria-describedby={aberto ? id : undefined}
      onMouseEnter={abrir}
      onMouseLeave={() => setAberto(false)}
      onFocus={abrir}
      onBlur={() => setAberto(false)}
    >
      {children}
      <Balao ref={balaoRef} id={id} role="tooltip" $aberto={aberto} $deslocamento={deslocamento}>
        {motivo}
      </Balao>
    </Envolucro>
  );
}
