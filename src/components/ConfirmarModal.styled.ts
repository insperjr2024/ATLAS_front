import styled from "styled-components";

/** O bloco da confirmação por digitação, quando `confirmacaoTexto` é passado.
 *  Separado da mensagem por uma linha: é uma tarefa a fazer, não mais texto
 *  para ler. */
export const ConfirmacaoCampo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
`;

export const ConfirmacaoRotulo = styled.label`
  font-size: 0.8rem;
  color: var(--muted-foreground);
  line-height: 1.5;
`;

/** O texto exato a copiar, em monoespaçada. A fonte separa o que a
 *  proporcional junta — espaço duplo, `l` de `I` —, e aqui a comparação é
 *  caractere a caractere. `user-select: all` deixa o clique único selecionar
 *  tudo: copiar é legítimo, a trava é contra distração, não contra preguiça. */
export const ConfirmacaoAlvo = styled.strong`
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.8rem;
  color: var(--foreground);
  background: var(--muted);
  border-radius: 0.25rem;
  padding: 0.1rem 0.3rem;
  user-select: all;
  word-break: break-word;
`;

export const ConfirmacaoInput = styled.input`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  background: var(--background);
  color: var(--foreground);
  font-size: 0.875rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;

  &:focus {
    outline: none;
    border-color: var(--destructive);
  }

  &::placeholder {
    color: var(--muted-foreground);
    opacity: 0.5;
  }
`;
