import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { EstadoVazio } from "@/components/EstadoVazio";
import { CorSelo } from "@/components/health-track/CorSelo";
import { SeletorCor } from "@/components/health-track/SeletorCor";
import { SemCor } from "@/components/health-track/HealthTrack.styled";
import { Textarea } from "@/components/ui/textarea";
import { formatarDataHora } from "@/lib/projetos";
import {
  getAvaliacaoAtual,
  getCiclos,
  getClassificacoes,
  registrarAvaliacao,
  type AvaliacaoAtual,
  type Ciclo,
  type Classificacao,
  type CorHealthTrack,
  type StatusGeral,
} from "@/lib/health-track";
import {
  PageStack,
  PageCard,
  PageCardHeader,
  PageCardTitle,
  PageCardContent,
  PageButton,
  PageLoadingBlock,
  ErrorBlock,
  ErrorText,
  EmptyText,
} from "@/styles/page.styled";
import {
  Anterior,
  CampoPilar,
  CicloCabecalho,
  CicloItem,
  Comentario,
  ComentariosDoCiclo,
  CoresDoCiclo,
  Faltando,
  Legenda,
  ListaCiclos,
  ListaPilares,
  Meta,
  NotaRegra,
  PilarDescricao,
  PilarItem,
  PilarNome,
  Rodape,
  RotuloComentario,
  StatusLinha,
  Sucesso,
} from "./PainelHealthTrack.styled";

type Rascunho = Record<number, { cor: CorHealthTrack | null; comentario: string }>;

/**
 * A saúde de UM projeto em pilares (Health Track §2 a §5).
 *
 * Três blocos, do mais lido ao menos lido: o status geral de agora, a cor de
 * cada pilar (onde também se preenche), e os ciclos anteriores.
 *
 * Era a aba "Health Track" dentro do projeto; virou painel da página
 * Health Track (2026-10-08) porque coordenador e consultor não podem ver.
 * Recebe o id porque não está mais dentro do `ProjetoPage`.
 *
 * Quem pode preencher vem do backend (`pode_preencher`): diretoria de
 * projetos ou gerente de uma frente do projeto. A tela não refaz a regra de
 * frente, ela já saiu errada nas vezes em que foi copiada para o front.
 */
