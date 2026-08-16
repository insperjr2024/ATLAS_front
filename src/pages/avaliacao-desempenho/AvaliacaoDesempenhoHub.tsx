import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getMinhaFila } from "@/lib/desempenho-avaliacoes";
import { AvaliacaoDesempenho } from "./AvaliacaoDesempenho";
import { MeuRelatorio } from "./MeuRelatorio";
import { PageHeader, PageHeaderText, PageStack, PageSubtitle, PageTitle } from "@/styles/page.styled";
import { TabBar, TabButton, TabCount } from "./AvaliacaoDesempenho.styled";

type Aba = "pendencias" | "relatorio";
const ABAS_VALIDAS: Aba[] = ["pendencias", "relatorio"];

/**
 * O hub de Avaliação de Desempenho — responder avaliações de colegas e ver
 * o próprio relatório, as duas metades do MESMO fluxo (avaliar e ser
 * avaliado), agora sob um cabeçalho só, mesmo padrão de `TabBar` que
 * `Bancas.tsx` já usa.
 *
 * ⚠ "Meus Mentorados" fica DE FORA de propósito, em rota e item de sidebar
 * próprios. Mentoria é um vínculo independente do projeto (a diretoria
 * escolhe manualmente quem mentora quem) — o mentor não participa do
 * processo de avaliação do mentorado, só enxerga o resultado depois. Juntar
 * os dois sob o mesmo rótulo também colidia visualmente pra diretoria, que
 * já tem um "Avaliação de Desempenho" próprio (o painel admin).
 */
export function AvaliacaoDesempenhoHub() {
  const { usuario, token } = useAuth();
  const [searchParams] = useSearchParams();

  // `?aba=` é o que faz um link direto (ou o botão "voltar" do navegador)
  // cair na aba certa, mesmo padrão já usado em `Bancas.tsx`.
  const abaDaQuery = searchParams.get("aba") as Aba | null;
  const [aba, setAba] = useState<Aba>(
    abaDaQuery && ABAS_VALIDAS.includes(abaDaQuery) ? abaDaQuery : "pendencias",
  );

  // Só pro número ao lado do nome da aba — não é a fila inteira, a aba
  // busca a própria quando é aberta. Mesmo espírito do sino de
  // notificações, que também tem uma rota só pra contagem.
  const [pendentes, setPendentes] = useState<number | null>(null);

  useEffect(() => {
    if (!usuario || !token) return;
    getMinhaFila(usuario.id, token)
      .then((fila) => setPendentes(fila.filter((item) => item.aberto).length))
      .catch(() => {});
  }, [usuario, token]);

  if (!usuario) return null;

  return (
    <PageStack>
      <PageHeader>
        <PageHeaderText>
          <PageTitle>Avaliação de Desempenho</PageTitle>
          <PageSubtitle>Avalie os colegas do seu projeto e veja como você foi avaliado.</PageSubtitle>
        </PageHeaderText>
      </PageHeader>

      <TabBar role="tablist" aria-label="Avaliação de Desempenho">
        <TabButton
          type="button"
          role="tab"
          aria-selected={aba === "pendencias"}
          $ativa={aba === "pendencias"}
          onClick={() => setAba("pendencias")}
        >
          Pendências
          {!!pendentes && <TabCount>{pendentes}</TabCount>}
        </TabButton>
        <TabButton
          type="button"
          role="tab"
          aria-selected={aba === "relatorio"}
          $ativa={aba === "relatorio"}
          onClick={() => setAba("relatorio")}
        >
          Meu relatório
        </TabButton>
      </TabBar>

      {aba === "pendencias" ? <AvaliacaoDesempenho /> : <MeuRelatorio />}
    </PageStack>
  );
}
