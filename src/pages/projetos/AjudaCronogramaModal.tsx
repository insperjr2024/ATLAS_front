import { useEffect } from "react";
import { X } from "lucide-react";
import {
  ModalBody,
  ModalClose,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalTitle,
} from "@/styles/modal.styled";
import { PageButton } from "@/styles/page.styled";
import { PassoLista, PassoItem, PassoTitulo, PassoTexto } from "./AjudaCronograma.styled";

interface Props {
  onFechar: () => void;
}

/**
 * "Como funciona", a explicação da tela, sob demanda.
 *
 * Num botão, e não num texto fixo no topo: quem usa a tela todo dia não
 * precisa reler a instrução, e um aviso permanente vira ruído que se aprende
 * a ignorar. Quem chega pela primeira vez procura ajuda, e acha.
 *
 * O conteúdo descreve o GESTO (escolher escopo, ligar o modo, clicar no dia),
 * porque é isso que não se descobre olhando: um calendário não anuncia que é
 * clicável.
 */
export function AjudaCronogramaModal({ onFechar }: Props) {
  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") onFechar();
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [onFechar]);

  return (
    <ModalOverlay onMouseDown={onFechar}>
      <ModalContent onMouseDown={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Como montar o cronograma</ModalTitle>
          <ModalClose type="button" aria-label="Fechar" onClick={onFechar}>
            <X size={16} />
          </ModalClose>
        </ModalHeader>

        <ModalBody>
          <PassoLista>
            <PassoItem>
              <PassoTitulo>1. Escolha um escopo</PassoTitulo>
              <PassoTexto>
                No seletor acima. Em <strong>Todos os escopos</strong> você vê o projeto
                inteiro, mas só consegue marcar kickoff e reunião semanal, as datas de
                banca e entrega pertencem a um escopo específico.
              </PassoTexto>
            </PassoItem>

            <PassoItem>
              <PassoTitulo>2. Ligue o que quer marcar</PassoTitulo>
              <PassoTexto>
                Clique em <strong>Banca</strong>, <strong>Entrega</strong>,{" "}
                <strong>Reunião inicial</strong> ou <strong>Kickoff</strong>. O botão fica
                aceso, indicando que o próximo clique no calendário vale para ele.
              </PassoTexto>
            </PassoItem>

            <PassoItem>
              <PassoTitulo>3. Clique no dia</PassoTitulo>
              <PassoTexto>
                No calendário. Abre uma confirmação antes de gravar, nenhum clique crava
                data direto. Para sair do modo sem marcar nada, aperte{" "}
                <strong>Esc</strong> ou clique no botão de novo.
              </PassoTexto>
            </PassoItem>

            <PassoItem>
              <PassoTitulo>Errou? Dá para desfazer</PassoTitulo>
              <PassoTexto>
                Depois de marcar, aparece uma barra embaixo com{" "}
                <strong>Desfazer</strong> e uma contagem de 30 segundos. Passou disso, a
                correção é marcar de novo na data certa.
              </PassoTexto>
            </PassoItem>

            <PassoItem>
              <PassoTitulo>Pintar as etapas é outro gesto</PassoTitulo>
              <PassoTexto>
                As faixas coloridas do cronograma são pintadas <strong>arrastando</strong>{" "}
                pelos dias, depois de escolher uma etapa. Clicar num dia já pintado apaga.
              </PassoTexto>
            </PassoItem>
          </PassoLista>
        </ModalBody>

        <ModalFooter>
          <PageButton type="button" onClick={onFechar}>
            Entendi
          </PageButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
}
