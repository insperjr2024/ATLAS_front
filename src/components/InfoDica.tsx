import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { MotivoDesabilitado } from "./MotivoDesabilitado";
import { Botao } from "./InfoDica.styled";

interface Props {
  children: ReactNode;
  /** Rótulo para leitor de tela — o "i" sozinho não diz nada a quem não vê. */
  rotulo?: string;
}

/**
 * ⭐ **O "i" que carrega a explicação que ninguém lia.**
 *
 * ⚠ **Por que existe.** Cards como "Datas" e "Escopos vendidos" tinham a
 * explicação sempre visível — um parágrafo (às vezes quatro) embaixo do
 * conteúdo, o tempo todo, para todo mundo, mesmo pra quem já sabe como a tela
 * funciona. Ninguém lê texto permanente numa tela que se abre de relance, e o
 * card ficava com mais linha de explicação do que de dado.
 *
 * Aqui o texto só existe quando alguém pergunta — passando o mouse ou
 * chegando pelo Tab. É o mesmo mecanismo do `MotivoDesabilitado` (mesmo
 * balão, mesmo ajuste de borda de tela), só que o gatilho é um ícone
 * dedicado em vez de um botão que por acaso está desabilitado.
 *
 * 📐 Não é modal: a explicação é para tirar uma dúvida, não uma decisão que
 * precisa de "ok" para fechar. Fechar sozinho ao tirar o mouse é o
 * comportamento certo aqui.
 */
export function InfoDica({ children, rotulo = "Mais informações" }: Props) {
  return (
    <MotivoDesabilitado motivo={children}>
      <Botao type="button" aria-label={rotulo}>
        <Info size={13} />
      </Botao>
    </MotivoDesabilitado>
  );
}
