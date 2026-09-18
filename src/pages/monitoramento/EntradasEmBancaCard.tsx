import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { decidirEntradaBanca } from "@/lib/bancas";
import { formatarDataHora } from "@/lib/projetos";
import type { AprovacaoEntradaBanca } from "@/lib/monitoramento";
import {
  PageCard,
  PageCardHeader,
  PageCardTitle,
  PageCardContent,
  PageButtonSm,
  EmptyText,
} from "@/styles/page.styled";
import {
  AprovacaoCitacao,
  AprovacaoMeta,
  AtrasoTitulo,
  LinkProjeto,
  ListaSimples,
  Pilula,
} from "./Monitoramento.styled";
import { AprovacaoLinha, FormDecisao } from "./AprovacaoLinha";

/**
 * ⭐ 2026-09-18, a pedido: a fila de quem pediu para entrar numa banca sem
 * vaga livre — banca no teto, ou a última vaga reservada pro piso por frente
 * que a pessoa não cobre.
 *
 * ⚠ **Não confundir com "Pedidos de entrada"** (`EntradasEmProjetoCard`),
 * que é sobre entrar num PROJETO via Vagas. Esta é sobre entrar como
 * avaliador numa BANCA já marcada.
 *
 * ⭐ **Aprovar CRIA a candidatura**, acima do teto normal — é o próprio ponto
 * do pedido: a diretoria decidiu que vale a pena, e a banca fica com mais
 * gente que o máximo sem problema nenhum.
 */
export function EntradasEmBancaCard({
  itens,
  onDecidiu,
}: {
  itens: AprovacaoEntradaBanca[];
  onDecidiu: () => void;
}) {
  const { token } = useAuth();
  const [decidindo, setDecidindo] = useState<{ id: number; aprovar: boolean } | null>(null);

  return (
    <PageCard id="fila-entradas-em-banca">
      <PageCardHeader>
        <PageCardTitle>
          Entradas em banca{itens.length > 0 && ` (${itens.length})`}
        </PageCardTitle>
      </PageCardHeader>
      <PageCardContent>
        {itens.length === 0 ? (
          <EmptyText>Nenhum pedido de entrada em banca aguardando decisão.</EmptyText>
        ) : (
          <ListaSimples>
            {itens.map((p) => (
              <AprovacaoLinha
                key={p.id}
                desde={p.criado_em}
                titulo={
                  <AtrasoTitulo>
                    {p.projeto_id ? (
                      <LinkProjeto to={`/projetos/${p.projeto_id}/banca`}>{p.projeto_nome}</LinkProjeto>
                    ) : (
                      <span>{p.projeto_nome}</span>
                    )}
                    <Pilula $tom="alerta">
                      {p.alocados}/{p.vagas} alocados
                    </Pilula>
                  </AtrasoTitulo>
                }
                acoes={
                  decidindo?.id === p.id ? (
                    <FormDecisao
                      rotuloConfirmar={decidindo.aprovar ? `Aprovar e alocar ${p.usuario_nome ?? ""}` : "Confirmar recusa"}
                      aviso={
                        decidindo.aprovar ? (
                          <AprovacaoMeta>
                            <span>
                              Confirmar já <strong>coloca {p.usuario_nome ?? "esta pessoa"} na banca</strong>,
                              acima do teto normal.
                            </span>
                          </AprovacaoMeta>
                        ) : undefined
                      }
                      onCancelar={() => setDecidindo(null)}
                      onConfirmar={async (texto) => {
                        if (!token) return;
                        await decidirEntradaBanca(p.id, { aprovar: decidindo.aprovar, resposta: texto }, token);
                        setDecidindo(null);
                        onDecidiu();
                      }}
                    />
                  ) : (
                    <>
                      <PageButtonSm
                        type="button"
                        $variant="outline"
                        onClick={() => setDecidindo({ id: p.id, aprovar: true })}
                      >
                        Aprovar
                      </PageButtonSm>
                      <PageButtonSm
                        type="button"
                        $variant="ghost"
                        onClick={() => setDecidindo({ id: p.id, aprovar: false })}
                      >
                        Negar
                      </PageButtonSm>
                    </>
                  )
                }
              >
                <AprovacaoMeta>
                  <span>
                    <strong>{p.usuario_nome ?? "alguém"}</strong> quer entrar
                    {p.frentes.length > 0 ? ` (${p.frentes.join(", ")})` : ""}
                  </span>
                  {p.data_hora && <span>{formatarDataHora(p.data_hora)}</span>}
                </AprovacaoMeta>

                <AprovacaoCitacao>{p.justificativa}</AprovacaoCitacao>
              </AprovacaoLinha>
            ))}
          </ListaSimples>
        )}
      </PageCardContent>
    </PageCard>
  );
}
