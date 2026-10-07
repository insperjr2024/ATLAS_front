import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUsuarios } from "@/lib/usuarios";
import { getRelatorio } from "@/lib/desempenho-relatorio";
import { getMentorias } from "@/lib/desempenho-mentorias";
import { RelatorioDesempenho } from "@/components/desempenho/RelatorioDesempenho";
import { RelatorioPdi } from "@/components/desempenho/RelatorioPdi";
import type { UsuarioResumo, Posicao } from "@/types/auth";
import { MENTORES_ELEGIVEIS } from "@/utils/permissoes";
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
  PageLoadingBlock,
  PageSubtitle,
} from "@/styles/page.styled";
import { FieldInput, FieldSelect } from "@/pages/Bancas.styled";
import { MentoradoButton, MentoradoNome, MentoradosList, TituloComAvatar } from "../MeusMentorados.styled";
import { FiltrosRow, Iniciais } from "./Painel.styled";
import {
  TipoCard,
  TipoCardDescricao,
  TipoCardHeader,
  TipoCardTitulo,
  TipoOpcoesGrid,
} from "../AvaliacaoDesempenho.styled";

type ModoRelatorio = "avaliacoes" | "pdi";

/** "Ana Souza" -> "AS". Mesma regra de `MeusMentorados.tsx`. */
/** Quem é mentor e nunca mentorado: não tem PDI próprio, tem o dos
 *  mentorados. Coordenador, gerente, diretoria e a coordenação de vendas. */
const SEM_PDI_PROPRIO = new Set<Posicao>([...MENTORES_ELEGIVEIS, "vendas", "diretor_de_vendas"]);

function iniciais(nome: string | null | undefined): string {
  const partes = (nome ?? "").trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

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

  // 2026-09-26, a pedido: coordenador nunca é mentorado (regra 2.5, mentor
  // = coordenador). "Relatórios de PDI" dele não pode ser o PDI dele mesmo
  // (não existe), tem que ser o PDI de quem ELE mentora, e pode ser mais de
  // uma pessoa. 2026-10-06: vale pra todo mundo que não tem PDI próprio
  // (gerente, coordenação de vendas, diretoria), não só pro coordenador.
  const semPdiProprio = !!selecionado && SEM_PDI_PROPRIO.has(selecionado.posicao);
  const [mentoradosDoCoordenador, setMentoradosDoCoordenador] = useState<DesempenhoMentoria[]>([]);
  const [carregandoMentorados, setCarregandoMentorados] = useState(false);
  const [mentoradoPdiSelecionado, setMentoradoPdiSelecionado] = useState<DesempenhoMentoria | null>(null);

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
    setMentoradoPdiSelecionado(null);
  }

  async function abrirModo(modoEscolhido: ModoRelatorio) {
    setModo(modoEscolhido);
    setMentoradoPdiSelecionado(null);
    if (!selecionado || !token) return;

    if (modoEscolhido === "avaliacoes") {
      setCarregandoRelatorio(true);
      try {
        setRelatorio(await getRelatorio(selecionado.id, token));
      } catch (err) {
        setErro(err instanceof Error ? err.message : "Erro ao carregar o relatório");
      } finally {
        setCarregandoRelatorio(false);
      }
      return;
    }

    // modo === "pdi": coordenador não tem PDI próprio, tem mentorados —
    // busca quem ele mentora em vez do (inexistente) PDI dele mesmo.
    //
    // ⚠ `getMentorias` (todas), não `getMeusMentorados` (self-only,
    // `require_self` sem override de admin de propósito — ver o
    // comentário em `authorization.py`): quem está aqui é a diretoria
    // olhando o mentorado de OUTRA pessoa, não os próprios.
    if (SEM_PDI_PROPRIO.has(selecionado.posicao)) {
      setCarregandoMentorados(true);
      try {
        const todas = await getMentorias(token);
        setMentoradosDoCoordenador(todas.filter((m) => m.mentor_id === selecionado.id));
      } catch (err) {
        setErro(err instanceof Error ? err.message : "Erro ao carregar os mentorados");
      } finally {
        setCarregandoMentorados(false);
      }
    }
  }

  /** "Voltar" tem dois níveis quando é PDI de coordenador: sai do mentorado
   *  aberto primeiro (volta pra lista de mentorados), só depois sai do modo. */
  function voltarModo() {
    if (mentoradoPdiSelecionado) {
      setMentoradoPdiSelecionado(null);
      return;
    }
    setModo(null);
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

  if (selecionado && modo === "pdi" && semPdiProprio) {
    return (
      <PageCard>
        <PageCardHeader>
          <PageCardTitle>
            {mentoradoPdiSelecionado ? (
              <TituloComAvatar>
                <Iniciais aria-hidden>{iniciais(mentoradoPdiSelecionado.mentorado_nome)}</Iniciais>
                Relatórios de PDI — {mentoradoPdiSelecionado.mentorado_nome}
              </TituloComAvatar>
            ) : (
              `Relatórios de PDI dos mentorados de ${selecionado.nome}`
            )}
          </PageCardTitle>
          <PageButton $variant="outline" type="button" onClick={voltarModo}>
            Voltar
          </PageButton>
        </PageCardHeader>
        <PageCardContent>
          {mentoradoPdiSelecionado ? (
            <RelatorioPdi
              usuarioId={mentoradoPdiSelecionado.mentorado_id}
              podeEnviarInicial
              podeEnviarEncontro
            />
          ) : (
            <>
              {/* Coordenador nunca é mentorado (regra 2.5) — sem isto, quem
                  visse este relatório poderia achar que ele não tem PDI
                  nenhum, quando o que não existe é O PDI DELE: aqui é o de
                  quem ele mentora, um card por pessoa. */}
              <PageSubtitle>
                {selecionado.nome} não tem PDI próprio — ele é mentor, não mentorado. Estes são os
                relatórios de PDI de quem ele mentora.
              </PageSubtitle>
              {carregandoMentorados ? (
                <PageLoadingBlock />
              ) : mentoradosDoCoordenador.length === 0 ? (
                <EmptyText>{selecionado.nome} não mentora ninguém no momento.</EmptyText>
              ) : (
                <MentoradosList>
                  {mentoradosDoCoordenador.map((m) => (
                    <MentoradoButton key={m.id} type="button" onClick={() => setMentoradoPdiSelecionado(m)}>
                      <Iniciais aria-hidden>{iniciais(m.mentorado_nome)}</Iniciais>
                      <MentoradoNome>{m.mentorado_nome}</MentoradoNome>
                    </MentoradoButton>
                  ))}
                </MentoradosList>
              )}
            </>
          )}
        </PageCardContent>
      </PageCard>
    );
  }

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
              <TipoCardDescricao>
                {semPdiProprio
                  ? "Coordenador não tem PDI próprio — dos mentorados dele."
                  : "PDI inicial e encontros de mentoria, com prazo e arquivo."}
              </TipoCardDescricao>
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
