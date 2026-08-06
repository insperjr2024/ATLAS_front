import { useEffect, useState } from "react";
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
import { FieldGroup, FieldLabel, FieldTextarea } from "@/pages/Bancas.styled";
import { FormErrorText } from "./Projetos.styled";

interface Props {
  nomeEscopo: string;
  motivo: string;
  solicitadoPorNome: string;
  onCancelar: () => void;
  onResponder: (aprovado: boolean, justificativa: string) => Promise<void> | void;
}

/** §5.6: só a diretoria vê isto — o gerente não aprova reajustes. Aprovar
 *  destrava o cronograma; rejeitar mantém a trava. As duas exigem justificativa. */
export function ResponderReajusteModal({
  nomeEscopo,
  motivo,
  solicitadoPorNome,
  onCancelar,
  onResponder,
}: Props) {
  const [justificativa, setJustificativa] = useState("");
  const [salvando, setSalvando] = useState<"aprovado" | "rejeitado" | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") onCancelar();
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [onCancelar]);

  async function responder(aprovado: boolean) {
    const limpo = justificativa.trim();
    if (!limpo) {
      setErro("Digite uma justificativa para a decisão.");
      return;
    }
    setErro("");
    setSalvando(aprovado ? "aprovado" : "rejeitado");
    try {
      await onResponder(aprovado, limpo);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao responder a solicitação");
      setSalvando(null);
    }
  }

  return (
    <ModalOverlay onMouseDown={onCancelar}>
      <ModalContent onMouseDown={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Pedido de reajuste — {nomeEscopo}</ModalTitle>
          <ModalClose type="button" aria-label="Fechar" onClick={onCancelar}>
            <X size={16} />
          </ModalClose>
        </ModalHeader>

        <ModalBody>
          <FieldGroup>
            <FieldLabel as="span">{solicitadoPorNome} pediu:</FieldLabel>
            <p>{motivo}</p>
          </FieldGroup>

          <FieldGroup>
            <FieldLabel htmlFor="reajuste-justificativa">Sua justificativa</FieldLabel>
            <FieldTextarea
              id="reajuste-justificativa"
              autoFocus
              rows={3}
              value={justificativa}
              placeholder="Por que aprovar ou rejeitar este pedido"
              onChange={(e) => setJustificativa(e.target.value)}
            />
          </FieldGroup>

          {erro && <FormErrorText>{erro}</FormErrorText>}
        </ModalBody>

        <ModalFooter>
          <PageButton type="button" $variant="outline" onClick={onCancelar}>
            Cancelar
          </PageButton>
          <PageButton type="button" $variant="outline" disabled={!!salvando} onClick={() => responder(false)}>
            {salvando === "rejeitado" ? "Rejeitando…" : "Rejeitar"}
          </PageButton>
          <PageButton type="button" disabled={!!salvando} onClick={() => responder(true)}>
            {salvando === "aprovado" ? "Aprovando…" : "Aprovar e destravar"}
          </PageButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
}
