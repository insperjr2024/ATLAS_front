import styled from "styled-components";
import { NavLink } from "react-router-dom";
import { theme } from "@/styles/theme";
import type { TonsColuna } from "@/lib/colunas-tarefa";

export {
  PageHeaderRow,
  PageHeaderText,
  PageHeading,
  PageSubheading,
  FormStack,
  FieldGroup,
  FieldLabel,
  Required,
  FieldInput,
  FieldTextarea,
  FieldSelect,
  CheckboxGrid,
  CheckboxLabel,
  FormErrorText,
  DataTable,
  TableHead,
  TableHeadCell,
  TableBody,
  TableRow,
  TableCell,
  NameCell,
  ActionsCell,
  DetailList,
  DetailRow,
  DetailTerm,
  DetailValue,
  ModalOverlay,
  ModalHeader,
  ModalTitle,
  ModalClose,
  ModalBody,
  ModalFooter,
  WideModalContent,
  SectionTitle,
} from "../Bancas.styled";

/**
 * O `FormStack` só espaça os filhos DIRETOS do <form> — e num card eles são
 * o conteúdo e o rodapé. Este é o empilhamento dos campos lá dentro.
 */
export const FormFields = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.lg};
`;

/** O toggle "Link" / "Anexar PDF" do campo de proposta — um ou outro. */
export const ModoPropostaRow = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
`;

/* ------------------------------------------------------------------ */
/* Lista — os cards do §6.2                                            */
/* ------------------------------------------------------------------ */

export const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr));
  gap: ${theme.spacing.md};
`;

export const ProjetoCard = styled(NavLink)`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.xl};
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.card};
  box-shadow: ${theme.shadows.sm};
  text-decoration: none;
  color: inherit;
  transition: border-color ${theme.transitions.fast}, box-shadow ${theme.transitions.fast};

  &:hover {
    border-color: ${theme.colors.ring};
    box-shadow: ${theme.shadows.md};
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px color-mix(in srgb, ${theme.colors.ring} 30%, transparent);
  }
`;

export const CardTitle = styled.h2`
  margin: 0;
  font-size: ${theme.fontSize.base};
  font-weight: ${theme.fontWeight.semibold};
  color: ${theme.colors.foreground};
`;

export const CardCliente = styled.p`
  margin: 0;
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
`;

export const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
`;

export const FrenteTag = styled.span`
  display: inline-flex;
  padding: 0.125rem 0.5rem;
  border-radius: ${theme.borderRadius.full};
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.secondary};
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.foreground};
`;

export const CardEquipe = styled.p`
  margin: 0;
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
  line-height: 1.5;

  strong {
    font-weight: ${theme.fontWeight.medium};
    color: ${theme.colors.foreground};
  }
`;

/** ⚠ kickoff pendente — o único alerta que o card carrega hoje. */
export const CardAlerta = styled.p`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin: 0;
  padding-top: ${theme.spacing.sm};
  border-top: 1px solid ${theme.colors.border};
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.warningForeground};
`;

export const FiltersRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing.sm};
  align-items: center;
`;

export const ViewToggleRow = styled.div`
  display: inline-flex;
  padding: 0.1875rem;
  border-radius: ${theme.borderRadius.lg};
  background: ${theme.colors.muted};
`;

export const ViewToggleBtn = styled.button<{ $ativo?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  height: 1.875rem;
  padding: 0 0.75rem;
  border: none;
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  cursor: pointer;
  transition: background ${theme.transitions.fast}, color ${theme.transitions.fast};
  background: ${({ $ativo }) => ($ativo ? theme.colors.card : "transparent")};
  color: ${({ $ativo }) => ($ativo ? theme.colors.foreground : theme.colors.mutedForeground)};
  box-shadow: ${({ $ativo }) => ($ativo ? theme.shadows.sm : "none")};

  &:hover {
    color: ${theme.colors.foreground};
  }
`;

export const FrenteFilterWrap = styled.div`
  position: relative;
`;

export const FrenteFilterButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  height: 2.25rem;
  padding: 0 0.75rem;
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${theme.colors.input};
  background: ${theme.colors.background};
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.foreground};
  cursor: pointer;

  &:focus-visible {
    outline: none;
    border-color: ${theme.colors.ring};
    box-shadow: 0 0 0 3px color-mix(in srgb, ${theme.colors.ring} 25%, transparent);
  }
`;

export const FrenteFilterPanel = styled.div`
  position: absolute;
  z-index: 20;
  top: calc(100% + 0.375rem);
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 12rem;
  max-height: 14rem;
  overflow-y: auto;
  padding: 0.625rem 0.75rem;
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.popover};
  box-shadow: ${theme.shadows.lg};
