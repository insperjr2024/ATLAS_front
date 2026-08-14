import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { PALETA } from "@/components/cronograma-pintado/cores";
import {
  AmostraBotao,
  PaletaGrid,
} from "@/components/cronograma-pintado/PaintedCalendar.styled";
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
import {
  FieldGroup,
  FieldInput,
  FieldLabel,
  FieldSelect,
  FormErrorText,
} from "./Projetos.styled";

interface Props {
  /** A cor pré-selecionada, a próxima da rampa, pela ordem da etapa. */
  corInicial: string;
  /**
   * Os escopos em que a etapa pode nascer, todos eles: o cadeado de
   * oficialização acabou, e pintar além da janela avisa em vez de impedir
   *.
   *
   * Na visão Geral não há escopo escolhido na barra, então a pergunta vem para
   * cá: toda etapa pertence a um escopo, e o banco exige isso.
   */
  escopos: { id: number; nome: string }[];
  /** Quando a barra já está num escopo, ele vem travado e o campo some. */
  escopoFixo?: number | null;
  onCancelar: () => void;
  /** Cria a etapa. Se rejeitar, a mensagem aparece no próprio formulário. */
  onCriar: (nome: string, cor: string, escopoId: number) => Promise<void> | void;
}

/**
 * A criação de etapa do , "o coordenador cria a etapa, escolhe a cor e
 * pinta os dias".
 *
 * Substituiu um `window.prompt()`, que além de destoar do app só devolvia
 * texto: a cor era decidida sozinha pelo código, e escolher a cor é requisito
 * do case, não enfeite.
 */
export function NovaEtapaModal({
  corInicial,
  escopos,
  escopoFixo,
  onCancelar,
  onCriar,
}: Props) {
  const [nome, setNome] = useState("");
  const [cor, setCor] = useState(corInicial);
  const [escopoId, setEscopoId] = useState<number | null>(escopoFixo ?? escopos[0]?.id ?? null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  // Esc fecha, o `prompt` nativo dava isso de graça e seria uma regressão
  // silenciosa perder ao trocar por um modal próprio.
  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") onCancelar();
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [onCancelar]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const limpo = nome.trim();
    if (!limpo) {
      setErro("Dê um nome à etapa.");
      return;
    }
    if (!escopoId) {
      setErro("Escolha o escopo a que esta etapa pertence.");
      return;
    }
    setErro("");
    setSalvando(true);
    try {
      await onCriar(limpo, cor, escopoId);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao criar a etapa");
      setSalvando(false);
    }
    // Sem `setSalvando(false)` no sucesso: quem criou desmonta este modal, e
    // mexer no estado depois disso só renderiza um componente que já morreu.
  }

  return (
    // Clique no overlay fecha; no conteúdo, não, daí o stopPropagation.
    <ModalOverlay onMouseDown={onCancelar}>
      <ModalContent onMouseDown={(e) => e.stopPropagation()}>
        <form onSubmit={enviar}>
          <ModalHeader>
            <ModalTitle>Nova etapa</ModalTitle>
            <ModalClose type="button" aria-label="Fechar" onClick={onCancelar}>
              <X size={16} />
            </ModalClose>
          </ModalHeader>

          <ModalBody>
            <FieldGroup>
              <FieldLabel htmlFor="etapa-nome">Nome</FieldLabel>
              <FieldInput
                id="etapa-nome"
                autoFocus
                value={nome}
                placeholder="Pesquisa, Entrevistas, Diagnóstico…"
                onChange={(e) => setNome(e.target.value)}
              />
            </FieldGroup>

            {!escopoFixo && escopos.length > 0 && (
              <FieldGroup>
                <FieldLabel htmlFor="etapa-escopo">Escopo</FieldLabel>
                <FieldSelect
                  id="etapa-escopo"
                  value={String(escopoId ?? "")}
                  onChange={(e) => setEscopoId(Number(e.target.value))}
                >
                  {escopos.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nome}
                    </option>
                  ))}
                </FieldSelect>
              </FieldGroup>
            )}

            <FieldGroup>
              <FieldLabel as="span">Cor</FieldLabel>
              <PaletaGrid role="radiogroup" aria-label="Cor da etapa">
                {PALETA.map((opcao) => (
                  <AmostraBotao
                    key={opcao.amostra}
                    type="button"
                    role="radio"
                    aria-checked={cor === opcao.amostra}
                    aria-label={`Cor ${opcao.amostra}`}
                    $cor={opcao.amostra}
                    $ativa={cor === opcao.amostra}
                    onClick={() => setCor(opcao.amostra)}
                  />
                ))}
              </PaletaGrid>
            </FieldGroup>

            {erro && <FormErrorText>{erro}</FormErrorText>}
          </ModalBody>

          <ModalFooter>
            <PageButton type="button" $variant="outline" onClick={onCancelar}>
              Cancelar
            </PageButton>
            <PageButton type="submit" disabled={salvando}>
              {salvando ? "Criando…" : "Criar etapa"}
            </PageButton>
          </ModalFooter>
        </form>
      </ModalContent>
    </ModalOverlay>
  );
}
