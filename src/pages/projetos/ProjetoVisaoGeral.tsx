import { useState } from "react";
import { Download, ExternalLink, Lock, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ROTULO_STATUS_BANCA, tomDoStatusBanca } from "@/lib/bancas";
import {
  baixarAnexoProposta,
  formatarData,
  formatarDataHora,
  marcarBancaDoEscopo,
  marcarEntregaCliente,
  marcarEntregaEscopo,
  marcarKickoff,
  ROTULO_STATUS_ESCOPO,
  rotuloDiaSemana,
  updateEquipe,
} from "@/lib/projetos";
import {
  MemberPicker,
  montarEquipePayload,
  validarEquipe,
  type EquipeSelecionada,
} from "@/components/membros/MemberPicker";
import type { UsuarioResumo } from "@/types/auth";
import type { EscopoVendido, ProjetoCompleto } from "@/types/projeto";
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
  DataRow,
  DataLabel,
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
  LegendaTabela,
  FrenteBloco,
  FrenteCabecalho,
  BancaLinha,
  BancaEscopo,
  BancaData,
  EscopoPicker,
  EscopoOpcao,
} from "./Projetos.styled";
import { useProjeto } from "./ProjetoPage";

export function ProjetoVisaoGeral() {
  const { projeto, usuarios, recarregar } = useProjeto();
  const { usuario, token } = useAuth();
  const [editandoEquipe, setEditandoEquipe] = useState(false);
  const [baixandoAnexo, setBaixandoAnexo] = useState(false);
  const [erroAnexo, setErroAnexo] = useState("");

  const nomeUsuario = (id: number) => usuarios.find((u) => u.id === id)?.nome ?? `Usuário ${id}`;
  const podeEditarEquipe = !!usuario?.cargo.pode_editar_equipe;

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
          </PageCardHeader>
          <PageCardContent>
            {projeto.descricao ? (
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
          <DataRow>
            <DataLabel>Criado em</DataLabel>
            <span>{formatarDataHora(projeto.criado_em)}</span>
          </DataRow>
          <DataEditavel
            rotulo="Kickoff"
            valor={projeto.data_kickoff}
            projeto={projeto}
            token={token}
            recarregar={recarregar}
            tipo="kickoff"
          />
          <DataEditavel
            rotulo="Entrega ao cliente"
            valor={projeto.data_entrega_cliente}
            projeto={projeto}
            token={token}
            recarregar={recarregar}
            tipo="entrega"
          />
          <DataRow>
            <DataLabel>Dias de ambientação</DataLabel>
            <span>{projeto.dias_ambientacao} dias úteis</span>
          </DataRow>
          <DataRow>
            <DataLabel>Reunião semanal</DataLabel>
            <span>{rotuloDiaSemana(projeto.dia_reuniao_padrao)}</span>
          </DataRow>
        </PageCardContent>
      </PageCard>

      <TabelaEscopos />

      {/* §5.5: uma banca por escopo, e o escopo é de uma frente — daí o
          recorte por frente, que é como a coordenação se organiza. */}
      <BancasPorFrente />

      {/* Pausa para pensar: a contagem é do backend (`utils/contagem_dias.py`).
          O front nunca recalcula dia útil — só desenha o que recebe. */}

      {editandoEquipe && token && (
        <EditarEquipeModal
          projeto={projeto}
          usuarios={usuarios}
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
 * A tabela do §6.4: escopo · status · dias usados · banca · entrega.
 *
 * 🔒 O cadeado na entrega é conveniência de UI — quem barra de verdade é
 * `RegistrarEntregaEscopoUseCase` no backend, que devolve 422 enquanto a
 * banca do escopo não estiver aprovada.
 */
function TabelaEscopos() {
  const { projeto, recarregar } = useProjeto();
  const { usuario, token } = useAuth();
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState<number | null>(null);

  // §6.4: marcar kickoff e data de entrega é dos QUATRO perfis — a
  // responsabilidade é do coordenador, mas o acesso não é exclusivo dele.
  // (O backend usa só `exigir_acesso_ao_projeto` aqui; o front não pode ser
  // mais restrito que ele, ou esconde um botão que a pessoa tem direito de ver.)
  const podeConduzir = !!usuario?.cargo.pode_marcar_kickoff;

  async function agir(escopoId: number, acao: () => Promise<unknown>) {
    if (!token) return;
    setOcupado(escopoId);
    setErro("");
    try {
      await acao();
      await recarregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao atualizar o escopo");
    } finally {
      setOcupado(null);
    }
  }

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
                  <TableHeadCell>Banca</TableHeadCell>
                  <TableHeadCell>Entrega</TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {projeto.escopos.map((escopo) => {
                  const percentual =
                    escopo.dias_uteis_vendidos > 0
                      ? (escopo.consumidos / escopo.dias_uteis_vendidos) * 100
                      : 0;
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
                            {escopo.consumidos}/{escopo.dias_uteis_vendidos}
                            {escopo.estourou && ` (+${Math.abs(escopo.restantes)})`}
                          </ProgressoTexto>
                        </ProgressoWrap>
                      </TableCell>

                      <TableCell>
                        {banca ? (
                          <PageBadge $tone={tomDoStatusBanca(banca.status)}>
                            {banca.data_hora ? formatarData(banca.data_hora) : "—"} ·{" "}
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
                            <PageButtonSm
                              type="button"
                              $variant="outline"
                              disabled={ocupado === escopo.id}
                              onClick={() =>
                                agir(escopo.id, () =>
                                  marcarEntregaEscopo(
                                    escopo.id,
                                    new Date().toISOString().slice(0, 10),
                                    token!,
                                  ),
                                )
                              }
                            >
                              Marcar entrega
                            </PageButtonSm>
                          ) : (
                            <EmptyText>liberada</EmptyText>
                          )
                        ) : (
                          <Cadeado title="A entrega só é liberada depois da banca do escopo ser aprovada (§5.5)">
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
              🔒 A entrega fica travada até a banca do escopo ser aprovada. Os dias correm apenas
              enquanto o escopo está iniciado e não entregue — feriados, provas e recessos do
              calendário do Insper não contam.
            </LegendaTabela>
            {erro && <FormErrorText>{erro}</FormErrorText>}
          </>
        )}
      </PageCardContent>
    </PageCard>
  );
}

/* ------------------------------------------------------------------ */

/**
 * As bancas do projeto, uma seção por frente (§5.5 + §8).
 *
 * "Cada escopo tem a sua própria banca" (§5.5) e cada escopo pertence a uma
 * frente — então um projeto sinérgico de Business + Direito tem a banca de
 * Análise Mercadológica **em Business** e a de Revisão Contratual **em
 * Direito**, com composições e pisos diferentes. A tabela de escopos mostra
 * a banca como uma coluna no meio de dias e entrega; aqui o recorte é o que
 * a coordenação usa para se organizar: o que cada frente tem pela frente.
 *
 * Frente que o projeto contempla mas ainda não tem escopo aparece assim
 * mesmo, vazia — é informação, não erro: alguém vendeu a frente e ainda não
 * cadastrou o escopo dela.
 */
function BancasPorFrente() {
  const { projeto, frentes, recarregar } = useProjeto();
  const { usuario, token } = useAuth();
  const [marcando, setMarcando] = useState<EscopoVendido | null>(null);

  const nomeFrente = (id: number) => frentes.find((f) => f.id === id)?.nome ?? `Frente ${id}`;

  // §5.6: marcar/remarcar banca é de liderança — o backend usa
  // `require_lideranca` e cobra justificativa da diretoria na remarcação.
  const podeMarcar = !!usuario?.cargo.pode_definir_cronograma;

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
                    A frente foi vendida, mas ainda não há escopo cadastrado nela — e é o escopo que
                    tem banca.
                  </EmptyText>
                ) : (
                  escoposDaFrente.map((escopo) => (
                    <BancaLinha key={escopo.id}>
                      <BancaEscopo>
                        {escopo.nome}
                        {/* Sem esta linha, a mesma data repetida em dois
                            escopos pareceria cadastro duplicado — e não é:
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
                        <PageButtonSm
                          type="button"
                          $variant="outline"
                          onClick={() => setMarcando(escopo)}
                        >
                          {escopo.banca ? "Remarcar" : "Marcar banca"}
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
          Cada escopo tem no máximo uma banca (§5.5), mas uma banca pode avaliar vários escopos do
          projeto — quem marca escolhe quais. A banca herda as frentes dos escopos que cobre, e são
          elas que definem a composição exigida e quem pode ser escalado. A data é a mesma que
          aparece em Bancas e no cronograma: um registro só, lido de três lugares.
        </LegendaTabela>
      </PageCardContent>

      {marcando && token && (
        <MarcarBancaModal
          escopo={marcando}
          escoposDoProjeto={projeto.escopos}
          nomeFrente={nomeFrente}
          ehDiretor={usuario?.posicao === "diretor"}
          token={token}
          onClose={() => setMarcando(null)}
          onSalvo={async () => {
            setMarcando(null);
            await recarregar();
          }}
        />
      )}
    </PageCard>
  );
}

/**
 * Marcar ou remarcar a banca de um escopo — e escolher que outros escopos do
 * projeto entram nela.
 *
 * 🔒 Remarcar exige justificativa e é só da diretoria (§5.6) — o backend
 * recusa com 422 e a mensagem aparece aqui. O campo só é pedido quando já
 * existe data, que é quando a regra vale.
 *
 * Escopo que já tem banca própria aparece bloqueado: juntá-lo aqui apagaria
 * em silêncio a data marcada nele. Para juntar os dois é preciso desmarcar a
 * banca do outro antes — o backend recusa do mesmo jeito, a lista só antecipa
 * a recusa.
 */
function MarcarBancaModal({
  escopo,
  escoposDoProjeto,
  nomeFrente,
  ehDiretor,
  token,
  onClose,
  onSalvo,
}: {
  escopo: EscopoVendido;
  escoposDoProjeto: EscopoVendido[];
  nomeFrente: (id: number) => string;
  ehDiretor: boolean;
  token: string;
  onClose: () => void;
  onSalvo: () => void;
}) {
  const remarcacao = Boolean(escopo.banca?.data_hora);
  const [dataHora, setDataHora] = useState(escopo.banca?.data_hora?.slice(0, 16) ?? "");
  const [justificativa, setJustificativa] = useState("");
  const [selecionados, setSelecionados] = useState<number[]>(
    escopo.banca?.escopo_ids ?? [escopo.id],
  );
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  // Cancelado não tem por que entrar em banca; o resto do projeto é elegível.
  const candidatos = escoposDoProjeto.filter(
    (e) => e.id === escopo.id || e.status !== "cancelado",
  );
  // A banca deste escopo é a "nossa": os escopos que ela já cobre continuam
  // marcáveis; os presos a OUTRA banca, não.
  const bloqueado = (e: EscopoVendido) =>
    e.id !== escopo.id && Boolean(e.banca) && e.banca!.id !== escopo.banca?.id;

  const frentesEnvolvidas = [
    ...new Set(
      candidatos.filter((e) => selecionados.includes(e.id)).map((e) => e.frente_id),
    ),
  ];

  function alternar(id: number) {
    setSelecionados((atuais) =>
      atuais.includes(id) ? atuais.filter((x) => x !== id) : [...atuais, id],
    );
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro("");
    try {
      await marcarBancaDoEscopo(
        escopo.id,
        dataHora,
        token,
        justificativa.trim() || undefined,
        [...new Set([escopo.id, ...selecionados])],
      );
      onSalvo();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao marcar a banca");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <ModalOverlay onClick={onClose} role="presentation">
      <WideModalContent
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="marcar-banca"
      >
        <ModalHeader>
          <ModalTitle id="marcar-banca">
            {remarcacao ? "Remarcar banca" : "Marcar banca"} · {escopo.nome}
          </ModalTitle>
          <ModalClose type="button" aria-label="Fechar" onClick={onClose}>
            <X size={18} />
          </ModalClose>
        </ModalHeader>
        <form onSubmit={salvar}>
          <ModalBody>
            <DataRow>
              <DataLabel>Escopos nesta banca</DataLabel>
              <EscopoPicker>
                {candidatos.map((e) => {
                  const travado = bloqueado(e);
                  return (
                    <EscopoOpcao key={e.id} $bloqueado={travado}>
                      <input
                        type="checkbox"
                        checked={e.id === escopo.id || selecionados.includes(e.id)}
                        // O escopo de onde a banca está sendo marcada entra
                        // sempre — desmarcá-lo deixaria a ação sem sentido.
                        disabled={travado || e.id === escopo.id}
                        onChange={() => alternar(e.id)}
                      />
                      <span>{e.nome}</span>
                      <small>
                        {travado ? "já tem banca própria" : nomeFrente(e.frente_id)}
                      </small>
                    </EscopoOpcao>
                  );
                })}
              </EscopoPicker>
            </DataRow>
            {frentesEnvolvidas.length > 1 && (
              <EmptyText>
                Esta banca vai cobrir {frentesEnvolvidas.map(nomeFrente).join(" e ")} — a composição
                exigida passa a somar as duas frentes (§8).
              </EmptyText>
            )}
            <DataRow>
              <DataLabel>Data e hora</DataLabel>
              <FieldInput
                type="datetime-local"
                value={dataHora}
                onChange={(e) => setDataHora(e.target.value)}
                aria-label="Data e hora da banca"
                required
              />
            </DataRow>
            {remarcacao && (
              <>
                <DataRow>
                  <DataLabel>Justificativa</DataLabel>
                  <FieldInput
                    value={justificativa}
                    onChange={(e) => setJustificativa(e.target.value)}
                    placeholder="Por que a data mudou"
                    aria-label="Justificativa da remarcação"
                    required
                  />
                </DataRow>
                {!ehDiretor && (
                  <EmptyText>
                    Remarcar uma banca que já tem data é decisão da diretoria (§5.6) — o servidor vai
                    recusar.
                  </EmptyText>
                )}
              </>
            )}
            <EmptyText>
              O sistema recusa duas bancas no mesmo horário; só a diretoria libera a exceção (§8).
            </EmptyText>
            {erro && <FormErrorText>{erro}</FormErrorText>}
          </ModalBody>
          <ModalFooter>
            <PageButton type="button" $variant="outline" onClick={onClose}>
              Cancelar
            </PageButton>
            <PageButton type="submit" disabled={salvando || !dataHora}>
              {salvando ? "Salvando…" : remarcacao ? "Remarcar" : "Marcar"}
            </PageButton>
          </ModalFooter>
        </form>
      </WideModalContent>
    </ModalOverlay>
  );
}

/* ------------------------------------------------------------------ */

function DataEditavel({
  rotulo,
  valor,
  projeto,
  token,
  recarregar,
  tipo,
}: {
  rotulo: string;
  valor: string | null;
  projeto: ProjetoCompleto;
  token: string | null;
  recarregar: () => Promise<void>;
  tipo: "kickoff" | "entrega";
}) {
  const [editando, setEditando] = useState(false);
  const [data, setData] = useState(valor?.slice(0, 10) ?? "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function salvar() {
    if (!token || !data) return;
    setSalvando(true);
    setErro("");
    try {
      if (tipo === "kickoff") await marcarKickoff(projeto.id, data, token);
      else await marcarEntregaCliente(projeto.id, data, token);
      setEditando(false);
      await recarregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar a data");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <DataRow>
        <DataLabel>{rotulo}</DataLabel>
        {editando ? (
          <>
            <FieldInput
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              aria-label={rotulo}
            />
            <PageButtonSm type="button" disabled={salvando || !data} onClick={salvar}>
              {salvando ? "Salvando…" : "Salvar"}
            </PageButtonSm>
            <PageButtonSm
              type="button"
              $variant="ghost"
              onClick={() => {
                setEditando(false);
                setData(valor?.slice(0, 10) ?? "");
                setErro("");
              }}
            >
              Cancelar
            </PageButtonSm>
          </>
        ) : (
          <>
            <span>{formatarData(valor)}</span>
            <PageButtonSm type="button" $variant="ghost" onClick={() => setEditando(true)}>
              {valor ? "Alterar" : "Marcar"}
            </PageButtonSm>
          </>
        )}
      </DataRow>
      {erro && <FormErrorText>{erro}</FormErrorText>}
    </>
  );
}

/* ------------------------------------------------------------------ */

function EditarEquipeModal({
  projeto,
  usuarios,
  token,
  onClose,
  onSalvo,
}: {
  projeto: ProjetoCompleto;
  usuarios: UsuarioResumo[];
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
            />
            <EmptyText>
              Trocar alguém não apaga o passado: a linha antiga é fechada e uma nova é aberta, para o
              histórico de quem participou continuar de pé.
            </EmptyText>
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
