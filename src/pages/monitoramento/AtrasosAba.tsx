import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { pode } from "@/utils/permissoes";
import { getAtrasos, type Atrasos } from "@/lib/monitoramento";
import {
  formatarData,
  registrarJustificativaAtraso,
  ROTULO_MOTIVO_ATRASO,
  ROTULO_STATUS,
} from "@/lib/projetos";
import type { StatusProjeto } from "@/types/projeto";

type LinhaProjeto = Atrasos["por_projeto"][number];
type Motivo = LinhaProjeto["motivos"][number];
import { ConteudoPaginado, Paginacao, usePaginacao } from "./Paginacao";
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
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalClose,
  ModalBody,
  ModalFooter,
} from "@/styles/modal.styled";
import { FieldTextarea, FormErrorText } from "@/pages/Bancas.styled";
import {
  AtrasoCorpo,
  AtrasoDias,
  AtrasoTitulo,
  BarraCelula,
  BarraCelulaPreenchida,
  BarraCelulaTrilho,
  DataTable,
  EstadoLimpo,
  EstadoLimpoIcone,
  FaixaResumo,
  Legenda,
  LegendaItem,
  LinhaAtraso,
  LinkProjeto,
  ListaSimples,
  MotivoData,
  MotivoDias,
  MotivoEscopoNome,
  MotivoItem,
  MotivoJustificadoBadge,
  MotivoJustificarBtn,
  MotivoLista,
  MotivoTag,
  Pilula,
  ResumoItem,
  ResumoRotulo,
  ResumoValor,
  SemDado,
  TabelaRolagem,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  type NivelSeveridade,
} from "./Monitoramento.styled";
import { useFiltroFrente } from "./FiltroFrente";

/**
 * §7.4 — o pilar é a BANCA: "um escopo está atrasado quando passa da data da
 * sua banca sem que ela tenha acontecido". A entrega ao cliente é acompanhada
 * à parte, com a distinção interno/externo, para não penalizar o time pelo
 * que não é dele.
 *
 * Os dias aqui são ÚTEIS, pelo calendário do Insper — a mesma régua da aba de
 * Execução. O texto do §7.4 dizia "corridos", mas a diretoria confirmou em
 * 2026-08-04 que são úteis: cobrar fim de semana, feriado e semana de provas
 * seria cobrar tempo em que o time não tinha como trabalhar. Não há mais duas
 * réguas no sistema, então os números das duas abas se comparam.
 *
 * **`dias_totais` é SOMA, não duração.** O backend acumula os dias de todos os
 * motivos do projeto (`AtrasoProjeto.dias_totais`) e ordena a lista por ela.
 * Soma responde "quanto atraso este projeto acumula"; não responde "há quanto
 * tempo ele está atrasado" — três escopos com 4 dias cada somam 12 sem que
 * nada esteja parado há 12 dias. Por isso a tela separa as duas leituras: o
 * número grande é a soma (para bater com a ordem da lista) e a COR vem do pior
 * motivo isolado, que é sobre o que os cortes do `nivel()` foram escritos.
 */
// Mesmo padrão de `TarefasGeraisAba`/`CronogramasGeraisAba`: sem isto, o link
// "Voltar" da página do projeto caía sempre em `/projetos`, perdendo a aba de
// Monitoramento de onde a pessoa realmente veio.
const VOLTAR_PARA_AQUI = { voltarPara: "/monitoramento/atrasos", voltarRotulo: "Voltar para Atrasos" };

