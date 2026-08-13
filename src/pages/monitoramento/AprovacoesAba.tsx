import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getAprovacoes, type Aprovacoes } from "@/lib/monitoramento";
import { formatarData } from "@/lib/projetos";
import { ExcecoesDeChoqueCard } from "./ExcecoesDeChoqueCard";
import { PedidosDeDiasCard } from "./PedidosDeDiasCard";
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
import { ItemLista, LinkProjeto, ListaSimples, Pilula } from "./Monitoramento.styled";

/**
 * ⭐ A fila da diretoria — tudo que espera decisão dela, num lugar só.
 *
 * O problema que esta aba resolve não é de dado, é de descoberta. As decisões
 * estavam espalhadas: o pedido de dias num card da Visão geral e a
 * justificativa de atraso dentro da aba Atrasos. Fila que ninguém sabe que
 * existe é fila parada — dois pedidos chegaram a ficar represados sem ninguém
 * notar.
 *
 * ⚠ **Nem toda ação restrita à diretoria é uma aprovação.** Criar formulário,
 * configurar coluna do kanban e excluir usuário também são só dela, e nenhuma
 * entra aqui: são coisas que ela FAZ quando quer, não coisas que esperam por
 * ela. O critério é ter alguém do outro lado bloqueado enquanto não houver
 * resposta.
 *
 * ⭐ **As cinco filas aparecem sempre, mesmo vazias.** Uma tela que só surge
 * quando há problema não ensina o que ela cobre — e era isso que acontecia
 * quando tudo resolvido virava um único "Nada esperando por você".
 *
 * Três delas **não decidem aqui**: levam ao lugar onde a decisão tem
 * contexto. Justificar um atraso sem ver os motivos, aceitar alguém sem ver a
 * carga dele, ou dar veredito sem ver a banca é decidir no escuro. A aba
 * responde "o que falta?"; a tela de destino responde "por quê?". Só o pedido
 * de dias e a exceção de choque se decidem na própria lista, porque o motivo
 * escrito (e, no choque, com qual banca ela conflita) é todo o contexto de que
 * a decisão precisa.
 */
