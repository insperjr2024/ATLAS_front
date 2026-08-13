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

      <TabBar>
        <TabLink to="/avaliacao-desempenho/painel/avaliadores">Avaliadores</TabLink>
        <TabLink to="/avaliacao-desempenho/painel/avaliados">Avaliados</TabLink>
        <TabLink to="/avaliacao-desempenho/painel/relatorio">Relatórios</TabLink>
        <TabLink to="/avaliacao-desempenho/painel/lotes">Formulários</TabLink>
        <TabLink to="/avaliacao-desempenho/painel/mentoria">PDI</TabLink>
      </TabBar>

      <Outlet />
    </PageStack>
  );
}
