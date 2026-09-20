import styled from "styled-components";
import { theme } from "@/styles/theme";

// ---------- Página de detalhe do documento ----------

export const DocumentoPaginaHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing.md};
`;

export const DocumentoPaginaTitulo = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};

  h1 {
    margin: 0;
    font-size: ${theme.fontSize.lg};
    font-weight: ${theme.fontWeight.semibold};
  }
`;

export const VoltarLink = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  border: none;
  background: none;
  padding: 0;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.mutedForeground};
  cursor: pointer;

  &:hover {
    color: ${theme.colors.foreground};
    text-decoration: underline;
  }
`;

/** As 6 etapas do ciclo de vida — mesma ideia visual do stepper do sistema
 *  antigo (Preenchimento → Geração → Revisão interna → Aprovação do
 *  cliente → Aprovado → Arquivado), pra orientar de cara em que ponto do
 *  processo o documento está, sem precisar decifrar o rótulo do status. */
export const Etapas = styled.ol`
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const Etapa = styled.li<{ $estado: "concluida" | "atual" | "pendente" }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  padding: ${theme.spacing.xs} ${theme.spacing.sm} ${theme.spacing.xs} 0;
  font-size: ${theme.fontSize.xs};
  font-weight: ${({ $estado }) => ($estado === "atual" ? theme.fontWeight.semibold : theme.fontWeight.medium)};
  color: ${({ $estado }) =>
    $estado === "pendente" ? theme.colors.mutedForeground : theme.colors.foreground};

  &:not(:last-child)::after {
    content: "";
    display: inline-block;
    width: 1.5rem;
    height: 1px;
    margin: 0 ${theme.spacing.xs};
    background: ${theme.colors.border};
  }
`;

export const EtapaMarca = styled.span<{ $estado: "concluida" | "atual" | "pendente" }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 999px;
  font-size: 0.65rem;
  font-weight: ${theme.fontWeight.semibold};
  flex-shrink: 0;

  ${({ $estado }) =>
    $estado === "concluida"
      ? `background: ${theme.colors.success}; color: ${theme.colors.successForeground};`
      : $estado === "atual"
        ? `background: ${theme.colors.primary}; color: ${theme.colors.primaryForeground};`
        : `background: ${theme.colors.muted}; color: ${theme.colors.mutedForeground}; border: 1px solid ${theme.colors.border};`}
`;

/** A ação que de fato move o processo pra frente, visualmente separada das
 *  ações secundárias (editar, baixar, apagar) — numa barra própria, maior,
 *  em vez de competir por atenção com o resto. */
export const AcaoPrincipalBarra = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.muted};
`;

export const AcoesSecundariasLinha = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing.sm};
  padding-top: ${theme.spacing.sm};
  border-top: 1px solid ${theme.colors.border};
  margin-top: ${theme.spacing.md};
`;

export const DocumentoLista = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
`;

export const DocumentoLinha = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing.md};
  width: 100%;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.background};
  cursor: pointer;
  text-align: left;
  font: inherit;
  color: inherit;

  &:hover {
    border-color: ${theme.colors.primary};
  }
`;

export const DocumentoTipo = styled.span`
  font-weight: ${theme.fontWeight.medium};
`;

export const DocumentoMeta = styled.span`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.mutedForeground};
`;

export const TiposDisponiveisRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing.sm};
`;

export const DadosTextarea = styled.textarea`
  width: 100%;
  box-sizing: border-box;
  min-height: 18rem;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${theme.colors.input};
  background: ${theme.colors.background};
  color: ${theme.colors.foreground};
  font-family: ui-monospace, "SF Mono", Menlo, monospace;
  font-size: ${theme.fontSize.xs};
  resize: vertical;

  &:focus {
    outline: none;
    border-color: ${theme.colors.ring};
  }
`;

export const AcoesLinha = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing.sm};
  align-items: center;
`;

export const FormSecoes = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.lg};
`;

export const FormSecaoTitulo = styled.h3`
  margin: 0 0 ${theme.spacing.sm};
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.semibold};
  color: ${theme.colors.foreground};
