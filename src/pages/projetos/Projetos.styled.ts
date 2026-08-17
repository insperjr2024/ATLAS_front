import styled, { css, keyframes } from "styled-components";
import { Link, NavLink } from "react-router-dom";
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
 * O `FormStack` só espaça os filhos DIRETOS do <form>, e num card eles são
 * o conteúdo e o rodapé. Este é o empilhamento dos campos lá dentro.
 */
export const FormFields = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.lg};
`;

/** O selo de vagas abertas (§7.3): linha própria logo abaixo do subtítulo,
 *  não mais dentro da frase "N projetos · N com kickoff pendente" — enterrado
 *  no meio de uma frase de metadados, ninguém lia até o fim. Link sublinhado,
 *  não um badge com fundo/borda: aquele formato lia como mais um status
 *  (tipo `StatusPilula`), e isto é uma ação, não um estado do projeto. */
export const VagasSelo = styled(Link)`
  display: inline-flex;
  align-self: flex-start;
  align-items: center;
  gap: 0.2rem;
  margin-top: ${theme.spacing.sm};
  color: ${theme.colors.primary};
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.semibold};
  text-decoration: none;

  svg {
    transition: transform ${theme.transitions.fast};
  }

  &:hover svg {
    transform: translateX(0.15rem);
  }
`;

/** Link dentro de um `AvisoBanner` (ex.: "Responder" no aviso de pedido de
 *  entrada pendente) — herda a cor do aviso em vez do azul padrão do
 *  navegador, só ganha peso e sublinhado pra continuar lendo como ação. */
export const AvisoLink = styled(Link)`
  color: inherit;
  font-weight: ${theme.fontWeight.semibold};
  text-decoration: underline;
`;

/** O toggle "Link" / "Anexar PDF" do campo de proposta, um ou outro. */
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
  position: relative;
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

/** Mesmo sinal do Kanban (`Kanban.styled.ts`, `PendenteDot`) — pedido de
 *  entrada pendente pra este projeto, sem precisar abrir pra descobrir. */
export const PendenteDot = styled.span`
  position: absolute;
  top: 0.6rem;
  right: 0.6rem;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: ${theme.borderRadius.full};
  background: ${theme.colors.destructive};
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

/**
 * A pílula de status/etapa, mesma borda arredondada e tamanho de fonte da
 * `FrenteTag`, em QUALQUER lugar que mostre uma cor de status: card da lista
 * de projetos, cabeçalho de coluna do kanban (de projeto ou de tarefa),
 * timeline do histórico, seletor de etapa. Um formato só, pra cor de status
 * nunca parecer um controle diferente dependendo de onde aparece.
 */
export const StatusPilula = styled.span<{ $cor: TonsColuna }>`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  min-width: 0;
  padding: 0.125rem 0.5rem;
  border-radius: ${theme.borderRadius.full};
  border: 1px solid ${({ $cor }) => $cor.borda};
  background: ${({ $cor }) => $cor.fundo};
  color: ${({ $cor }) => $cor.texto};
  font-size: ${theme.fontSize.xs};
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

/** O ícone antes de "Arquivado em ...", em linha com o texto, não numa
 *  linha própria: o SVG do ícone é um elemento de bloco por padrão, e sem
 *  esse wrapper `inline-flex` ele empurrava o texto pra baixo dele. */
export const ArquivadoEmLinha = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
`;

/** kickoff pendente, o único alerta que o card carrega hoje. */
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

/** Separa grupos de opções dentro de um dropdown de filtro (ex.: frentes,
 *  ordem, "Mostrar arquivados", em `ProjetosList`) sem precisar de um
 *  dropdown por grupo. */
export const FrenteFilterDivisor = styled.div`
  border-top: 1px solid ${theme.colors.border};
  margin: 0.125rem 0;
`;

/** O rótulo de cada grupo dentro do dropdown de filtro, "Frentes", "Ordem",
 *  "Arquivados". */
export const FrenteFilterSecao = styled.p`
  margin: 0;
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${theme.colors.mutedForeground};
`;

/** Uma opção clicável dentro do dropdown que não é checkbox (ex.: a direção
 *  da ordenação), mesma tipografia do `CheckboxLabel` ao lado, só sem o
 *  quadradinho. */