export function PainelHealthTrack({ projetoId }: { projetoId: number }) {
  const { token } = useAuth();
  const [atual, setAtual] = useState<AvaliacaoAtual | null>(null);
  const [ciclos, setCiclos] = useState<Ciclo[]>([]);
  const [classificacoes, setClassificacoes] = useState<Classificacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [editando, setEditando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  const buscar = useCallback(
    () =>
      Promise.all([
        getAvaliacaoAtual(projetoId, token!),
        getCiclos(projetoId, token!),
        getClassificacoes(token!),
      ]),
    [projetoId, token],
  );

  const aplicar = useCallback(
    ([resAtual, resCiclos, resClassificacoes]: Awaited<ReturnType<typeof buscar>>) => {
      setAtual(resAtual);
      setCiclos(resCiclos);
      setClassificacoes(resClassificacoes);
      setErro("");
    },
    [],
  );

  const falhar = useCallback((err: unknown) => {
    setErro(err instanceof Error ? err.message : "Erro ao carregar o Health Track");
  }, []);

  // O estado só muda quando a resposta chega, e só se a aba ainda estiver
  // olhando para o mesmo projeto: trocar de projeto com a busca em voo não
  // pode pintar a tela do novo com os dados do antigo.
  useEffect(() => {
    if (!token) return;
    let ativo = true;
    buscar()
      .then((r) => ativo && aplicar(r))
      .catch((err) => ativo && falhar(err))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, [token, buscar, aplicar, falhar]);

  /** Depois de salvar ou no "Tentar novamente". */
  const carregar = useCallback(async () => {
    try {
      aplicar(await buscar());
    } catch (err) {
      falhar(err);
    }
  }, [buscar, aplicar, falhar]);

  const nomeDaCor = useCallback(
    (cor: CorHealthTrack) => classificacoes.find((c) => c.cor === cor)?.nome,
    [classificacoes],
  );

  if (erro) {
    return (
      <ErrorBlock>
        <ErrorText>Não foi possível carregar o Health Track: {erro}</ErrorText>
        <PageButton $variant="outline" onClick={() => carregar()}>
          Tentar novamente
        </PageButton>
      </ErrorBlock>
    );
  }

  if (carregando || !atual) return <PageLoadingBlock />;

  const status = atual.status_geral;

  return (
    <PageStack>
      <PageCard>
        <PageCardHeader>
          <PageCardTitle>Status geral</PageCardTitle>
          {atual.pode_preencher && !editando && (
            <PageButton
              onClick={() => {
                setSalvo(false);
                setEditando(true);
              }}
            >
              Nova avaliação
            </PageButton>
          )}
        </PageCardHeader>
        <PageCardContent>
          {status ? (
            <>
              <StatusLinha>
                <CorSelo cor={status.na_epoca} rotulo={nomeDaCor(status.na_epoca)} grande />
                <Meta>
                  Avaliado em {formatarDataHora(status.avaliado_em)}
                  {ultimoAvaliador(ciclos) && ` por ${ultimoAvaliador(ciclos)}`}
                </Meta>
              </StatusLinha>
              <DivergenciaDeRegra status={status} nomeDaCor={nomeDaCor} atual />
            </>
          ) : (
            <EstadoVazio
              causa="vazio"
              titulo={ciclos.length ? "Status geral pendente" : "Ainda sem Health Track"}
              motivo={motivoSemStatus(ciclos.length > 0, atual.pode_preencher)}
            />
          )}
          {salvo && <Sucesso role="status">Avaliação registrada.</Sucesso>}
        </PageCardContent>
      </PageCard>

      <PageCard>
        <PageCardHeader>
          <PageCardTitle>{editando ? "Nova avaliação" : "Pilares"}</PageCardTitle>
        </PageCardHeader>
        <PageCardContent>
          {editando ? (
            <FormularioAvaliacao
              projetoId={projetoId}
              atual={atual}
              classificacoes={classificacoes}
              onCancelar={() => setEditando(false)}
              onSalvo={async () => {
                setEditando(false);
                setSalvo(true);
                await carregar();
              }}
            />
          ) : (
            <ListaPilares>
              {atual.pilares.map(({ pilar, avaliacao }) => (
                <PilarItem key={pilar.id}>
                  <div>
                    <PilarNome>{pilar.nome}</PilarNome>
                    {pilar.descricao && <PilarDescricao>{pilar.descricao}</PilarDescricao>}
                  </div>
                  <div>
                    {avaliacao ? (
                      <CorSelo cor={avaliacao.cor} rotulo={nomeDaCor(avaliacao.cor)} />
                    ) : (
                      <SemCor>Sem avaliação</SemCor>
                    )}
                  </div>
                  {avaliacao?.comentario && <Comentario>{avaliacao.comentario}</Comentario>}
                </PilarItem>
              ))}
            </ListaPilares>
          )}
        </PageCardContent>
      </PageCard>

      <PageCard>
        <PageCardHeader>
          <PageCardTitle>Ciclos anteriores</PageCardTitle>
        </PageCardHeader>
        <PageCardContent>
          {ciclos.length === 0 ? (
            <EmptyText>Os preenchimentos aparecem aqui, do mais recente ao mais antigo.</EmptyText>
          ) : (
            <ListaCiclos>
              {ciclos.map((ciclo) => (
                <CicloResumo
                  key={`${ciclo.avaliado_em}-${ciclo.avaliado_por}`}
                  ciclo={ciclo}
                  nomeDaCor={nomeDaCor}
                />
              ))}
            </ListaCiclos>
          )}
        </PageCardContent>
      </PageCard>
    </PageStack>
  );
}

function ultimoAvaliador(ciclos: Ciclo[]): string | null {
  return ciclos[0]?.avaliado_por_nome ?? null;
}

function motivoSemStatus(temCiclo: boolean, podePreencher: boolean): string {
  if (temCiclo) {
    // Só acontece quando um pilar foi ativado depois do último preenchimento.
    return podePreencher
      ? "Um pilar novo ainda não tem cor. Faça uma nova avaliação para calcular o status."
      : "Um pilar novo ainda não tem cor. O status volta no próximo preenchimento da gerência ou da diretoria.";
  }
  return podePreencher
    ? "Use \"Nova avaliação\" para dar uma cor a cada pilar."
    : "A gerência da frente ou a diretoria de projetos faz o primeiro preenchimento.";
}

/** "Pela regra atual seria X": só aparece quando a regra mudou depois do
 *  ciclo e o resultado mudou com ela. */
function DivergenciaDeRegra({
  status,
  nomeDaCor,
  atual,
}: {
  status: StatusGeral;
  nomeDaCor: (cor: CorHealthTrack) => string | undefined;
  atual?: boolean;
}) {
  if (status.na_epoca === status.pela_regra_atual) return null;
  return (
    <NotaRegra>
      <span>Pela regra atual, {atual ? "este projeto" : "este ciclo"} seria</span>
      <CorSelo cor={status.pela_regra_atual} rotulo={nomeDaCor(status.pela_regra_atual)} />
      <span>(a diretoria mudou a regra depois desta avaliação)</span>
    </NotaRegra>
  );
}

function CicloResumo({
  ciclo,
  nomeDaCor,
}: {
  ciclo: Ciclo;
  nomeDaCor: (cor: CorHealthTrack) => string | undefined;
}) {
  const comComentario = ciclo.avaliacoes.filter((a) => a.comentario);
  return (
    <CicloItem>
      <CicloCabecalho>
        <Meta>
          {formatarDataHora(ciclo.avaliado_em)}
          {ciclo.avaliado_por_nome && ` · ${ciclo.avaliado_por_nome}`}
        </Meta>
        <CorSelo cor={ciclo.status_geral.na_epoca} rotulo={nomeDaCor(ciclo.status_geral.na_epoca)} />
      </CicloCabecalho>
      <CoresDoCiclo aria-label="Cor de cada pilar neste ciclo">
        {ciclo.avaliacoes.map((a) => (
          <li key={a.id}>
            {a.pilar_nome}
            <CorSelo cor={a.cor} rotulo={nomeDaCor(a.cor)} />
          </li>
        ))}
      </CoresDoCiclo>
      <DivergenciaDeRegra status={ciclo.status_geral} nomeDaCor={nomeDaCor} />
      {comComentario.length > 0 && (
        <details>
          <summary>
            {comComentario.length === 1 ? "1 comentário" : `${comComentario.length} comentários`}
          </summary>
          <ComentariosDoCiclo>
            {comComentario.map((a) => (
              <div key={a.id}>
                <dt>{a.pilar_nome}</dt>
                <dd>{a.comentario}</dd>
              </div>
            ))}
          </ComentariosDoCiclo>
        </details>
      )}
    </CicloItem>
  );
}

/**
 * O preenchimento: todos os pilares ativos, de uma vez.
 *
 * Começa EM BRANCO, com a cor anterior ao lado como referência. Vir já
 * preenchido com o ciclo passado convidaria a confirmar sem olhar, e cada
 * ciclo é uma leitura nova do projeto.
 */
function FormularioAvaliacao({
  projetoId,
  atual,
  classificacoes,
  onCancelar,
  onSalvo,
}: {
  projetoId: number;
  atual: AvaliacaoAtual;
  classificacoes: Classificacao[];
  onCancelar: () => void;
  onSalvo: () => Promise<void>;
}) {
  const { token } = useAuth();
  const [rascunho, setRascunho] = useState<Rascunho>(() =>
    Object.fromEntries(atual.pilares.map(({ pilar }) => [pilar.id, { cor: null, comentario: "" }])),
  );
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  const faltando = useMemo(
    () => atual.pilares.filter(({ pilar }) => !rascunho[pilar.id]?.cor).length,
    [atual.pilares, rascunho],
  );

  function mudar(pilarId: number, campo: Partial<Rascunho[number]>) {
    setRascunho((r) => ({ ...r, [pilarId]: { ...r[pilarId], ...campo } }));
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!token || faltando > 0) return;
    setEnviando(true);
    setErro("");
    try {
      await registrarAvaliacao(
        projetoId,
        atual.pilares.map(({ pilar }) => ({
          pilar_id: pilar.id,
          cor: rascunho[pilar.id].cor as CorHealthTrack,
          comentario: rascunho[pilar.id].comentario.trim() || null,
        })),
        token,
      );
      await onSalvo();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar a avaliação");
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} noValidate>
      {classificacoes.length > 0 && (
        <Legenda>
          {classificacoes.map((c) => (
            <div key={c.cor}>
              <dt>
                <CorSelo cor={c.cor} rotulo={c.nome} />
              </dt>
              <dd>{c.descricao}</dd>
            </div>
          ))}
        </Legenda>
      )}

      {atual.pilares.map(({ pilar, avaliacao }) => {
        const idComentario = `ht-comentario-${pilar.id}`;
        return (
          <CampoPilar key={pilar.id}>
            <legend>
              <PilarNome>{pilar.nome}</PilarNome>
              {pilar.descricao && <PilarDescricao>{pilar.descricao}</PilarDescricao>}
            </legend>
            <SeletorCor
              nome={`ht-cor-${pilar.id}`}
              rotulo={pilar.nome}
              valor={rascunho[pilar.id]?.cor ?? null}
              classificacoes={classificacoes}
              onChange={(cor) => mudar(pilar.id, { cor })}
              desabilitado={enviando}
            />
            {avaliacao && (
              <Anterior>
                Anterior:
                <CorSelo cor={avaliacao.cor} rotulo={classificacoes.find((c) => c.cor === avaliacao.cor)?.nome} />
              </Anterior>
            )}
            <RotuloComentario htmlFor={idComentario}>Comentário (opcional)</RotuloComentario>
            <Textarea
              id={idComentario}
              value={rascunho[pilar.id]?.comentario ?? ""}
              onChange={(e) => mudar(pilar.id, { comentario: e.target.value })}
              disabled={enviando}
              rows={2}
            />
          </CampoPilar>
        );
      })}

      <Rodape>
        <Faltando aria-live="polite">
          {faltando > 0
            ? `Falta escolher a cor de ${faltando} ${faltando === 1 ? "pilar" : "pilares"}`
            : "Todos os pilares com cor"}
        </Faltando>
        {erro && <ErrorText role="alert">{erro}</ErrorText>}
        <PageButton type="button" $variant="outline" onClick={onCancelar} disabled={enviando}>
          Cancelar
        </PageButton>
        <PageButton type="submit" disabled={enviando || faltando > 0}>
          {enviando ? "Salvando..." : "Salvar avaliação"}
        </PageButton>
      </Rodape>
    </form>
  );
}