`;

export const FormSubsecaoTitulo = styled.h4`
  margin: ${theme.spacing.md} 0 ${theme.spacing.sm};
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.mutedForeground};
  text-transform: uppercase;
  letter-spacing: 0.03em;
`;

export const FormGrid = styled.div<{ $colunas?: 2 | 3 }>`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${theme.spacing.md};

  @media (min-width: ${theme.breakpoints.sm}px) {
    grid-template-columns: repeat(${({ $colunas = 2 }) => $colunas}, minmax(0, 1fr));
  }
`;

export const ListaLinha = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};

  > *:first-child {
    flex: 1;
  }
`;

export const ListaRemoverBotao = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  flex-shrink: 0;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.background};
  color: ${theme.colors.mutedForeground};
  cursor: pointer;
  font-size: ${theme.fontSize.sm};

  &:hover {
    border-color: ${theme.colors.destructive};
    color: ${theme.colors.destructive};
  }
`;

export const ListaAdicionarBotao = styled.button`
  align-self: flex-start;
  border: none;
  background: none;
  padding: 0;
  color: ${theme.colors.primary};
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

/** Contorno vermelho ao redor de um campo apontado como obrigatório vazio —
 *  envolve o `<FieldInput>`/`<FieldTextarea>` sem precisar mexer neles (são
 *  compartilhados com o resto do app). */
export const CampoDestacadoWrapper = styled.div<{ $destacar?: boolean }>`
  ${({ $destacar }) =>
    $destacar &&
    `
      outline: 2px solid ${theme.colors.destructive};
      outline-offset: 2px;
      border-radius: ${theme.borderRadius.md};
    `}
`;

export const CampoObrigatorioTexto = styled.span`
  display: block;
  margin-top: ${theme.spacing.xs};
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.destructive};
`;

export const ArquivoLinha = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

/** ⚠ 2026-09-21, corrigido: era o azul cheio (`theme.colors.info`) de
 *  `ProjetoNovo.styled.ts` — fazia sentido lá, onde é a ÚNICA ação da tela
 *  (anexar a proposta). Aqui são duas entre várias outras (Coleta de Dados,
 *  reanexar .docx), sempre secundárias — o mesmo visual "outline" de
 *  `PageButton $variant="outline"`, pra não competir com os botões de ação
 *  de verdade (Gerar rascunho, Confirmar). */
export const ArquivoBotao = styled.label`
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  min-height: 2rem;
  padding: 0 0.75rem;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.lg};
  background: ${theme.colors.background};
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.foreground};
  cursor: pointer;
  transition: background ${theme.transitions.fast}, border-color ${theme.transitions.fast};

  &:hover {
    background: ${theme.colors.muted};
  }

  input {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
    pointer-events: none;
  }

  &:has(input:focus-visible) {
    box-shadow: 0 0 0 3px color-mix(in srgb, ${theme.colors.ring} 35%, transparent);
  }
`;

export const ArquivoNome = styled.span<{ $vazio?: boolean }>`
  min-width: 0;
  font-size: ${theme.fontSize.sm};
  color: ${({ $vazio }) => ($vazio ? theme.colors.mutedForeground : theme.colors.foreground)};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const LinkCaixa = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.muted};
`;

export const LinkLinha = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};

  code {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: ${theme.fontSize.xs};
    color: ${theme.colors.mutedForeground};
  }
`;

export const SolicitacaoCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xs};
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.background};
`;

export const TrechoCitado = styled.blockquote`
  margin: 0;
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-left: 2px solid ${theme.colors.border};
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
  font-style: italic;
`;

export const ParagrafoEditavelBloco = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xs};
  padding-bottom: ${theme.spacing.md};

  & + & {
    border-top: 1px solid ${theme.colors.border};
    padding-top: ${theme.spacing.md};
  }
`;

export const VersaoLinha = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.xs} 0;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.mutedForeground};

  & + & {
    border-top: 1px solid ${theme.colors.border};
  }
`;