export function AtrasosAba() {
  const { token, usuario } = useAuth();
  const navigate = useNavigate();
  const { frenteId, seletor } = useFiltroFrente();
  const [dados, setDados] = useState<Atrasos | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  // §7.4 — o alerta é automático; só a diretoria digita o porquê. A
  // justificativa é POR MOTIVO (escopo + tipo): o mesmo escopo pode estar
  // atrasado em banca e entrega ao mesmo tempo, e uma nota genérica do
  // projeto não distingue qual dos dois foi respondido.
  const podeJustificar = pode(usuario, "registrar_justificativa_atraso");
  const [justificando, setJustificando] = useState<{ projeto: LinhaProjeto; motivo: Motivo } | null>(
    null,
  );

  async function carregar() {
    if (!token) return;
    setCarregando(true);
    setErro("");
    try {
      setDados(await getAtrasos(token, frenteId));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar os atrasos");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, frenteId]);

  const projetos = dados?.por_projeto ?? [];
  const coordenadores = dados?.por_coordenador ?? [];

  /* A régua das barras da tabela de coordenadores: o maior acumulado dela.
     Comparar coordenador com coordenador é o ponto — o §7.4 quer padrão
     recorrente, e padrão só aparece na comparação entre pares. */
  const piorCoordenador = useMemo(
    () => Math.max(1, ...coordenadores.map((c) => c.dias_acumulados)),
    [coordenadores],
  );
  const diasAcumulados = useMemo(
    () => projetos.reduce((soma, p) => soma + p.dias_totais, 0),
    [projetos],
  );

  /* O "pior caso" da faixa é o maior atraso ISOLADO da visão, não a maior
     soma. É o número que a diretoria usa para dizer "o pior que temos hoje é
     um escopo parado há N dias" — e a maior soma não sustenta essa frase. */
  const piorMotivo = useMemo(
    () => Math.max(0, ...projetos.flatMap((p) => p.motivos.map((m) => m.dias))),
    [projetos],
  );

  /* Quantos estão atrasados APENAS pela agenda do cliente. O §7.4 tira esses
     do que se cobra do time, e a faixa precisa dizer isso — senão "8 projetos
     atrasados" vira cobrança de coisa que o time não controla. */
  const somenteExterno = useMemo(
    () => projetos.filter(apenasExterno).length,
    [projetos],
  );

  // Ordenada por gravidade, então o corte esconde a cauda. Antes dos `return`
  // cedo de erro e carregando — hook depois deles seria condicional.
  const listaProjetos = usePaginacao(projetos);

  if (erro) {
    return (
      <PageStack>
        {seletor}
        <ErrorBlock>
          <ErrorText>{erro}</ErrorText>
          <PageButton $variant="outline" onClick={carregar}>
            Tentar novamente
          </PageButton>
        </ErrorBlock>
      </PageStack>
    );
  }

  if (carregando || !dados) {
    return (
      <PageStack>
        {seletor}
        <PageLoadingBlock />
      </PageStack>
    );
  }

  return (
    <PageStack>
      {seletor}
      {projetos.length > 0 && (
        <FaixaResumo>
          <ResumoItem>
            {/* A contagem fica neutra de propósito. Tingi-la com a gravidade do
                PIOR projeto diria que os 12 estão críticos quando só um está. */}
            <ResumoValor>{projetos.length}</ResumoValor>
            <ResumoRotulo>
              {projetos.length === 1 ? "Projeto atrasado" : "Projetos atrasados"}
              {somenteExterno > 0 &&
                ` · ${somenteExterno} só por agenda do cliente`}
            </ResumoRotulo>
          </ResumoItem>
          <ResumoItem>
            <ResumoValor>
              {diasAcumulados}
              <small>dias</small>
            </ResumoValor>
            <ResumoRotulo>Dias úteis somados</ResumoRotulo>
          </ResumoItem>
          <ResumoItem>
            <ResumoValor $nivel={nivel(piorMotivo)}>
              {piorMotivo}
              <small>dias</small>
            </ResumoValor>
            <ResumoRotulo>Pior atraso isolado</ResumoRotulo>
          </ResumoItem>
        </FaixaResumo>
      )}

      <PageCard>
        <PageCardHeader>
          <PageCardTitle>Por projeto</PageCardTitle>
          {projetos.length > 0 && (
            <Legenda>
              <LegendaItem $nivel="leve">Até 3 dias</LegendaItem>
              <LegendaItem $nivel="media">4 a 10 dias</LegendaItem>
              <LegendaItem $nivel="critica">Mais de 10 dias</LegendaItem>
            </Legenda>
          )}
        </PageCardHeader>
        <PageCardContent>
          {projetos.length === 0 ? (
            <EstadoLimpo>
              <EstadoLimpoIcone aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m4 12.5 5.5 5.5L20 6.5" />
                </svg>
              </EstadoLimpoIcone>
              <strong>Nenhum projeto atrasado</strong>
              <span>
                Todas as bancas e entregas da sua visão estão dentro da data planejada.
              </span>
            </EstadoLimpo>
          ) : (
            <>
            <ConteudoPaginado estado={listaProjetos}>
              <ListaSimples>
                {listaProjetos.visiveis.map((p) => {
                  const externo = apenasExterno(p);
                  /* A cor vem do pior motivo isolado — os cortes do `nivel()`
                     foram escritos sobre o cronograma de UM escopo (§5.6), não
                     sobre a soma do projeto. Quando o atraso é todo externo a
                     cor sai de cena: §7.4 não cobra isso do time. */
                  const grau = nivel(pior(p.motivos.filter((m) => !ehExterno(m))));
                  /* Uma soma só é soma quando há o que somar. Com um motivo só,
                     "soma" confunde: o número É a duração. */
                  const somando = p.motivos.length > 1;
                  return (
                    <LinhaAtraso key={p.projeto_id}>
                      <AtrasoDias $nivel={grau} $externo={externo}>
                        <strong>{p.dias_totais}</strong>
                        <span>{somando ? "Soma" : "Dias"}</span>
                      </AtrasoDias>
  
                      <AtrasoCorpo>
                        <AtrasoTitulo>
                          <LinkProjeto to={`/projetos/${p.projeto_id}`} state={VOLTAR_PARA_AQUI}>
                            {p.projeto_nome}
                          </LinkProjeto>
                          <Pilula $tom="neutro">
                            {ROTULO_STATUS[p.status as StatusProjeto] ?? p.status}
                          </Pilula>
                          {externo && <Pilula $tom="atencao">Espera do cliente</Pilula>}
                        </AtrasoTitulo>
  
                        <MotivoLista>
                          {/* Os motivos descem do pior para o menor: numa lista
                              de 5 escopos, é o primeiro que explica a linha. */}
                          {[...p.motivos]
                            .sort((a, b) => b.dias - a.dias)
                            .map((m, i) => (
                              /* O escopo sozinho NÃO é chave única: o mesmo
                                 escopo pode entrar duas vezes, uma pela banca e
                                 outra pela entrega. O par tipo+escopo é. */
                              /* 5 filhos SEMPRE, mesmo quando um deles não
                                 tem conteúdo — MotivoItem é uma grade de 5
                                 colunas fixas por posição; se um filho sumir
                                 do DOM (em vez de ficar vazio), os de depois
                                 escorregam pra coluna errada. */
                              <MotivoItem key={`${m.tipo}-${m.projeto_escopo_id ?? i}`}>
                                <MotivoTag $externo={ehExterno(m)}>
                                  {ROTULO_MOTIVO_ATRASO[m.tipo] ?? m.tipo}
                                </MotivoTag>
                                <MotivoEscopoNome title={m.escopo}>{m.escopo}</MotivoEscopoNome>
                                <MotivoDias $nivel={nivel(m.dias)} $externo={ehExterno(m)}>
                                  {m.dias} {m.dias === 1 ? "dia" : "dias"}
                                </MotivoDias>
                                <MotivoData>
                                  {m.data_referencia && `vencia ${formatarData(m.data_referencia)}`}
                                </MotivoData>
                                {/* §7.4: por MOTIVO, não por projeto — o mesmo
                                    escopo pode estar atrasado em banca e
                                    entrega ao mesmo tempo, cada um com sua
                                    própria nota. Já justificado vira selo, não
                                    fica reabrindo pra "adicionar mais uma". */}
                                {m.justificado && m.justificativa_id != null ? (
                                  <MotivoJustificadoBadge
                                    to={`/projetos/${p.projeto_id}/historico#justificativa-${m.justificativa_id}`}
                                    state={VOLTAR_PARA_AQUI}
                                  >
                                    Justificado
                                  </MotivoJustificadoBadge>
                                ) : podeJustificar ? (
                                  <MotivoJustificarBtn type="button" onClick={() => setJustificando({ projeto: p, motivo: m })}>
                                    Justificar
                                  </MotivoJustificarBtn>
                                ) : (
                                  <span />
                                )}
                              </MotivoItem>
                            ))}
                        </MotivoLista>
                      </AtrasoCorpo>
                    </LinhaAtraso>
                  );
                })}
              </ListaSimples>
</ConteudoPaginado>
            <Paginacao estado={listaProjetos} />
            </>
          )}
        </PageCardContent>
      </PageCard>

      <PageCard>
        <PageCardHeader>
          <PageCardTitle>Por coordenador</PageCardTitle>
        </PageCardHeader>
        <PageCardContent>
          {coordenadores.length === 0 ? (
            <EmptyText>Nenhum coordenador na sua visão.</EmptyText>
          ) : (
            <TabelaRolagem $min="34rem" $max="26rem">
              <DataTable>
                <TableHead>
                  <TableRow>
                    <TableHeadCell>Coordenador</TableHeadCell>
                    <TableHeadCell>Projetos</TableHeadCell>
                    <TableHeadCell>Atrasados</TableHeadCell>
                    <TableHeadCell>Dias somados</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {coordenadores.map((c) => (
                    <TableRow key={c.usuario_id}>
                      <TableCell>{c.nome}</TableCell>
                      <TableCell>{c.projetos}</TableCell>
                      <TableCell>
                        {c.atrasados > 0 ? (
                          <Pilula $tom="alerta">
                            {c.atrasados} de {c.projetos}
                          </Pilula>
                        ) : (
                          <Pilula $tom="ok">Nenhum</Pilula>
                        )}
                      </TableCell>
                      <TableCell>
                        {c.dias_acumulados === 0 ? (
                          <SemDado>—</SemDado>
                        ) : (
                          /* A barra é decorativa: o número ao lado já diz o
                             valor, e sem `aria-hidden` o leitor de tela
                             anuncia uma div vazia no meio da célula. */
                          <BarraCelula>
                            <strong>{c.dias_acumulados}</strong>
                            <BarraCelulaTrilho aria-hidden="true">
                              <BarraCelulaPreenchida
                                $pct={(c.dias_acumulados / piorCoordenador) * 100}
                                $nivel={nivel(c.dias_acumulados)}
                              />
                            </BarraCelulaTrilho>
                          </BarraCelula>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </DataTable>
            </TabelaRolagem>
          )}
        </PageCardContent>
      </PageCard>

      {justificando && token && (
        <JustificarAtrasoModal
          projeto={justificando.projeto}
          motivo={justificando.motivo}
          token={token}
          onClose={() => setJustificando(null)}
          onSalvo={(criadaId) => {
            const projetoId = justificando.projeto.projeto_id;
            setJustificando(null);
            // Direto pra nota que acabou de ser escrita, não pro topo do
            // histórico inteiro — e "Voltar" de lá cai aqui, não em /projetos.
            navigate(`/projetos/${projetoId}/historico#justificativa-${criadaId}`, {
              state: VOLTAR_PARA_AQUI,
            });
          }}
        />
      )}
    </PageStack>
  );
}

/**
 * §7.4: o alerta de atraso é automático — ninguém digita nada pra ele
 * acontecer. O "porquê" é outra coisa: a diretoria pergunta ao coordenador e
 * registra a nota aqui, que fica gravada pra sempre no histórico do projeto
 * (`ProjetoHistorico.tsx`). Por MOTIVO (escopo + tipo), não por projeto: o
 * mesmo escopo pode estar atrasado em banca e entrega ao mesmo tempo.
 */
function JustificarAtrasoModal({
  projeto,
  motivo,
  token,
  onClose,
  onSalvo,
}: {
  projeto: LinhaProjeto;
  motivo: Motivo;
  token: string;
  onClose: () => void;
  onSalvo: (criadaId: number) => void;
}) {
  const [texto, setTexto] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function salvar() {
    if (!texto.trim()) {
      setErro("Digite a justificativa antes de salvar");
      return;
    }
    setSalvando(true);
    setErro("");
    try {
      const criada = await registrarJustificativaAtraso(
        projeto.projeto_id,
        texto.trim(),
        token,
        motivo.projeto_escopo_id ?? undefined,
        motivo.tipo,
      );
      onSalvo(criada.id);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao registrar a justificativa");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <ModalOverlay onClick={onClose} role="presentation">
      <ModalContent onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <ModalHeader>
          <ModalTitle>
            Justificar atraso — {projeto.projeto_nome}
            <br />
            <small>
              {ROTULO_MOTIVO_ATRASO[motivo.tipo] ?? motivo.tipo} de {motivo.escopo}
            </small>
          </ModalTitle>
          <ModalClose type="button" onClick={onClose} aria-label="Fechar">
            ✕
          </ModalClose>
        </ModalHeader>
        <ModalBody>
          <EmptyText style={{ marginBottom: "0.75rem" }}>
            Pergunte ao coordenador o motivo e registre aqui — fica salvo no histórico do projeto.
          </EmptyText>
          <FieldTextarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Por que este atraso aconteceu"
            aria-label="Justificativa do atraso"
            autoFocus
            required
          />
          {erro && <FormErrorText>{erro}</FormErrorText>}
        </ModalBody>
        <ModalFooter>
          <PageButton type="button" $variant="outline" onClick={onClose} disabled={salvando}>
            Cancelar
          </PageButton>
          <PageButton type="button" onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar justificativa"}
          </PageButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
}

/**
 * Os cortes: até 3 dias ainda cabe em reagendar dentro da semana; até 10 é uma
 * banca perdida que dá para recuperar no mês; acima disso o cronograma do
 * escopo já não fecha sem reajuste formal (§5.6).
 *
 * Repare que a régua é o cronograma de UM escopo. Por isso ela se aplica ao
 * atraso de um motivo isolado, e não à soma do projeto — ver `pior()`.
 */
function nivel(dias: number): NivelSeveridade {
  if (dias > 10) return "critica";
  if (dias > 3) return "media";
  return "leve";
}

/** §7.4: a entrega que escorregou por agenda do cliente não é atraso do time. */
function ehExterno(m: Motivo): boolean {
  return m.tipo === "entrega_externa";
}

/** O maior atraso da lista. Zero quando não há motivo — um projeto atrasado
 *  só por agenda do cliente cai aqui, e "leve" é o degrau certo: a cor dele é
 *  desligada de qualquer forma pelo `$externo`. */
function pior(motivos: Motivo[]): number {
  return Math.max(0, ...motivos.map((m) => m.dias));
}

/** Todo o atraso do projeto vem da agenda do cliente. */
function apenasExterno(p: LinhaProjeto): boolean {
  return p.motivos.length > 0 && p.motivos.every(ehExterno);
}
