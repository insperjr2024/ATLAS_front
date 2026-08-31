import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import type { Escopo, Frente } from "@/types/banca";
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

/** O valor do `<select>` para a opção "Outro" — um escopo fora do catálogo. */
const OUTRO = "outro";

interface Props {
  /** Catálogo completo; o modal filtra pelas frentes do projeto. */
  catalogo: Escopo[];
  /** As frentes DO PROJETO. O backend recusa escopo de frente que não é dele. */
  frentes: Frente[];
  /** Os escopos que o projeto já tem, para não oferecer o mesmo duas vezes. */
  jaVendidos: { escopo_id: number | null }[];
  onCancelar: () => void;
  /** Se rejeitar, a mensagem aparece no próprio formulário. */
  onCriar: (dados: {
    escopo_id: number | null;
    nome_customizado: string | null;
    frente_id: number;
    dias_uteis_vendidos: number;
  }) => Promise<void> | void;
}

/**
 * Acrescenta um escopo vendido a um projeto que já existe (§4).
 *
 * 📐 **Não reusa o `EscopoPicker` da criação de propósito.** Lá a lista é
 * montada inteira e enviada de uma vez; aqui cada escopo já tem vida própria
 * (reunião inicial, banca, entrega), e um editor de lista teria que traduzir
 * "a lista mudou" em criar/apagar — apagando, no caminho, escopos com dados
 * pendurados. Uma adição por vez é o que corresponde ao que o backend faz.
 */
export function NovoEscopoVendidoModal({
  catalogo,
  frentes,
  jaVendidos,
  onCancelar,
  onCriar,
}: Props) {
  const frenteIds = useMemo(() => frentes.map((f) => f.id), [frentes]);
  /** Só o catálogo das frentes do projeto, menos o que ele já vendeu — um
   *  escopo do catálogo entra uma vez só. "Outro" fica de fora da checagem
   *  porque cada um tem nome próprio e não colide. */
  const disponiveis = useMemo(() => {
    const usados = new Set(
      jaVendidos.map((e) => e.escopo_id).filter((id): id is number => id !== null),
    );
    return catalogo.filter(
      (e) => e.frente_id !== null && frenteIds.includes(e.frente_id) && !usados.has(e.id),
    );
  }, [catalogo, frenteIds, jaVendidos]);

  const [escolha, setEscolha] = useState<string>(() =>
    disponiveis.length > 0 ? String(disponiveis[0].id) : OUTRO,
  );
  const [nome, setNome] = useState("");
  const [frenteId, setFrenteId] = useState<number>(frenteIds[0] ?? 0);
  const [dias, setDias] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const ehOutro = escolha === OUTRO;

  // Escolher um escopo do catálogo já traz a frente dele: ela não é uma
  // segunda decisão, é um atributo do que foi escolhido. O campo só aparece
  // no "Outro", que não tem frente própria.
  useEffect(() => {
    if (ehOutro) return;
    const item = catalogo.find((e) => e.id === Number(escolha));
    if (item?.frente_id) setFrenteId(item.frente_id);
  }, [escolha, ehOutro, catalogo]);

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") onCancelar();
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [onCancelar]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (ehOutro && !nome.trim()) {
      setErro("Dê um nome ao escopo.");
      return;
    }
    const numero = Number(dias);
    if (!Number.isInteger(numero) || numero < 1) {
      setErro("Os dias úteis vendidos precisam ser maiores que zero.");
      return;
    }
    if (!frenteId) {
      setErro("Escolha a frente deste escopo.");
      return;
    }
    setErro("");
    setSalvando(true);
    try {
      await onCriar({
        escopo_id: ehOutro ? null : Number(escolha),
        nome_customizado: ehOutro ? nome.trim() : null,
        frente_id: frenteId,
        dias_uteis_vendidos: numero,
      });
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao adicionar o escopo");
      setSalvando(false);
    }
    // Sem `setSalvando(false)` no sucesso: quem criou desmonta este modal.
  }

  return (
    <ModalOverlay onMouseDown={onCancelar}>
      <ModalContent onMouseDown={(e) => e.stopPropagation()}>
        <form onSubmit={enviar}>
          <ModalHeader>
            <ModalTitle>Adicionar escopo vendido</ModalTitle>
            <ModalClose type="button" aria-label="Fechar" onClick={onCancelar}>
              <X size={16} />
            </ModalClose>
          </ModalHeader>

          <ModalBody>
            <FieldGroup>
              <FieldLabel htmlFor="escopo-catalogo">Escopo</FieldLabel>
              <FieldSelect
                id="escopo-catalogo"
                autoFocus
                value={escolha}
                onChange={(e) => setEscolha(e.target.value)}
              >
                {disponiveis.map((e) => (
                  <option key={e.id} value={String(e.id)}>
                    {e.nome}
                  </option>
                ))}
                <option value={OUTRO}>Outro (digitar o nome)</option>
              </FieldSelect>
            </FieldGroup>

            {ehOutro && (
              <>
                <FieldGroup>
                  <FieldLabel htmlFor="escopo-nome">Nome do escopo</FieldLabel>
                  <FieldInput
                    id="escopo-nome"
                    value={nome}
                    placeholder="Pesquisa de satisfação, Consultoria pontual…"
                    onChange={(e) => setNome(e.target.value)}
                  />
                </FieldGroup>
                {/* Só com mais de uma frente a pergunta existe: num projeto de
                    frente única a resposta já está decidida. */}
                {frentes.length > 1 && (
                  <FieldGroup>
                    <FieldLabel htmlFor="escopo-frente">Frente</FieldLabel>
                    <FieldSelect
                      id="escopo-frente"
                      value={String(frenteId)}
                      onChange={(e) => setFrenteId(Number(e.target.value))}
                    >
                      {frentes.map((f) => (
                        <option key={f.id} value={String(f.id)}>
                          {f.nome}
                        </option>
                      ))}
                    </FieldSelect>
                  </FieldGroup>
                )}
              </>
            )}

            <FieldGroup>
              <FieldLabel htmlFor="escopo-dias">Dias úteis vendidos</FieldLabel>
              <FieldInput
                id="escopo-dias"
                type="number"
                min={1}
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
              {salvando ? "Adicionando…" : "Adicionar"}
            </PageButton>
          </ModalFooter>
        </form>
      </ModalContent>
    </ModalOverlay>
  );
}
