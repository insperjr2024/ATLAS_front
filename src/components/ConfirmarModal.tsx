import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalTitle,
} from "@/styles/modal.styled";
import { PageButton } from "@/styles/page.styled";
import { FormErrorText } from "@/pages/Bancas.styled";
import {
  ConfirmacaoAlvo,
  ConfirmacaoCampo,
  ConfirmacaoInput,
  ConfirmacaoRotulo,
} from "./ConfirmarModal.styled";

interface Props {
  titulo: string;
  /** O que exatamente vai acontecer, não "tem certeza?", que não informa nada. */
  mensagem: ReactNode;
  rotuloConfirmar?: string;
  /**
   * O rótulo enquanto a ação roda. O padrão é "Excluindo…" porque a maioria
   * dos usos é destrutiva — mas nem todo uso é: confirmar uma entrega não
   * exclui nada, e o botão não pode dizer que exclui.
   */
  rotuloProcessando?: string;
  /**
   * Quando presente, exige que a pessoa DIGITE exatamente este texto antes de
   * o botão liberar. É a trava para o que não tem desfazer.
   *
   * Existe porque o modal comum protege contra o clique errado, e não contra
   * o clique distraído: quem está varrendo uma lista confirma no automático.
   * Ter de copiar o nome do projeto força a pessoa a ler qual projeto está na
   * frente dela — que é justamente o erro caro aqui, apagar o projeto certo
   * pelo motivo errado.
   */
  confirmacaoTexto?: string;
  onConfirmar: () => Promise<void> | void;
  onCancelar: () => void;
}

/**
 * A confirmação de uma ação destrutiva.
 *
 * Existe para o app não depender de `window.confirm()`, que é do
 * navegador: não segue o estilo de nada, trava a página inteira e não tem onde
 * mostrar o erro quando a ação falha no backend. Aqui o erro aparece no próprio
 * modal, e quem chamou decide se fecha.
 *
 * Genérico de propósito: é o componente usado em toda ação destrutiva do
 * app (Bancas, Config, Membros, Tarefas, painéis de desempenho). Ver também
 * `AlertModal`, o equivalente pra avisos sem decisão nenhuma pra tomar.
 */
export function ConfirmarModal({
  titulo,
  mensagem,
  rotuloConfirmar = "Excluir",
  rotuloProcessando = "Excluindo…",
  confirmacaoTexto,
  onConfirmar,
  onCancelar,
}: Props) {
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");
  const [digitado, setDigitado] = useState("");

  // `trim` nas duas pontas: copiar o nome da tela costuma trazer um espaço
  // junto, e recusar por causa disso seria implicância — a intenção está
  // provada do mesmo jeito. A comparação segue sensível a maiúscula, porque
  // é o que faz a pessoa olhar o nome em vez de digitar de memória.
  const liberado = !confirmacaoTexto || digitado.trim() === confirmacaoTexto.trim();

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") onCancelar();
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [onCancelar]);

  async function confirmar() {
    if (!liberado) return;
    setErro("");
    setProcessando(true);
    try {
      await onConfirmar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível concluir");
      setProcessando(false);
    }
    // No sucesso quem chamou desmonta este modal; mexer no estado depois
    // seria atualizar um componente que já morreu.
  }

  return (
    <ModalOverlay onMouseDown={onCancelar}>
      <ModalContent onMouseDown={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>{titulo}</ModalTitle>
        </ModalHeader>

        <ModalBody>
          {mensagem}
          {confirmacaoTexto && (
            <ConfirmacaoCampo>
              <ConfirmacaoRotulo htmlFor="confirmacao-digitada">
                Para confirmar, digite <ConfirmacaoAlvo>{confirmacaoTexto}</ConfirmacaoAlvo> abaixo:
              </ConfirmacaoRotulo>
              <ConfirmacaoInput
                id="confirmacao-digitada"
                type="text"
                value={digitado}
                autoFocus
                autoComplete="off"
                spellCheck={false}
                placeholder={confirmacaoTexto}
                disabled={processando}
                onChange={(e) => setDigitado(e.target.value)}
              />
            </ConfirmacaoCampo>
          )}
          {erro && <FormErrorText>{erro}</FormErrorText>}
        </ModalBody>

        <ModalFooter>
          <PageButton type="button" $variant="outline" onClick={onCancelar}>
            Cancelar
          </PageButton>
          {/* Desabilitado enquanto o texto não bate — e não "clica e reclama":
              o botão apagado diz que falta algo antes de a pessoa tentar. */}
          <PageButton type="button" disabled={processando || !liberado} onClick={confirmar}>
            {processando ? rotuloProcessando : rotuloConfirmar}
          </PageButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
}
