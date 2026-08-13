import styled from "styled-components";
import { theme } from "@/styles/theme";

/** Mesma largura de coluna do grid de Projetos (`Projetos.styled.ts`,
 *  `CardGrid`: 17rem) — os dois grids de card apareciam com tamanhos
 *  diferentes por não terem o mesmo `minmax`, mesmo com o resto do cartão
 *  igual. */
export const VagasGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr));
  gap: ${theme.spacing.md};
`;

/** Cartão do projeto. Sem vaga fica esmaecido em vez de sumir — a pessoa
 *  precisa ver que o projeto existe e está cheio. */
export const ProjetoCard = styled.button<{ $indisponivel: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.md};
  /* Fixa, não min-height: o grid já estica os cards de uma mesma FILA pra
     bater a altura do maior, mas fileiras diferentes não se enxergam — sem
     isto, a fileira com "Pedido pendente" (uma linha a mais) ficava mais
     alta que as outras, e cada fileira tinha uma altura própria. */
  height: 13rem;
  overflow: hidden;
  text-align: left;
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.card};
  font: inherit;
  cursor: ${({ $indisponivel }) => ($indisponivel ? "default" : "pointer")};
  opacity: ${({ $indisponivel }) => ($indisponivel ? 0.6 : 1)};
  transition: border-color 0.12s ease, box-shadow 0.12s ease;

  &:hover {
    border-color: ${({ $indisponivel }) =>
      $indisponivel ? theme.colors.border : theme.colors.primary};
    box-shadow: ${({ $indisponivel }) => ($indisponivel ? "none" : theme.shadows.sm)};
  }

  &:focus-visible {
    outline: 2px solid ${theme.colors.primary};
    outline-offset: 2px;
  }
`;

export const CardTopo = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${theme.spacing.sm};
`;

export const CardNome = styled.span`
  font-size: ${theme.fontSize.base};
  font-weight: ${theme.fontWeight.semibold};
  color: ${theme.colors.cardForeground};
`;

export const CardCliente = styled.span`
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
`;

export const CardLinha = styled.span`
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.mutedForeground};
`;

/** As bolinhas de vaga: preenchida = ocupada, vazia = livre. Um número seco
 *  ("1/3") diz o mesmo, mas isto se lê sem processar. */
export const Vagas = styled.div`
  display: flex;
  gap: 0.25rem;
  align-items: center;
`;

export const Bolinha = styled.span<{ $ocupada: boolean }>`
  width: 0.625rem;
  height: 0.625rem;
  border-radius: ${theme.borderRadius.full};
  border: 1px solid
    ${({ $ocupada }) => ($ocupada ? theme.colors.primary : theme.colors.border)};
  background: ${({ $ocupada }) => ($ocupada ? theme.colors.primary : "transparent")};
`;

/** As frentes do projeto, logo abaixo do nome: é a primeira coisa que diz
 *  se o projeto tem a ver com quem está olhando. */
export const FrentesRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
`;

export const Impedimento = styled.span`
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
  font-style: italic;
`;

/** Mesmo visual do ProjetoCard, mas como div: usado quando EU já tenho um
 *  pedido pendente pra este projeto — não abre mais o modal de pedir, o
 *  clique no card não faz mais sentido, só resta ver o status e cancelar. */
export const ProjetoCardEstatico = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.md};
  /* Mesma altura fixa do ProjetoCard — ver o comentário lá. */
  height: 13rem;
  overflow: hidden;
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.card};
`;

export const PedidoStatusLinha = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing.sm};
  padding-top: ${theme.spacing.xs};
  border-top: 1px solid ${theme.colors.border};
`;

/* ------------------------------------------------------------------ */
/* Meus pedidos (dropdown no cabeçalho de Vagas)                       */
/* ------------------------------------------------------------------ */

export const MeusPedidosWrap = styled.div`
  position: relative;
`;

/** Outline vermelho, não cheio: cheio demais competia com o próprio título
 *  da página e com "Enviar pedido" (o CTA de verdade). O vermelho (ícone de
 *  avião, mesma linguagem de "enviados" de e-mail) já distingue de "Frentes"
 *  sem precisar de fundo sólido. */
export const MeusPedidosButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  height: 2.25rem;
  padding: 0 0.875rem;
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid color-mix(in srgb, ${theme.colors.primary} 45%, transparent);
  background: ${theme.colors.background};
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.primary};
  cursor: pointer;

  &:hover {
    background: color-mix(in srgb, ${theme.colors.primary} 8%, white);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px color-mix(in srgb, ${theme.colors.ring} 25%, transparent);
  }
`;

/** Mais largo que o dropdown de Filtros (FrenteFilterPanel): precisa caber
 *  a justificativa inteira, não só rótulos curtos de checkbox. */
export const MeusPedidosPanel = styled.div`
  position: absolute;
  z-index: 20;
  top: calc(100% + 0.375rem);
  right: 0;
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
  width: 22rem;
  max-width: calc(100vw - 2rem);
  max-height: 24rem;
  overflow-y: auto;
  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.popover};
  box-shadow: ${theme.shadows.lg};
`;

/* ------------------------------------------------------------------ */
/* Solicitações recebidas                                               */
/* ------------------------------------------------------------------ */

export const PedidoCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.card};

  & + & {
    margin-top: ${theme.spacing.sm};
  }
`;

export const PedidoTopo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing.sm};
  flex-wrap: wrap;
`;

export const PedidoTopoAcoes = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
`;

/** Excluir um pedido já recusado da lista de "Meus pedidos" — não desfaz
 *  nada, só limpa o que não serve mais de aviso. */
export const BotaoExcluirPedido = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  border: none;
  border-radius: ${theme.borderRadius.sm};
  background: transparent;
  color: ${theme.colors.mutedForeground};
  cursor: pointer;

  &:hover {
    color: ${theme.colors.destructive};
    background: color-mix(in srgb, ${theme.colors.destructive} 10%, transparent);
  }
`;

/** A justificativa é o que o coordenador vem ler — destacada, não escondida
 *  numa linha de meta. */
export const Justificativa = styled.blockquote`
  margin: 0;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border-left: 3px solid ${theme.colors.primary};
  background: ${theme.colors.muted};
  border-radius: 0 ${theme.borderRadius.md} ${theme.borderRadius.md} 0;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.cardForeground};
  white-space: pre-wrap;
`;

/** Mesma justificativa, sem a borda vermelha de destaque: em "Recebidos" o
 *  vermelho chama atenção pro coordenador ler antes de decidir; em "Meus
 *  pedidos" é a própria pessoa relendo o que ela mesma escreveu — não
 *  precisa do mesmo grito, ainda mais ao lado de um botão já vermelho. */
export const MinhaJustificativa = styled.blockquote`
  margin: 0;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  background: ${theme.colors.muted};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.cardForeground};
  white-space: pre-wrap;
`;

export const PedidoAcoes = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
  flex-wrap: wrap;
`;

export const GrupoProjeto = styled.section`
  & + & {
    margin-top: ${theme.spacing.lg};
  }
`;

export const GrupoTitulo = styled.h3`
  margin: 0 0 ${theme.spacing.sm};
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.semibold};
  color: ${theme.colors.cardForeground};
`;
