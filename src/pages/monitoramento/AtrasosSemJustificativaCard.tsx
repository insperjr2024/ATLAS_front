import { useState } from "react";
import styled from "styled-components";
import { theme } from "@/styles/theme";
import { useAuth } from "@/context/AuthContext";
import {
  formatarData,
  pedirJustificativaAtraso,
  registrarJustificativaAtraso,
} from "@/lib/projetos";
import type { AprovacaoAtraso, MotivoDeAtraso } from "@/lib/monitoramento";
import {
  ErrorText,
  PageCard,
  PageCardHeader,
  PageCardTitle,
  PageCardContent,
  EmptyText,
} from "@/styles/page.styled";
import {
  AprovacaoMeta,
  AtrasoTitulo,
  LinkProjeto,
  ListaSimples,
  MotivoDias,
  MotivoEscopoNome,
  MotivoItem,
  MotivoJustificarBtn,
  MotivoJustificadoBadge,
  MotivoLista,
  MotivoTag,
  Pilula,
} from "./Monitoramento.styled";
import { AprovacaoLinha, FormDecisao } from "./AprovacaoLinha";

/** Os dois caminhos do §7.4 lado a lado, na última coluna do motivo. */
const AcoesDoMotivo = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  justify-self: end;
`;

/**
 * "aguardando desde 13/08" — o pedido já feito.
 *
 * ⚠ Não é o `MotivoJustificadoBadge`: aquele é um `Link` (leva à nota no
 * histórico) e exige `to`. Aqui não há nota nenhuma para onde ir ainda — é
 * justamente o que se está esperando.
 */
const MotivoAguardando = styled.span`
  justify-self: end;
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
  white-space: nowrap;
  cursor: help;
