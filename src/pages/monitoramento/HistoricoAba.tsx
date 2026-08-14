import { PageStack } from "@/styles/page.styled";
import { ProjetosAtivosTabela } from "./ProjetosAtivosTabela";
import { PortfolioEncerradoTabela } from "./PortfolioEncerradoTabela";

/**
 * A aba **Histórico de projetos** (§7) — só diretoria e gerência.
 *
 * Duas tabelas no MESMO modelo, empilhadas: primeiro o que ainda está aberto
 * (Projetos em curso), depois o que já fechou (Portfólio encerrado). Cada uma é
 * um card autônomo — com o próprio filtro de frente, busca, segmento e
 * ordenação —, então dá para olhar os ativos de uma frente e os encerrados de
 * outra ao mesmo tempo. Quem decide o recorte é o backend
 * (`aplicar_recorte_visao`); a trava de posição fica no menu e na rota.
 */
export function HistoricoAba() {
  return (
    <PageStack>
      <ProjetosAtivosTabela />
      <PortfolioEncerradoTabela />
    </PageStack>
  );
}
