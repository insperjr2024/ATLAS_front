import { useState } from "react";
import { ExternalLink, Lock, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ROTULO_STATUS_BANCA, tomDoStatusBanca } from "@/lib/bancas";
import {
  formatarData,
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
import type { ProjetoCompleto } from "@/types/projeto";
import { pode } from "@/utils/permissoes";
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
} from "./Projetos.styled";
import { useProjeto } from "./ProjetoPage";

export function ProjetoVisaoGeral() {
  const { projeto, usuarios, recarregar } = useProjeto();
  const { usuario, token } = useAuth();
  const [editandoEquipe, setEditandoEquipe] = useState(false);

  const nomeUsuario = (id: number) => usuarios.find((u) => u.id === id)?.nome ?? `Usuário ${id}`;
  const podeEditarEquipe = pode(usuario, "editar_equipe");

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
          </PageCardHeader>
          <PageCardContent>
            {projeto.descricao ? (
              <DescricaoTexto>{projeto.descricao}</DescricaoTexto>
            ) : (
              <EmptyText>Sem descrição cadastrada.</EmptyText>
            )}
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
  const podeConduzir = pode(usuario, "marcar_kickoff");

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

  // 🤖 O kickoff é o gatilho de Vendido → Ambientação, e o backend só aceita
  // a marcação enquanto o projeto está Vendido.
  const travado = tipo === "kickoff" && projeto.status !== "vendido";

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
            {!travado && (
              <PageButtonSm type="button" $variant="ghost" onClick={() => setEditando(true)}>
                {valor ? "Alterar" : "Marcar"}
              </PageButtonSm>
            )}
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
