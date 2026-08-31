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
import { FieldGroup, FieldInput, FieldLabel, FormErrorText } from "./Projetos.styled";

interface Props {
  nomeEscopo: string;
  /** O tamanho atual da janela: vendidos + ajustados. */
  diasJanela: number;
  onCancelar: () => void;
  /** Se rejeitar, a mensagem aparece no próprio formulário. */
  onSalvar: (diasJanela: number) => Promise<void> | void;
}

/**
 * ⭐ O ajuste manual da janela do escopo — a porta da diretoria de projetos.
 *
 * O resto da tela trata a janela como parede: arrastar uma etapa para fora
 * dela é recusado, e o caminho é pedir dias de ajuste, que tem prazo (§8).
 * Depois do prazo ninguém mexia, nem quem decide sobre prazo. Aqui ela mexe,
 * a qualquer momento e sem trava nenhuma de regra.
 *
 * 📐 **Um número, e só.** Uma versão anterior trazia também o início e o fim
 * de cada trecho de etapa, uma linha por trecho. Numa etapa pintada em seis
 * pedaços aquilo virava doze campos de data para uma decisão que é de um
 * número só — e mover etapa continua sendo o arrasto no calendário, que é
 * onde a forma do cronograma se lê. Esticada a janela, o calendário volta a
 * aceitar o arrasto até o fim novo.
 */
export function AjusteJanelaModal({
  nomeEscopo,
  diasJanela,
  onCancelar,
  onSalvar,
}: Props) {
  const [dias, setDias] = useState(String(diasJanela));
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
    const numero = Number(dias);
    // A mesma recusa do backend, dita antes da ida.
    if (!Number.isInteger(numero) || numero < 1) {
      setErro("A janela precisa ter pelo menos 1 dia útil.");
      return;
    }
    setErro("");
    setSalvando(true);
    try {
      await onSalvar(numero);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar o ajuste");
      setSalvando(false);
    }
    // Sem `setSalvando(false)` no sucesso: quem salvou desmonta este modal.
  }

  return (
    <ModalOverlay onMouseDown={onCancelar}>
      <ModalContent onMouseDown={(e) => e.stopPropagation()}>
        <form onSubmit={enviar}>
          <ModalHeader>
            <ModalTitle>Ajustar a janela de {nomeEscopo}</ModalTitle>
            <ModalClose type="button" aria-label="Fechar" onClick={onCancelar}>
              <X size={16} />
            </ModalClose>
          </ModalHeader>

          <ModalBody>
            <FieldGroup>
              <FieldLabel htmlFor="janela-dias">Dias úteis da janela</FieldLabel>
              <FieldInput
                id="janela-dias"
                type="number"
                min={1}
                autoFocus
                value={dias}
                onChange={(e) => setDias(e.target.value)}
              />
            </FieldGroup>

            {erro && <FormErrorText>{erro}</FormErrorText>}
          </ModalBody>

          <ModalFooter>
            <PageButton type="button" $variant="outline" onClick={onCancelar}>
              Cancelar
            </PageButton>
            <PageButton type="submit" disabled={salvando}>
              {salvando ? "Salvando…" : "Salvar"}
            </PageButton>
          </ModalFooter>
        </form>
      </ModalContent>
    </ModalOverlay>
  );
}
