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
  onCancelar: () => void;
  onSolicitar: (motivo: string) => Promise<void> | void;
}

/** §5.6: o pedido do coordenador pra reabrir um cronograma já oficializado —
 *  vira uma solicitação pendente, só a diretoria responde. */
export function SolicitarReajusteModal({ nomeEscopo, onCancelar, onSolicitar }: Props) {
  const [motivo, setMotivo] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") onCancelar();
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [onCancelar]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const limpo = motivo.trim();
    if (!limpo) {
      setErro("Descreva o motivo do reajuste.");
      return;
    }
    setErro("");
    setSalvando(true);
    try {
      await onSolicitar(limpo);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao enviar a solicitação");
      setSalvando(false);
    }
  }

  return (
    <ModalOverlay onMouseDown={onCancelar}>
      <ModalContent onMouseDown={(e) => e.stopPropagation()}>
        <form onSubmit={enviar}>
          <ModalHeader>
            <ModalTitle>Solicitar reajuste — {nomeEscopo}</ModalTitle>
            <ModalClose type="button" aria-label="Fechar" onClick={onCancelar}>
              <X size={16} />
            </ModalClose>
          </ModalHeader>

          <ModalBody>
            <FieldGroup>
              <FieldLabel htmlFor="reajuste-motivo">
                Por que este cronograma já oficializado precisa mudar?
              </FieldLabel>
              <FieldTextarea
                id="reajuste-motivo"
                autoFocus
                rows={4}
                value={motivo}
                placeholder="Ex.: cliente pediu para adiar a banca em 2 semanas"
                onChange={(e) => setMotivo(e.target.value)}
              />
            </FieldGroup>

            {erro && <FormErrorText>{erro}</FormErrorText>}
          </ModalBody>

          <ModalFooter>
            <PageButton type="button" $variant="outline" onClick={onCancelar}>
              Cancelar
            </PageButton>
            <PageButton type="submit" disabled={salvando}>
              {salvando ? "Enviando…" : "Enviar pedido à diretoria"}
            </PageButton>
          </ModalFooter>
        </form>
      </ModalContent>
    </ModalOverlay>
  );
}
