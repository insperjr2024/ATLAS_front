import { useState } from "react";
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
  diasVendidos: number;
  diasAjustados: number;
  /** O último dia em que o pedido ainda é aceito, já formatado. */
  prazo: string;
  onCancelar: () => void;
  /** Se rejeitar, a mensagem do backend aparece no próprio formulário. */
  onPedir: (dias: number, motivo: string) => Promise<void> | void;
}

/**
 * §8: o coordenador pede dias extras para o escopo.
 *
 * ⭐ **A tela nunca soma os dois números.** Ela mostra *20 vendidos · 10
 * ajustados*, nunca "30 vendidos" — a diferença entre ter vendido 30 e ter
 * precisado de mais 10 é a informação inteira, e é ela que a diretoria está
 * decidindo aqui.
 *
 * As regras (só o coordenador, só dentro dos 3 dias úteis) NÃO são repetidas
 * aqui: elas moram no backend, que responde 422 com a explicação pronta. Duas
 * cópias da mesma regra divergiriam no primeiro ajuste.
 */
export function PedirDiasModal({
  nomeEscopo,
  diasVendidos,
  diasAjustados,
  prazo,
  onCancelar,
  onPedir,
}: Props) {
  const [dias, setDias] = useState(5);
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    setErro("");
    setEnviando(true);
    try {
      await onPedir(dias, motivo.trim());
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao pedir dias de ajuste");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <ModalOverlay onClick={onCancelar}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Pedir dias de ajuste</ModalTitle>
          <ModalClose type="button" onClick={onCancelar} aria-label="Fechar">
            <X size={16} />
          </ModalClose>
        </ModalHeader>

        <ModalBody>
          <p>
            <strong>{nomeEscopo}</strong> — {diasVendidos} dias vendidos
            {diasAjustados > 0 && ` · ${diasAjustados} já ajustados`}.
          </p>
          <p>
            O prazo para pedir vai até <strong>{prazo}</strong>. Depois dele, o que
            passar da janela é atraso do projeto.
          </p>

          <FieldGroup>
            <FieldLabel htmlFor="dias-ajuste">Dias úteis a mais</FieldLabel>
            <FieldInput
              id="dias-ajuste"
              type="number"
              min={1}
              value={dias}
              onChange={(e) => setDias(Number(e.target.value))}
            />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel htmlFor="motivo-ajuste">
              Por que os dias vendidos não dão conta?
            </FieldLabel>
            <FieldInput
              as="textarea"
              id="motivo-ajuste"
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </FieldGroup>

          {erro && <FormErrorText>{erro}</FormErrorText>}
        </ModalBody>

        <ModalFooter>
          <PageButton type="button" $variant="ghost" onClick={onCancelar}>
            Cancelar
          </PageButton>
          <PageButton
            type="button"
            disabled={dias < 1 || !motivo.trim() || enviando}
            onClick={enviar}
          >
            Pedir à diretoria
          </PageButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
}
