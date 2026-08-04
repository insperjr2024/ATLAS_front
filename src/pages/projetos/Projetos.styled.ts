import styled from "styled-components";
import { NavLink } from "react-router-dom";
import { theme } from "@/styles/theme";

export {
  PageHeaderRow,
  PageHeaderText,
  PageHeading,
  PageSubheading,
  FormStack,
  FieldGroup,
  FieldLabel,
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
