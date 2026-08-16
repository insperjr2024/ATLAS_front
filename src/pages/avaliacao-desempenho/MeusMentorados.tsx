import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getMeusMentorados } from "@/lib/desempenho-mentorias";
import { getRelatorio } from "@/lib/desempenho-relatorio";
import { RelatorioDesempenho } from "@/components/desempenho/RelatorioDesempenho";
import { RelatorioPdi } from "@/components/desempenho/RelatorioPdi";
import type { DesempenhoMentoria, DesempenhoRelatorio } from "@/types/desempenho";
import {
  EmptyText,
  ErrorBlock,
  ErrorText,
  PageButton,
  PageCard,
  PageCardContent,
  PageCardHeader,
  PageCardTitle,
  PageHeader,
  PageHeaderText,
  PageLoadingBlock,
  PageStack,
  PageSubtitle,
  PageTitle,
} from "@/styles/page.styled";
import { MentoradoButton, MentoradosList } from "./MeusMentorados.styled";
import {
  TipoCard,
  TipoCardDescricao,
  TipoCardHeader,
  TipoCardTitulo,
  TipoOpcoesGrid,
} from "./AvaliacaoDesempenho.styled";

type ModoRelatorio = "avaliacoes" | "pdi";

export function MeusMentorados() {
  const { usuario, token } = useAuth();
  const [mentorados, setMentorados] = useState<DesempenhoMentoria[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [relatorio, setRelatorio] = useState<DesempenhoRelatorio | null>(null);
  const [carregandoRelatorio, setCarregandoRelatorio] = useState(false);

  /* Estado do drill-down (mentorado escolhido, tipo de relatório) vive na
   * URL, não em useState solto: assim o botão Voltar do NAVEGADOR desfaz um
   * nível por vez (relatório -> mentorado -> lista), em vez de sair da
   * página inteira direto pra tela anterior a "Meus mentorados". */
  const [searchParams, setSearchParams] = useSearchParams();
  const mentoradoIdParam = searchParams.get("mentorado");
  const modoParam = searchParams.get("modo");
  const modo: ModoRelatorio | null =
    modoParam === "avaliacoes" || modoParam === "pdi" ? modoParam : null;
  const selecionado = mentoradoIdParam
    ? (mentorados.find((m) => String(m.mentorado_id) === mentoradoIdParam) ?? null)
    : null;

  async function buscar() {
    if (!usuario || !token) return;
    setCarregando(true);
    setErro("");
    try {
      setMentorados(await getMeusMentorados(usuario.id, token));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar seus mentorados");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    buscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario?.id, token]);

  useEffect(() => {
    if (modo !== "avaliacoes" || !selecionado || !token) {
      setRelatorio(null);
      return;
    }
    let ativo = true;
    setCarregandoRelatorio(true);
    getRelatorio(selecionado.mentorado_id, token)
      .then((r) => {
        if (ativo) setRelatorio(r);
      })
      .catch((err) => {
        if (ativo) setErro(err instanceof Error ? err.message : "Erro ao carregar o relatório do mentorado");
      })
      .finally(() => {
        if (ativo) setCarregandoRelatorio(false);
      });
    return () => {
      ativo = false;
    };
  }, [modo, selecionado, token]);

  function abrirMentorado(mentoria: DesempenhoMentoria) {
    setSearchParams({ mentorado: String(mentoria.mentorado_id) });
  }

  function abrirModo(modoEscolhido: ModoRelatorio) {
    if (!selecionado) return;
    setSearchParams({ mentorado: String(selecionado.mentorado_id), modo: modoEscolhido });
  }

  function fecharModo() {
    if (!selecionado) return;
    setSearchParams({ mentorado: String(selecionado.mentorado_id) });
  }

  function fecharMentorado() {
    setSearchParams({});
  }

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

  if (carregando) return <PageLoadingBlock />;

  return (
    <PageStack>
      <PageHeader>
        <PageHeaderText>
          <PageTitle>Meus mentorados</PageTitle>
          <PageSubtitle>Acompanhe o desempenho de quem você mentora.</PageSubtitle>
        </PageHeaderText>
      </PageHeader>

      {selecionado && modo ? (
        <PageCard>
          <PageCardHeader>
            <PageCardTitle>
              {modo === "avaliacoes" ? "Relatório das avaliações" : "Relatórios de PDI"} —{" "}
              {selecionado.mentorado_nome}
            </PageCardTitle>
            <PageButton $variant="outline" type="button" onClick={fecharModo}>
              Voltar
            </PageButton>
          </PageCardHeader>
          <PageCardContent>
            {modo === "avaliacoes" ? (
              carregandoRelatorio || !relatorio ? (
                <PageLoadingBlock />
              ) : (
                // Mentorado é sempre consultor (regra 2.5, mentor=coordenador).
                <RelatorioDesempenho
                  relatorio={relatorio}
                  pessoa={{ nome: selecionado.mentorado_nome ?? "", posicao: "consultor" }}
                />
              )
            ) : (
              <RelatorioPdi usuarioId={selecionado.mentorado_id} podeEnviarInicial={false} podeEnviarEncontro />
            )}
          </PageCardContent>
        </PageCard>
      ) : selecionado ? (
        <PageCard>
          <PageCardHeader>
            <PageCardTitle>{selecionado.mentorado_nome}</PageCardTitle>
            <PageButton $variant="outline" type="button" onClick={fecharMentorado}>
              Voltar
            </PageButton>
          </PageCardHeader>
          <PageCardContent>
            <TipoOpcoesGrid>
              <TipoCard type="button" $disabled={false} onClick={() => abrirModo("avaliacoes")}>
                <TipoCardHeader>
                  <TipoCardTitulo>Relatório das avaliações</TipoCardTitulo>
                </TipoCardHeader>
                <TipoCardDescricao>Periódica e finalização, notas e comentários recebidos.</TipoCardDescricao>
              </TipoCard>
              <TipoCard type="button" $disabled={false} onClick={() => abrirModo("pdi")}>
                <TipoCardHeader>
                  <TipoCardTitulo>Relatórios de PDI</TipoCardTitulo>
                </TipoCardHeader>
                <TipoCardDescricao>PDI inicial e encontros de mentoria, com prazo e arquivo.</TipoCardDescricao>
              </TipoCard>
            </TipoOpcoesGrid>
          </PageCardContent>
        </PageCard>
      ) : (
        <PageCard>
          <PageCardHeader>
            <PageCardTitle>Mentorados</PageCardTitle>
          </PageCardHeader>
          <PageCardContent>
            {mentorados.length === 0 ? (
              <EmptyText>Você não é mentor de ninguém no momento.</EmptyText>
            ) : (
              <MentoradosList>
                {mentorados.map((m) => (
                  <MentoradoButton key={m.id} type="button" onClick={() => abrirMentorado(m)}>
                    {m.mentorado_nome}
                  </MentoradoButton>
                ))}
              </MentoradosList>
            )}
          </PageCardContent>
        </PageCard>
      )}
    </PageStack>
  );
}
