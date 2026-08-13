import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Download, ExternalLink, Lock, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ROTULO_STATUS_BANCA, tomDoStatusBanca } from "@/lib/bancas";
import { getUsuariosFrentes } from "@/lib/usuarios-frentes";
import {
  baixarAnexoProposta,
  DIAS_REUNIAO,
  formatarData,
  formatarDataHora,
  formatarDataHoraBanca,
  marcarKickoff,
  registrarJustificativaAtraso,
  ROTULO_STATUS_ESCOPO,
  rotuloDiaSemana,
  updateDescricao,
  updateDiaReuniaoPadrao,
  updateDiasAmbientacao,
  updateEquipe,
} from "@/lib/projetos";
import {
  MemberPicker,
  montarEquipePayload,
  validarEquipe,
  type EquipeSelecionada,
} from "@/components/membros/MemberPicker";
import { CompatibilidadeHorarios } from "@/components/grade/CompatibilidadeHorarios";
import type { UsuarioFrente, UsuarioResumo } from "@/types/auth";
import type { ProjetoCompleto } from "@/types/projeto";
import type { Frente } from "@/types/banca";
import {
  PageStack,
  PageCard,
  PageCardHeader,
  PageCardTitle,
  PageCardContent,
  PageBadge,
  PageButton,
  PageButtonSm,
  EmptyText,
} from "@/styles/page.styled";
import {
  FieldInput,
  FieldSelect,
  FieldTextarea,
  FormErrorText,
  ModalOverlay,
  ModalHeader,
  ModalTitle,
  ModalClose,
  ModalBody,
  ModalFooter,
  WideModalContent,
  InfoGrid,
  DescricaoTexto,
  LinkExterno,
  DatasGrid,
  DataItem,
  DataItemLabel,
  DataItemNota,
  DataItemValor,
  EdicaoBotoes,
  EquipeList,
  EquipeItem,
  PapelTag,
  DataTable,
  TableHead,
  TableHeadCell,
  TableBody,
  TableRow,
  TableCell,
  ProgressoWrap,
  ProgressoTrilha,
  ProgressoBarra,
  ProgressoTexto,
  Cadeado,
  EscopoNome,
  AtrasoCelula,
  JustificativaAtraso,
  LegendaTabela,
  FrenteBloco,
  FrenteCabecalho,
  BancaLinha,
  BancaEscopo,
  BancaData,
} from "./Projetos.styled";
import { useProjeto } from "./ProjetoPage";

