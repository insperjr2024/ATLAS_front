import { useEffect } from "react";
import type { ReactNode } from "react";
import {
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalTitle,
} from "@/styles/modal.styled";
import { PageButton } from "@/styles/page.styled";

interface Props {
  titulo?: string;
  mensagem: ReactNode;
  onFechar: () => void;
}

/**
 * O aviso de uma ação que já aconteceu (normalmente um erro), não pede
 * decisão, só que a pessoa leia e feche.
 *
 * Existe pelo mesmo motivo do `ConfirmarModal`: parar de depender do
 * `window.alert()` do navegador, que não segue o estilo de nada e trava a
 * aba inteira até alguém clicar OK.
 */
export function AlertModal({ titulo = "Aviso", mensagem, onFechar }: Props) {
  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape" || e.key === "Enter") onFechar();
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [onFechar]);

  return (
    <ModalOverlay onMouseDown={onFechar}>
      <ModalContent onMouseDown={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>{titulo}</ModalTitle>
        </ModalHeader>

        <ModalBody>{mensagem}</ModalBody>

        <ModalFooter>
          <PageButton type="button" onClick={onFechar}>
            OK
          </PageButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
}
