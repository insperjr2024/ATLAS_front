import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getProjeto, ROTULO_STATUS } from "@/lib/projetos";
import type { ProjetoCompleto } from "@/types/projeto";
import {
  ErrorText,
  PageHeader,
  PageHeaderText,
  PageLoadingBlock,
  PageStack,
  PageSubtitle,
  PageTitle,
} from "@/styles/page.styled";
import { PainelHealthTrack } from "./PainelHealthTrack";
import { Voltar } from "./HealthTrack.styled";

/**
 * O Health Track de um projeto, aberto a partir do mapa da carteira.
 *
 * Só o cabeçalho é daqui; o conteúdo é o `PainelHealthTrack`, o mesmo que
 * era a aba dentro do projeto. O nome do projeto vem de `/projetos/{id}`,
 * que já aplica o recorte de visão: quem não enxerga o projeto cai no erro.
 */
export function HealthTrackProjeto() {
  const { id } = useParams();
  const { token } = useAuth();
  const projetoId = Number(id);
  const [projeto, setProjeto] = useState<ProjetoCompleto | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!token || !projetoId) return;
    let vivo = true;
    getProjeto(projetoId, token)
      .then((p) => vivo && setProjeto(p))
      .catch((err) => vivo && setErro(err instanceof Error ? err.message : "Projeto não encontrado"));
    return () => {
      vivo = false;
    };
  }, [token, projetoId]);

  if (erro) return <ErrorText>Não foi possível abrir o projeto: {erro}</ErrorText>;
  if (!projeto) return <PageLoadingBlock />;

  return (
    <PageStack>
      <Voltar to="/health-track">
        <ArrowLeft aria-hidden="true" />
        Mapa da carteira
      </Voltar>
      <PageHeader>
        <PageHeaderText>
          <PageTitle>{projeto.nome}</PageTitle>
          <PageSubtitle>
            Health Track
            {projeto.cliente && ` · ${projeto.cliente}`}
            {" · "}
            {ROTULO_STATUS[projeto.status as keyof typeof ROTULO_STATUS] ?? projeto.status}
          </PageSubtitle>
        </PageHeaderText>
      </PageHeader>
      <PainelHealthTrack projetoId={projetoId} />
    </PageStack>
  );
}