export const FrenteFilterOpcao = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0;
  border: none;
  background: none;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.foreground};
  cursor: pointer;
  text-align: left;

  &:hover {
    color: ${theme.colors.primary};
  }
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

  /* O bloco de nome/descrição/equipe (PageHeaderText) cede espaço primeiro —
     sem isto, um projeto com dois nomes compridos na equipe empurrava o
     status/Arquivar/Apagar pra uma linha embaixo, e ficava inconsistente
     com o projeto vizinho, cuja equipe tem nomes mais curtos. */
  & > *:first-child {
    flex: 1 1 320px;
    min-width: 0;
  }

  & > *:last-child {
    flex-shrink: 0;
  }
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

/** O banner de kickoff pendente, some assim que a data é marcada. */
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
 * O card de Datas em grade, não em linhas empilhadas, uma linha por campo
 * deixava letra minúscula boiando numa fileira inteira de espaço vazio à
 * direita. Aqui cada campo é uma célula (rótulo em cima, valor embaixo),
 * então o card usa a largura toda em vez de só a coluna da esquerda.
 */
export const DatasGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(8.5rem, 1fr));
  gap: ${theme.spacing.lg} ${theme.spacing.xl};
`;

export const DataItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`;

export const DataItemLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: ${theme.fontSize.xs};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${theme.colors.mutedForeground};
`;

/**
 * Troca de etapa como lista, não como botõezinhos de avançar/voltar. A cor
 * mora só na `StatusPilula` (a MESMA pílula do card de Projetos, do kanban e
 * da timeline), o botão e as linhas do menu em volta dela são neutros. Pintar
 * o CONTROLE inteiro da cor da etapa (fundo colorido de ponta a ponta) era o
 * que destoava do resto do site, onde a cor sempre fica presa numa pílula
 * pequena sobre uma superfície neutra, nunca vaza pro contêiner inteiro.
 */
export const EtapaSeletorWrap = styled.div`
  position: relative;
`;

export const EtapaBotaoAtual = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0;
  border: none;
  border-radius: ${theme.borderRadius.full};
  background: transparent;
  color: ${theme.colors.mutedForeground};
  font-size: ${theme.fontSize.sm};
  cursor: pointer;

  &:disabled {
    cursor: default;
    opacity: 0.7;
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px color-mix(in srgb, ${theme.colors.ring} 25%, transparent);
  }
`;

export const EtapaMenu = styled.div`
  position: absolute;
  top: calc(100% + 0.25rem);
  right: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  padding: ${theme.spacing.xs};
  min-width: 15rem;
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.background};
  box-shadow: ${theme.shadows.lg};
`;

export const EtapaOpcaoBotao = styled.button`
  display: flex;
  align-items: center;
  padding: 0.5rem 0.625rem;
  border: none;
  border-radius: ${theme.borderRadius.md};
  background: transparent;
  color: ${theme.colors.foreground};
  font-size: ${theme.fontSize.sm};
  text-align: left;
  cursor: pointer;

  &:hover {
    background: ${theme.colors.muted};
  }
`;

export const EdicaoBotoes = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
  margin-top: ${theme.spacing.sm};
`;

/** O nome do projeto é o título da página (`PageHeading`), o lápis de
 *  editar mora ao lado dele, não escondido dentro do card de Descrição. */
export const NomeEditavel = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

export const NomeBotaoEditar = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  border: none;
  border-radius: ${theme.borderRadius.md};
  background: transparent;
  color: ${theme.colors.mutedForeground};
  cursor: pointer;

  &:hover {
    color: ${theme.colors.foreground};
    background: ${theme.colors.muted};
  }
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

/** O complemento discreto de um valor — "· até 20/08" ao lado de "5 dias
 *  úteis". Peso normal e cor apagada: é contexto do número, não o número. */
export const DataItemDetalhe = styled.span`
  font-weight: ${theme.fontWeight.normal};
  color: ${theme.colors.mutedForeground};
`;

/**
 * A variante de metadado do `DataItem` — "Criado em" e afins.
 *
 * ⭐ Menor e mais apagada de propósito: é dado de auditoria, não algo que
 * alguém vem à Visão geral procurar. Competir em tamanho com Kickoff ou
 * Entrega faria a tela sugerir que as duas coisas pesam igual.
 */
export const DataItemMeta = styled(DataItem)`
  ${DataItemLabel} {
    font-size: 0.65rem;
  }
  ${DataItemValor} {
    font-size: ${theme.fontSize.sm};
    font-weight: ${theme.fontWeight.normal};
    color: ${theme.colors.mutedForeground};
  }
