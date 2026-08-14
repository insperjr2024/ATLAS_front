import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { registrarResultado } from "@/lib/bancas";
import { formatarData } from "@/lib/projetos";
import type { AprovacaoBancaSemResultado } from "@/lib/monitoramento";
import {
  PageCard,
  PageCardHeader,
  PageCardTitle,
  PageCardContent,
  PageButtonSm,
  EmptyText,
} from "@/styles/page.styled";
import {
  AprovacaoMeta,
  AtrasoTitulo,
  LinkProjeto,
  ListaSimples,
  Pilula,
} from "./Monitoramento.styled";
import { AprovacaoLinha, FormDecisao } from "./AprovacaoLinha";

/**
 * §5.5: a banca aconteceu e ninguém registrou o veredito.
 *
 * ⭐ **É o bloqueio mais duro do sistema.** Sem veredito a entrega ao cliente
 * não libera: o escopo fica parado. O caminho normal é o voto dos avaliadores,
 * que apura sozinho — o que cai aqui é o que o voto não resolveu.
 *
 * ⭐ **A urna é o contexto que faltava.** A linha dizia "projeto — escopo,
 * realizada em 22/07", e duas situações que exigem respostas OPOSTAS ficavam
 * idênticas: *ninguém votou e o prazo venceu* (a diretoria decide no lugar
 * deles) e *falta um voto e o prazo corre* (a diretoria cobra, não decide).
 *
 * ⚠ **O botão de veredito não existe enquanto o prazo corre.** Registrar o
 * resultado é a rota de EXCEÇÃO — botão à mão é botão usado, e usá-lo com a
 * votação aberta é atropelar os avaliadores. Enquanto `prazo_vencido` é
 * falso, a linha mostra quantos votos faltam e até quando, e só oferece o
 * caminho de ir cobrar.
 */
export function BancasSemResultadoCard({
  itens,
  onDecidiu,
}: {
  itens: AprovacaoBancaSemResultado[];
  onDecidiu: () => void;
}) {
  const { token } = useAuth();
  const [decidindo, setDecidindo] = useState<{ id: number; aprovada: boolean } | null>(null);

  return (
    <PageCard id="fila-bancas">
      <PageCardHeader>
        <PageCardTitle>Bancas sem resultado{itens.length > 0 && ` (${itens.length})`}</PageCardTitle>
      </PageCardHeader>
      <PageCardContent>
        {itens.length === 0 ? (
          <EmptyText>Toda banca realizada já tem o veredito registrado.</EmptyText>
        ) : (
          <>
            {/* ⚠ A explicação fica AQUI, uma vez. Ela estava dentro de cada
                item, e como é a mesma frase para todos, oito linhas viravam
                oito cópias do mesmo parágrafo — parede de texto no lugar de
                contexto. O que muda de item para item já está na linha de
                fatos e na pílula. */}
            <EmptyText style={{ marginBottom: "0.75rem" }}>
              O veredito normal vem do voto dos avaliadores. Enquanto o prazo corre, a fila só
              mostra quanto falta; passado o prazo sem a urna fechar, só a diretoria destrava.
            </EmptyText>
            <ListaSimples>
            {itens.map((b) => {
              const { recebidos, esperados, aprovacoes, reprovacoes, motivo } = b.apuracao;
              const escopos = b.escopos?.length
                ? b.escopos.map((e) => e.nome).join(", ")
                : b.escopo_nome;

              // A pílula diz por que ainda não há veredito — não repete a data.
              const pilula =
                motivo === "empate" ? (
                  <Pilula $tom="atencao">
                    empate {aprovacoes}×{reprovacoes}
                  </Pilula>
                ) : motivo === "sem_votos" ? (
                  <Pilula $tom="alerta">ninguém votou</Pilula>
                ) : motivo === "maioria" ? (
                  <Pilula $tom="ok">
                    maioria {aprovacoes}×{reprovacoes}
                  </Pilula>
                ) : (
                  <Pilula $tom="neutro">
                    {recebidos} de {esperados} votaram
                  </Pilula>
                );

              return (
                <AprovacaoLinha
                  key={b.banca_id}
                  desde={b.realizado_em}
                  titulo={
                    <AtrasoTitulo>
                      <LinkProjeto to={`/projetos/${b.projeto_id}/banca`}>
                        {b.projeto_nome} — {escopos}
                      </LinkProjeto>
                      {pilula}
                    </AtrasoTitulo>
                  }
                  acoes={
                    decidindo?.id === b.banca_id ? (
                      <FormDecisao
                        rotuloConfirmar={
                          decidindo.aprovada ? "Confirmar aprovada" : "Confirmar não aprovada"
                        }
                        exigeTexto={false}
                        aviso={
                          <EmptyText>
                            Isto registra o veredito <strong>no lugar dos avaliadores</strong> e
                            {decidindo.aprovada ? " libera" : " mantém travada"} a entrega ao
                            cliente.
                          </EmptyText>
                        }
                        onCancelar={() => setDecidindo(null)}
                        onConfirmar={async () => {
                          if (!token) return;
                          await registrarResultado(
                            b.banca_id,
                            decidindo.aprovada ? "aprovada" : "nao_aprovada",
                            token,
                          );
                          setDecidindo(null);
                          onDecidiu();
                        }}
                      />
                    ) : b.prazo_vencido ? (
                      <>
                        <PageButtonSm
                          type="button"
                          $variant="outline"
                          onClick={() => setDecidindo({ id: b.banca_id, aprovada: true })}
                        >
                          Aprovada
                        </PageButtonSm>
                        <PageButtonSm
                          type="button"
                          $variant="ghost"
                          onClick={() => setDecidindo({ id: b.banca_id, aprovada: false })}
                        >
                          Não aprovada
                        </PageButtonSm>
                      </>
                    ) : (
                      // Prazo aberto: os avaliadores ainda podem votar.
                      <PageButtonSm
                        as={Link}
                        to={`/projetos/${b.projeto_id}/banca`}
                        $variant="outline"
                      >
                        Ver a banca
                      </PageButtonSm>
                    )
                  }
                >
                  <AprovacaoMeta>
                    <span>
                      realizada em <strong>{formatarData(b.realizado_em)}</strong>
                    </span>
                    <span>
                      <strong>{recebidos}</strong> de <strong>{esperados}</strong> votaram
                    </span>
                    <span>
                      {b.prazo_vencido ? (
                        <>
                          prazo venceu em <em>{formatarData(b.prazo_avaliacao_em)}</em>
                        </>
                      ) : (
                        <>prazo até {formatarData(b.prazo_avaliacao_em)}</>
                      )}
                    </span>
                  </AprovacaoMeta>
                </AprovacaoLinha>
              );
              })}
            </ListaSimples>
          </>
        )}
      </PageCardContent>
    </PageCard>
  );
}
