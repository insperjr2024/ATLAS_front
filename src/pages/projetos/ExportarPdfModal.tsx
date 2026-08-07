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
import { CheckboxGrid, CheckboxLabel, FieldSelect, FormErrorText } from "./Projetos.styled";

interface Props {
  /** Os meses do semestre — o recorte que aparece por padrão. */
  meses: Date[];
  /**
   * Os meses da janela inteira, oferecidos atrás de "Mais meses".
   *
   * A janela cobre o ano corrente e o seguinte, então listar tudo de cara
   * daria 24 caixas para escolher entre as 6 que interessam.
   */
  mesesExtras: Date[];
  /** Os escopos do projeto, para o PDF poder sair de um só. */
  escopos: { id: number; nome: string }[];
  /** O escopo em foco na tela, que vira o padrão do modal. */
  escopoAtual: number | "geral";
  onCancelar: () => void;
  /** `escopo` = "geral" exporta o projeto inteiro. */
  onExportar: (meses: Date[], escopo: number | "geral", formato: "pdf" | "png") => Promise<void>;
}

/**
 * Escolher o que entra no PDF antes de gerar.
 *
 * Sem isto o export saía do que estivesse na tela — e depois que o cronograma
 * ganhou as visões de dia e semana, isso virou uma armadilha: quem estivesse
 * na visão de Dia gerava um PDF de um dia só, sem nada avisando.
 */
export function ExportarPdfModal({
  meses,
  mesesExtras,
  escopos,
  escopoAtual,
  onCancelar,
  onExportar,
}: Props) {
  const [escopo, setEscopo] = useState<number | "geral">(escopoAtual);
  const [formato, setFormato] = useState<"pdf" | "png">("pdf");
  const [ampliado, setAmpliado] = useState(false);
  const visiveis = ampliado ? mesesExtras : meses;
  // Todos marcados por padrão: o caso comum é o cronograma inteiro, e o §6.4
  // pede o calendário "pronto para apresentações".
  // Só os do semestre nascem marcados. Ampliar mostra o resto DESMARCADO —
  // quem clicou em "mais meses" quer escolher, não levar tudo junto.
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
    const selecionados = mesesExtras.filter((m) => escolhidos.has(chaveData(m)));
    if (selecionados.length === 0) {
      setErro("Escolha pelo menos um mês.");
      return;
    }
    setErro("");
    setGerando(true);
    try {
      await onExportar(selecionados, escopo, formato);
    } catch (err) {
      setErro(err instanceof Error ? err.message : `Erro ao gerar o ${formato.toUpperCase()}`);
      setGerando(false);
    }
  }

  const todos = visiveis.every((m) => escolhidos.has(chaveData(m)));

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
          <p style={{ margin: "0 0 0.375rem", fontSize: "0.875rem" }}>Formato do arquivo</p>
          <FieldSelect
            aria-label="Formato do arquivo"
            style={{ marginBottom: "1rem", width: "100%" }}
            value={formato}
            onChange={(e) => setFormato(e.target.value as "pdf" | "png")}
          >
            <option value="pdf">PDF</option>
            <option value="png">Imagem (PNG)</option>
          </FieldSelect>

          <p style={{ margin: "0 0 0.375rem", fontSize: "0.875rem" }}>O que entra no arquivo?</p>
          <FieldSelect
            aria-label="Escopo do PDF"
            style={{ marginBottom: "1rem", width: "100%" }}
            value={String(escopo)}
            onChange={(e) =>
              setEscopo(e.target.value === "geral" ? "geral" : Number(e.target.value))
            }
          >
            <option value="geral">Geral</option>
            {escopos.map((e) => (
              <option key={e.id} value={e.id}>
                Somente {e.nome}
              </option>
            ))}
          </FieldSelect>

          <p style={{ margin: "0 0 0.75rem", fontSize: "0.875rem" }}>
            Quais meses entram no arquivo?
          </p>

          <CheckboxGrid>
            {visiveis.map((mes) => {
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

          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
            <PageButton
              type="button"
              $variant="ghost"
              onClick={() =>
                setEscolhidos(todos ? new Set() : new Set(visiveis.map(chaveData)))
              }
            >
              {todos ? "Desmarcar todos" : "Marcar todos"}
            </PageButton>
            {!ampliado && mesesExtras.length > meses.length && (
              <PageButton type="button" $variant="ghost" onClick={() => setAmpliado(true)}>
                Mais meses
              </PageButton>
            )}
          </div>

          {erro && <FormErrorText>{erro}</FormErrorText>}
        </ModalBody>

        <ModalFooter>
          <PageButton type="button" $variant="outline" onClick={onCancelar}>
            Cancelar
          </PageButton>
          <PageButton type="button" disabled={gerando} onClick={gerar}>
            {gerando ? "Gerando…" : `Gerar ${formato.toUpperCase()}`}
          </PageButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
}