`;

/**
 * A dica embaixo de uma data que é **lida** do cronograma, não editada aqui.
 *
 * Existe porque tirar o formulário sem dizer onde ele foi parar viraria um
 * beco: a pessoa via a data vazia, nenhum campo, e concluía que faltava
 * permissão.
 */
export const DataItemNota = styled.span`
  font-size: ${theme.fontSize.xs};
  line-height: 1.4;
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

/* ------------------------------------------------------------------ */
/* Tabela de escopos vendidos                                   */
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

/** Clampa em 100% na largura, mas o RÓTULO ao lado mostra o número real
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

/** O cadeado da entrega travada, conveniência de UI; quem barra é o backend. */
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

/** a célula "Atraso", o número e, embaixo, o porquê (ou o pedido dele). */
export const AtrasoCelula = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
`;

/**
 * A célula "Entrega": a data e, embaixo, o estado da confirmação.
 *
 * ⭐ Data e confirmação empilhadas, e não num badge só, porque são duas
 * informações diferentes — *quando* foi e se alguém já **afirmou** que foi. Uma
 * data sozinha na coluna era lida como "entregue", que é justamente a confusão
 * que a confirmação existe para desfazer.
 */
export const EntregaCelula = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;

  small {
    font-size: ${theme.fontSize.xs};
    color: ${theme.colors.mutedForeground};
  }
`;

/**
 * A nota do atraso na célula.
 *
 * Cortada em duas linhas de propósito: a explicação pode ser longa, e deixá-la
 * crescer livre esticaria a linha inteira da tabela e empurraria as colunas de
 * banca e entrega para fora da vista. O texto completo fica no `title` e no
 * Histórico do projeto, que é onde ele é o assunto.
 */
export const JustificativaAtraso = styled.p`
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-width: 16rem;
  margin: 0;
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

export const HistoricoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${theme.spacing.lg};

  @media (min-width: ${theme.breakpoints.lg}px) {
    grid-template-columns: minmax(260px, 320px) 1fr;
    align-items: start;
  }
`;

export const HistoricoResumoLista = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
`;

export const HistoricoResumoLinha = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

export const HistoricoResumoCabecalho = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
`;

export const HistoricoResumoNome = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.foreground};
`;

export const HistoricoResumoBarraTrilha = styled.div`
  height: 0.4rem;
  border-radius: ${theme.borderRadius.full};
  background: ${theme.colors.secondary};
  overflow: hidden;
`;

export const HistoricoResumoBarraFill = styled.div<{ $percent: number; $cor: string }>`
  height: 100%;
  width: ${({ $percent }) => $percent}%;
  background: ${({ $cor }) => $cor};
  border-radius: ${theme.borderRadius.full};
  transition: width ${theme.transitions.normal};
`;

/**
 * Uma linha de filtros dentro do card "Filtros" do histórico, Etapa sozinha
 * numa linha (pode ter muitas pílulas), Quem alterou/Período/De/Até juntos
 * na linha de baixo, separadas por `FrenteFilterDivisor`. Duas linhas com
 * propósito claro, em vez de tudo espremido junto sem agrupamento.
 */
export const HistoricoFiltroLinha = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.md};

  &:last-child {
    margin-bottom: 0;
  }
`;

export const HistoricoFiltroGrupo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  min-width: 10rem;
`;

export const HistoricoFiltroLabel = styled.label`
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.mutedForeground};
`;

export const HistoricoFiltroPills = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
`;

export const HistoricoFiltroPill = styled.button<{ $ativo: boolean; $cor: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  border-radius: ${theme.borderRadius.full};
  border: 1px solid ${({ $ativo, $cor }) => ($ativo ? $cor : theme.colors.border)};
  background: ${({ $ativo, $cor }) =>
    $ativo ? "color-mix(in srgb, " + $cor + " 16%, white)" : theme.colors.background};
  color: ${({ $ativo }) => ($ativo ? theme.colors.foreground : theme.colors.mutedForeground)};
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
  cursor: pointer;
  transition: border-color ${theme.transitions.fast}, background ${theme.transitions.fast};

  &:hover {
    border-color: ${({ $cor }) => $cor};
  }
`;

export const HistoricoLimparFiltros = styled.button`
  align-self: flex-end;
  padding: 0.5rem 0;
  border: none;
  background: none;
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.primary};
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

