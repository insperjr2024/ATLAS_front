import styled from "styled-components";
import { theme } from "@/styles/theme";

export {
  PageHeaderRow,
  PageHeaderText,
  PageHeading,
  PageSubheading,
} from "./Bancas.styled";

/* ------------------------------------------------------------------ */
/* Filtros                                                             */
/*                                                                     */
/* Oito tipos em chips soltos quebravam a linha e deixavam dois órfãos  */
/* embaixo. Aqui são duas dimensões diferentes em UMA linha: o estado   */
/* de leitura vira segmentado (2 opções, exclusivas) e o tipo vira      */
/* dropdown (8 opções, combináveis). O dropdown cresce para baixo, não  */
/* para os lados — não importa quantos tipos existam.                   */
/* ------------------------------------------------------------------ */

export const FiltroBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

export const SegGroup = styled.div`
  display: inline-flex;
  padding: 2px;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.full};
  background: ${theme.colors.muted};
`;

export const SegButton = styled.button<{ $ativo: boolean }>`
  padding: 0.3rem 0.85rem;
  border: none;
  border-radius: ${theme.borderRadius.full};
  background: ${({ $ativo }) => ($ativo ? theme.colors.card : "transparent")};
  color: ${({ $ativo }) => ($ativo ? theme.colors.cardForeground : theme.colors.mutedForeground)};
  box-shadow: ${({ $ativo }) => ($ativo ? theme.shadows.sm : "none")};
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
  cursor: pointer;
  transition: background ${theme.transitions.fast}, color ${theme.transitions.fast};
`;

export const DropdownWrap = styled.div`
  position: relative;
`;

export const DropdownBotao = styled.button<{ $ativo: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  border: 1px solid ${({ $ativo }) => ($ativo ? theme.colors.primary : theme.colors.border)};
  border-radius: ${theme.borderRadius.full};
  background: ${theme.colors.card};
  color: ${({ $ativo }) => ($ativo ? theme.colors.primary : theme.colors.mutedForeground)};
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
  cursor: pointer;
  transition: border-color ${theme.transitions.fast}, color ${theme.transitions.fast};
`;

export const DropdownContagem = styled.span`
  min-width: 1.1rem;
  padding: 0 0.3rem;
  border-radius: ${theme.borderRadius.full};
  background: ${theme.colors.primary};
  color: ${theme.colors.primaryForeground};
  font-size: 0.65rem;
  font-weight: ${theme.fontWeight.semibold};
  text-align: center;
`;

export const DropdownPainel = styled.div`
  position: absolute;
  z-index: 20;
  top: calc(100% + 0.35rem);
  left: 0;
  min-width: 16rem;
  padding: 0.35rem;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.lg};
  background: ${theme.colors.popover};
  box-shadow: ${theme.shadows.md};
`;

export const OpcaoLinha = styled.button<{ $vazio: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.55rem;
  width: 100%;
  padding: 0.4rem 0.5rem;
  border: none;
  border-radius: ${theme.borderRadius.md};
  background: none;
  color: ${theme.colors.popoverForeground};
  font-size: ${theme.fontSize.sm};
  text-align: left;
  cursor: pointer;
  /* Zerado fica apagado, mas continua clicável: some da atenção sem sumir da
     lista — é ela que informa quais alertas existem. */
  opacity: ${({ $vazio }) => ($vazio ? 0.5 : 1)};

  &:hover {
    background: ${theme.colors.muted};
  }
`;

export const OpcaoCaixa = styled.span<{ $marcada: boolean }>`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  border: 1px solid ${({ $marcada }) => ($marcada ? theme.colors.primary : theme.colors.border)};
  border-radius: ${theme.borderRadius.sm};
  background: ${({ $marcada }) => ($marcada ? theme.colors.primary : "transparent")};
  color: ${theme.colors.primaryForeground};
`;

export const OpcaoTexto = styled.span`
  flex: 1;
`;

export const OpcaoContagem = styled.span`
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
  font-variant-numeric: tabular-nums;
`;

export const PainelRodape = styled.div`
  margin-top: 0.25rem;
  padding-top: 0.35rem;
  border-top: 1px solid ${theme.colors.border};
`;

export const PainelLimpar = styled.button`
  width: 100%;
  padding: 0.35rem 0.5rem;
  border: none;
  border-radius: ${theme.borderRadius.md};
  background: none;
  color: ${theme.colors.mutedForeground};
  font-size: ${theme.fontSize.xs};
  text-align: left;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${theme.colors.muted};
    color: ${theme.colors.primary};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const VazioBloco = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.xl} ${theme.spacing.lg};
`;

export const Lista = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
`;

/** O item inteiro é clicável — cada notificação abre direto na rota do
 *  problema, que é o motivo de as abas do projeto serem sub-rotas. */
export const Item = styled.li<{ $lida: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  border-bottom: 1px solid ${theme.colors.border};
  /* Lida fica esmaecida, mas CONTINUA na lista: marcar como lida não resolve
     o problema — quem tira "Alfa sem kickoff" daqui é marcar o kickoff. */
  opacity: ${({ $lida }) => ($lida ? 0.55 : 1)};

  &:last-child {
    border-bottom: none;
  }
`;

export const ItemIcone = styled.div<{ $alerta: boolean }>`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: ${theme.borderRadius.full};
  background: ${({ $alerta }) =>
    $alerta
      ? `color-mix(in srgb, ${theme.colors.destructive} 12%, transparent)`
      : theme.colors.muted};
  color: ${({ $alerta }) => ($alerta ? theme.colors.destructive : theme.colors.mutedForeground)};
`;

export const ItemCorpo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
`;

export const ItemTitulo = styled.button`
  padding: 0;
  border: none;
  background: none;
  text-align: left;
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.cardForeground};
  cursor: pointer;

  &:hover {
    color: ${theme.colors.primary};
  }
`;

export const ItemMeta = styled.span`
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
`;

export const ItemAcao = styled.button`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.5rem;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.lg};
  background: ${theme.colors.card};
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
  cursor: pointer;

  &:hover {
    color: ${theme.colors.primary};
    border-color: ${theme.colors.primary};
  }
`;

/** A explicação de que ler ≠ resolver. Sem ela, a pessoa marca tudo como
 *  lido, vê os itens continuarem na tela e acha que é bug. */
export const NotaRodape = styled.p`
  margin: 0;
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
  border-top: 1px solid ${theme.colors.border};
`;