`;

export const FrenteFilterFooter = styled.button`
  align-self: flex-start;
  padding: 0;
  border: none;
  background: none;
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.primary};
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

/* ------------------------------------------------------------------ */
/* Shell da página do projeto                                          */
/* ------------------------------------------------------------------ */

export const ProjetoShell = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.lg};
`;

export const ShellHeader = styled.header`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${theme.spacing.md};
`;

export const VoltarLink = styled(NavLink)`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
  text-decoration: none;

  &:hover {
    color: ${theme.colors.foreground};
  }
`;

export const StatusRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

/** O banner de kickoff pendente — some assim que a data é marcada. */
export const AvisoBanner = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid color-mix(in srgb, ${theme.colors.warning} 45%, transparent);
  background: color-mix(in srgb, ${theme.colors.warning} 12%, white);
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.warningForeground};
`;

export const TabBar = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  border-bottom: 1px solid ${theme.colors.border};
`;

export const TabLink = styled(NavLink)<{ $desabilitada?: boolean }>`
  padding: 0.5rem 0.875rem;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.mutedForeground};
  text-decoration: none;
  transition: color ${theme.transitions.fast}, border-color ${theme.transitions.fast};

  &:hover {
    color: ${theme.colors.foreground};
  }

  &.active {
    color: ${theme.colors.primary};
    border-bottom-color: ${theme.colors.primary};
  }
`;

/* ------------------------------------------------------------------ */
/* Aba Visão geral                                                     */
/* ------------------------------------------------------------------ */

export const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${theme.spacing.lg};

  @media (min-width: ${theme.breakpoints.lg}px) {
    grid-template-columns: 1fr 1fr;
  }
`;

export const DescricaoTexto = styled.p`
  margin: 0;
  font-size: ${theme.fontSize.sm};
  line-height: 1.6;
  color: ${theme.colors.foreground};
  white-space: pre-wrap;
`;

export const LinkExterno = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.primary};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

export const DataRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${theme.spacing.sm};
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.foreground};

  & + & {
    margin-top: ${theme.spacing.sm};
  }
`;

export const DataLabel = styled.span`
  min-width: 9rem;
  font-size: ${theme.fontSize.xs};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${theme.colors.mutedForeground};
`;

/**
 * O card de Datas em grade, não em linhas empilhadas — uma linha por campo
 * deixava letra minúscula boiando numa fileira inteira de espaço vazio à
 * direita. Aqui cada campo é uma célula (rótulo em cima, valor embaixo),
 * então o card usa a largura toda em vez de só a coluna da esquerda.
 */
export const DatasGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
  gap: ${theme.spacing.lg} ${theme.spacing.xl};
`;

export const DataItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`;

export const DataItemLabel = styled.span`
  font-size: ${theme.fontSize.xs};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${theme.colors.mutedForeground};
`;

/**
 * Troca de etapa como lista, não como botõezinhos de avançar/voltar — a
 * pílula colorida é a MESMA paleta do kanban de projetos (`CORES_STATUS`),
 * pra escolher a fase aqui não parecer um controle diferente do kanban.
 */
export const EtapaSeletorWrap = styled.div`
  position: relative;
`;

export const EtapaBotaoAtual = styled.button<{ $cor: TonsColuna }>`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.3rem 0.7rem;
  border: 1px solid ${({ $cor }) => $cor.borda};
  border-radius: ${theme.borderRadius.md};
  background: ${({ $cor }) => $cor.fundo};
  color: ${({ $cor }) => $cor.texto};
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  cursor: pointer;

  &:disabled {
    cursor: default;
    opacity: 0.7;
  }
`;

export const EtapaMenu = styled.div`
  position: absolute;
  top: calc(100% + 0.25rem);
  right: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: ${theme.spacing.xs};
  min-width: 15rem;
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.background};
  box-shadow: ${theme.shadows.lg};
`;

export const EtapaOpcaoBotao = styled.button<{ $cor: TonsColuna | null }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.625rem;
  border: none;
  border-radius: ${theme.borderRadius.md};
  background: ${({ $cor }) => $cor?.fundo ?? "transparent"};
  color: ${({ $cor }) => $cor?.texto ?? theme.colors.foreground};
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  text-align: left;
  cursor: pointer;

  &:hover {
    filter: brightness(0.96);
  }
`;

export const EdicaoBotoes = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
  margin-top: ${theme.spacing.sm};
`;

export const DataItemValor = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${theme.spacing.sm};
  font-size: ${theme.fontSize.base};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.foreground};
`;

export const EquipeList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const EquipeItem = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing.sm};
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.foreground};
`;

export const PapelTag = styled.span<{ $coordenador?: boolean }>`
  display: inline-flex;
  padding: 0.125rem 0.5rem;
  border-radius: ${theme.borderRadius.full};
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
  background: ${({ $coordenador }) =>
    $coordenador ? `color-mix(in srgb, ${theme.colors.primary} 10%, white)` : theme.colors.muted};
  color: ${({ $coordenador }) => ($coordenador ? theme.colors.primary : theme.colors.mutedForeground)};
