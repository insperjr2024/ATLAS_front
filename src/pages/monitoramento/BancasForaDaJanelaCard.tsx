import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { decidirForaJanela } from "@/lib/bancas";
import { formatarData, formatarDataHora } from "@/lib/projetos";
import type { AprovacaoForaDaJanela } from "@/lib/monitoramento";
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
 * ⭐ §13: a fila de bancas fora da janela do escopo, para quem as decide.
 *
 * ⚠ **O atalho que isto fecha.** Marcar fora da janela era um ato só: só
 * quem tinha `posicao === "diretor"` conseguia, e marcava sozinho, na mesma
 * chamada que gravava a data — pedido e decisão eram a mesma pessoa no mesmo
 * clique. Agora quem marca pede aqui, com justificativa, e a diretoria
 * decide depois — mesmo desenho da fila de choque de horário ao lado.
 *
 * A resposta é obrigatória nos dois sentidos, mesmo motivo das outras filas:
 * recusar sem motivo deixa quem pediu sem saber o que mudar, e aprovar sem
 * motivo apaga por que o §13 foi aberto naquele caso.
 */
export function BancasForaDaJanelaCard({
  itens,
  onDecidiu,
}: {
  itens: AprovacaoForaDaJanela[];
  onDecidiu: () => void;
}) {
  const { token } = useAuth();
  const [decidindo, setDecidindo] = useState<{ id: number; aprovar: boolean } | null>(null);

  return (
    <PageCard id="fila-fora-da-janela">
      <PageCardHeader>
        <PageCardTitle>
          Bancas fora da janela{itens.length > 0 && ` (${itens.length})`}
        </PageCardTitle>
      </PageCardHeader>
      <PageCardContent>
        {itens.length === 0 ? (
          <EmptyText>Nenhum pedido de autorização aguardando decisão.</EmptyText>
        ) : (
          <ListaSimples>
            {itens.map((p) => (
              <AprovacaoLinha
                key={p.id}
                desde={p.criado_em}
                titulo={
                  <AtrasoTitulo>
                    <LinkProjeto to={`/projetos/${p.projeto_id}/cronograma`}>
                      {p.projeto_nome}
                      {p.escopo_nome ? ` — ${p.escopo_nome}` : ""}
                    </LinkProjeto>
                    {p.fim_janela && (
                      <Pilula $tom="alerta">janela até {formatarData(p.fim_janela)}</Pilula>
                    )}
                  </AtrasoTitulo>
                }
                acoes={
                  decidindo?.id === p.id ? (
                    <FormDecisao
                      rotuloConfirmar={decidindo.aprovar ? "Confirmar autorização" : "Confirmar recusa"}
                      onCancelar={() => setDecidindo(null)}
                      onConfirmar={async (texto) => {
                        if (!token) return;
                        await decidirForaJanela(p.id, { aprovar: decidindo.aprovar, resposta: texto }, token);
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
                        Autorizar
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
                    quer <strong>{formatarDataHora(p.data_hora_pretendida)}</strong>
                  </span>
                  <span>
                    {p.solicitado_por_nome ?? "coordenador"} em {formatarData(p.criado_em)}
                  </span>
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
