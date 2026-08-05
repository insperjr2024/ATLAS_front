import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { chaveData } from "@/components/calendario/semanas";
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
import { X } from "lucide-react";
import { CheckboxGrid, CheckboxLabel, FormErrorText } from "./Projetos.styled";

interface Props {
  /** Todos os meses da janela do projeto, em ordem. */
  meses: Date[];
  onCancelar: () => void;
  /** Recebe os meses escolhidos, em ordem de calendário. */
  onExportar: (meses: Date[]) => Promise<void>;
}

/**
 * Escolher o que entra no PDF antes de gerar.
 *
 * Sem isto o export saía do que estivesse na tela — e depois que o cronograma
 * ganhou as visões de dia e semana, isso virou uma armadilha: quem estivesse
 * na visão de Dia gerava um PDF de um dia só, sem nada avisando.
 */
export function ExportarPdfModal({ meses, onCancelar, onExportar }: Props) {
  // Todos marcados por padrão: o caso comum é o cronograma inteiro, e o §6.4
  // pede o calendário "pronto para apresentações".
  const [escolhidos, setEscolhidos] = useState<Set<string>>(
    () => new Set(meses.map(chaveData)),
  );
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") onCancelar();
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [onCancelar]);

  function alternar(chave: string) {
    setEscolhidos((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(chave)) proximo.delete(chave);
      else proximo.add(chave);
      return proximo;
    });
  }

  async function gerar() {
    const selecionados = meses.filter((m) => escolhidos.has(chaveData(m)));
    if (selecionados.length === 0) {
      setErro("Escolha pelo menos um mês.");
      return;
    }
    setErro("");
    setGerando(true);
    try {
      await onExportar(selecionados);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao gerar o PDF");
      setGerando(false);
    }
  }

  const todos = escolhidos.size === meses.length;

  return (
    <ModalOverlay onMouseDown={onCancelar}>
      <ModalContent onMouseDown={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Exportar cronograma</ModalTitle>
          <ModalClose type="button" aria-label="Fechar" onClick={onCancelar}>
            <X size={16} />
          </ModalClose>
        </ModalHeader>

        <ModalBody>
          <p style={{ margin: "0 0 0.75rem", fontSize: "0.875rem" }}>
            Quais meses entram no PDF?
          </p>

          <CheckboxGrid>
            {meses.map((mes) => {
              const chave = chaveData(mes);
              return (
                <CheckboxLabel key={chave}>
                  <input
                    type="checkbox"
                    checked={escolhidos.has(chave)}
                    onChange={() => alternar(chave)}
                  />
                  <span style={{ textTransform: "capitalize" }}>
                    {format(mes, "MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                </CheckboxLabel>
              );
            })}
          </CheckboxGrid>

          <PageButton
            type="button"
            $variant="ghost"
            style={{ marginTop: "0.75rem" }}
            onClick={() =>
              setEscolhidos(todos ? new Set() : new Set(meses.map(chaveData)))
            }
          >
            {todos ? "Desmarcar todos" : "Marcar todos"}
          </PageButton>

          {erro && <FormErrorText>{erro}</FormErrorText>}
        </ModalBody>

        <ModalFooter>
          <PageButton type="button" $variant="outline" onClick={onCancelar}>
            Cancelar
          </PageButton>
          <PageButton type="button" disabled={gerando} onClick={gerar}>
            {gerando ? "Gerando…" : "Gerar PDF"}
          </PageButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
}
