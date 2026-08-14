import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { ProjetoComVaga } from "@/lib/vagas";
import type { StatusProjeto } from "@/types/projeto";
import { ROTULO_STATUS } from "@/lib/projetos";
import {
  ModalBody,
  ModalClose,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalTitle,
} from "@/styles/modal.styled";
import { PageButton, EmptyText } from "@/styles/page.styled";
import {
  FieldGroup,
  FieldLabel,
  FieldTextarea,
  FormErrorText,
  DetailList,
  DetailRow,
  DetailTerm,
  DetailValue,
} from "./Bancas.styled";

interface Props {
  projeto: ProjetoComVaga;
  onFechar: () => void;
  onEnviar: (justificativa: string) => Promise<void>;
}

const MINIMO = 20;

/**
 * As informações do projeto, e a declaração de interesse.
 *
 * A justificativa tem mínimo de caracteres. O coordenador decide lendo
 * isto, "quero entrar" não dá base para decidir nada, e um campo livre sem
 * piso vira exatamente isso.
 */
export function VagaProjetoModal({ projeto, onFechar, onEnviar }: Props) {
  const [justificativa, setJustificativa] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") onFechar();
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [onFechar]);

  const faltam = MINIMO - justificativa.trim().length;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (faltam > 0) {
      setErro(`Escreva um pouco mais, faltam ${faltam} caracteres.`);
      return;
    }
    setErro("");
    setEnviando(true);
    try {
      await onEnviar(justificativa.trim());
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao enviar o pedido");
      setEnviando(false);
    }
  }

  return (
    <ModalOverlay onMouseDown={onFechar}>
      <ModalContent onMouseDown={(e) => e.stopPropagation()}>
        <form onSubmit={enviar}>
          <ModalHeader>
            <ModalTitle>{projeto.nome}</ModalTitle>
            <ModalClose type="button" aria-label="Fechar" onClick={onFechar}>
              <X size={16} />
            </ModalClose>
          </ModalHeader>

          <ModalBody>
            <DetailList>
              <DetailRow>
                <DetailTerm>Cliente</DetailTerm>
                <DetailValue>{projeto.cliente}</DetailValue>
              </DetailRow>
              <DetailRow>
                <DetailTerm>Status</DetailTerm>
                <DetailValue>{ROTULO_STATUS[projeto.status as StatusProjeto] ?? projeto.status}</DetailValue>
              </DetailRow>
              <DetailRow>
                <DetailTerm>{projeto.frentes.length === 1 ? "Frente" : "Frentes"}</DetailTerm>
                <DetailValue>
                  {projeto.frentes.length > 0 ? projeto.frentes.join(" · ") : "—"}
                  {projeto.frentes.length > 1 && " (projeto sinérgico)"}
                </DetailValue>
              </DetailRow>
              <DetailRow>
                <DetailTerm>Coordenador</DetailTerm>
                <DetailValue>{projeto.coordenador_nome ?? "Sem coordenador"}</DetailValue>
              </DetailRow>
              <DetailRow>
                <DetailTerm>Time</DetailTerm>
                <DetailValue>
                  {projeto.alocados} de {projeto.max_consultores} consultores
                  {projeto.consultores.length > 0 && ` · ${projeto.consultores.join(", ")}`}
                </DetailValue>
              </DetailRow>
            </DetailList>

            {projeto.descricao ? (
              <FieldGroup>
                <FieldLabel as="span">Sobre o projeto</FieldLabel>
                <DetailValue style={{ whiteSpace: "pre-wrap" }}>{projeto.descricao}</DetailValue>
              </FieldGroup>
            ) : (
              <EmptyText>Este projeto ainda não tem descrição.</EmptyText>
            )}

            <FieldGroup>
              <FieldLabel htmlFor="justificativa">Por que você quer entrar?</FieldLabel>
              <FieldTextarea
                id="justificativa"
                rows={5}
                value={justificativa}
                maxLength={1000}
                placeholder="O que te interessa neste projeto e o que você traz para ele. É isto que o coordenador vai ler para decidir."
                onChange={(e) => setJustificativa(e.target.value)}
              />
              <EmptyText>
                {faltam > 0
                  ? `Faltam ${faltam} caracteres.`
                  : `${justificativa.trim().length} caracteres.`}
              </EmptyText>
            </FieldGroup>

            {erro && <FormErrorText>{erro}</FormErrorText>}
          </ModalBody>

          <ModalFooter>
            <PageButton type="button" $variant="outline" onClick={onFechar}>
              Cancelar
            </PageButton>
            <PageButton type="submit" disabled={enviando || faltam > 0}>
              {enviando ? "Enviando…" : "Enviar pedido"}
            </PageButton>
          </ModalFooter>
        </form>
      </ModalContent>
    </ModalOverlay>
  );
}