export const HistoricoAutorChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.125rem 0.5rem;
  border-radius: ${theme.borderRadius.full};
  background: ${theme.colors.secondary};
  color: ${theme.colors.foreground};
  font-weight: ${theme.fontWeight.medium};
`;

/* Timeline vertical, uma linha contínua com um ponto por mudança,
   conectados. O agrupamento por dia é um rótulo leve dentro da própria
   linha, não uma caixa separada. */

export const HistoricoPeriodoPills = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
`;

export const HistoricoTimeline = styled.div`
  display: flex;
  flex-direction: column;
`;

export const HistoricoTimelineDiaTitulo = styled.p`
  margin: ${theme.spacing.lg} 0 ${theme.spacing.sm} 2.25rem;
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.semibold};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${theme.colors.mutedForeground};

  &:first-child {
    margin-top: 0;
  }
`;

export const HistoricoTimelineItem = styled.div`
  display: grid;
  grid-template-columns: 1.5rem 1fr;
  column-gap: 0.75rem;
`;

export const HistoricoTimelineTrilho = styled.div<{ $ultimo?: boolean }>`
  position: relative;
  display: flex;
  justify-content: center;

  ${({ $ultimo }) =>
    !$ultimo &&
    css`
      &::before {
        content: "";
        position: absolute;
        top: 0.85rem;
        bottom: 0;
        left: 50%;
        width: 2px;
        transform: translateX(-50%);
        background: ${theme.colors.border};
      }
    `}
`;

export const HistoricoTimelinePonto = styled.div<{ $cor: string }>`
  z-index: 1;
  margin-top: 0.4rem;
  width: 0.65rem;
  height: 0.65rem;
  flex-shrink: 0;
  border-radius: 50%;
  background: ${({ $cor }) => $cor};
  box-shadow: 0 0 0 3px color-mix(in srgb, ${({ $cor }) => $cor} 20%, ${theme.colors.background});
`;

const realce = keyframes`
  0%, 100% { background: transparent; }
  25%, 75% { background: color-mix(in srgb, ${theme.colors.primary} 12%, transparent); }
`;

/**
 * $destaque/$realcado: uma nota de atraso ou remarcação de
 * banca, em vez de uma transição de status, ganha uma faixa à esquerda pra
 * se destacar na timeline, e pulsa quando a pessoa chega aqui direto pelo
 * link "Justificar atraso" (#justificativa-N/#remarcacao-N).
 */
export const HistoricoTimelineConteudo = styled.div<{
  $destaque?: boolean;
  $realcado?: boolean;
  /** A cor da borda esquerda do cartão, neutra por padrão.
   *
   *  Era vermelha cravada, de quando só a remarcação usava o destaque. Com
   *  seis naturezas de evento na timeline, colorir a moldura enchia a coluna
   *  de vermelho e verde e tudo passava a parecer alerta. A cor vive na
   *  etiqueta, que é um acento por linha; a moldura só delimita. */
  $corDestaque?: string;
}>`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  padding-bottom: ${theme.spacing.lg};
  min-width: 0;
  /* Espaço pro scroll não esconder o item embaixo de nada quando a gente
     pula direto pra ele vindo de "Justificar atraso". */
  scroll-margin-top: 2rem;

  ${({ $destaque, $corDestaque }) =>
    $destaque &&
    css`
      padding: ${theme.spacing.sm} ${theme.spacing.md};
      border-radius: ${theme.borderRadius.md};
      background: color-mix(in srgb, ${theme.colors.mutedForeground} 4%, transparent);
      border-left: 3px solid
        color-mix(in srgb, ${$corDestaque ?? theme.colors.mutedForeground} 45%, transparent);
    `}

  ${({ $realcado }) =>
    $realcado &&
    css`
      animation: ${realce} 1.8s ease-in-out;
    `}
`;

export const HistoricoTimelineTransicao = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

export const HistoricoTimelineMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
`;

/** , a linha de nota de atraso ocupa a largura toda: é texto livre da
 *  diretoria, não cabe ao lado de uma pílula de status como a transição. */
export const HistoricoNotaLinha = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  width: 100%;
`;

export const HistoricoNotaCabecalho = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

/** Mesma proporção de `StatusPilula`/`FrenteTag`, antes era bem maior e mais
 *  pesada que as pílulas de etapa ao lado dela na timeline, duas linguagens
 *  visuais diferentes na mesma lista. */
