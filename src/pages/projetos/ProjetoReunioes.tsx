import { useCallback, useEffect, useMemo, useState } from "react";
import { addWeeks, format, isToday, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { chaveData, diasDaSemana } from "@/components/calendario/semanas";
import { createReuniao, deleteReuniao, getReunioes } from "@/lib/tarefas";
import { formatarData, rotuloDiaSemana } from "@/lib/projetos";
import type { EscopoVendido } from "@/types/projeto";
import type { ReuniaoSemanal, ReunioesResposta } from "@/types/tarefa";
import { ConfirmarModal } from "@/components/ConfirmarModal";
import {
  PageStack,
  PageCard,
  PageCardHeader,
  PageCardTitle,
  PageCardContent,
  PageBadge,
  PageButton,
  PageButtonSm,
  PageLoadingBlock,
  ErrorBlock,
  ErrorText,
  EmptyText,
} from "@/styles/page.styled";
import {
  DiaMarca,
  DiaNumero,
  DiaRotulo,
  DiaSemana,
  EscolhaEscopoDica,
  EscolhaEscopoLista,
  EscolhaEscopoOpcao,
  EscolhaEscopoPainel,
  EscolhaEscopoTitulo,
  FaixaSemana,
  NavegacaoSemana,
  SemanaRotulo,
} from "@/components/kanban/Kanban.styled";
import { FormErrorText } from "./Projetos.styled";
import { useProjeto } from "./ProjetoPage";

/** §6.4 pede a semana de segunda a domingo. */
const INICIO_SEMANA = 1;

/**
 * ⭐ A reunião semanal é o que faz a contagem do §5.4 começar a correr.
 *
 * Registrar a reunião é dizer o DIA **e sobre qual escopo ela foi**. A primeira
 * reunião de um escopo é a "reunião inicial" dele: o backend usa a data dela
 * como `projeto_escopo.data_inicio`. Por isso não existe (mais) um botão
 * "iniciar escopo" em outra tela — a contagem nasce daqui, e some daqui se a
 * reunião for apagada.
 */
export function ProjetoReunioes() {
  const { projeto, usuarios, recarregar } = useProjeto();
  const { token } = useAuth();
  const [dados, setDados] = useState<ReunioesResposta | null>(null);
  const [semana, setSemana] = useState(() => startOfWeek(new Date(), { weekStartsOn: INICIO_SEMANA }));
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [sucesso, setSucesso] = useState("");
  /** O dia que está esperando a resposta de "sobre qual escopo foi?". */
  const [escolhendo, setEscolhendo] = useState<string | null>(null);
  /** A reunião inicial que se está prestes a apagar — apagar zera a contagem. */
  const [confirmandoRemocao, setConfirmandoRemocao] = useState<ReuniaoSemanal | null>(null);

  const carregar = useCallback(async () => {
    if (!token) return;
    setErro("");
    try {
      setDados(await getReunioes(projeto.id, token));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar as reuniões");
    } finally {
      setCarregando(false);
    }
  }, [projeto.id, token]);

  useEffect(() => {
    setCarregando(true);
    carregar();
  }, [carregar]);

  const porData = useMemo(() => {
    const mapa = new Map<string, ReuniaoSemanal>();
    for (const r of dados?.reunioes ?? []) mapa.set(r.data_reuniao.slice(0, 10), r);
    return mapa;
  }, [dados]);

  const escoposPorId = useMemo(
    () => new Map(projeto.escopos.map((e) => [e.id, e])),
    [projeto.escopos],
  );

  /** Cancelado não recebe reunião; entregue já congelou a contagem (§5.4). */
  const escoposDisponiveis = projeto.escopos.filter((e) => e.status !== "cancelado");

  /** A reunião que deu a largada no escopo — apagá-la desfaz o início. */
  function ehReuniaoInicial(reuniao: ReuniaoSemanal): boolean {
    if (!reuniao.projeto_escopo_id) return false;
    const escopo = escoposPorId.get(reuniao.projeto_escopo_id);
    return !!escopo?.data_inicio && escopo.data_inicio.slice(0, 10) === reuniao.data_reuniao.slice(0, 10);
  }

  async function registrar(chave: string, escopoId: number | null) {
    if (!token) return;
    setAviso("");
    setSucesso("");
    try {
      const resposta = await createReuniao(projeto.id, chave, escopoId, token);
      setEscolhendo(null);
      if (resposta.escopo_iniciado) {
        const nome = escopoId ? escoposPorId.get(escopoId)?.nome : null;
        setSucesso(
          `Reunião inicial registrada — a contagem de dias de ${nome ?? "o escopo"} começou em ${formatarData(chave)}.`,
        );
      }
      // A contagem dos escopos vive no shell do projeto: recarrega para a aba
      // Visão geral já mostrar o escopo em andamento.
      await Promise.all([carregar(), recarregar()]);
    } catch (err) {
      setAviso(err instanceof Error ? err.message : "Erro ao registrar a reunião");
    }
  }

  async function remover(reuniao: ReuniaoSemanal) {
    if (!token) return;
    setAviso("");
    setSucesso("");
    try {
      await deleteReuniao(reuniao.id, token);
      await Promise.all([carregar(), recarregar()]);
    } catch (err) {
      setAviso(err instanceof Error ? err.message : "Erro ao remover a reunião");
      throw err;
    }
  }

  function aoClicarNoDia(chave: string) {
    const existente = porData.get(chave);
    if (!existente) {
      setAviso("");
      setSucesso("");
      setEscolhendo((atual) => (atual === chave ? null : chave));
      return;
    }
    if (ehReuniaoInicial(existente)) {
      setConfirmandoRemocao(existente);
      return;
    }
    remover(existente).catch(() => undefined);
  }

  if (erro) {
    return (
      <ErrorBlock>
        <ErrorText>Não foi possível carregar as reuniões: {erro}</ErrorText>
        <PageButton $variant="outline" onClick={() => carregar()}>
          Tentar novamente
        </PageButton>
      </ErrorBlock>
    );
  }

  if (carregando || !dados) return <PageLoadingBlock />;

  const dias = diasDaSemana(semana, INICIO_SEMANA);
  const temNestaSemana = dias.some((d) => porData.has(chaveData(d)));
  const historico = [...(dados.reunioes ?? [])].slice(0, 8);
  const escopoDaRemocao = confirmandoRemocao?.projeto_escopo_id
    ? escoposPorId.get(confirmandoRemocao.projeto_escopo_id)
    : null;

  return (
    <PageStack>
      <PageCard>
        <PageCardHeader>
          <PageCardTitle>Reunião semanal</PageCardTitle>
          <PageBadge $tone={temNestaSemana ? "success" : "warning"}>
            {temNestaSemana ? "registrada nesta semana" : "sem reunião nesta semana"}
          </PageBadge>
        </PageCardHeader>
        <PageCardContent>
          <NavegacaoSemana>
            <PageButtonSm
              type="button"
              $variant="ghost"
              onClick={() => setSemana((s) => addWeeks(s, -1))}
            >
              <ChevronLeft size={14} />
              Semana anterior
            </PageButtonSm>
            <SemanaRotulo>
              {format(dias[0], "dd 'de' MMM", { locale: ptBR })} –{" "}
              {format(dias[6], "dd 'de' MMM", { locale: ptBR })}
            </SemanaRotulo>
            <PageButtonSm
              type="button"
              $variant="ghost"
              onClick={() => setSemana((s) => addWeeks(s, 1))}
            >
              Próxima semana
              <ChevronRight size={14} />
            </PageButtonSm>
          </NavegacaoSemana>

          <FaixaSemana>
            {dias.map((dia, indice) => {
              const chave = chaveData(dia);
              const reuniao = porData.get(chave);
              // O dia padrão do projeto fica destacado mesmo vazio — é a
              // sugestão do §6.4, não uma obrigação.
              const ehPadrao = projeto.dia_reuniao_padrao === indice + 1;
              const escopo = reuniao?.projeto_escopo_id
                ? escoposPorId.get(reuniao.projeto_escopo_id)
                : null;
              return (
                <DiaSemana
                  key={chave}
                  type="button"
                  $registrado={!!reuniao}
                  $padrao={ehPadrao}
                  title={
                    reuniao
                      ? `${escopo ? escopo.nome : "Reunião geral"} — clique para desfazer o registro`
                      : ehPadrao
                        ? "Dia padrão sugerido — clique para registrar"
                        : "Clique para registrar a reunião neste dia"
                  }
                  onClick={() => aoClicarNoDia(chave)}
                >
                  <DiaRotulo>{format(dia, "EEEEEE", { locale: ptBR })}</DiaRotulo>
                  <DiaNumero $hoje={isToday(dia)}>{format(dia, "d")}</DiaNumero>
                  <DiaMarca>{reuniao ? <Check size={12} /> : ehPadrao ? "·" : ""}</DiaMarca>
                </DiaSemana>
              );
            })}
          </FaixaSemana>

          {escolhendo && (
            <SeletorDeEscopo
              dia={escolhendo}
              escopos={escoposDisponiveis}
              onEscolher={(escopoId) => registrar(escolhendo, escopoId)}
              onCancelar={() => setEscolhendo(null)}
            />
          )}

          {aviso && <FormErrorText>{aviso}</FormErrorText>}
          {sucesso && (
            <EmptyText style={{ marginTop: "0.75rem", color: "inherit" }}>▶ {sucesso}</EmptyText>
          )}

          <EmptyText style={{ marginTop: "1rem" }}>
            Dia padrão do projeto: <strong>{rotuloDiaSemana(projeto.dia_reuniao_padrao)}</strong>. A
            reunião pode ser movida e pode haver mais de uma na mesma semana — cada dia marcado é um
            registro. ▶ A <strong>primeira reunião de um escopo</strong> é a reunião inicial dele: é
            ela que faz a contagem de dias começar a correr, e ela só é aceita depois que a{" "}
            <strong>data da banca</strong> daquele escopo já está marcada (§5.4).
          </EmptyText>
        </PageCardContent>
      </PageCard>

      <PageCard>
        <PageCardHeader>
          <PageCardTitle>Últimas reuniões</PageCardTitle>
        </PageCardHeader>
        <PageCardContent>
          {historico.length === 0 ? (
            <EmptyText>Nenhuma reunião registrada ainda.</EmptyText>
          ) : (
            <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
              {historico.map((r) => {
                const escopo = r.projeto_escopo_id ? escoposPorId.get(r.projeto_escopo_id) : null;
                return (
                  <li key={r.id} style={{ fontSize: "0.875rem", lineHeight: 1.9 }}>
                    {format(new Date(`${r.data_reuniao.slice(0, 10)}T12:00:00`), "EEEE, dd/MM/yyyy", {
                      locale: ptBR,
                    })}{" "}
                    — <strong>{escopo ? escopo.nome : "reunião geral"}</strong>
                    {ehReuniaoInicial(r) && " (reunião inicial — deu a largada na contagem)"} ·
                    registrada por {usuarios.find((u) => u.id === r.registrado_por)?.nome ?? "—"}
                  </li>
                );
              })}
            </ul>
          )}
        </PageCardContent>
      </PageCard>

      {confirmandoRemocao && (
        <ConfirmarModal
          titulo="Apagar a reunião inicial?"
          mensagem={
            <>
              Esta é a reunião inicial de <strong>{escopoDaRemocao?.nome ?? "um escopo"}</strong>.
              Apagá-la devolve o escopo para <strong>não iniciado</strong> e zera a contagem de dias
              dele — os {escopoDaRemocao?.consumidos ?? 0} dias já contados somem.
            </>
          }
          rotuloConfirmar="Apagar mesmo assim"
          onConfirmar={async () => {
            await remover(confirmandoRemocao);
            setConfirmandoRemocao(null);
          }}
          onCancelar={() => setConfirmandoRemocao(null)}
        />
      )}
    </PageStack>
  );
}

/* ------------------------------------------------------------------ */

/**
 * "Sobre qual escopo foi?" — a pergunta que o §5.4 exige.
 *
 * Escopo sem data de banca aparece **desabilitado**: o backend recusa a
 * largada dele com 422, e mostrar o botão clicável seria empurrar a pessoa
 * para um erro que a tela já sabe prever.
 */
function SeletorDeEscopo({
  dia,
  escopos,
  onEscolher,
  onCancelar,
}: {
  dia: string;
  escopos: EscopoVendido[];
  onEscolher: (escopoId: number | null) => void;
  onCancelar: () => void;
}) {
  return (
    <EscolhaEscopoPainel>
      <EscolhaEscopoTitulo>
        Sobre qual escopo foi a reunião de {formatarData(dia)}?
      </EscolhaEscopoTitulo>
      <EscolhaEscopoLista>
        {escopos.map((escopo) => {
          const inicial = !escopo.data_inicio;
          const semBanca = inicial && !escopo.banca?.data_hora;
          return (
            <EscolhaEscopoOpcao
              key={escopo.id}
              type="button"
              disabled={semBanca}
              title={
                semBanca
                  ? "A contagem só começa com a reunião inicial E a data da banca (§5.4) — marque a banca na aba Visão geral"
                  : undefined
              }
              onClick={() => onEscolher(escopo.id)}
            >
              <span>{escopo.nome}</span>
              {semBanca ? (
                <EscolhaEscopoDica>marque a data da banca primeiro</EscolhaEscopoDica>
              ) : inicial ? (
                <EscolhaEscopoDica>
                  <Play size={10} /> inicia a contagem
                </EscolhaEscopoDica>
              ) : escopo.data_entrega_real ? (
                <EscolhaEscopoDica>entregue</EscolhaEscopoDica>
              ) : (
                <EscolhaEscopoDica>
                  {escopo.consumidos}/{escopo.dias_uteis_vendidos} dias
                </EscolhaEscopoDica>
              )}
            </EscolhaEscopoOpcao>
          );
        })}

        <EscolhaEscopoOpcao type="button" onClick={() => onEscolher(null)}>
          <span>Reunião geral do projeto</span>
          <EscolhaEscopoDica>não mexe na contagem</EscolhaEscopoDica>
        </EscolhaEscopoOpcao>
      </EscolhaEscopoLista>
      <div>
        <PageButtonSm type="button" $variant="ghost" onClick={onCancelar}>
          Cancelar
        </PageButtonSm>
      </div>
    </EscolhaEscopoPainel>
  );
}
