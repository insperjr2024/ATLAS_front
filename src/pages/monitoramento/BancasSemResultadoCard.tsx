import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { quemPodeAprovar, registrarAprovacaoBanca } from "@/lib/bancas";
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
 * §5.5: a banca aconteceu e ainda espera uma decisão (diretoria de projetos
 * ou gerente da frente, `use_cases/banca/aprovar_banca.py`).
 *
 * Qualquer um decide sozinho: diretoria ou o gerente de qualquer frente da
 * banca aprova ou reprova, sem esperar mais ninguém. Não há "prazo aberto,
 * ainda dá para esperar": a decisão é sempre possível assim que a banca
 * aconteceu, por isso toda linha já oferece Aprovar e Reprovar direto.
 */
export function BancasSemResultadoCard({
  itens,
  onDecidiu,
}: {
  itens: AprovacaoBancaSemResultado[];
  onDecidiu: () => void;
}) {
  const { token } = useAuth();
  const [decidindo, setDecidindo] = useState<{ bancaId: number; aprovado: boolean } | null>(null);

  return (
    <PageCard id="fila-bancas">
      <PageCardHeader>
        <PageCardTitle>Bancas sem resultado{itens.length > 0 && ` (${itens.length})`}</PageCardTitle>
      </PageCardHeader>
      <PageCardContent>
        {itens.length === 0 ? (
          <EmptyText>Toda banca realizada já tem resultado registrado.</EmptyText>
        ) : (
          <ListaSimples>
            {itens.map((b) => {
              const escopos = b.escopos?.length
                ? b.escopos.map((e) => e.nome).join(", ")
                : b.escopo_nome;

              return (
                <AprovacaoLinha
                  key={b.banca_id}
                  desde={b.realizado_em}
                  titulo={
                    <AtrasoTitulo>
                      <LinkProjeto to={`/projetos/${b.projeto_id}/banca`}>
                        {b.projeto_nome}
                      </LinkProjeto>
                      <Pilula $tom="atencao">aguardando decisão</Pilula>
                    </AtrasoTitulo>
                  }
                  acoes={
                    decidindo?.bancaId === b.banca_id ? (
                      <FormDecisao
                        rotuloConfirmar={
                          decidindo.aprovado ? "Confirmar aprovação" : "Confirmar reprovação"
                        }
                        exigeTexto={false}
                        aviso={
                          <EmptyText>
                            Sua decisão sozinha já fecha o resultado da banca, sem esperar mais
                            ninguém.
                          </EmptyText>
                        }
                        onCancelar={() => setDecidindo(null)}
                        onConfirmar={async () => {
                          if (!token) return;
                          await registrarAprovacaoBanca(b.banca_id, decidindo.aprovado, null, token);
                          setDecidindo(null);
                          onDecidiu();
                        }}
                      />
                    ) : (
                      <>
                        <PageButtonSm
                          type="button"
                          onClick={() => setDecidindo({ bancaId: b.banca_id, aprovado: true })}
                        >
                          Aprovar
                        </PageButtonSm>
                        <PageButtonSm
                          type="button"
                          $variant="ghost"
                          onClick={() => setDecidindo({ bancaId: b.banca_id, aprovado: false })}
                        >
                          Reprovar
                        </PageButtonSm>
                      </>
                    )
                  }
                >
                  <AprovacaoMeta>
                    <span>
                      escopo: <strong>{escopos}</strong>
                    </span>
                    <span>
                      realizada em <strong>{formatarData(b.realizado_em)}</strong>
                    </span>
                  </AprovacaoMeta>
                  <AprovacaoMeta>
                    <span>
                      pode aprovar: <strong>{quemPodeAprovar(b)}</strong>
                    </span>
                  </AprovacaoMeta>
                </AprovacaoLinha>
              );
            })}
          </ListaSimples>
        )}
      </PageCardContent>
    </PageCard>
  );
}
