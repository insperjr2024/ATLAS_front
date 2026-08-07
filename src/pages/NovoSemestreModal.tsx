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
import { FieldGroup, FieldInput, FieldLabel, FormErrorText, Required } from "./Bancas.styled";

interface Props {
  onCancelar: () => void;
  onSalvar: (dados: { nome: string; inicio: string; fim: string }) => Promise<void>;
}

/**
 * Abrir uma gestão nova (§12).
 *
 * Sem campo de status: toda gestão nasce ativa — é o backend que arquiva a
 * anterior sozinho quando esta é criada, então não tem sentido perguntar.
 */
export function NovoSemestreModal({ onCancelar, onSalvar }: Props) {
  const [nome, setNome] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
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
    if (!nome.trim() || !inicio || !fim) {
      setErro("Preencha nome, início e fim.");
      return;
    }
    if (fim < inicio) {
      setErro("O fim não pode ser antes do início.");
      return;
    }
    setErro("");
    setSalvando(true);
    try {
      await onSalvar({ nome: nome.trim(), inicio, fim });
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao criar o semestre");
      setSalvando(false);
    }
  }

  return (
    <ModalOverlay onMouseDown={onCancelar}>
      <ModalContent onMouseDown={(e) => e.stopPropagation()}>
        <form onSubmit={enviar}>
          <ModalHeader>
            <ModalTitle>Novo semestre</ModalTitle>
            <ModalClose type="button" aria-label="Fechar" onClick={onCancelar}>
              <X size={16} />
            </ModalClose>
          </ModalHeader>

          <ModalBody>
            <FieldGroup>
              <FieldLabel htmlFor="semestre-nome">
                Nome<Required>*</Required>
              </FieldLabel>
              <FieldInput
                id="semestre-nome"
                autoFocus
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="2026.2"
              />
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor="semestre-inicio">
                Início<Required>*</Required>
              </FieldLabel>
              <FieldInput
                id="semestre-inicio"
                type="date"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
              />
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor="semestre-fim">
                Fim<Required>*</Required>
              </FieldLabel>
              <FieldInput
                id="semestre-fim"
                type="date"
                value={fim}
                min={inicio || undefined}
                onChange={(e) => setFim(e.target.value)}
              />
            </FieldGroup>

            {erro && <FormErrorText>{erro}</FormErrorText>}
          </ModalBody>

          <ModalFooter>
            <PageButton type="button" $variant="outline" onClick={onCancelar}>
              Cancelar
            </PageButton>
            <PageButton type="submit" disabled={salvando}>
              {salvando ? "Criando…" : "Criar semestre"}
            </PageButton>
          </ModalFooter>
        </form>
      </ModalContent>
    </ModalOverlay>
  );
}