export function ProjetoVisaoGeral() {
  const { projeto, usuarios, frentes, recarregar } = useProjeto();
  const { usuario, token } = useAuth();
  const [editandoEquipe, setEditandoEquipe] = useState(false);
  const [baixandoAnexo, setBaixandoAnexo] = useState(false);
  const [erroAnexo, setErroAnexo] = useState("");
  const [editandoDescricao, setEditandoDescricao] = useState(false);
  const [descricao, setDescricao] = useState(projeto.descricao ?? "");
  const [salvandoDescricao, setSalvandoDescricao] = useState(false);
  const [erroDescricao, setErroDescricao] = useState("");

  const nomeUsuario = (id: number) => usuarios.find((u) => u.id === id)?.nome ?? `Usuário ${id}`;
  const podeEditarEquipe = !!usuario?.permissoes.pode_editar_equipe;

  async function handleSalvarDescricao() {
    if (!token) return;
    setSalvandoDescricao(true);
    setErroDescricao("");
    try {
      await updateDescricao(projeto.id, descricao, token);
      setEditandoDescricao(false);
      await recarregar();
    } catch (err) {
      setErroDescricao(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSalvandoDescricao(false);
    }
  }

  async function handleBaixarAnexo() {
    if (!token || !projeto.anexo_proposta_nome) return;
    setErroAnexo("");
    setBaixandoAnexo(true);
    try {
      await baixarAnexoProposta(projeto.id, projeto.anexo_proposta_nome, token);
    } catch (err) {
      setErroAnexo(err instanceof Error ? err.message : "Erro ao baixar o anexo");
    } finally {
      setBaixandoAnexo(false);
    }
  }

  return (
    <PageStack>
      <InfoGrid>
        <PageCard>
          <PageCardHeader>
            <PageCardTitle>Descrição</PageCardTitle>
            {projeto.link_proposta && (
              <LinkExterno href={projeto.link_proposta} target="_blank" rel="noreferrer">
                Abrir proposta
                <ExternalLink size={14} />
              </LinkExterno>
            )}
            {projeto.anexo_proposta_nome && (
              <PageButtonSm type="button" $variant="outline" onClick={handleBaixarAnexo} disabled={baixandoAnexo}>
                <Download size={14} />
                {baixandoAnexo ? "Baixando…" : "Baixar proposta"}
              </PageButtonSm>
            )}
            {podeEditarEquipe && !editandoDescricao && (
              <PageButtonSm
                type="button"
                $variant="outline"
                onClick={() => {
                  setDescricao(projeto.descricao ?? "");
                  setEditandoDescricao(true);
                }}
              >
                Editar
              </PageButtonSm>
            )}
          </PageCardHeader>
          <PageCardContent>
            {editandoDescricao ? (
              <>
                <FieldTextarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={5}
                  aria-label="Descrição do projeto"
                />
                {erroDescricao && <FormErrorText>{erroDescricao}</FormErrorText>}
                <EdicaoBotoes>
                  <PageButtonSm type="button" disabled={salvandoDescricao} onClick={handleSalvarDescricao}>
                    {salvandoDescricao ? "Salvando…" : "Salvar"}
                  </PageButtonSm>
                  <PageButtonSm
                    type="button"
                    $variant="ghost"
                    onClick={() => {
                      setEditandoDescricao(false);
                      setErroDescricao("");
                    }}
                  >
                    Cancelar
                  </PageButtonSm>
                </EdicaoBotoes>
              </>
            ) : projeto.descricao ? (
              <DescricaoTexto>{projeto.descricao}</DescricaoTexto>
            ) : (
              <EmptyText>Sem descrição cadastrada.</EmptyText>
            )}
            {erroAnexo && <FormErrorText>{erroAnexo}</FormErrorText>}
          </PageCardContent>
        </PageCard>

        <PageCard>
          <PageCardHeader>
            <PageCardTitle>Equipe</PageCardTitle>
            {podeEditarEquipe && (
              <PageButtonSm type="button" $variant="outline" onClick={() => setEditandoEquipe(true)}>
                Editar equipe
              </PageButtonSm>
            )}
          </PageCardHeader>
          <PageCardContent>
            {projeto.equipe.length === 0 ? (
              <EmptyText>Nenhum membro alocado.</EmptyText>
            ) : (
              <EquipeList>
                {[...projeto.equipe]
                  .sort((a, b) => (a.papel === "coordenador" ? -1 : b.papel === "coordenador" ? 1 : 0))
                  .map((membro) => (
                    <EquipeItem key={`${membro.usuario_id}-${membro.entrou_em}`}>
                      <span>{nomeUsuario(membro.usuario_id)}</span>
                      <PapelTag $coordenador={membro.papel === "coordenador"}>
                        {membro.papel === "coordenador" ? "Coordenador(a)" : "Consultor(a)"}
                      </PapelTag>
                    </EquipeItem>
                  ))}
              </EquipeList>
            )}
          </PageCardContent>
        </PageCard>
      </InfoGrid>

      <PageCard>
        <PageCardHeader>
          <PageCardTitle>Datas</PageCardTitle>
        </PageCardHeader>
        <PageCardContent>
          <DatasGrid>
            <DataItem>
              <DataItemLabel>Criado em</DataItemLabel>
              <DataItemValor>{formatarDataHora(projeto.criado_em)}</DataItemValor>
            </DataItem>
            {/* Datas são AGENDADAS no Cronograma, e só LIDAS aqui, a mesma
                data com duas portas de escrita foi o que se quis acabar.
                O KICKOFF é a exceção deliberada: é a única das seis datas
                sem regra de janela (não cai dentro nem fora de nada, não pede
                justificativa e não depende de banca), então nada se ganha em
                obrigar a ir ao calendário só para digitá-la. Ele aceita os dois
                caminhos. */}
            <DataEditavelKickoff projeto={projeto} token={token} recarregar={recarregar} />
            {/* DERIVADA: entrega ao cliente e entrega do escopo são a mesma
                coisa, o cliente recebe quando o escopo é entregue. Esta é a do
                último escopo entregue; as individuais estão na tabela abaixo. */}
            <DataItem>
              <DataItemLabel>Entrega ao cliente</DataItemLabel>
              <DataItemValor>
                <span>{formatarData(projeto.data_entrega_cliente)}</span>
              </DataItemValor>
              <DataItemNota>
                É a entrega do último escopo, cada escopo tem a sua, registrada em{" "}
                <strong>Entrega</strong>, no calendário do Cronograma.
              </DataItemNota>
            </DataItem>
            <DataEditavelDiasAmbientacao projeto={projeto} token={token} recarregar={recarregar} />
            <DataEditavelDiaReuniao projeto={projeto} token={token} recarregar={recarregar} />
          </DatasGrid>
        </PageCardContent>
      </PageCard>

      <TabelaEscopos />

      {/* uma banca por escopo, e o escopo é de uma frente, daí o
          recorte por frente, que é como a coordenação se organiza. */}
      <BancasPorFrente />

      {/* Pausa para pensar: a contagem é do backend (`utils/contagem_dias.py`).
          O front nunca recalcula dia útil, só desenha o que recebe. */}

      {editandoEquipe && token && (
        <EditarEquipeModal
          projeto={projeto}
          usuarios={usuarios}
          frentes={frentes}
          token={token}
          onClose={() => setEditandoEquipe(false)}
          onSalvo={async () => {
            setEditandoEquipe(false);
            await recarregar();
          }}
        />
      )}
    </PageStack>
  );
}

/* ------------------------------------------------------------------ */

/**
 * A tabela do escopo · status · dias usados · banca · entrega.
 *
 * O cadeado na entrega é conveniência de UI, quem barra de verdade é
 * `RegistrarEntregaEscopoUseCase` no backend, que devolve 422 enquanto a
 * banca do escopo não estiver aprovada.
 */
function TabelaEscopos() {
  const { projeto, recarregar } = useProjeto();
  const { usuario, token } = useAuth();
  /** o escopo cujo atraso está sendo justificado. */
  const [justificando, setJustificando] = useState<{
    escopoId: number;
    nome: string;
    dias: number;
  } | null>(null);
  /**
   * Quem escreve o porquê do atraso: coordenação, gerência e diretoria.
   *
   * Espelha o `require_lideranca` da rota, consultor vê o atraso mas não
   * responde por ele. O front só ESCONDE; quem decide é o backend.
   */
  const podeJustificar = !!usuario && usuario.posicao !== "consultor";
  // marcar kickoff e data de entrega é dos QUATRO perfis, a
  // responsabilidade é do coordenador, mas o acesso não é exclusivo dele.
  // (O backend usa só `exigir_acesso_ao_projeto` aqui; o front não pode ser
  // mais restrito que ele, ou esconde um botão que a pessoa tem direito de ver.)
  const podeConduzir = !!usuario?.permissoes.pode_marcar_kickoff;

  // A única escrita daqui é a JUSTIFICATIVA DO ATRASO, e ela é
  // exceção pelo mesmo motivo que o resto não é: datas de escopo, banca e
  // entrega, se agendam no Cronograma, onde dá para ver o dia contra a janela
  // e o calendário do Insper. Já o "por que estourou" não é data nenhuma; é a
  // resposta ao número que ESTA tabela mostra, e mandar a pessoa para outra
  // tela para escrevê-la é o que fazia ninguém escrever.

  return (
    <PageCard>
      <PageCardHeader>
        <PageCardTitle>Escopos vendidos</PageCardTitle>
      </PageCardHeader>
      <PageCardContent>
        {projeto.escopos.length === 0 ? (
          <EmptyText>Nenhum escopo cadastrado neste projeto.</EmptyText>
        ) : (
          <>
            <DataTable>
              <TableHead>
                <TableRow>
                  <TableHeadCell>Escopo</TableHeadCell>
                  <TableHeadCell>Status</TableHeadCell>
                  <TableHeadCell>Dias usados</TableHeadCell>
                  {/* Atraso é o  (dias úteis além da janela) e Correções é o
                       (dias pintados depois da banca). O número da seção
                      fica aqui, no comentário: texto que o usuário lê não cita
                      parágrafo de documento interno. */}
                  <TableHeadCell title="Dias úteis além da janela">Atraso</TableHeadCell>
                  <TableHeadCell title="Dias úteis pintados depois da entrega">
                    Correções
                  </TableHeadCell>
                  <TableHeadCell>Banca</TableHeadCell>
                  <TableHeadCell>Entrega</TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {projeto.escopos.map((escopo) => {
                  // A barra mede contra a JANELA (vendidos + ajustados):
                  // quem ganhou 10 dias tem 10 dias a mais para gastar, senão a
                  // autorização não teria efeito nenhum na tela.
                  const janela = escopo.dias_uteis_vendidos + escopo.dias_uteis_ajustados;
                  const percentual = janela > 0 ? (escopo.consumidos / janela) * 100 : 0;
                  const banca = escopo.banca;
                  return (
                    <TableRow key={escopo.id}>
                      <TableCell>
                        <EscopoNome>
                          <strong>{escopo.nome}</strong>
                          {escopo.data_inicio && (
                            <small>desde {formatarData(escopo.data_inicio)}</small>
                          )}
                        </EscopoNome>
                      </TableCell>

                      <TableCell>
                        <PageBadge
                          $tone={
                            escopo.status === "entregue"
                              ? "success"
                              : escopo.status === "em_andamento"
                                ? "default"
                                : "muted"
                          }
                        >
                          {ROTULO_STATUS_ESCOPO[escopo.status]}
                        </PageBadge>
                      </TableCell>

                      <TableCell>
                        <ProgressoWrap>
                          <ProgressoTrilha>
                            <ProgressoBarra
                              $percentual={percentual}
                              $estourou={escopo.estourou}
                            />
                          </ProgressoTrilha>
                          <ProgressoTexto $estourou={escopo.estourou}>
                            {escopo.consumidos}/{janela}
                            {escopo.estourou && ` (+${Math.abs(escopo.restantes)})`}
                          </ProgressoTexto>
                          {/* Vendidos e ajustados NUNCA aparecem somados num
                              número só: a diferença entre ter vendido 30 e ter
                              vendido 20 e precisado de mais 10 é a informação
                              inteira. A barra usa a soma; o texto, a separação. */}
                          <small>
                            {escopo.dias_uteis_vendidos} vendidos
                            {escopo.dias_uteis_ajustados > 0 &&
                              ` · ${escopo.dias_uteis_ajustados} ajustados`}
                          </small>
                        </ProgressoWrap>
                      </TableCell>

                      <TableCell>
                        {escopo.atraso > 0 ? (
                          <AtrasoCelula>
                            <PageBadge $tone="danger">
                              {escopo.atraso} {escopo.atraso === 1 ? "dia" : "dias"}
                            </PageBadge>
                            {/* o número diz QUANTO; só a nota diz POR
                                QUÊ, e é ela que a diretoria lê no Monitoramento.
                                Pedir aqui é pedir a quem está conduzindo o
                                escopo, enquanto o motivo ainda está fresco. */}
                            {escopo.justificativa_atraso ? (
                              <JustificativaAtraso
                                title={`${escopo.justificativa_atraso.registrado_por ?? "alguém"} em ${formatarData(escopo.justificativa_atraso.registrado_em)}`}
                              >
                                {escopo.justificativa_atraso.texto}
                              </JustificativaAtraso>
                            ) : podeJustificar ? (
                              <PageButtonSm
                                type="button"
                                $variant="outline"
                                onClick={() =>
                                  setJustificando({
                                    escopoId: escopo.id,
                                    nome: escopo.nome,
                                    dias: escopo.atraso,
                                  })
                                }
                              >
                                Justificar atraso
                              </PageButtonSm>
                            ) : (
                              // Consultor vê o atraso, mas não escreve a nota
                              // (o backend cobra `require_lideranca`).
                              <EmptyText>Sem justificativa</EmptyText>
                            )}
                          </AtrasoCelula>
                        ) : (
                          <EmptyText>—</EmptyText>
                        )}
                      </TableCell>

                      <TableCell>
                        {escopo.correcoes > 0 ? (
                          <PageBadge $tone="muted">
                            {escopo.correcoes} {escopo.correcoes === 1 ? "dia" : "dias"}
                          </PageBadge>
                        ) : (
                          <EmptyText>—</EmptyText>
                        )}
                      </TableCell>

                      <TableCell>
                        {banca ? (
                          <PageBadge $tone={tomDoStatusBanca(banca.status)}>
                            {banca.data_hora ? formatarDataHoraBanca(banca.data_hora) : "—"} ·{" "}
                            {ROTULO_STATUS_BANCA[banca.status]}
                          </PageBadge>
                        ) : (
                          <EmptyText>—</EmptyText>
                        )}
                      </TableCell>

                      <TableCell>
                        {escopo.data_entrega_real ? (
                          formatarData(escopo.data_entrega_real)
                        ) : escopo.entrega_liberada ? (
                          podeConduzir ? (
                            /* Leva para o calendário em vez de gravar HOJE
                               em silêncio: a entrega quase nunca é no dia em
                               que alguém lembra de registrá-la, e a data certa
                               é escolhida onde ela é vista, no Cronograma. */
                            <PageButtonSm
                              as={Link}
                              to={`/projetos/${projeto.id}/cronograma`}
                              $variant="outline"
                            >
                              Marcar no Cronograma
                            </PageButtonSm>
                          ) : (
                            <EmptyText>liberada</EmptyText>
                          )
                        ) : (
                          <Cadeado title="A entrega só é liberada depois da banca do escopo ser aprovada">
                            <Lock size={12} />
                            travada
                          </Cadeado>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </DataTable>

            <LegendaTabela>
              A entrega fica travada até a banca do escopo ser realizada. Os dias correm da
              reunião inicial até a <strong>banca ser realizada</strong>, feriados, provas e
              recessos do calendário do Insper não contam, e o que se faz depois da banca é{" "}
              <strong>correção</strong>, que tem coluna própria e não consome dias vendidos.
              <br />▶ Por isso <em>Dias usados</em> e <em>Atraso</em> falam do mesmo estouro: se a
              barra passa do vendido, a diferença é exatamente o atraso.
              <br />▶ Um escopo começa a contar na <strong>reunião inicial</strong> dele: marque-a
              no <strong>Cronograma</strong>, escolhendo o escopo e clicando no dia. A banca não
              precisa estar marcada antes, é ela que precisa caber na janela que a reunião abre.
            </LegendaTabela>
          </>
        )}
      </PageCardContent>

      {justificando && token && (
        <JustificarAtrasoEscopoModal
          escopoId={justificando.escopoId}
          nome={justificando.nome}
          dias={justificando.dias}
          projetoId={projeto.id}
          token={token}
          onFechar={() => setJustificando(null)}
          onSalvo={async () => {
            setJustificando(null);
            // Recarrega o projeto: a nota volta no escopo e a célula troca o
            // botão pelo texto, sem a pessoa precisar dar F5 para acreditar.
            await recarregar();
          }}
        />
      )}
    </PageCard>
  );
}

/**
 * /por que este escopo passou da janela.
 *
 * Escreve na MESMA tabela que a nota da diretoria (`projeto_justificativa_atraso`),
 * com `motivo_tipo: "escopo"`, o que a faz aparecer no Histórico do projeto
 * e na aba Atrasos do Monitoramento sem nenhuma fiação nova.
 *
 * Não é um campo editável: cada envio cria uma nota nova, e a anterior
 * continua no Histórico. É registro, não formulário, foi assim que o 
 * definiu, e apagar o que se disse antes tiraria justamente a leitura de como
 * a explicação mudou ao longo do atraso.
 */
function JustificarAtrasoEscopoModal({
  escopoId,
  nome,
  dias,
  projetoId,
  token,
  onFechar,
  onSalvo,
}: {
  escopoId: number;
  nome: string;
  dias: number;
  projetoId: number;
  token: string;
  onFechar: () => void;
  onSalvo: () => void | Promise<void>;
}) {
  const [texto, setTexto] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function salvar() {
    setErro("");
    setSalvando(true);
    try {
      await registrarJustificativaAtraso(projetoId, texto.trim(), token, escopoId, "escopo");
      await onSalvo();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível salvar a justificativa");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <ModalOverlay onClick={onFechar} role="presentation">
      <WideModalContent
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="justificar-atraso-titulo"
      >
        <ModalHeader>
          <ModalTitle id="justificar-atraso-titulo">Justificar o atraso</ModalTitle>
          <ModalClose type="button" aria-label="Fechar" onClick={onFechar}>
            <X size={18} />
          </ModalClose>
        </ModalHeader>
        <ModalBody>
          <p>
            <strong>{nome}</strong> passou <strong>{dias} {dias === 1 ? "dia útil" : "dias úteis"}</strong>{" "}
            além da janela vendida. Explique o motivo, a nota fica no Histórico do
            projeto e a diretoria a lê no Monitoramento.
          </p>
          <FieldTextarea
            rows={4}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Ex.: o cliente atrasou o envio dos documentos e a equipe ficou parada duas semanas."
          />
          {erro && <FormErrorText>{erro}</FormErrorText>}
        </ModalBody>
        <ModalFooter>
          <PageButton type="button" $variant="ghost" onClick={onFechar}>
            Cancelar
          </PageButton>
          <PageButton type="button" disabled={salvando || !texto.trim()} onClick={salvar}>
            {salvando ? "Salvando..." : "Salvar"}
          </PageButton>
        </ModalFooter>
      </WideModalContent>
    </ModalOverlay>
  );
}

/* ------------------------------------------------------------------ */

/**
 * As bancas do projeto, uma seção por frente.
 *
 * "Cada escopo tem a sua própria banca" e cada escopo pertence a uma
 * frente, então um projeto sinérgico de Business + Direito tem a banca de
 * Análise Mercadológica **em Business** e a de Revisão Contratual **em
 * Direito**, com composições e pisos diferentes. A tabela de escopos mostra
 * a banca como uma coluna no meio de dias e entrega; aqui o recorte é o que
 * a coordenação usa para se organizar: o que cada frente tem pela frente.
 *
 * Frente que o projeto contempla mas ainda não tem escopo aparece assim
 * mesmo, vazia, é informação, não erro: alguém vendeu a frente e ainda não
 * cadastrou o escopo dela.
 */
function BancasPorFrente() {
  const { projeto, frentes } = useProjeto();
  const { usuario } = useAuth();

  const nomeFrente = (id: number) => frentes.find((f) => f.id === id)?.nome ?? `Frente ${id}`;

  // marcar/remarcar banca é de liderança, o backend usa
  // `require_lideranca` e cobra justificativa da diretoria na remarcação.
  const podeMarcar = !!usuario?.permissoes.pode_definir_cronograma;

  // A ordem é a das frentes do projeto; escopo de uma frente que saiu do
  // projeto ainda aparece, senão a banca dele sumiria da tela sem aviso.
  const idsDeEscopo = [...new Set(projeto.escopos.map((e) => e.frente_id))];
  const frenteIds = [
    ...projeto.frente_ids,
    ...idsDeEscopo.filter((id) => !projeto.frente_ids.includes(id)),
  ];

  return (
    <PageCard>
      <PageCardHeader>
        <PageCardTitle>Bancas por escopo</PageCardTitle>
      </PageCardHeader>
      <PageCardContent>
        {frenteIds.length === 0 ? (
          <EmptyText>Este projeto não tem frentes cadastradas.</EmptyText>
        ) : (
          frenteIds.map((frenteId) => {
            const escoposDaFrente = projeto.escopos.filter((e) => e.frente_id === frenteId);
            const marcadas = escoposDaFrente.filter((e) => e.banca).length;
            return (
              <FrenteBloco key={frenteId}>
                <FrenteCabecalho>
                  <h3>{nomeFrente(frenteId)}</h3>
                  <small>
                    {escoposDaFrente.length === 0
                      ? "sem escopo cadastrado"
                      : `${marcadas} de ${escoposDaFrente.length} ${
                          escoposDaFrente.length === 1 ? "banca marcada" : "bancas marcadas"
                        }`}
                  </small>
                </FrenteCabecalho>

                {escoposDaFrente.length === 0 ? (
                  <EmptyText>
                    A frente foi vendida, mas ainda não há escopo cadastrado nela, e é o escopo que
                    tem banca.
                  </EmptyText>
                ) : (
                  escoposDaFrente.map((escopo) => (
                    <BancaLinha key={escopo.id}>
                      <BancaEscopo>
                        {escopo.nome}
                        {/* Sem esta linha, a mesma data repetida em dois
                            escopos pareceria cadastro duplicado, e não é:
                            é uma banca só avaliando os dois. */}
                        {escopo.banca && escopo.banca.escopo_ids.length > 1 && (
                          <small>
                            mesma banca de{" "}
                            {projeto.escopos
                              .filter(
                                (e) =>
                                  e.id !== escopo.id && escopo.banca!.escopo_ids.includes(e.id),
                              )
                              .map((e) => e.nome)
                              .join(", ")}
                          </small>
                        )}
                      </BancaEscopo>
                      {escopo.banca ? (
                        <>
                          <BancaData>
                            {escopo.banca.data_hora
                              ? formatarDataHora(escopo.banca.data_hora)
                              : "sem data"}
                          </BancaData>
                          <PageBadge $tone={tomDoStatusBanca(escopo.banca.status)}>
                            {ROTULO_STATUS_BANCA[escopo.banca.status]}
                          </PageBadge>
                        </>
                      ) : (
                        <PageBadge $tone="muted">não marcada</PageBadge>
                      )}
                      {podeMarcar && (
                        /* A data da banca é agendada no Cronograma, onde dá
                           para ver se ela cai dentro da janela do escopo —
                           que é a regra que a governa. */
                        <PageButtonSm
                          as={Link}
                          to={`/projetos/${projeto.id}/cronograma`}
                          $variant="outline"
                        >
                          {escopo.banca ? "Remarcar no Cronograma" : "Marcar no Cronograma"}
                        </PageButtonSm>
                      )}
                    </BancaLinha>
                  ))
                )}
              </FrenteBloco>
            );
          })
        )}

        <LegendaTabela>
          Cada escopo tem no máximo uma banca, mas uma banca pode avaliar vários escopos do
          projeto, quem marca escolhe quais, no <strong>Cronograma</strong>. A banca herda as
          frentes dos escopos que cobre, e são elas que definem a composição exigida e quem pode ser
          escalado. A data é a mesma que aparece em Bancas e no cronograma: um registro só, lido de
          três lugares.
        </LegendaTabela>
      </PageCardContent>
    </PageCard>
  );
}

/* ------------------------------------------------------------------ */

/* O MarcarBancaModal que morava aqui virou `./MarcarBancaModal.tsx`, usado
   pelo Cronograma: a banca passou a ser marcada clicando no dia, onde dá para
   ver se ela cai dentro da janela do escopo. Esta tela só a exibe. */

/* ------------------------------------------------------------------ */

/**
 * O kickoff, editável aqui **e** marcável no calendário.
 *
 * A exceção às outras datas do projeto: sem janela para respeitar, sem
 * justificativa, sem gate de diretoria. Digitar direto é o caminho curto de
 * quem só quer corrigir um dia; o calendário continua sendo o caminho de quem
 * está montando o cronograma e quer ver a ambientação nascer dali.
 */
function DataEditavelKickoff({
  projeto,
  token,
  recarregar,
}: {
  projeto: ProjetoCompleto;
  token: string | null;
  recarregar: () => Promise<void>;
}) {
  const { usuario } = useAuth();
  // Mesma permissão do backend (`require_pode_marcar_kickoff` em
  // `routers/projetos.py`), sem esse gate o botão aparecia pra qualquer um,
  // que só descobria que não podia depois de preencher e salvar (403).
  const podeEditar = !!usuario?.permissoes.pode_marcar_kickoff;
  const [editando, setEditando] = useState(false);
  const [data, setData] = useState(projeto.data_kickoff?.slice(0, 10) ?? "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function salvar() {
    if (!token || !data) return;
    setSalvando(true);
    setErro("");
    try {
      await marcarKickoff(projeto.id, data, token);
      setEditando(false);
      await recarregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar a data");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <DataItem>
      <DataItemLabel>Kickoff</DataItemLabel>
      <DataItemValor>
        {editando ? (
          <>
            <FieldInput
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              aria-label="Kickoff"
            />
            <PageButtonSm type="button" disabled={salvando || !data} onClick={salvar}>
              {salvando ? "Salvando…" : "Salvar"}
            </PageButtonSm>
            <PageButtonSm
              type="button"
              $variant="ghost"
              onClick={() => {
                setEditando(false);
                setData(projeto.data_kickoff?.slice(0, 10) ?? "");
                setErro("");
              }}
            >
              Cancelar
            </PageButtonSm>
          </>
        ) : (
          <>
            <span>{formatarData(projeto.data_kickoff)}</span>
            {podeEditar && (
              <PageButtonSm type="button" $variant="ghost" onClick={() => setEditando(true)}>
                {projeto.data_kickoff ? "Alterar" : "Marcar"}
              </PageButtonSm>
            )}
          </>
        )}
      </DataItemValor>
      {!editando && (
        <DataItemNota>
          Ou marque no calendário, em <strong>Kickoff</strong>, na aba Cronograma. É dele que a
          ambientação conta.
        </DataItemNota>
      )}
      {erro && <FormErrorText>{erro}</FormErrorText>}
    </DataItem>
  );
}

/* ------------------------------------------------------------------ */

function DataEditavelDiasAmbientacao({
  projeto,
  token,
  recarregar,
}: {
  projeto: ProjetoCompleto;
  token: string | null;
  recarregar: () => Promise<void>;
}) {
  const { usuario } = useAuth();
  const podeEditar = !!usuario?.permissoes.pode_editar_equipe;
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(String(projeto.dias_ambientacao));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function salvar() {
    if (!token) return;
    const numero = Number(valor);
    if (!Number.isInteger(numero) || numero < 0 || numero > 60) {
      setErro("Informe um número de dias úteis entre 0 e 60.");
      return;
    }
    setSalvando(true);
    setErro("");
    try {
      await updateDiasAmbientacao(projeto.id, numero, token);
      setEditando(false);
      await recarregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar os dias de ambientação");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <DataItem>
      <DataItemLabel>Dias de ambientação</DataItemLabel>
      <DataItemValor>
        {editando ? (
          <>
            <FieldInput
              type="number"
              min={0}
              max={60}
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              aria-label="Dias de ambientação"
            />
            <PageButtonSm type="button" disabled={salvando} onClick={salvar}>
              {salvando ? "Salvando…" : "Salvar"}
            </PageButtonSm>
            <PageButtonSm
              type="button"
              $variant="ghost"
              onClick={() => {
                setEditando(false);
                setValor(String(projeto.dias_ambientacao));
                setErro("");
              }}
            >
              Cancelar
            </PageButtonSm>
          </>
        ) : (
          <>
            <span>{projeto.dias_ambientacao} dias úteis</span>
            {podeEditar && (
              <PageButtonSm type="button" $variant="ghost" onClick={() => setEditando(true)}>
                Alterar
              </PageButtonSm>
            )}
          </>
        )}
      </DataItemValor>
      {/* A única etapa do ciclo que sai sozinha: ela tem data de
          fim calculável, as outras dependem de alguém decidir. A data vem
          pronta do backend, o front não conta dia útil. */}
      {projeto.status === "ambientacao" && projeto.fim_ambientacao && (
        <EmptyText>
          até {formatarData(projeto.fim_ambientacao)}, depois disso o projeto passa para{" "}
          <strong>Em andamento</strong> automaticamente.
        </EmptyText>
      )}
      {erro && <FormErrorText>{erro}</FormErrorText>}
    </DataItem>
  );
}

/* ------------------------------------------------------------------ */

function DataEditavelDiaReuniao({
  projeto,
  token,
  recarregar,
}: {
  projeto: ProjetoCompleto;
  token: string | null;
  recarregar: () => Promise<void>;
}) {
  const { usuario } = useAuth();
  const podeEditar = !!usuario?.permissoes.pode_editar_equipe;
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(
    projeto.dia_reuniao_padrao ? String(projeto.dia_reuniao_padrao) : "",
  );
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function salvar() {
    if (!token) return;
    setSalvando(true);
    setErro("");
    try {
      await updateDiaReuniaoPadrao(projeto.id, valor ? Number(valor) : null, token);
      setEditando(false);
      await recarregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar o dia da reunião");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <DataItem>
      <DataItemLabel>Reunião semanal</DataItemLabel>
      <DataItemValor>
        {editando ? (
          <>
            <FieldSelect
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              aria-label="Dia padrão da reunião semanal"
            >
              <option value="">Sem dia definido</option>
              {DIAS_REUNIAO.map((dia) => (
                <option key={dia.valor} value={dia.valor}>
                  {dia.rotulo}
                </option>
              ))}
            </FieldSelect>
            <PageButtonSm type="button" disabled={salvando} onClick={salvar}>
              {salvando ? "Salvando…" : "Salvar"}
            </PageButtonSm>
            <PageButtonSm
              type="button"
              $variant="ghost"
              onClick={() => {
                setEditando(false);
                setValor(projeto.dia_reuniao_padrao ? String(projeto.dia_reuniao_padrao) : "");
                setErro("");
              }}
            >
              Cancelar
            </PageButtonSm>
          </>
        ) : (
          <>
            <span>{rotuloDiaSemana(projeto.dia_reuniao_padrao)}</span>
            {podeEditar && (
              <PageButtonSm type="button" $variant="ghost" onClick={() => setEditando(true)}>
                {projeto.dia_reuniao_padrao ? "Alterar" : "Definir"}
              </PageButtonSm>
            )}
          </>
        )}
      </DataItemValor>
      {erro && <FormErrorText>{erro}</FormErrorText>}
    </DataItem>
  );
}

/* ------------------------------------------------------------------ */

function EditarEquipeModal({
  projeto,
  usuarios,
  frentes,
  token,
  onClose,
  onSalvo,
}: {
  projeto: ProjetoCompleto;
  usuarios: UsuarioResumo[];
  frentes: Frente[];
  token: string;
  onClose: () => void;
  onSalvo: () => Promise<void>;
}) {
  const [equipe, setEquipe] = useState<EquipeSelecionada>({
    coordenadorId: projeto.coordenador_id,
    consultorIds: projeto.consultor_ids,
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [usuariosFrentes, setUsuariosFrentes] = useState<UsuarioFrente[]>([]);

  useEffect(() => {
    getUsuariosFrentes(token).then(setUsuariosFrentes);
  }, [token]);

  const ativos = usuarios
    .filter((u) => u.ativo)
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    const problema = validarEquipe(equipe);
    if (problema) {
      setErro(problema);
      return;
    }
    setSalvando(true);
    setErro("");
    try {
      await updateEquipe(projeto.id, montarEquipePayload(equipe), token);
      await onSalvo();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar a equipe");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <ModalOverlay onClick={onClose} role="presentation">
      <WideModalContent onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="equipe-titulo">
        <ModalHeader>
          <ModalTitle id="equipe-titulo">Editar equipe</ModalTitle>
          <ModalClose type="button" aria-label="Fechar" onClick={onClose}>
            <X size={18} />
          </ModalClose>
        </ModalHeader>
        <form onSubmit={handleSalvar}>
          <ModalBody>
            <MemberPicker
              usuarios={ativos}
              valor={equipe}
              onChange={setEquipe}
              desabilitado={salvando}
              usuariosFrentes={usuariosFrentes}
              frentes={frentes}
              frenteIdsProjeto={projeto.frente_ids}
            />

            {/* Mesma leitura de quando o projeto nasceu: trocar alguém pode
                fechar a única janela em que o time se reunia. */}
            <CompatibilidadeHorarios consultorIds={equipe.consultorIds} usuarios={ativos} />

            {erro && <FormErrorText>{erro}</FormErrorText>}
          </ModalBody>
          <ModalFooter>
            <PageButton type="button" $variant="outline" onClick={onClose}>
              Cancelar
            </PageButton>
            <PageButton type="submit" disabled={salvando}>
              {salvando ? "Salvando…" : "Salvar equipe"}
            </PageButton>
          </ModalFooter>
        </form>
      </WideModalContent>
    </ModalOverlay>
  );
}
