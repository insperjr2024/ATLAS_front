import { Outlet } from "react-router-dom";
import { PageHeader, PageHeaderText, PageStack, PageSubtitle, PageTitle } from "@/styles/page.styled";
import { TabBar, TabLink } from "./Painel.styled";

export function PainelDesempenho() {
  return (
    <PageStack>
      <PageHeader>
        <PageHeaderText>
          <PageTitle>Painel de Avaliação de Desempenho</PageTitle>
          <PageSubtitle>Administração de formulários, PDI e resultados.</PageSubtitle>
        </PageHeaderText>
      </PageHeader>

      {/* Relatórios primeiro: é a entrada principal, "me fale sobre esta
          pessoa" (relatório agregado + PDI dela). Avaliações é a auditoria
          do registro bruto — outra pergunta, não mais uma 2ª forma de
          responder a mesma. */}
      <TabBar>
        <TabLink to="/avaliacao-desempenho/painel/relatorio">Relatórios</TabLink>
        <TabLink to="/avaliacao-desempenho/painel/avaliadores">Avaliadores</TabLink>
        <TabLink to="/avaliacao-desempenho/painel/avaliados">Avaliados</TabLink>
        <TabLink to="/avaliacao-desempenho/painel/lotes">Formulários</TabLink>
        <TabLink to="/avaliacao-desempenho/painel/pdi">PDI</TabLink>
      </TabBar>

      <Outlet />
    </PageStack>
  );
}
