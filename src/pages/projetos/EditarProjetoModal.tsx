import { useEffect, useState } from "react";
import styled from "styled-components";
import { theme } from "@/styles/theme";
import { X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ehDiretoriaDeProjetos } from "@/utils/permissoes";
import {
  renomearProjeto,
  updateCliente,
  updateDescricao,
  updateEquipe,
  updateEscopoProjeto,
  updateFrentes,
  updateLinkProposta,
  updateMaxConsultores,
  uploadAnexoProposta,
  type UpdateEscopoProjetoPayload,
} from "@/lib/projetos";
import { getUsuariosFrentes } from "@/lib/usuarios-frentes";
import { getEscopos } from "@/lib/escopos";
import {
  MemberPicker,
  montarEquipePayload,
  validarEquipe,
  type EquipeSelecionada,
} from "@/components/membros/MemberPicker";
import { CompatibilidadeHorarios } from "@/components/grade/CompatibilidadeHorarios";
import { MultiSelect } from "@/components/MultiSelect";
import type { UsuarioFrente, UsuarioResumo } from "@/types/auth";
import type { EscopoVendido, ProjetoCompleto } from "@/types/projeto";
import type { Escopo, Frente } from "@/types/banca";
import { EmptyText, PageButton } from "@/styles/page.styled";
import { FrenteLista, FrenteToggle } from "./ProjetoNovo.styled";
import {
  FieldGroup,
  FieldInput,
  FieldLabel,
  FieldSelect,
  Required,
  FieldTextarea,
  FormErrorText,
  ModalOverlay,
  ModalHeader,
  ModalTitle,
  ModalClose,
  ModalBody,
  ModalFooter,
  WideModalContent,
} from "./Projetos.styled";

/** O valor do `<select>` de tipo de escopo para "Outro", mesmo rótulo do
 *  `NovoEscopoVendidoModal`, que é onde esse `<select>` nasceu. */
const OUTRO_ESCOPO = "outro";

/** Um escopo já vendido, editado nesta linha. Diferente do escopo NOVO
 *  (`NovoEscopoVendidoModal`): não tem `frente_id` escolhível, porque a
 *  frente de um escopo que já existe não é editável (ver
 *  `UpdateEscopoProjetoRequest.calendario`, mesma régua). */
interface EscopoEmEdicao {
  id: number;
  frenteId: number;
  tipo: string;
  nomeCustomizado: string;
  dias: string;
}

function paraEdicao(escopo: EscopoVendido): EscopoEmEdicao {
  return {
    id: escopo.id,
    frenteId: escopo.frente_id,
    tipo: escopo.escopo_id !== null ? String(escopo.escopo_id) : OUTRO_ESCOPO,
    nomeCustomizado: escopo.nome_customizado ?? "",
    dias: String(escopo.dias_uteis_vendidos),
  };
}

/** `null` quando nada mudou nesta linha, evita um PATCH vazio por escopo
 *  que ninguém tocou. */
function payloadDoEscopo(
  linha: EscopoEmEdicao,
  original: EscopoVendido,
): UpdateEscopoProjetoPayload | null {
  const payload: UpdateEscopoProjetoPayload = {};

  const ehOutro = linha.tipo === OUTRO_ESCOPO;
  const novoEscopoId = ehOutro ? null : Number(linha.tipo);
  const novoNome = ehOutro ? linha.nomeCustomizado.trim() : null;
  // Os dois campos formam UM tipo: se qualquer um dos dois mudou, os dois
  // viajam juntos, mandar só a metade deixaria o outro lado com o valor
  // antigo no PATCH.
  if (novoEscopoId !== original.escopo_id || novoNome !== (original.nome_customizado ?? null)) {
    payload.escopo_id = novoEscopoId;
    payload.nome_customizado = novoNome;
  }

  const novosDias = Number(linha.dias);
  if (novosDias !== original.dias_uteis_vendidos) {
    payload.dias_uteis_vendidos = novosDias;
  }

  return Object.keys(payload).length > 0 ? payload : null;
}

/** Um escopo por bloco, com borda própria. A tabela "Escopos vendidos" (na
 *  Visão geral) já lista todos lado a lado; aqui cada um vira um cartão
 *  porque editar pede mais campo por linha do que aquela tabela tem coluna. */
