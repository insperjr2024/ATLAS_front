import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
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
import { theme } from "@/styles/theme";
import { MentoradoButton, MentoradoNome, MentoradosList } from "./MeusMentorados.styled";
import { Iniciais } from "./painel/Painel.styled";
import {
  TipoCard,
  TipoCardDescricao,
  TipoCardHeader,
  TipoCardTitulo,
  TipoOpcoesGrid,
} from "./AvaliacaoDesempenho.styled";

type ModoRelatorio = "avaliacoes" | "pdi";

/** "Ana Souza" -> "AS". Duas letras bastam e cabem no círculo. */
function iniciais(nome: string | null | undefined): string {
  const partes = (nome ?? "").trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

export function MeusMentorados() {
  const { usuario, token } = useAuth();
  const [mentorados, setMentorados] = useState<DesempenhoMentoria[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [selecionado, setSelecionado] = useState<DesempenhoMentoria | null>(null);
  const [modo, setModo] = useState<ModoRelatorio | null>(null);
  const [relatorio, setRelatorio] = useState<DesempenhoRelatorio | null>(null);
  const [carregandoRelatorio, setCarregandoRelatorio] = useState(false);

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

  function abrirMentorado(mentoria: DesempenhoMentoria) {
    setSelecionado(mentoria);
    setModo(null);
  }

  async function abrirModo(modoEscolhido: ModoRelatorio) {
    setModo(modoEscolhido);
    if (modoEscolhido !== "avaliacoes" || !selecionado || !token) return;
    setCarregandoRelatorio(true);
    try {
      setRelatorio(await getRelatorio(selecionado.mentorado_id, token));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar o relatório do mentorado");
    } finally {
      setCarregandoRelatorio(false);
    }
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
            <PageButton $variant="outline" type="button" onClick={() => setModo(null)}>
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
            <PageButton $variant="outline" type="button" onClick={() => setSelecionado(null)}>
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
                    <Iniciais aria-hidden>{iniciais(m.mentorado_nome)}</Iniciais>
                    <MentoradoNome>{m.mentorado_nome}</MentoradoNome>
                    <ChevronRight size={16} color={theme.colors.mutedForeground} />
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