export const HistoricoNotaTag = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.5rem;
  border-radius: ${theme.borderRadius.full};
  border: 1px solid color-mix(in srgb, ${theme.colors.destructive} 35%, transparent);
  background: color-mix(in srgb, ${theme.colors.destructive} 12%, transparent);
  color: ${theme.colors.destructive};
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
`;

/**
 * O contexto da nota (tipo do motivo + escopo), texto corrido separado por
 * "·", não uma segunda pílula ao lado de `HistoricoNotaTag`. Duas caixas e
 * um texto solto na mesma linha (o formato antigo) misturava linguagens
 * visuais diferentes pro mesmo tipo de informação; "Remarcação de Banca" já
 * mostrava o escopo assim, isto só alinha "Justificativa de Atraso" ao
 * mesmo padrão.
 */
export const HistoricoNotaMotivo = styled.span`
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
`;

export const HistoricoNotaTexto = styled.p`
  margin: 0;
  font-size: ${theme.fontSize.sm};
  line-height: 1.5;
  color: ${theme.colors.foreground};
  white-space: pre-wrap;
`;

/** Excluir uma nota, não é edição de rotina, então fica discreto
 *  e vermelho, só pra quem tem a permissão (a mesma trava de quem registra). */
export const HistoricoExcluirBtn = styled.button`
  align-self: flex-start;
  padding: 0;
  border: none;
  background: none;
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.destructive};
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

export const HistoricoCarregarMais = styled.button`
  display: block;
  margin: ${theme.spacing.sm} auto 0;
  padding: 0.5rem 1.25rem;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.lg};
  background: ${theme.colors.background};
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.foreground};
  cursor: pointer;
  transition: border-color ${theme.transitions.fast}, background ${theme.transitions.fast};

  &:hover {
    border-color: ${theme.colors.ring};
    background: ${theme.colors.muted};
  }
`;

/** Os botões do cabeçalho da aba de tarefas, lado a lado. */
export const HeaderAcoes = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

/* ------------------------------------------------------------------ */
/* Bancas por frente                                       */
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

/** O nome do escopo, que ocupa a folga e empurra data e status para a direita.
 *
 * O `small` é o aviso de banca compartilhada, quando a mesma banca avalia
 * mais de um escopo, cada linha diz com quem divide, senão a data repetida em
 * duas linhas pareceria erro de cadastro. */
export const BancaEscopo = styled.span`
  flex: 1;
  min-width: 10rem;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.foreground};

  small {
    display: block;
    margin-top: 2px;
    font-size: ${theme.fontSize.xs};
    color: ${theme.colors.mutedForeground};
  }
`;

export const BancaData = styled.span`
  font-size: ${theme.fontSize.sm};
  font-variant-numeric: tabular-nums;
  color: ${theme.colors.foreground};
`;

/* ------------------------------------------------------------------ */
/* Escolher os escopos que entram numa banca                           */
/* ------------------------------------------------------------------ */

/** A lista de escopos do projeto dentro do modal de marcar banca. */
export const EscopoPicker = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.xs};
  max-height: 14rem;
  overflow-y: auto;
`;

/** Uma opção da lista. `$bloqueado` = escopo que já tem banca própria. */
export const EscopoOpcao = styled.label<{ $bloqueado?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.sm};
  font-size: ${theme.fontSize.sm};
  color: ${({ $bloqueado }) =>
    $bloqueado ? theme.colors.mutedForeground : theme.colors.foreground};
  cursor: ${({ $bloqueado }) => ($bloqueado ? "not-allowed" : "pointer")};

  &:hover {
    background: ${({ $bloqueado }) => ($bloqueado ? "transparent" : theme.colors.muted)};
  }

  input {
    accent-color: ${theme.colors.primary};
  }

  span {
    flex: 1;
  }

  small {
    font-size: ${theme.fontSize.xs};
    color: ${theme.colors.mutedForeground};
  }
`;

/**
 * A etiqueta de tipo das linhas do Histórico, com a cor passada por quem usa.
 *
 * `HistoricoNotaTag` existe desde antes, mas com o vermelho cravado, servia a
 * um tipo só (remarcação). Com seis fontes na timeline, a cor precisa dizer
 * de que natureza é o evento: pedido é neutro, aprovação é verde, recusa é
 * vermelha, anotação de reunião é azul. Mesma forma, cor por parâmetro.
 */
