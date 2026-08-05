import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getRelatorio } from "@/lib/desempenho-relatorio";
import { getProjetos } from "@/lib/projetos";
import { RelatorioDesempenho } from "@/components/desempenho/RelatorioDesempenho";
import type { DesempenhoRelatorio } from "@/types/desempenho";
import {
  ErrorBlock,
  ErrorText,
  PageButton,
  PageCard,
  PageCardContent,
  PageHeader,
  PageHeaderText,
  PageLoadingBlock,
  PageStack,
  PageSubtitle,
  PageTitle,
} from "@/styles/page.styled";

export function MeuRelatorio() {
  const { usuario, token } = useAuth();
  const [relatorio, setRelatorio] = useState<DesempenhoRelatorio | null>(null);
  const [meusProjetos, setMeusProjetos] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function buscar() {
    if (!usuario || !token) return;
    setCarregando(true);
    setErro("");
    try {
      // `getProjetos` já aplica o recorte de visão (§3): pra coordenador e
      // consultor, devolve só os projetos onde eles estão alocados hoje —
      // ou seja, é literalmente "meus projetos", sem endpoint extra.
      const [dadosRelatorio, dadosProjetos] = await Promise.all([
        getRelatorio(usuario.id, token),
        getProjetos(token),
      ]);
      setRelatorio(dadosRelatorio);
      setMeusProjetos(dadosProjetos.map((p) => p.nome));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar seu relatório");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    buscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario?.id, token]);

  if (erro) {
    return (
      <ErrorBlock>
        <ErrorText>{erro}</ErrorText>
        <PageButton $variant="outline" onClick={buscar}>
          Tentar novamente
        </PageButton>
      </ErrorBlock>
    );
  }

  if (carregando || !relatorio) return <PageLoadingBlock />;

  return (
    <PageStack>
      <PageHeader>
        <PageHeaderText>
          <PageTitle>Relatório de desempenho</PageTitle>
          <PageSubtitle>Como você foi avaliado pelos colegas de projeto.</PageSubtitle>
        </PageHeaderText>
      </PageHeader>

      <PageCard>
        <PageCardContent>
          <RelatorioDesempenho
            relatorio={relatorio}
            pessoa={usuario ? { nome: usuario.nome, posicao: usuario.posicao, projetos: meusProjetos } : undefined}
          />
        </PageCardContent>
      </PageCard>
    </PageStack>
  );
}
