import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { responderSolicitacao } from "@/lib/vagas";
import { formatarData } from "@/lib/projetos";
import type { AprovacaoEntrada } from "@/lib/monitoramento";
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

/** §7.3: a partir de quantos projetos a carga vira assunto na decisão. */
const CARGA_ALTA = 3;

/**
 * Alguém pediu para entrar num projeto e está parado esperando.
 *
 * ⭐ **Decide aqui.** O argumento antigo para mandar a pessoa a "Vagas" era
 * que decidir sem ver a carga é decidir no escuro — mas a carga já vinha no
 * payload, só não estava em lugar nenhum da decisão. Com ela na linha, o
 * motivo de sair da tela deixou de existir.
 *
 * ⚠ **A assimetria é de propósito.** Aceitar não pede texto: a pessoa entra,
 * e o registro é a própria entrada na equipe. Recusar pede — quem foi
 * recusado merece saber por quê, e é a única coisa que sobra do pedido.
 */
export function EntradasEmProjetoCard({
  itens,
  onDecidiu,
}: {
  itens: AprovacaoEntrada[];
  onDecidiu: () => void;
}) {
  const { token } = useAuth();
  const [decidindo, setDecidindo] = useState<{ id: number; aceitar: boolean } | null>(null);

  return (
    <PageCard id="fila-entradas">
      <PageCardHeader>
        <PageCardTitle>
          Solicitações de entrada em projeto{itens.length > 0 && ` (${itens.length})`}
        </PageCardTitle>
      </PageCardHeader>
      <PageCardContent>
        {itens.length === 0 ? (
          <EmptyText>Ninguém esperando para entrar num projeto.</EmptyText>
        ) : (
          <ListaSimples>
            {itens.map((s) => {
              const carga = s.carga_do_solicitante;
              return (
                <AprovacaoLinha
                  key={s.id}
                  desde={s.criado_em}
                  titulo={
                    <AtrasoTitulo>
                      <LinkProjeto to={`/projetos/${s.projeto_id}`}>
                        {s.usuario_nome ?? "Alguém"} → {s.projeto_nome}
                      </LinkProjeto>
                      {/* A carga é o contexto da decisão: aceitar alguém que
                          já está em quatro projetos é outra conversa. */}
                      <Pilula $tom={carga >= CARGA_ALTA ? "atencao" : "neutro"}>
                        {carga} {carga === 1 ? "projeto" : "projetos"}
                      </Pilula>
                    </AtrasoTitulo>
                  }
                  acoes={
                    decidindo?.id === s.id ? (
                      <FormDecisao
                        rotuloConfirmar={decidindo.aceitar ? "Confirmar entrada" : "Confirmar recusa"}
                        exigeTexto={!decidindo.aceitar}
                        aviso={
                          decidindo.aceitar ? (
                            <EmptyText>
                              <strong>{s.usuario_nome ?? "A pessoa"}</strong> entra como
                              consultor(a) em {s.projeto_nome} agora.
                            </EmptyText>
                          ) : undefined
                        }
                        onCancelar={() => setDecidindo(null)}
                        onConfirmar={async (texto) => {
                          if (!token) return;
                          await responderSolicitacao(s.id, decidindo.aceitar, token, texto || undefined);
                          setDecidindo(null);
                          onDecidiu();
                        }}
                      />
                    ) : (
                      <>
                        <PageButtonSm
                          type="button"
                          $variant="outline"
                          onClick={() => setDecidindo({ id: s.id, aceitar: true })}
                        >
                          Aceitar no time
                        </PageButtonSm>
                        <PageButtonSm
                          type="button"
                          $variant="ghost"
                          onClick={() => setDecidindo({ id: s.id, aceitar: false })}
                        >
                          Recusar
                        </PageButtonSm>
                      </>
                    )
                  }
                >
                  <AprovacaoMeta>
                    <span>
                      já está em{" "}
                      {carga >= CARGA_ALTA ? <em>{carga} projetos</em> : <strong>{carga}</strong>}
                      {carga < CARGA_ALTA && (carga === 1 ? " projeto" : " projetos")}
                    </span>
                    <span>pediu em {formatarData(s.criado_em)}</span>
                  </AprovacaoMeta>

                  <AprovacaoCitacao>{s.justificativa}</AprovacaoCitacao>
                </AprovacaoLinha>
              );
            })}
          </ListaSimples>
        )}
      </PageCardContent>
    </PageCard>
  );
}
