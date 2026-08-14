import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUsuarios } from "@/lib/usuarios";
import { getRelatorio } from "@/lib/desempenho-relatorio";
import { RelatorioDesempenho } from "@/components/desempenho/RelatorioDesempenho";
import { RelatorioPdi } from "@/components/desempenho/RelatorioPdi";
import type { UsuarioResumo, Posicao } from "@/types/auth";
import type { DesempenhoRelatorio } from "@/types/desempenho";
import {
  EmptyText,
  ErrorBlock,
  ErrorText,
  PageButton,
  PageCard,
  PageCardContent,
  PageCardHeader,
  PageCardTitle,
  PageLoadingBlock,
} from "@/styles/page.styled";
import { FieldInput, FieldSelect } from "@/pages/Bancas.styled";
import { MentoradoButton, MentoradosList } from "../MeusMentorados.styled";
import { FiltrosRow } from "./Painel.styled";
import {
  TipoCard,
  TipoCardDescricao,
  TipoCardHeader,
  TipoCardTitulo,
  TipoOpcoesGrid,
} from "../AvaliacaoDesempenho.styled";

type ModoRelatorio = "avaliacoes" | "pdi";

export function PainelRelatorio() {
  const { token } = useAuth();
  const [usuarios, setUsuarios] = useState<UsuarioResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [filtroPosicao, setFiltroPosicao] = useState<Posicao | "">("");

  const [selecionado, setSelecionado] = useState<UsuarioResumo | null>(null);
  const [modo, setModo] = useState<ModoRelatorio | null>(null);
  const [relatorio, setRelatorio] = useState<DesempenhoRelatorio | null>(null);
  const [carregandoRelatorio, setCarregandoRelatorio] = useState(false);

  async function buscar() {
    if (!token) return;
    setCarregando(true);
    setErro("");
    try {
      setUsuarios(await getUsuarios(token));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar usuários");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    buscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const filtrados = useMemo(() => {
    return usuarios
      .filter((u) => !filtroPosicao || u.posicao === filtroPosicao)
      .filter((u) => u.nome.toLowerCase().includes(busca.toLowerCase()))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [usuarios, busca, filtroPosicao]);

  function abrirUsuario(usuarioAlvo: UsuarioResumo) {
    setSelecionado(usuarioAlvo);
    setModo(null);
  }

  async function abrirModo(modoEscolhido: ModoRelatorio) {
    setModo(modoEscolhido);
    if (modoEscolhido !== "avaliacoes" || !selecionado || !token) return;
    setCarregandoRelatorio(true);
    try {
      setRelatorio(await getRelatorio(selecionado.id, token));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar o relatório");
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

  if (selecionado && modo) {
    return (
      <PageCard>
        <PageCardHeader>
          <PageCardTitle>
            {modo === "avaliacoes" ? "Relatório das avaliações" : "Relatórios de PDI"}, {selecionado.nome}
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
              <RelatorioDesempenho
                relatorio={relatorio}
                pessoa={{ nome: selecionado.nome, posicao: selecionado.posicao }}
              />
            )
          ) : (
            <RelatorioPdi usuarioId={selecionado.id} podeEnviarInicial podeEnviarEncontro />
          )}
        </PageCardContent>
      </PageCard>
    );
  }

  if (selecionado) {
    return (
      <PageCard>
        <PageCardHeader>
          <PageCardTitle>{selecionado.nome}</PageCardTitle>
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
    );
  }

  return (
    <PageCard>
      <PageCardHeader>
        <PageCardTitle>Relatório de qualquer pessoa</PageCardTitle>
      </PageCardHeader>
      <PageCardContent>
        <FiltrosRow>
          <FieldInput
            placeholder="Buscar por nome..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <FieldSelect value={filtroPosicao} onChange={(e) => setFiltroPosicao(e.target.value as Posicao | "")}>
            <option value="">Todas as posições</option>
            <option value="coordenador">Coordenador</option>
            <option value="consultor">Consultor</option>
          </FieldSelect>
        </FiltrosRow>

        {filtrados.length === 0 ? (
          <EmptyText>Nenhum usuário encontrado.</EmptyText>
        ) : (
          <MentoradosList>
            {filtrados.map((u) => (
              <MentoradoButton key={u.id} type="button" onClick={() => abrirUsuario(u)}>
                {u.nome}
              </MentoradoButton>
            ))}
          </MentoradosList>
        )}
      </PageCardContent>
    </PageCard>
  );
}
