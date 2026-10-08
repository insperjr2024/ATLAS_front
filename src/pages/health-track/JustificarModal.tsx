import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { FormErrorText } from "@/pages/Bancas.styled";
import { PageButton } from "@/styles/page.styled";
import {
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalTitle,
} from "@/styles/modal.styled";

/**
 * "Não vou avaliar este projeto nesta rodada, porque...". O texto é
 * obrigatório: a rodada existe pra nada ficar pra trás sem alguém dizer por
 * quê. Fica gravado na rodada, não no projeto.
 */
export function JustificarModal({
  projetoNome,
  inicial,
  onConfirmar,
  onCancelar,
}: {
  projetoNome: string;
  inicial?: string | null;
  onConfirmar: (justificativa: string) => Promise<void>;
  onCancelar: () => void;
}) {
  const [texto, setTexto] = useState(inicial ?? "");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  async function confirmar() {
    if (texto.trim().length < 3) return;
    setEnviando(true);
    setErro("");
    try {
      await onConfirmar(texto.trim());
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível justificar");
      setEnviando(false);
    }
  }

  return (
    <ModalOverlay onMouseDown={onCancelar}>
      <ModalContent onMouseDown={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Não avaliar {projetoNome} nesta rodada</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <p style={{ marginTop: 0 }}>
            Por que este projeto fica de fora desta rodada? Exemplos: está pausado, ainda não começou de verdade, acabou
            de ser avaliado.
          </p>
          <Textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={3}
            autoFocus
            maxLength={1000}
            disabled={enviando}
            aria-label="Justificativa"
          />
          {erro && <FormErrorText>{erro}</FormErrorText>}
        </ModalBody>
        <ModalFooter>
          <PageButton type="button" $variant="outline" onClick={onCancelar} disabled={enviando}>
            Cancelar
          </PageButton>
          <PageButton type="button" onClick={confirmar} disabled={enviando || texto.trim().length < 3}>
            {enviando ? "Salvando…" : "Justificar"}
          </PageButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
}
