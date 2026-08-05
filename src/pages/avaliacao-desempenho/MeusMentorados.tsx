import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getMeusMentorados } from "@/lib/desempenho-mentorias";
import { getRelatorio } from "@/lib/desempenho-relatorio";
import { RelatorioDesempenho } from "@/components/desempenho/RelatorioDesempenho";
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

export function MeusMentorados() {
  const { usuario, token } = useAuth();
  const [mentorados, setMentorados] = useState<DesempenhoMentoria[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [selecionado, setSelecionado] = useState<DesempenhoMentoria | null>(null);
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

  async function abrirMentorado(mentoria: DesempenhoMentoria) {
    if (!token) return;
    setSelecionado(mentoria);
    setCarregandoRelatorio(true);
    try {
      setRelatorio(await getRelatorio(mentoria.mentorado_id, token));
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

      {selecionado ? (
        <PageCard>
          <PageCardHeader>
            <PageCardTitle>Relatório do mentorado</PageCardTitle>
            <PageButton
              $variant="outline"
              type="button"
              onClick={() => {
                setSelecionado(null);
                setRelatorio(null);
              }}
            >
              Voltar
            </PageButton>
          </PageCardHeader>
          <PageCardContent>
            {carregandoRelatorio || !relatorio ? (
              <PageLoadingBlock />
            ) : (
              // Mentorado é sempre consultor (regra 2.5 — mentor=coordenador).
              <RelatorioDesempenho
                relatorio={relatorio}
                pessoa={{ nome: selecionado.mentorado_nome ?? "", posicao: "consultor" }}
              />
            )}
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