export function AprovacoesAba() {
  const { token } = useAuth();
  const [dados, setDados] = useState<Aprovacoes | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    if (!token) return;
    setErro("");
    try {
      setDados(await getAprovacoes(token));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar as aprovações");
    } finally {
      setCarregando(false);
    }
  }, [token]);

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

  // ⭐ **As quatro filas aparecem SEMPRE, mesmo vazias.**
  //
  // Antes, com tudo resolvido, a aba inteira era substituída por um card
  // "Nada esperando por você". Isso escondia o que a tela cobre: quem abrisse
  // num dia calmo não tinha como saber que ela também vigia solicitações de
  // entrada ou bancas sem resultado. Fila que só existe quando há problema não
  // ensina ninguém a confiar nela — e o vazio de cada card já diz "aqui está
  // limpo" com mais precisão do que um vazio único dizia.
  return (
    <PageStack>
      {/* Decide na própria lista: o pedido traz o motivo escrito, que é todo o
          contexto de que a decisão precisa. */}
      <PedidosDeDiasCard onDecidiu={carregar} />
      <ExcecoesDeChoqueCard onDecidiu={carregar} />

      <PageCard>
        <PageCardHeader>
          <PageCardTitle>
            Atrasos sem justificativa
            {dados.atrasos_sem_justificativa.length > 0 &&
              ` (${dados.atrasos_sem_justificativa.length})`}
          </PageCardTitle>
        </PageCardHeader>
        <PageCardContent>
          {dados.atrasos_sem_justificativa.length === 0 ? (
            <EmptyText>Todo projeto atrasado já tem o porquê registrado.</EmptyText>
          ) : (
            <>
              <EmptyText style={{ marginBottom: "0.75rem" }}>
                §7.4: o alerta de atraso é automático, mas o motivo é você quem escreve — e é ele
                que explica o vermelho para quem olha o portfólio depois.
              </EmptyText>
              <ListaSimples>
                {dados.atrasos_sem_justificativa.map((a) => (
                  <ItemLista key={a.projeto_id}>
                    <div>
                      <LinkProjeto as={Link} to={`/projetos/${a.projeto_id}`}>
                        {a.projeto_nome}
                      </LinkProjeto>
                      <EmptyText>{a.motivos.join(" · ")}</EmptyText>
                    </div>
                    <Pilula $tom="alerta">
                      {a.dias_totais} {a.dias_totais === 1 ? "dia" : "dias"}
                    </Pilula>
                  </ItemLista>
                ))}
              </ListaSimples>
            </>
          )}
        </PageCardContent>
      </PageCard>

      <PageCard>
        <PageCardHeader>
          <PageCardTitle>
            Solicitações de entrada em projeto
            {dados.solicitacoes_de_entrada.length > 0 &&
              ` (${dados.solicitacoes_de_entrada.length})`}
          </PageCardTitle>
        </PageCardHeader>
        <PageCardContent>
          {dados.solicitacoes_de_entrada.length === 0 ? (
            <EmptyText>Ninguém esperando para entrar num projeto.</EmptyText>
          ) : (
            <>
              <EmptyText style={{ marginBottom: "0.75rem" }}>
                Quem pediu para entrar fica parado até alguém responder, e a vaga segue
                aberta. Responder é em <strong>Vagas em projetos</strong>, onde dá para ver
                a carga de quem pediu.
              </EmptyText>
              <ListaSimples>
                {dados.solicitacoes_de_entrada.map((s) => (
                  <ItemLista key={s.id}>
                    <div>
                      <LinkProjeto as={Link} to="/vagas">
                        {s.usuario_nome ?? "Alguém"} → {s.projeto_nome}
                      </LinkProjeto>
                      <EmptyText>{s.justificativa}</EmptyText>
                    </div>
                    {/* A carga é o contexto da decisão: aceitar alguém que já
                        está em quatro projetos é outra conversa. */}
                    <Pilula $tom="neutro">
                      {s.carga_do_solicitante}{" "}
                      {s.carga_do_solicitante === 1 ? "projeto" : "projetos"}
                    </Pilula>
                  </ItemLista>
                ))}
              </ListaSimples>
            </>
          )}
        </PageCardContent>
      </PageCard>

      <PageCard>
        <PageCardHeader>
          <PageCardTitle>
            Bancas sem resultado
            {dados.bancas_sem_resultado.length > 0 && ` (${dados.bancas_sem_resultado.length})`}
          </PageCardTitle>
        </PageCardHeader>
        <PageCardContent>
          {dados.bancas_sem_resultado.length === 0 ? (
            <EmptyText>Toda banca realizada já tem o veredito registrado.</EmptyText>
          ) : (
            <>
              <EmptyText style={{ marginBottom: "0.75rem" }}>
                A banca aconteceu e ninguém registrou se foi aprovada. O registro é na tela
                de <strong>Bancas</strong>.
              </EmptyText>
              <ListaSimples>
                {dados.bancas_sem_resultado.map((b) => (
                  <ItemLista key={b.banca_id}>
                    <div>
                      <LinkProjeto as={Link} to="/bancas">
                        {b.projeto_nome} — {b.escopo_nome}
                      </LinkProjeto>
                      <EmptyText>realizada em {formatarData(b.realizado_em)}</EmptyText>
                    </div>
                  </ItemLista>
                ))}
              </ListaSimples>
            </>
          )}
        </PageCardContent>
      </PageCard>

      {/* ⚠ Havia aqui um card "Entregas sem classificação": as entregas
          atrasadas ainda não marcadas como atraso interno ou por agenda do
          cliente. Saiu em 2026-08-12 junto com o que lhe dava sentido — o
          atraso de ENTREGA deixou de ser insight, e com ele a métrica que
          separava os dois tipos. */}
    </PageStack>
  );
}
