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
  /** `inicial` abre a janela de um escopo; `geral` é a reunião do projeto. */
  tipo: "inicial" | "geral";
  /** O nome do escopo, só quando é a reunião inicial. */
  nomeEscopo?: string;
  /** O dia clicado no calendário, em `yyyy-MM-dd`. */
  dia: string;
  /** Já existe reunião deste tipo neste dia — então isto é uma edição. */
  observacoesAtuais?: string | null;
  editando: boolean;
  onCancelar: () => void;
  onSalvar: (observacoes: string) => Promise<void> | void;
  /** Ausente quando não há o que apagar (marcação nova). */
  onApagar?: () => Promise<void> | void;
}

/**
 * A reunião marcada pelo calendário do cronograma (§12).
 *
 * ⭐ **É esta tela que substituiu a aba Reuniões.** Ela existe por causa das
 * observações: sem um lugar para escrever o que foi combinado, registrar a
 * reunião viraria só um ponto no calendário, e era exatamente isso que a aba
 * antiga fazia melhor.
 *
 * A diferença entre os dois tipos não é cosmética: a **inicial** grava
 * `projeto_escopo.data_inicio` e dá a largada da contagem de dias daquele
 * escopo (§5.4); a **geral** não mexe em contagem nenhuma. Por isso o aviso
 * aparece só num dos casos — quem está marcando precisa saber que aquele
 * clique começa o relógio.
 */
export function MarcarReuniaoModal({
  tipo,
  nomeEscopo,
  dia,
  observacoesAtuais,
  editando,
  onCancelar,
  onSalvar,
  onApagar,
}: Props) {
  const [observacoes, setObservacoes] = useState(observacoesAtuais ?? "");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function executar(acao: () => Promise<void> | void, quando: string) {
    setErro("");
    setEnviando(true);
    try {
      await acao();
    } catch (err) {
      setErro(err instanceof Error ? err.message : `Não foi possível ${quando}`);
    } finally {
      setEnviando(false);
    }
  }

  const titulo = tipo === "inicial" ? "Reunião inicial do escopo" : "Reunião geral";

  return (
    <ModalOverlay onClick={onCancelar}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>{editando ? `Editar ${titulo.toLowerCase()}` : titulo}</ModalTitle>
          <ModalClose type="button" onClick={onCancelar} aria-label="Fechar">
            <X size={16} />
          </ModalClose>
        </ModalHeader>

        <ModalBody>
          <p>
            {tipo === "inicial" ? (
              <>
                <strong>{nomeEscopo}</strong> — reunião em {formatarData(dia)}.
              </>
            ) : (
              <>Reunião do projeto em {formatarData(dia)}.</>
            )}
          </p>

          {tipo === "inicial" && !editando && (
            <p>
              ⭐ É esta reunião que <strong>abre a janela do escopo</strong> e começa
              a contagem dos dias vendidos.
            </p>
          )}

          <FieldGroup>
            <FieldLabel htmlFor="observacoes-reuniao">
              Observações da reunião (opcional)
            </FieldLabel>
            <FieldInput
              as="textarea"
              id="observacoes-reuniao"
              rows={4}
              placeholder="O que foi combinado, pendências, decisões do cliente…"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </FieldGroup>

          {erro && <FormErrorText>{erro}</FormErrorText>}
        </ModalBody>

        <ModalFooter>
          {editando && onApagar && (
            <PageButton
              type="button"
              $variant="ghost"
              disabled={enviando}
              onClick={() => executar(() => onApagar(), "apagar a reunião")}
            >
              Apagar
            </PageButton>
          )}
          <PageButton type="button" $variant="ghost" onClick={onCancelar}>
            Cancelar
          </PageButton>
          <PageButton
            type="button"
            disabled={enviando}
            onClick={() => executar(() => onSalvar(observacoes.trim()), "salvar a reunião")}
          >
            {editando ? "Salvar" : "Registrar"}
          </PageButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
}