const EscopoBloco = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};

  & + & {
    margin-top: ${theme.spacing.sm};
  }
`;

const EscopoBlocoTitulo = styled.p`
  margin: 0;
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.semibold};
  color: ${theme.colors.foreground};
`;

const EscopoBlocoCampos = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing.md};

  & > * {
    flex: 1 1 12rem;
  }
`;

/**
 * O empilhamento dos campos do modal.
 *
 * O `ModalBody` tem `padding` e mais nada: sem `flex` e sem `gap`, os campos
 * caem um encostado no outro e o formulário lê como um bloco só. O `gap` do
 * `FieldGroup` não resolve — ele separa o rótulo do próprio campo, e não um
 * campo do seguinte.
 *
 * Não foi corrigido no `ModalBody`: aquele é o corpo de TODOS os modais do
 * app, e um `gap` lá mexeria de uma vez em telas que ninguém abriu para
 * conferir. O espaçamento é problema deste formulário, então mora aqui.
 */
const SecoesForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.lg};
`;

/**
 * Um bloco de campos do mesmo assunto, separado do anterior por uma linha.
 *
 * Deliberadamente NÃO é o `BlocoSecao` numerado de `ProjetoNovo`. Lá o número
 * é verdade: o cadastro é percorrido inteiro, uma vez, de cima a baixo. Aqui a
 * pessoa abre o modal para arrumar um campo específico e vai direto nele —
 * numerar prometeria uma sequência que ninguém segue, e faria a edição
 * parecer um formulário longo por preencher.
 *
 * A divisória vem no `& + &` para que o primeiro bloco não ganhe uma linha
 * solta logo abaixo do cabeçalho do modal, que já tem a sua.
 */
const SecaoForm = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};

  & + & {
    padding-top: ${theme.spacing.lg};
    border-top: 1px solid ${theme.colors.border};
  }
`;

/** Rótulo do bloco: menor e mais apagado que os rótulos dos campos, senão
 *  competiria com eles em vez de agrupá-los. Mesma receita do
 *  `GrupoFrenteTitulo` do Config e do `SecaoTitulo` da ajuda do cronograma. */
const SecaoFormTitulo = styled.h3`
  margin: 0;
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.semibold};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${theme.colors.mutedForeground};
`;

interface Props {
  projeto: ProjetoCompleto;
  usuarios: UsuarioResumo[];
  frentes: Frente[];
  token: string;
  onClose: () => void;
  onSalvo: () => Promise<void>;
  /**
   * O vendedor do projeto edita só os campos DESCRITIVOS (nome, cliente,
   * descrição, link e PDF da proposta): foi ele que fechou isso com o
   * cliente. Alocação, Pessoas e Escopos ficam fora, e o resto do projeto
   * segue leitura para ele. O backend recusa o que passar disso.
   */
  soMetadados?: boolean;
}

/**
 * ⭐ **Um lugar só para editar o contexto do projeto**: nome, descrição e
 * equipe.
 *
 * ⚠ **O que ele substitui.** Os três campos moravam em lugares diferentes e
 * cada um tinha o próprio botão: um lápis ao lado do nome no cabeçalho, um
 * "Editar" no card de Descrição e um "Editar equipe" no card de Equipe. Três
 * afordâncias para a mesma ideia — "corrigir o cadastro deste projeto" — e o
 * cabeçalho ficava coberto de botões que ninguém usa no dia a dia.
 *
 * 📐 **Salva campo a campo, e só o que mudou.** São três endpoints distintos
 * (`renomearProjeto`, `updateDescricao`, `updateEquipe`), e mandar os três
 * sempre gravaria histórico de alteração de equipe para quem só corrigiu uma
 * vírgula na descrição.
 *
 * ⚠ A equipe é a parte cara: se ela falhar depois de o nome ter ido, o modal
 * fica aberto com o erro e o que já passou está gravado. É melhor do que
 * fingir atomicidade que a API não oferece — a pessoa vê o que faltou e tenta
 * de novo só aquilo.
 *
 * Os campos vivem em três blocos — Identificação, Alocação e Pessoas — porque
 * a lista corrida de oito campos não dizia que o teto de consultores e as
 * frentes são do mesmo assunto, nem que cliente e link da proposta são de
 * outro. Os títulos são só títulos, sem numeração: quem edita entra atrás de
 * um campo, não percorre o formulário inteiro.
 */