`;

/* ------------------------------------------------------------------ */
/* Tabela de escopos vendidos (§6.4)                                   */
/* ------------------------------------------------------------------ */

export const ProgressoWrap = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  min-width: 9rem;
`;

export const ProgressoTrilha = styled.div`
  flex: 1;
  height: 0.5rem;
  min-width: 4.5rem;
  border-radius: ${theme.borderRadius.full};
  background: ${theme.colors.muted};
  overflow: hidden;
`;

/** Clampa em 100% na largura — mas o RÓTULO ao lado mostra o número real
 *  (18/15), porque estourar o vendido é a informação, não um detalhe. */
export const ProgressoBarra = styled.div<{ $percentual: number; $estourou?: boolean }>`
  height: 100%;
  width: ${({ $percentual }) => Math.min(100, Math.max(0, $percentual))}%;
  border-radius: ${theme.borderRadius.full};
  background: ${({ $estourou }) =>
    $estourou ? theme.colors.destructive : theme.colors.success};
  transition: width ${theme.transitions.normal};
`;

export const ProgressoTexto = styled.span<{ $estourou?: boolean }>`
  font-size: ${theme.fontSize.xs};
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  color: ${({ $estourou }) => ($estourou ? theme.colors.destructive : theme.colors.mutedForeground)};
  font-weight: ${({ $estourou }) =>
    $estourou ? theme.fontWeight.semibold : theme.fontWeight.normal};
`;

/** 🔒 O cadeado da entrega travada — conveniência de UI; quem barra é o backend. */
export const Cadeado = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
  cursor: help;
`;

export const EscopoNome = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;

  strong {
    font-weight: ${theme.fontWeight.medium};
    color: ${theme.colors.foreground};
  }

  small {
    font-size: ${theme.fontSize.xs};
    color: ${theme.colors.mutedForeground};
  }
`;

export const LegendaTabela = styled.p`
  margin: ${theme.spacing.sm} 0 0;
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
`;

/** Painel das abas que ainda não existem (F6–F8, F11). */
export const EmBrevePanel = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.375rem;
  padding: ${theme.spacing.xl};
  border: 1px dashed ${theme.colors.border};
  border-radius: ${theme.borderRadius.xl};
  background: ${theme.colors.background};

  h2 {
    margin: 0;
    font-size: ${theme.fontSize.base};
    font-weight: ${theme.fontWeight.medium};
    color: ${theme.colors.foreground};
  }

  p {
    margin: 0;
    font-size: ${theme.fontSize.sm};
    color: ${theme.colors.mutedForeground};
  }
`;

/* ------------------------------------------------------------------ */
/* Aba Histórico                                                       */
/* ------------------------------------------------------------------ */

export const Timeline = styled.ol`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const TimelineItem = styled.li`
  display: flex;
  gap: ${theme.spacing.md};
  padding-left: ${theme.spacing.md};
  border-left: 2px solid ${theme.colors.border};
`;

export const TimelineTexto = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.foreground};

  small {
    font-size: ${theme.fontSize.xs};
    color: ${theme.colors.mutedForeground};
  }
`;

/** Os botões do cabeçalho da aba de tarefas, lado a lado. */
export const HeaderAcoes = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

/* ------------------------------------------------------------------ */
/* Bancas por frente (§5.5 + §8)                                       */
/* ------------------------------------------------------------------ */

/** Um bloco por frente que o projeto contempla. */
export const FrenteBloco = styled.section`
  & + & {
    margin-top: ${theme.spacing.lg};
    padding-top: ${theme.spacing.lg};
    border-top: 1px solid ${theme.colors.border};
  }
`;

export const FrenteCabecalho = styled.header`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  margin-bottom: ${theme.spacing.sm};

  h3 {
    margin: 0;
    font-size: ${theme.fontSize.sm};
    font-weight: ${theme.fontWeight.semibold};
    color: ${theme.colors.foreground};
  }

  small {
    color: ${theme.colors.mutedForeground};
    font-size: ${theme.fontSize.xs};
  }
`;

export const BancaLinha = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.sm} 0;

  & + & {
    border-top: 1px dashed ${theme.colors.border};
  }
`;

/** O nome do escopo, que ocupa a folga e empurra data e status para a direita. */
export const BancaEscopo = styled.span`
  flex: 1;
  min-width: 10rem;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.foreground};
`;

export const BancaData = styled.span`
  font-size: ${theme.fontSize.sm};
  font-variant-numeric: tabular-nums;
  color: ${theme.colors.foreground};
`;
