import { useEffect, useState } from "react";
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
import { FormErrorText } from "@/pages/Bancas.styled";

interface Props {
  titulo: string;
  /** O que exatamente vai acontecer — não "tem certeza?", que não informa nada. */
  mensagem: ReactNode;
  rotuloConfirmar?: string;
  onConfirmar: () => Promise<void> | void;
  onCancelar: () => void;
}

/**
 * A confirmação de uma ação destrutiva.
 *
 * Existe para o app parar de depender de `window.confirm()`, que é do
 * navegador: não segue o estilo de nada, trava a página inteira e não tem onde
 * mostrar o erro quando a ação falha no backend. Aqui o erro aparece no próprio
 * modal, e quem chamou decide se fecha.
 *
 * Genérico de propósito: os outros `confirm()` espalhados pelo app (Bancas,
 * Config, Membros, Tarefas) têm aqui o lugar para onde migrar.
 */
export function ConfirmarModal({
  titulo,
  mensagem,
  rotuloConfirmar = "Excluir",
  onConfirmar,
  onCancelar,
}: Props) {
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") onCancelar();
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [onCancelar]);

  async function confirmar() {
    setErro("");
    setProcessando(true);
    try {
      await onConfirmar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível concluir");
      setProcessando(false);
    }
    // No sucesso quem chamou desmonta este modal; mexer no estado depois
    // seria atualizar um componente que já morreu.
  }

  return (
    <ModalOverlay onMouseDown={onCancelar}>
      <ModalContent onMouseDown={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>{titulo}</ModalTitle>
        </ModalHeader>

        <ModalBody>
          {mensagem}
          {erro && <FormErrorText>{erro}</FormErrorText>}
        </ModalBody>

        <ModalFooter>
          <PageButton type="button" $variant="outline" onClick={onCancelar}>
            Cancelar
          </PageButton>
          <PageButton type="button" disabled={processando} onClick={confirmar}>
            {processando ? "Excluindo…" : rotuloConfirmar}
          </PageButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
}
