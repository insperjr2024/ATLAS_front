import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getAtrasos, type Atrasos } from "@/lib/monitoramento";
import { formatarData, registrarJustificativaAtraso } from "@/lib/projetos";
import { useFiltroFrente } from "./FiltroFrente";
import { useFiltroEscopo } from "./FiltroEscopo";
import { EstadoVazio } from "@/components/EstadoVazio";
import {
  PageStack,
  PageCard,
  PageCardHeader,
  PageCardTitle,
  PageCardContent,
  PageButton,
  PageButtonSm,
  PageLoadingBlock,
  ErrorBlock,
  ErrorText,
  EmptyText,
} from "@/styles/page.styled";
import {
  AprovacaoCitacao,
  AprovacaoMeta,
  AtrasoTitulo,
  DataTable,
  Legenda,
  LegendaItem,
  LinkProjeto,
  ListaSimples,
  NotaRodape,
  Pilula,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "./Monitoramento.styled";
import { AprovacaoLinha, FormDecisao } from "./AprovacaoLinha";

/**
 * O que já devia ter acontecido e não aconteceu.
 *
 * UMA régua carrega a palavra "atrasado", e é a banca: um escopo está
 * atrasado quando passa da data da sua banca sem que ela tenha acontecido,
 * o marco sob controle do time.
 *
 * A aba media DUAS coisas e chamava as duas de atraso, e era a raiz de
 * todo o resto. Ela dizia "Nenhum projeto atrasado" logo acima de "Escopos que
 * passaram da janela (4)": uma pergunta é o marco não aconteceu, a outra é
 * o trabalho custou mais dias do que foi vendido. Um escopo pode estourar a
 * janela com a banca feita e em dia, e vice-versa, os números nunca se somam
 * e nunca se contradizem, mas ninguém tinha como saber isso olhando a tela.
 *
 * A separação aqui é deliberada e vale em quatro camadas, porque só o título
 * não bastava:
 *
 * | | Bancas vencidas | Além do vendido |
 * |---|---|---|
 * | pergunta | o marco não aconteceu | o trabalho custou mais |
 * | conta | bancas | escopos |
 * | unidade | "N dias vencida" | "+N dias além" |
 * | fecha quando | a banca acontece | nunca (é histórico do escopo) |
 *
 * A palavra "atraso" só aparece do lado esquerdo dessa tabela. O card da
 * direita se chama "Além do vendido" e o número dele vem com "+".
 */
// Mesmo padrão de `TarefasGeraisAba`/`CronogramasGeraisAba`: sem isto, o link
// "Voltar" da página do projeto caía sempre em `/projetos`, perdendo a aba de
// Monitoramento de onde a pessoa realmente veio.
const VOLTAR_PARA_AQUI = { voltarPara: "/monitoramento/atrasos", voltarRotulo: "Voltar para Atrasos" };

export function AtrasosAba() {
  const { token } = useAuth();
  const [dados, setDados] = useState<Atrasos | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  // Mesmo par de hooks das outras abas: eles guardam o estado, montam o
  // seletor e cuidam do recorte de visão (o gerente não escolhe frente).
  const { frenteId, seletor: seletorFrente } = useFiltroFrente();
  const { escopoId, seletor: seletorEscopo } = useFiltroEscopo(frenteId);

  const carregar = useCallback(async () => {
    if (!token) return;
    setErro("");
    try {
      setDados(await getAtrasos(token, frenteId, escopoId));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar os atrasos");
    } finally {
      setCarregando(false);
    }
  }, [token, frenteId, escopoId]);

  useEffect(() => {
    setCarregando(true);
    carregar();
  }, [carregar]);

  if (erro) {
    return (
      <ErrorBlock>
        <ErrorText>{erro}</ErrorText>
        <PageButton $variant="outline" onClick={carregar}>
          Tentar novamente
        </PageButton>
      </ErrorBlock>
    );
  }

  if (carregando || !dados) return <PageLoadingBlock />;

  // Uma linha por BANCA vencida, não por projeto: é a banca que venceu, e é
  // sobre ela que a nota da diretoria é escrita. O aninhamento projeto →
  // motivos existia para acomodar dois tipos de motivo, e sobrou um só.
  const bancasVencidas = dados.por_projeto.flatMap((p) =>
    p.motivos.map((m) => ({ ...m, projeto_id: p.projeto_id, projeto_nome: p.projeto_nome, status: p.status })),
  );
  const alemDoVendido = dados.escopos_atrasados;
  // Só quem tem algo em alguma das duas réguas. A tabela listava TODO
  // coordenador, e por isso "Pior caso" e "Qual é" ficavam sempre em branco.
  const coordenadores = dados.por_coordenador.filter((c) => c.atrasados > 0);

  return (
    <PageStack>
      <>
        {seletorFrente}
        {seletorEscopo}
      </>

      <CardBancasVencidas
        itens={bancasVencidas}
        onJustificou={carregar}
        voltarPara={VOLTAR_PARA_AQUI.voltarPara}
        voltarRotulo={VOLTAR_PARA_AQUI.voltarRotulo}
      />
      <CardAlemDoVendido
        itens={alemDoVendido}
        onJustificou={carregar}
        voltarPara={VOLTAR_PARA_AQUI.voltarPara}
        voltarRotulo={VOLTAR_PARA_AQUI.voltarRotulo}
      />

      <PageCard>
        <PageCardHeader>
          <PageCardTitle>Por coordenador</PageCardTitle>
        </PageCardHeader>
        <PageCardContent>
          {coordenadores.length === 0 ? (
            <EstadoVazio
              causa="acesso"
              titulo="Nenhum coordenador com banca vencida no recorte"
              motivo="Esta tabela lista os coordenadores dos projetos das frentes que você acompanha. Vazia significa que nenhum projeto seu tem banca vencida agora, ou que você ainda não acompanha frente nenhuma."
            />
          ) : (
            <>
              <EmptyText style={{ marginBottom: "0.75rem" }}>
                O objetivo é achar padrão recorrente, não julgar um caso isolado. Só aparece quem
                tem banca vencida agora.
              </EmptyText>
              <DataTable>
                <TableHead>
                  <TableRow>
                    <TableHeadCell>Coordenador</TableHeadCell>
                    <TableHeadCell>Projetos em curso</TableHeadCell>
                    <TableHeadCell>Com banca vencida</TableHeadCell>
                    <TableHeadCell>Pior caso</TableHeadCell>
                    <TableHeadCell>Qual é</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {coordenadores.map((c) => (
                    <TableRow key={c.usuario_id}>
                      <TableCell>{c.nome}</TableCell>
                      <TableCell>{c.projetos}</TableCell>
                      <TableCell>
                        <Pilula $tom={c.atrasados > 1 ? "alerta" : "atencao"}>
                          {c.atrasados}
                        </Pilula>
                      </TableCell>
                      <TableCell>{c.pior_dias} dias</TableCell>
                      <TableCell>
                        {c.pior_projeto}
                        {c.pior_motivo ? `, ${c.pior_motivo}` : ""}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </DataTable>
            </>
          )}
        </PageCardContent>
      </PageCard>

      {/* A nota que impede a leitura errada de voltar. Sem ela, quem vê
          "0 bancas vencidas" e "2 escopos além do vendido" na mesma tela lê
          contradição, foi exatamente o que a tela antiga produzia. */}
      <NotaRodape>
        <strong>Atrasado</strong> = a data da banca passou e ela não foi registrada como
        realizada. Dias úteis pelo calendário do Insper; dias de projeto pausado não contam.{" "}
        <strong>Além do vendido</strong> = dias úteis consumidos acima de vendidos + ajustados;
        não é atraso de marco, para de correr quando a banca acontece, e não entra na conta de
        projetos atrasados. Os dois números medem coisas diferentes e não se somam. Projeto
        finalizado, pausado ou arquivado, escopo cancelado, entregue ou ainda sem reunião
        inicial ficam de fora das duas listas.
      </NotaRodape>
    </PageStack>
  );
}

/* ------------------------------------------------------------------ */

type BancaVencida = Atrasos["por_projeto"][number]["motivos"][number] & {
  projeto_id: number;
  projeto_nome: string;
  status: string;
};

/** Os mesmos cortes do resto do Monitoramento. */
function nivel(dias: number) {
  if (dias > 10) return "critica" as const;
  if (dias > 3) return "media" as const;
  return "leve" as const;
}

function CardBancasVencidas({
  itens,
  onJustificou,
  voltarPara,
  voltarRotulo,
}: {
  itens: BancaVencida[];
  onJustificou: () => void;
  voltarPara: string;
  voltarRotulo: string;
}) {
  const { token } = useAuth();
  const [justificando, setJustificando] = useState<BancaVencida | null>(null);

  return (
    <PageCard id="bancas-vencidas">
      <PageCardHeader>
        <PageCardTitle>Bancas vencidas{itens.length > 0 && ` (${itens.length})`}</PageCardTitle>
      </PageCardHeader>
      <PageCardContent>
        {itens.length === 0 ? (
          // O texto antigo dizia "Todas as bancas e entregas da sua visão
          // estão dentro da data planejada", afirmava duas coisas falsas: que
          // a aba mede entregas (deixou de medir em 12/08) e que estava tudo
          // em dia, com escopos além do vendido logo abaixo.
          <EmptyText>
            Nenhuma banca venceu sem acontecer. Escopos que passaram do tempo vendido, se
            houver, aparecem no card abaixo, é outra medida.
          </EmptyText>
        ) : (
          <>
            <EmptyText style={{ marginBottom: "0.5rem" }}>
              A data passou e a banca não foi registrada como realizada. O alerta é automático;
              o porquê é você quem escreve, e ele fica no histórico do projeto.
            </EmptyText>
            <Legenda>
              <LegendaItem $nivel="leve">até 3 dias</LegendaItem>
              <LegendaItem $nivel="media">4 a 10</LegendaItem>
              <LegendaItem $nivel="critica">mais de 10</LegendaItem>
            </Legenda>
            <ListaSimples>
              {itens.map((m) => (
                <AprovacaoLinha
                  key={`${m.projeto_id}-${m.projeto_escopo_id}-${m.tipo}`}
                  dias={m.dias}
                  unidade={m.dias === 1 ? "dia" : "dias"}
                  titulo={
                    <AtrasoTitulo>
                      <LinkProjeto
                        to={`/projetos/${m.projeto_id}/cronograma`}
                        state={{ voltarPara, voltarRotulo }}
                      >
                        {m.projeto_nome} — {m.escopo}
                      </LinkProjeto>
                      <Pilula $tom={nivel(m.dias) === "critica" ? "alerta" : "atencao"}>
                        banca vencida
                      </Pilula>
                    </AtrasoTitulo>
                  }
                  acoes={
                    justificando === m ? (
                      <FormDecisao
                        rotuloConfirmar="Registrar o porquê"
                        onCancelar={() => setJustificando(null)}
                        onConfirmar={async (texto) => {
                          if (!token) return;
                          await registrarJustificativaAtraso(
                            m.projeto_id,
                            texto,
                            token,
                            m.projeto_escopo_id ?? undefined,
                            m.tipo,
                          );
                          setJustificando(null);
                          onJustificou();
                        }}
                      />
                    ) : m.justificado ? (
                      <PageButtonSm
                        as={Link}
                        to={`/projetos/${m.projeto_id}/historico`}
                        $variant="ghost"
                      >
                        Já justificado
                      </PageButtonSm>
                    ) : (
                      <PageButtonSm
                        type="button"
                        $variant="outline"
                        onClick={() => setJustificando(m)}
                      >
                        Justificar
                      </PageButtonSm>
                    )
                  }
                >
                  <AprovacaoMeta>
                    <span>
                      venceu em <strong>{m.data_referencia ? formatarData(m.data_referencia) : "—"}</strong>
                    </span>
                    <span>projeto em {m.status.replace(/_/g, " ")}</span>
                  </AprovacaoMeta>
                </AprovacaoLinha>
              ))}
            </ListaSimples>
          </>
        )}
      </PageCardContent>
    </PageCard>
  );
}

/* ------------------------------------------------------------------ */

function CardAlemDoVendido({
  itens,
  onJustificou,
  voltarPara,
  voltarRotulo,
}: {
  itens: Atrasos["escopos_atrasados"];
  onJustificou: () => void;
  voltarPara: string;
  voltarRotulo: string;
}) {
  const { token } = useAuth();
  const [justificando, setJustificando] = useState<number | null>(null);

  return (
    <PageCard id="alem-do-vendido">
      <PageCardHeader>
        <PageCardTitle>Além do vendido{itens.length > 0 && ` (${itens.length})`}</PageCardTitle>
      </PageCardHeader>
      <PageCardContent>
        {itens.length === 0 ? (
          <EmptyText>Nenhum escopo passou do tempo que foi vendido.</EmptyText>
        ) : (
          <>
            <EmptyText style={{ marginBottom: "0.5rem" }}>
              Dias úteis consumidos acima de vendidos + ajustados, descontando pausas. A
              contagem congela quando a banca acontece. <strong>Não é atraso de marco</strong>,
              nenhum destes escopos entra na conta de projetos atrasados.
            </EmptyText>
            <ListaSimples>
              {itens.map((e) => (
                <AprovacaoLinha
                  key={e.projeto_escopo_id}
                  dias={e.dias}
                  // A unidade que separa esta régua da outra, no próprio número.
                  unidade="além"
                  titulo={
                    <AtrasoTitulo>
                      <LinkProjeto
                        to={`/projetos/${e.projeto_id}/cronograma`}
                        state={{ voltarPara, voltarRotulo }}
                      >
                        {e.projeto_nome} — {e.escopo_nome}
                      </LinkProjeto>
                      <Pilula $tom="neutro">
                        +{e.dias} sobre {e.dias_vendidos + e.dias_ajustados}
                      </Pilula>
                    </AtrasoTitulo>
                  }
                  acoes={
                    justificando === e.projeto_escopo_id ? (
                      <FormDecisao
                        rotuloConfirmar="Registrar o porquê"
                        onCancelar={() => setJustificando(null)}
                        onConfirmar={async (texto) => {
                          if (!token) return;
                          await registrarJustificativaAtraso(
                            e.projeto_id,
                            texto,
                            token,
                            e.projeto_escopo_id,
                            "escopo",
                          );
                          setJustificando(null);
                          onJustificou();
                        }}
                      />
                    ) : e.justificativa ? (
                      <PageButtonSm
                        as={Link}
                        to={`/projetos/${e.projeto_id}/historico`}
                        $variant="ghost"
                      >
                        Já justificado
                      </PageButtonSm>
                    ) : (
                      <PageButtonSm
                        type="button"
                        $variant="outline"
                        onClick={() => setJustificando(e.projeto_escopo_id)}
                      >
                        Justificar
                      </PageButtonSm>
                    )
                  }
                >
                  <AprovacaoMeta>
                    {/* Vendidos e ajustados nunca somados num número só: a
                        diferença entre ter vendido 30 e ter vendido 20 e
                        precisado de mais 10 é a informação inteira. */}
                    <span>
                      <strong>{e.dias_vendidos}</strong> vendidos
                      {e.dias_ajustados > 0 && (
                        <>
                          {" "}
                          + <strong>{e.dias_ajustados}</strong> ajustados
                        </>
                      )}
                    </span>
                    {e.registrado_em && (
                      <span>explicado em {formatarData(e.registrado_em)}</span>
                    )}
                  </AprovacaoMeta>

                  {e.justificativa && (
                    <AprovacaoCitacao>
                      {e.justificativa}
                      {e.registrado_por ? `, ${e.registrado_por}` : ""}
                    </AprovacaoCitacao>
                  )}
                </AprovacaoLinha>
              ))}
            </ListaSimples>
          </>
        )}
      </PageCardContent>
    </PageCard>
  );
}
