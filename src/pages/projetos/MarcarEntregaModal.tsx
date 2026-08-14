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
import { formatarData } from "@/lib/projetos";
import { FieldGroup, FieldInput, FieldLabel, FormErrorText } from "./Projetos.styled";

interface Props {
  /** O nome do escopo, ou "o projeto ao cliente" quando é a data do projeto. */
  alvo: string;
  /** O dia clicado no calendário, em `yyyy-MM-dd`. */
  dia: string;
  /** A entrega já registrada, quando existe, isto é uma ALTERAÇÃO. */
  entregaAtual: string | null;
  ehDiretor: boolean;
  onCancelar: () => void;
  /** Se rejeitar, a mensagem do backend aparece no próprio formulário. */
  onConfirmar: (justificativa: string) => Promise<void> | void;
}

/**
 * A entrega do escopo ao cliente, marcada pelo calendário.
 *
 * **Marcar é livre; alterar é decisão da diretoria.** Registrar a entrega é
 * o passo em que o coordenador fecha o escopo, travá-lo faria o time depender
 * da diretoria para anotar o que já aconteceu. Mudar a data depois é outra
 * coisa: sem gate, um escopo entregue com atraso poderia ter a data empurrada
 * até o atraso sumir do monitoramento.
 *
 * A trava do  (sem banca realizada não há entrega) continua sendo do
 * backend, este modal não a repete, só mostra a recusa quando ela vem.
 */
export function MarcarEntregaModal({
  alvo,
  dia,
  entregaAtual,
  ehDiretor,
  onCancelar,
  onConfirmar,
}: Props) {
  const [justificativa, setJustificativa] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const alterando = !!entregaAtual && entregaAtual.slice(0, 10) !== dia;
  const bloqueado = alterando && !ehDiretor;

  async function enviar() {
    setErro("");
    setEnviando(true);
    try {
      await onConfirmar(justificativa.trim());
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível marcar a entrega");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <ModalOverlay onClick={onCancelar}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>{alterando ? "Alterar entrega" : "Registrar entrega"}</ModalTitle>
          <ModalClose type="button" onClick={onCancelar} aria-label="Fechar">
            <X size={16} />
          </ModalClose>
        </ModalHeader>

        <ModalBody>
          <p>
            <strong>{alvo}</strong>, entrega em {formatarData(dia)}.
          </p>

          {/* ⭐ A data é registro; o status é declaração. Sem esta linha, quem
              marca o dia volta à Visão geral e estranha o escopo continuar
              "Em andamento" — e o próximo passo não está nesta tela. */}
          {!alterando && (
            <p>
              Isto registra o <strong>dia</strong> da entrega. O escopo passa a{" "}
              <strong>Entregue</strong> quando o coordenador ou a diretoria confirmar a
              entrega na aba <strong>Visão geral</strong>.
            </p>
          )}

          {alterando && (
            <p>
              Já existe entrega registrada em{" "}
              <strong>{formatarData(entregaAtual)}</strong>.{" "}
              {bloqueado
                ? "Mudar uma data de entrega já registrada é decisão da diretoria."
                : "A mudança fica registrada no Histórico com a justificativa."}
            </p>
          )}

          {alterando && !bloqueado && (
            <FieldGroup>
              <FieldLabel htmlFor="justificativa-entrega">Justificativa</FieldLabel>
              <FieldInput
                as="textarea"
                id="justificativa-entrega"
                rows={3}
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
              />
            </FieldGroup>
          )}

          {erro && <FormErrorText>{erro}</FormErrorText>}
        </ModalBody>

        <ModalFooter>
          <PageButton type="button" $variant="ghost" onClick={onCancelar}>
            Cancelar
          </PageButton>
          <PageButton
            type="button"
            disabled={enviando || bloqueado || (alterando && !justificativa.trim())}
            onClick={enviar}
          >
            {alterando ? "Alterar" : "Registrar"}
          </PageButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
}
