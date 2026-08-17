import { useId, useRef, useState, type ReactNode } from "react";
import { Balao, Envolucro } from "./MotivoDesabilitado.styled";

/** Respiro mínimo entre o balão e a borda da janela, em pixels. */
const MARGEM = 8;

interface Props {
  /**
   * Por que o controle está desabilitado — ou, quando o filho não é um botão
   * desabilitado, a explicação que o ícone de informação existe para dar.
   *
   * ⭐ Escreva as três coisas, nessa ordem: **o que está bloqueado, por quê, e
   * o que fazer agora.** É a terceira que faz a pessoa parar de perguntar —
   * "Prazo esgotado" diz o estado e deixa quem leu no mesmo lugar de antes.
   *
   * `ReactNode`, não só texto: uma legenda com várias regras cabe como lista,
   * sem precisar virar uma frase só separada por ponto e vírgula.
   *
   * Vazio (ou nulo) = não há motivo a explicar, e o componente sai de cena
   * devolvendo o filho puro. É o que permite usá-lo em botão que só às vezes
   * está desabilitado, sem `if` na chamada.
   */
  motivo?: ReactNode;
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
  const envolucroRef = useRef<HTMLSpanElement>(null);
  const [aberto, setAberto] = useState(false);

  /**
   * ⭐ **A posição do balão na JANELA, não no card.**
   *
   * Como o balão é `position: fixed` (ver o styled — é o que o tira do
   * `overflow: hidden` dos cards), o CSS não sabe mais sozinho onde ele fica.
   * Estas coordenadas saem da medição do gatilho, feita na hora de abrir.
   */
  const [posicao, setPosicao] = useState({ esquerda: 0, baixo: 0 });

  /**
   * ⚠ Medido no evento, não num efeito — a regra `set-state-in-effect` do lint
   * proíbe o segundo, e aqui o primeiro é melhor de qualquer forma: dá para
   * calcular a posição ANTES de o balão ficar visível, sem o pulo de um quadro
   * mal posicionado.
   *
   * O balão fica sempre no DOM (escondido por `visibility`) justamente para
   * poder ser medido antes de aparecer — elemento com `display: none` não tem
   * caixa, e não haveria o que medir.
   */
  function abrir() {
    const alvo = envolucroRef.current;
    const balao = balaoRef.current;
    if (alvo && balao) {
      const gatilho = alvo.getBoundingClientRect();
      const largura = balao.offsetWidth;

      // Centralizado no gatilho, e então trazido de volta para dentro da
      // janela: estes controles vivem no canto de cards, então estourar a
      // borda é o caso comum, não a exceção.
      let esquerda = gatilho.left + gatilho.width / 2 - largura / 2;
      esquerda = Math.min(esquerda, window.innerWidth - largura - MARGEM);
      // A esquerda vem depois de propósito: numa janela estreita demais para o
      // balão, os dois lados estouram e encostar na esquerda é o que mantém o
      // começo da frase legível.
      esquerda = Math.max(esquerda, MARGEM);

      // `bottom` medido a partir do rodapé da janela: é o que faz o balão
      // crescer para CIMA conforme o texto, sem cobrir o gatilho.
      const baixo = window.innerHeight - gatilho.top + MARGEM;

      setPosicao({ esquerda, baixo });
    }
    setAberto(true);
  }

  if (!motivo) return <>{children}</>;

  return (
    <Envolucro
      ref={envolucroRef}
      tabIndex={0}
      aria-describedby={aberto ? id : undefined}
      onMouseEnter={abrir}
      onMouseLeave={() => setAberto(false)}
      onFocus={abrir}
      onBlur={() => setAberto(false)}
    >
      {children}
      <Balao
        ref={balaoRef}
        id={id}
        role="tooltip"
        $aberto={aberto}
        $esquerda={posicao.esquerda}
        $baixo={posicao.baixo}
      >
        {motivo}
      </Balao>
    </Envolucro>
  );
}