export const HistoricoTipoTag = styled.span<{ $cor: string }>`
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  padding: 0.125rem 0.5rem;
  border-radius: ${theme.borderRadius.full};
  border: 1px solid ${({ $cor }) => `color-mix(in srgb, ${$cor} 35%, transparent)`};
  background: ${({ $cor }) => `color-mix(in srgb, ${$cor} 12%, transparent)`};
  color: ${({ $cor }) => $cor};
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
`;

/** "aguardando a diretoria", o estado de um pedido ainda sem resposta. */
export const HistoricoAguardando = styled.span`
  font-size: ${theme.fontSize.xs};
  font-style: italic;
  color: ${theme.colors.mutedForeground};
`;

/* ---------------------------------------------- contexto no cabeçalho fixo */

/**
 * A descrição do projeto no cabeçalho, cortada em duas linhas.
 *
 * ⭐ Ela subiu do card "Descrição" da Visão geral para cá em 14/08/2026: é a
 * resposta para "do que se trata este projeto", e quem precisa dela precisa em
 * qualquer aba — não só na primeira.
 *
 * 📐 Cortada em duas linhas porque é texto livre e cresce sem limite. Um
 * cabeçalho fixo que muda de altura conforme o tamanho da descrição empurraria
 * as abas para baixo em uns projetos e não em outros.
 */
export const DescricaoCabecalho = styled.p<{ $inteira: boolean }>`
  margin: 0.15rem 0 0;
  font-size: ${theme.fontSize.sm};
  line-height: 1.45;
  color: ${theme.colors.mutedForeground};
  max-width: 68ch;

  ${({ $inteira }) =>
    !$inteira &&
    `
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  `}
`;

export const DescricaoVerMais = styled.button`
  align-self: flex-start;
  margin-top: 0.1rem;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.primary};

  &:hover {
    text-decoration: underline;
  }
`;

/** A equipe no cabeçalho: coordenação e consultores lado a lado. */
export const EquipeCabecalho = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${theme.spacing.sm};
  margin-top: 0.35rem;
`;

export const EquipeGrupo = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  flex-wrap: wrap;
`;

export const EquipeRotulo = styled.span`
  display: inline-flex;
  align-items: baseline;
  gap: 0.35rem;
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.semibold};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${theme.colors.mutedForeground};
`;

/**
 * "2 de 3" — a ocupação da equipe.
 *
 * ⭐ Responde "ainda cabe gente?" sem ninguém contar avatares, que é a
 * pergunta de quem vai alocar. Colado ao rótulo que ele conta: solto, o número
 * não diz de quê.
 */
export const EquipeOcupacao = styled.span<{ $cheio: boolean }>`
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
  font-variant-numeric: tabular-nums;
  text-transform: none;
  letter-spacing: 0;
  color: ${({ $cheio }) => ($cheio ? theme.colors.mutedForeground : theme.colors.primary)};
`;

export const EquipePessoa = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.foreground};
`;

/** As iniciais. Cor derivada do id: a mesma pessoa é sempre a mesma cor. */
export const EquipeAvatar = styled.span<{ $cor: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: ${theme.borderRadius.full};
  background: ${({ $cor }) => $cor};
  color: #fff;
  font-size: 0.62rem;
  font-weight: ${theme.fontWeight.semibold};
  flex-shrink: 0;
`;

export const EquipeVazia = styled.span`
  font-size: ${theme.fontSize.sm};
  font-style: italic;
  color: ${theme.colors.mutedForeground};
`;

/** A linha da proposta na Visão geral: link e/ou anexo, lado a lado. */
export const PropostaLinha = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  flex-wrap: wrap;
`;

/**
 * A proposta no cabeçalho, ao lado do nome.
 *
 * ⭐ **Pílula com borda, não texto solto.** A primeira versão era só um ícone
 * cinza sem contorno — do tamanho de um pixel perdido ao lado de um título
 * grande, ninguém achava que aquilo era clicável. A mesma borda e o mesmo
 * arredondamento da `FrenteTag` ao lado fazem ela se anunciar como algo que
 * se aperta, sem competir em peso visual com o nome do projeto.
 */
const propostaBase = css`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.6rem;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.full};
  background: ${theme.colors.secondary};
  cursor: pointer;
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.foreground};
  text-decoration: none;

  &:hover {
    background: ${theme.colors.muted};
    border-color: ${theme.colors.mutedForeground};
  }

  &:disabled {
    cursor: default;
    opacity: 0.6;
  }
`;

export const PropostaLink = styled.a`
  ${propostaBase}
`;

export const PropostaBotao = styled.button`
  ${propostaBase}
`;