export function EditarProjetoModal({
  projeto,
  usuarios,
  frentes,
  token,
  onClose,
  onSalvo,
  soMetadados = false,
}: Props) {
  const [nome, setNome] = useState(projeto.nome);
  const [cliente, setCliente] = useState(projeto.cliente ?? "");
  const [descricao, setDescricao] = useState(projeto.descricao ?? "");
  const [linkProposta, setLinkProposta] = useState(projeto.link_proposta ?? "");
  /** PDF da proposta escolhido agora. Envia só no salvar. */
  const [anexoProposta, setAnexoProposta] = useState<File | null>(null);
  const [frenteIds, setFrenteIds] = useState(projeto.frente_ids);
  const [equipe, setEquipe] = useState<EquipeSelecionada>({
    coordenadorIds: projeto.coordenador_ids,
    consultorIds: projeto.consultor_ids,
  });
  // Separado da equipe de propósito: quem vendeu não é do time. Vender não
  // ocupa vaga de consultor nem entra na conta de capacidade.
  const [vendedorIds, setVendedorIds] = useState<number[]>(projeto.vendedor_ids ?? []);
  const [maxConsultores, setMaxConsultores] = useState(String(projeto.max_consultores));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [usuariosFrentes, setUsuariosFrentes] = useState<UsuarioFrente[]>([]);

  // Trocar o tipo de um escopo ou os dias úteis vendidos é só da diretoria de
  // projetos (o coordenador segue adicionando/removendo escopo na Visão
  // geral). O backend recusa com 422 de qualquer jeito; aqui só não mostramos.
  const { usuario } = useAuth();
  const podeEditarEscopos = ehDiretoriaDeProjetos(usuario);

  const [escoposEdicao, setEscoposEdicao] = useState<EscopoEmEdicao[]>(() =>
    projeto.escopos.map(paraEdicao),
  );
  /** O catálogo só é buscado se houver escopo pra editar e quem abriu puder. */
  const [catalogoEscopos, setCatalogoEscopos] = useState<Escopo[]>([]);

  useEffect(() => {
    if (!podeEditarEscopos || projeto.escopos.length === 0 || !token) return;
    getEscopos(token)
      .then(setCatalogoEscopos)
      .catch(() => setCatalogoEscopos([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, podeEditarEscopos]);

  function atualizarEscopo(id: number, patch: Partial<EscopoEmEdicao>) {
    setEscoposEdicao((lista) => lista.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  function toggleFrente(id: number) {
    setFrenteIds((atual) =>
      atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id],
    );
  }

  const frenteIdsMudaram =
    frenteIds.length !== projeto.frente_ids.length ||
    frenteIds.some((id) => !projeto.frente_ids.includes(id));

  useEffect(() => {
    getUsuariosFrentes(token).then(setUsuariosFrentes);
  }, [token]);

  const ativos = usuarios
    .filter((u) => u.ativo)
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  const equipeMudou =
    equipe.coordenadorIds.length !== projeto.coordenador_ids.length ||
    equipe.coordenadorIds.some((id) => !projeto.coordenador_ids.includes(id)) ||
    equipe.consultorIds.length !== projeto.consultor_ids.length ||
    equipe.consultorIds.some((id) => !projeto.consultor_ids.includes(id));

  const vendedoresAtuais = projeto.vendedor_ids ?? [];
  const vendedoresMudaram =
    vendedorIds.length !== vendedoresAtuais.length ||
    vendedorIds.some((id) => !vendedoresAtuais.includes(id));

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) {
      setErro("O nome do projeto não pode ficar vazio.");
      return;
    }
    if (anexoProposta && !anexoProposta.name.toLowerCase().endsWith(".pdf")) {
      setErro("O anexo da proposta precisa ser um PDF.");
      return;
    }
    // As checagens abaixo são das seções que o vendedor não vê.
    if (!soMetadados && frenteIds.length === 0) {
      setErro("Escolha pelo menos uma frente.");
      return;
    }
    const problema = !soMetadados && equipeMudou ? validarEquipe(equipe) : null;
    if (problema) {
      setErro(problema);
      return;
    }
    const numeroTeto = Number(maxConsultores);
    if (!soMetadados && (!Number.isInteger(numeroTeto) || numeroTeto < 0 || numeroTeto > 20)) {
      setErro("O teto de consultores precisa ser um número de 0 a 20.");
      return;
    }
    if (!soMetadados && podeEditarEscopos) {
      for (const linha of escoposEdicao) {
        const original = projeto.escopos.find((e) => e.id === linha.id);
        if (!original) continue;
        if (linha.tipo === OUTRO_ESCOPO && !linha.nomeCustomizado.trim()) {
          setErro(`Dê um nome ao escopo "${original.nome}", ou escolha um item do catálogo.`);
          return;
        }
        const dias = Number(linha.dias);
        if (!Number.isInteger(dias) || dias < 1) {
          setErro(`Os dias úteis vendidos de "${original.nome}" precisam ser maiores que zero.`);
          return;
        }
      }
    }

    setSalvando(true);
    setErro("");
    try {
      if (nome.trim() !== projeto.nome) {
        await renomearProjeto(projeto.id, nome.trim(), token);
      }
      if (cliente.trim() !== (projeto.cliente ?? "")) {
        await updateCliente(projeto.id, cliente.trim(), token);
      }
      if (descricao !== (projeto.descricao ?? "")) {
        await updateDescricao(projeto.id, descricao, token);
      }
      if (linkProposta.trim() !== (projeto.link_proposta ?? "")) {
        await updateLinkProposta(projeto.id, linkProposta.trim(), token);
      }
      // O PDF por último dos campos descritivos: o upload zera o link no
      // backend, então mandar depois do link acima evita reescrever um link
      // que ia sumir de qualquer forma.
      if (anexoProposta) {
        await uploadAnexoProposta(projeto.id, anexoProposta, token);
      }

      // Daqui para baixo é o que o vendedor não edita.
      if (soMetadados) {
        await onSalvo();
        return;
      }

      // Antes da equipe: se uma frente saiu, quem ela habilitava no
      // MemberPicker precisa já ter sumido da lista antes de a equipe ser
      // validada do lado do servidor.
      if (frenteIdsMudaram) {
        await updateFrentes(projeto.id, frenteIds, token);
      }
      // Antes da equipe: se o teto estiver baixando, o backend recusa a
      // equipe grande demais primeiro, e a pessoa corrige a ordem errada
      // sem entender por quê. Aqui o teto sempre vai primeiro.
      if (numeroTeto !== projeto.max_consultores) {
        await updateMaxConsultores(projeto.id, numeroTeto, token);
      }
      // A mesma rota grava os dois, mas `vendedor_ids` só vai quando mudou:
      // mandar sempre apagaria a lista de quem salvou só a equipe, e omitir
      // é o jeito de dizer "não mexa nos vendedores".
      if (equipeMudou || vendedoresMudaram) {
        await updateEquipe(
          projeto.id,
          montarEquipePayload(equipe),
          token,
          vendedoresMudaram ? vendedorIds : undefined,
        );
      }
      // Por último: se um escopo falhar (tipo do catálogo removido nesse
      // meio-tempo, por exemplo), o resto já está salvo, e o modal segue
      // aberto só com o que faltou, igual à equipe logo acima.
      if (podeEditarEscopos) {
        for (const linha of escoposEdicao) {
          const original = projeto.escopos.find((e) => e.id === linha.id);
          if (!original) continue;
          const payload = payloadDoEscopo(linha, original);
          if (payload) {
            await updateEscopoProjeto(linha.id, payload, token);
          }
        }
      }
      await onSalvo();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <ModalOverlay onClick={onClose} role="presentation">
      <WideModalContent
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="editar-projeto-titulo"
      >
        <ModalHeader>
          <ModalTitle id="editar-projeto-titulo">Editar projeto</ModalTitle>
          <ModalClose type="button" aria-label="Fechar" onClick={onClose}>
            <X size={18} />
          </ModalClose>
        </ModalHeader>
        <form onSubmit={handleSalvar}>
          <ModalBody>
            <SecoesForm>
              <SecaoForm>
                <SecaoFormTitulo>Identificação</SecaoFormTitulo>

                <FieldGroup>
                  <FieldLabel htmlFor="editar-nome">
                    Nome do projeto<Required>*</Required>
                  </FieldLabel>
                  <FieldInput
                    id="editar-nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    disabled={salvando}
                    autoFocus
                  />
                </FieldGroup>

                <FieldGroup>
                  <FieldLabel htmlFor="editar-cliente">Cliente</FieldLabel>
                  <FieldInput
                    id="editar-cliente"
                    value={cliente}
                    onChange={(e) => setCliente(e.target.value)}
                    disabled={salvando}
                    placeholder="Padaria do Zé"
                  />
                </FieldGroup>

                <FieldGroup>
                  <FieldLabel htmlFor="editar-descricao">Descrição</FieldLabel>
                  <FieldTextarea
                    id="editar-descricao"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    rows={4}
                    disabled={salvando}
                    placeholder="Do que se trata este projeto?"
                  />
                </FieldGroup>

                <FieldGroup>
                  <FieldLabel htmlFor="editar-link-proposta">Link da proposta</FieldLabel>
                  <FieldInput
                    id="editar-link-proposta"
                    value={linkProposta}
                    onChange={(e) => setLinkProposta(e.target.value)}
                    disabled={salvando}
                    placeholder="https://…"
                  />
                </FieldGroup>

                <FieldGroup>
                  <FieldLabel htmlFor="editar-anexo-proposta">PDF da proposta</FieldLabel>
                  <input
                    id="editar-anexo-proposta"
                    type="file"
                    accept="application/pdf,.pdf"
                    disabled={salvando}
                    onChange={(e) => setAnexoProposta(e.target.files?.[0] ?? null)}
                  />
                  <EmptyText style={{ margin: 0, fontSize: "0.7rem" }}>
                    {projeto.anexo_proposta_nome
                      ? `Atual: ${projeto.anexo_proposta_nome}. Escolher um novo substitui.`
                      : "Opcional. Enviar um PDF apaga o link da proposta."}
                  </EmptyText>
                </FieldGroup>
              </SecaoForm>

              {!soMetadados && (
              <>
              <SecaoForm>
                <SecaoFormTitulo>Alocação</SecaoFormTitulo>

                <FieldGroup>
                  <FieldLabel as="span">
                    Frente(s)<Required>*</Required>
                  </FieldLabel>
                  <FrenteLista>
                    {frentes.map((frente) => {
                      const marcada = frenteIds.includes(frente.id);
                      return (
                        <FrenteToggle key={frente.id} $marcada={marcada}>
                          <input
                            type="checkbox"
                            checked={marcada}
                            disabled={salvando}
                            onChange={() => toggleFrente(frente.id)}
                          />
                          {frente.nome}
                        </FrenteToggle>
                      );
                    })}
                  </FrenteLista>
                </FieldGroup>

                <FieldGroup>
                  {/* Obrigatório de fato, e não só por hábito: a coluna é
                      `nullable=False` e `UpdateMaxConsultoresRequest` não tem
                      default, então não existe "deixar em branco" — apagar o
                      campo é um erro de validação, não um projeto sem teto. */}
                  <FieldLabel htmlFor="editar-max-consultores">
                    Teto de consultores<Required>*</Required>
                  </FieldLabel>
                  <FieldInput
                    id="editar-max-consultores"
                    type="number"
                    min={0}
                    max={20}
                    value={maxConsultores}
                    onChange={(e) => setMaxConsultores(e.target.value)}
                    disabled={salvando}
                  />
                </FieldGroup>
              </SecaoForm>

              <SecaoForm>
                <SecaoFormTitulo>Pessoas</SecaoFormTitulo>

                {/* Sem asterisco nos dois: a equipe pode ficar incompleta
                    enquanto a gestão decide quem assume (ver `validarEquipe`),
                    e vendedor é informação comercial que muitos projetos
                    simplesmente não têm. */}
                <MemberPicker
                  usuarios={ativos}
                  valor={equipe}
                  onChange={setEquipe}
                  desabilitado={salvando}
                  usuariosFrentes={usuariosFrentes}
                  frentes={frentes}
                  frenteIdsProjeto={frenteIds}
                />

                <FieldGroup>
                  <FieldLabel htmlFor="vendedores">Quem vendeu o projeto</FieldLabel>
                  <MultiSelect
                    valores={vendedorIds.map(String)}
                    onChange={(ids) => setVendedorIds(ids.map(Number))}
                    opcoes={ativos.map((u) => ({ value: String(u.id), label: u.nome }))}
                    rotuloVazio="Ninguém marcado"
                    resumo={(n) => `${n} vendedores`}
                    aria-label="Quem vendeu o projeto"
                    pesquisavel
                  />
                </FieldGroup>

                {/* Mesma leitura de quando o projeto nasceu: trocar alguém pode
                    fechar a única janela em que o time se reunia. Fica neste
                    bloco porque é consequência da equipe escolhida logo acima,
                    não um campo a preencher. */}
                <CompatibilidadeHorarios consultorIds={equipe.consultorIds} usuarios={ativos} />
              </SecaoForm>

              {/* Só a diretoria de projetos, e só com escopo já cadastrado:
                  adicionar/remover continua na Visão geral (aberto ao
                  coordenador), junto da reunião inicial e da banca de cada um. */}
              {podeEditarEscopos && escoposEdicao.length > 0 && (
                <SecaoForm>
                  <SecaoFormTitulo>Escopos vendidos</SecaoFormTitulo>
                  <EmptyText style={{ margin: 0, fontSize: "0.75rem" }}>
                    Troque o tipo de um escopo já cadastrado e corrija os dias úteis vendidos. Para
                    adicionar ou remover escopos, use a tabela "Escopos vendidos" na Visão geral.
                  </EmptyText>
                  {escoposEdicao.map((linha) => {
                    const original = projeto.escopos.find((e) => e.id === linha.id);
                    if (!original) return null;
                    const ehOutro = linha.tipo === OUTRO_ESCOPO;
                    const opcoesDaFrente = catalogoEscopos.filter(
                      (c) => c.frente_id === linha.frenteId,
                    );
                    return (
                      <EscopoBloco key={linha.id}>
                        <EscopoBlocoTitulo>{original.nome}</EscopoBlocoTitulo>
                        <EscopoBlocoCampos>
                          <FieldGroup>
                            <FieldLabel htmlFor={`escopo-tipo-${linha.id}`}>Tipo</FieldLabel>
                            <FieldSelect
                              id={`escopo-tipo-${linha.id}`}
                              value={linha.tipo}
                              disabled={salvando}
                              onChange={(e) => atualizarEscopo(linha.id, { tipo: e.target.value })}
                            >
                              {opcoesDaFrente.map((c) => (
                                <option key={c.id} value={String(c.id)}>
                                  {c.nome}
                                </option>
                              ))}
                              <option value={OUTRO_ESCOPO}>Outro (digitar o nome)</option>
                            </FieldSelect>
                          </FieldGroup>

                          {ehOutro && (
                            <FieldGroup>
                              <FieldLabel htmlFor={`escopo-nome-${linha.id}`}>Nome</FieldLabel>
                              <FieldInput
                                id={`escopo-nome-${linha.id}`}
                                value={linha.nomeCustomizado}
                                disabled={salvando}
                                onChange={(e) =>
                                  atualizarEscopo(linha.id, { nomeCustomizado: e.target.value })
                                }
                              />
                            </FieldGroup>
                          )}

                          <FieldGroup>
                            <FieldLabel htmlFor={`escopo-dias-${linha.id}`}>
                              Dias úteis vendidos
                            </FieldLabel>
                            <FieldInput
                              id={`escopo-dias-${linha.id}`}
                              type="number"
                              min={1}
                              value={linha.dias}
                              disabled={salvando}
                              onChange={(e) => atualizarEscopo(linha.id, { dias: e.target.value })}
                            />
                          </FieldGroup>
                        </EscopoBlocoCampos>
                      </EscopoBloco>
                    );
                  })}
                </SecaoForm>
              )}
              </>
              )}

              {/* Dentro da pilha, e não solto no `ModalBody`: fora dela o erro
                  encostaria no último bloco, exatamente o problema que a pilha
                  existe para resolver. */}
              {erro && <FormErrorText>{erro}</FormErrorText>}
            </SecoesForm>
          </ModalBody>
          <ModalFooter>
            <PageButton type="button" $variant="outline" onClick={onClose}>
              Cancelar
            </PageButton>
            <PageButton type="submit" disabled={salvando}>
              {salvando ? "Salvando…" : "Salvar"}
            </PageButton>
          </ModalFooter>
        </form>
      </WideModalContent>
    </ModalOverlay>
  );
}
