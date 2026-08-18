import { Outlet, useLocation } from "react-router-dom";
import { PageHeader, PageHeaderText, PageStack, PageSubtitle, PageTitle } from "@/styles/page.styled";
import { TabBar, TabLink } from "./Painel.styled";

export function PainelDesempenho() {
  const { pathname } = useLocation();
  // "Avaliadores" e "Avaliados" são duas ROTAS (o toggle de dentro de
  // PainelAvaliacoes navega entre elas, ver o comentário lá), mas uma aba
  // só na barra — className forçado porque o NavLink padrão só marca ativo
  // a rota exata, e aqui as duas contam.
  const emAvaliacoes = pathname.includes("/avaliadores") || pathname.includes("/avaliados");

  return (
    <PageStack>
      <PageHeader>
        <PageHeaderText>
          <PageTitle>Painel de Avaliação de Desempenho</PageTitle>
          <PageSubtitle>Administração de formulários, PDI e resultados.</PageSubtitle>
        </PageHeaderText>
      </PageHeader>

      <TabBar>
        <TabLink
          to="/avaliacao-desempenho/painel/avaliadores"
          className={emAvaliacoes ? "active" : undefined}
        >
          Avaliações
        </TabLink>
        <TabLink to="/avaliacao-desempenho/painel/relatorio">Relatórios</TabLink>
        <TabLink to="/avaliacao-desempenho/painel/lotes">Formulários</TabLink>
        <TabLink to="/avaliacao-desempenho/painel/pdi">PDI</TabLink>
      </TabBar>

      <Outlet />
    </PageStack>
  );
}