`;

/** Os mesmos cortes da aba Atrasos — a régua do atraso é uma só. */
function nivel(dias: number) {
  if (dias > 10) return "critica" as const;
  if (dias > 3) return "media" as const;
  return "leve" as const;
}

/**
 * §7.4: o alerta de atraso é automático, o porquê é a diretoria quem digita.
 *
 * ⭐ **A nota é POR MOTIVO, não por projeto.** O mesmo projeto pode ter uma
 * banca vencida num escopo e a janela estourada em outro, e cada um pede uma
 * explicação diferente. A fila mandava para a página do projeto com uma frase
 * corrida ("banca de X venceu · escopo Y estourou") — sem saber qual escopo
 * nem quantos dias, não dava para escrever nada específico sem abrir tudo.
 *
 * ⚠ **A escala aqui é a do ATRASO, não a da espera.** Nos outros cards o
 * número da esquerda mede há quantos dias o item está na fila; aqui ele mede
 * o atraso do cronograma, que é o que a nota vai explicar. Por isso a coluna
 * usa o pior motivo e não a data de entrada.
 */
export function AtrasosSemJustificativaCard({
  itens,
  onDecidiu,
}: {
  itens: AprovacaoAtraso[];
  onDecidiu: () => void;
}) {
  const { token } = useAuth();
  const [justificando, setJustificando] = useState<{
    projetoId: number;
    motivo: MotivoDeAtraso;
  } | null>(null);
  const [pedindo, setPedindo] = useState<number | null>(null);
  const [erro, setErro] = useState("");

  return (
    <PageCard id="fila-atrasos">
      <PageCardHeader>
        <PageCardTitle>
          Atrasos sem justificativa{itens.length > 0 && ` (${itens.length})`}
        </PageCardTitle>
      </PageCardHeader>
      <PageCardContent>
        {itens.length === 0 ? (
          // ⚠ O vazio dizia só "Todo projeto atrasado já tem o porquê
          // registrado" — quem abria num dia calmo não tinha como saber o que
          // esta seção cobre nem por que ela existe.
          <EmptyText>
            Nada a cobrar. Aqui aparece todo projeto com <strong>banca vencida</strong> — a
            data passou e ela não aconteceu — sem que ninguém tenha registrado o porquê. O
            alerta é automático; a explicação é você quem pede ao coordenador ou escreve, e
            ela fica no histórico do projeto.
          </EmptyText>
        ) : (
          <>
            <EmptyText style={{ marginBottom: "0.75rem" }}>
              §7.4: o alerta de atraso é automático, o porquê não. Peça a explicação ao
              coordenador — ele recebe o aviso e responde na página do projeto — ou escreva
              você mesma, se já souber. Nos dois casos a nota fica no histórico.
            </EmptyText>
            {erro && <ErrorText>{erro}</ErrorText>}
            <ListaSimples>
            {itens.map((a) => (
              <AprovacaoLinha
                key={a.projeto_id}
                // ⚠ A coluna mede o PIOR motivo, não a espera: é o número que
                // ordena a lista e o que a nota vai explicar. O componente
                // recebe data, então converte-se o número em data de origem.
                desde={new Date(Date.now() - a.pior_motivo * 86_400_000).toISOString()}
                titulo={
                  <AtrasoTitulo>
                    <LinkProjeto to={`/projetos/${a.projeto_id}`}>{a.projeto_nome}</LinkProjeto>
                    <Pilula $tom="neutro">{a.status.replace(/_/g, " ")}</Pilula>
                  </AtrasoTitulo>
                }
                acoes={
                  justificando && justificando.projetoId === a.projeto_id ? (
                    <FormDecisao
                      rotuloConfirmar="Registrar o porquê"
                      aviso={
                        <EmptyText>
                          Sobre <strong>{justificando.motivo.descricao}</strong>. Vai para o
                          histórico do projeto.
                        </EmptyText>
                      }
                      onCancelar={() => setJustificando(null)}
                      onConfirmar={async (texto) => {
                        if (!token) return;
                        await registrarJustificativaAtraso(
                          a.projeto_id,
                          texto,
                          token,
                          justificando.motivo.projeto_escopo_id ?? undefined,
                          justificando.motivo.tipo,
                        );
                        setJustificando(null);
                        onDecidiu();
                      }}
                    />
                  ) : (
                    <EmptyText>
                      {a.motivos.filter((m) => !m.justificado).length} sem resposta
                    </EmptyText>
                  )
                }
              >
                <AprovacaoMeta>
                  <span>
                    pior motivo: <em>{a.pior_motivo} dias</em>
                  </span>
                  {a.motivos.length > 1 && (
                    <span>
                      <strong>{a.motivos.length}</strong> motivos
                    </span>
                  )}
                </AprovacaoMeta>

                {/* Um botão por motivo: é o que permite escrever a nota certa
                    para o escopo certo sem abrir o projeto. */}
                <MotivoLista>
                  {a.motivos.map((m, i) => (
                    <MotivoItem key={`${m.tipo}-${m.projeto_escopo_id ?? i}`}>
                      <MotivoTag>{m.tipo}</MotivoTag>
                      <MotivoEscopoNome>{m.escopo ?? "o projeto"}</MotivoEscopoNome>
                      <MotivoDias $nivel={nivel(m.dias)}>
                        {m.dias === 0 ? "venceu hoje" : `${m.dias} d`}
                      </MotivoDias>
                      <span>{m.data_referencia ? formatarData(m.data_referencia) : "—"}</span>
                      {m.justificado ? (
                        <MotivoJustificadoBadge
                          to={`/projetos/${a.projeto_id}/historico`}
                          title="Já respondido — ver a nota no histórico"
                        >
                          ✓ justificado
                        </MotivoJustificadoBadge>
                      ) : m.pedido_em ? (
                        // Já cobrado: mostra desde quando, para a diretoria não
                        // perguntar duas vezes a mesma coisa.
                        <MotivoAguardando
                          title={`A explicação foi pedida ao coordenador em ${formatarData(m.pedido_em)}`}
                        >
                          aguardando desde {formatarData(m.pedido_em)}
                        </MotivoAguardando>
                      ) : (
                        <AcoesDoMotivo>
                          {/* ⭐ Pedir vem primeiro: o §7.4 diz que a diretoria
                              PERGUNTA ao coordenador. Escrever direto é o
                              caminho de quem já sabe o porquê. */}
                          <MotivoJustificarBtn
                            type="button"
                            $variant="outline"
                            disabled={pedindo === a.projeto_id}
                            onClick={async () => {
                              if (!token) return;
                              setErro("");
                              setPedindo(a.projeto_id);
                              try {
                                await pedirJustificativaAtraso(a.projeto_id, token, {
                                  projeto_escopo_id: m.projeto_escopo_id,
                                  tipo: m.tipo,
                                  sobre: m.descricao,
                                });
                                onDecidiu();
                              } catch (err) {
                                setErro(
                                  err instanceof Error ? err.message : "Não foi possível pedir",
                                );
                              } finally {
                                setPedindo(null);
                              }
                            }}
                          >
                            Pedir ao coordenador
                          </MotivoJustificarBtn>
                          <MotivoJustificarBtn
                            type="button"
                            $variant="ghost"
                            onClick={() => setJustificando({ projetoId: a.projeto_id, motivo: m })}
                          >
                            Escrever
                          </MotivoJustificarBtn>
                        </AcoesDoMotivo>
                      )}
                    </MotivoItem>
                  ))}
                </MotivoLista>
              </AprovacaoLinha>
            ))}
            </ListaSimples>
          </>
        )}
      </PageCardContent>
    </PageCard>
  );
}
