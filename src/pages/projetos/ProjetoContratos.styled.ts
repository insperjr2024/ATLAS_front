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

/** Nome do projeto por baixo do título do documento — precisa se destacar
 *  mais que um link discreto comum: é o que diz DE QUE PROJETO é este
 *  documento, a primeira coisa que se quer confirmar ao abrir a página. */
export const ProjetoLinha = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${theme.spacing.sm};
  margin-top: 0.125rem;
`;

export const ProjetoDestaque = styled.span`
  display: inline-flex;
  align-items: center;
  font-size: ${theme.fontSize.base};
  font-weight: ${theme.fontWeight.semibold};
  color: ${theme.colors.primary};

  &:is(a) {
    text-decoration: none;
    cursor: pointer;
  }
  &:is(a):hover {
    text-decoration: underline;
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

/** Dia/Mês/Ano da assinatura cabem em poucos caracteres — no `FormGrid`
 *  normal (colunas 1fr) cada um esticava pra 1/3 da largura da tela, o que
 *  ficava ainda mais estranho depois de destacar o campo vazio em vermelho
 *  (a caixa vermelha, gigante, sem relação com o tamanho do valor).
 *
 *  ⚠ 2026-09-20, corrigido: "Mês (número ou nome)" quebra em duas linhas
 *  num campo de 9rem, mas "Dia"/"Ano" não — sem reservar a mesma altura de
 *  rótulo pros três, o input do Mês ficava mais baixo que os outros dois,
 *  desalinhado. `min-height` no rótulo (não no campo) resolve isso não
 *  importa quantas linhas o texto ocupar. */
export const FormGridEstreito = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing.md};

  > * {
    width: 10rem;
    max-width: 100%;
  }

  label {
    display: block;
    min-height: 2.4em;
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
 *  compartilhados com o resto do app).
 *
 *  ⚠ 2026-09-20, corrigido: `<FieldInput>` (diferente de `<FieldTextarea>`)
 *  não tem `width: 100%` — contava com ser filho direto de um grid/flex que
 *  estica os itens por padrão. Ao virar filho de UM DIV COMUM aqui, essa
 *  esticada some e o input renderiza na largura intrínseca do navegador
 *  (bem menor) — o contorno (em volta do div, que ainda ocupa a coluna
 *  inteira) sobra visivelmente maior que a caixa cinza do campo. */
export const CampoDestacadoWrapper = styled.div<{ $destacar?: boolean }>`
  display: block;

  input,
  textarea,
  select {
    width: 100%;
    box-sizing: border-box;
  }

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

/** ⚠ 2026-09-21, corrigido de novo: "Baixar modelo" virou botão-outline igual
 *  ao "Preencher a partir da Coleta" quando tirei o azul do segundo — os dois
 *  ficaram gêmeos idênticos lado a lado. São ações de peso bem diferente
 *  (baixar um .docx em branco vs. subir um preenchido e reescrever o
 *  formulário inteiro), então só o texto do meio ("baixar o modelo") fica
 *  como link discreto — o botão de verdade sobra só pra ação que importa. */
export const LinkDiscreto = styled.button`
  border: none;
  background: none;
  padding: 0;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.mutedForeground};
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;

  &:hover {
    color: ${theme.colors.foreground};
  }

  &:disabled {
    cursor: default;
    opacity: 0.6;
  }
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
