import { AvaliacaoDesempenho } from "./AvaliacaoDesempenho";
import { PageHeader, PageHeaderText, PageStack, PageSubtitle, PageTitle } from "@/styles/page.styled";

/**
 * Ninguém vê o próprio relatório de desempenho — só o mentor vê o do
 * mentorado (`MeusMentorados`), e a diretoria/gerência vê tudo pelo painel
 * admin. Por isso não existe aba "Meu relatório" aqui, e `MeuRelatorio.tsx`
 * segue sem link em lugar nenhum, igual já era antes desta tela existir.
 */
export function AvaliacaoDesempenhoHub() {
  return (
    <PageStack>
      <PageHeader>
        <PageHeaderText>
          <PageTitle>Avaliação de Desempenho</PageTitle>
          <PageSubtitle>Avalie os colegas do seu projeto ao longo do semestre.</PageSubtitle>
        </PageHeaderText>
      </PageHeader>

      <AvaliacaoDesempenho />
    </PageStack>
  );
}
