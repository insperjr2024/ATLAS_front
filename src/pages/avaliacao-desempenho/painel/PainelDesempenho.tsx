import { Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, PageHeaderText, PageStack, PageSubtitle, PageTitle } from "@/styles/page.styled";
import { TabBar, TabLink } from "./Painel.styled";

export function PainelDesempenho() {
  const { usuario } = useAuth();

  return (
    <PageStack>
      <PageHeader>
        <PageHeaderText>
          <PageTitle>Painel de Avaliação de Desempenho</PageTitle>
          <PageSubtitle>Administração de lotes, formulários, mentorias e resultados.</PageSubtitle>
        </PageHeaderText>
      </PageHeader>

      <TabBar>
        <TabLink to="/avaliacao-desempenho/painel/avaliadores">Avaliadores</TabLink>
        <TabLink to="/avaliacao-desempenho/painel/avaliados">Avaliados</TabLink>
        <TabLink to="/avaliacao-desempenho/painel/relatorio">Relatórios</TabLink>
        <TabLink to="/avaliacao-desempenho/painel/lotes">Lotes</TabLink>
        <TabLink to="/avaliacao-desempenho/painel/mentoria">Mentoria</TabLink>
        <TabLink to="/avaliacao-desempenho/painel/pdi">PDI</TabLink>
        {/* Formulários fica fora do <Outlet> (rota irmã, com caixa própria de
            permissão), mas sem um link daqui não tinha como chegar nela. */}
        {usuario?.posicao === "diretor" && (
          <TabLink to="/avaliacao-desempenho/painel/formularios">Formulários</TabLink>
        )}
      </TabBar>

      <Outlet />
    </PageStack>
  );
}
