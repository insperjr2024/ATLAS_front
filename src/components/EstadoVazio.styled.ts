import styled from "styled-components";
import { theme } from "@/styles/theme";
import type { CausaDoVazio } from "./EstadoVazio";

/**
 * A caixa do estado vazio.
 *
 * 📐 Sem ícone e sem ilustração: estas listas aparecem várias por tela (o
 * monitoramento tem cinco num scroll só), e um bloco decorado em cada uma
 * viraria mais ruído que a informação. O que muda entre as causas é só a
 * borda, à esquerda.
 *
 * ⚠ A borda do caso `filtro` é a única com cor de destaque, e de propósito: é
 * a única causa em que a pessoa consegue resolver ali mesmo, mudando o
 * recorte. "Não existe" e "não é seu" não têm o que destacar.
 */
export const Caixa = styled.div<{ $causa: CausaDoVazio }>`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.muted};
  border-left: 3px solid
    ${({ $causa }) =>
      $causa === "filtro" ? theme.colors.primary : theme.colors.border};
`;

export const Titulo = styled.p`
  margin: 0;
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.semibold};
  color: ${theme.colors.foreground};
`;

export const Motivo = styled.p`
  margin: 0;
  font-size: ${theme.fontSize.sm};
  line-height: 1.45;
  color: ${theme.colors.mutedForeground};
  /* Uma linha de texto corrido não deve atravessar a tela inteira. */
  max-width: 60ch;
`;
