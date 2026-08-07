import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getFaixasDisponiveis, getMinhaGrade, salvarGrade } from "@/lib/grade-horaria";
import { getFrentes } from "@/lib/bancas";
import { getUsuariosFrentes } from "@/lib/usuarios-frentes";
import { ROTULO_POSICAO } from "@/utils/permissoes";
import type { Frente } from "@/types/banca";
import type { FaixaDisponivel, FaixaGrade } from "@/types/grade";
import { GradeEditor } from "@/components/grade/GradeEditor";
import {
  PageStack,
  PageHeader,
  PageHeaderText,
  PageTitle,
  PageSubtitle,
  PageCard,
  PageCardHeader,
  PageCardTitle,
  PageCardContent,
  PageLoadingBlock,
  ErrorBlock,
  ErrorText,
  PageButton,
} from "@/styles/page.styled";
import {
  Avatar,
  DadosGrid,
  DadoItem,
  DadoRotulo,
  DadoValor,
  Explicacao,
  PerfilCabecalho,
  PerfilNome,
  PerfilSubtitulo,
} from "./MeuPerfil.styled";

/** "Heloisa Nogueira" → "HN". Sem foto ainda, então as iniciais são o que
 *  identifica a pessoa de relance no topo do card. */
function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

/**
 * Meu perfil (§11) — os dados do pré-cadastro e a grade de aulas do semestre.
 *
 * É de todo mundo: não há trava de cargo nem de posição. Cada um vê e edita a
 * própria grade, e o backend nem aceita id de outra pessoa — o usuário sai
 * sempre do token.
 */
export function MeuPerfil() {
  const { usuario, token } = useAuth();
  const [faixasDisponiveis, setFaixasDisponiveis] = useState<FaixaDisponivel[]>([]);
  const [salvas, setSalvas] = useState<FaixaGrade[]>([]);
  const [frentes, setFrentes] = useState<Frente[]>([]);
  const [minhasFrentes, setMinhasFrentes] = useState<number[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  // "Tentar novamente" incrementa isto em vez de chamar a busca direto:
  // disparar setState no corpo do efeito gera render em cascata.
  const [tentativa, setTentativa] = useState(0);

  const usuarioId = usuario?.id;

  useEffect(() => {
    if (!token || usuarioId == null) return;
    let ativo = true;
    Promise.all([
      getFaixasDisponiveis(token),
      getMinhaGrade(token),
      getFrentes(token),
      getUsuariosFrentes(token),
    ])
      .then(([faixasResp, gradeResp, frentesResp, vinculosResp]) => {
        if (!ativo) return;
        setFaixasDisponiveis(faixasResp);
        setSalvas(gradeResp.faixas);
        setFrentes(frentesResp);
        setMinhasFrentes(
          vinculosResp.filter((v) => v.usuario_id === usuarioId).map((v) => v.frente_id),
        );
        setErro("");
      })
      .catch((e) => {
        if (ativo) setErro(e instanceof Error ? e.message : "Erro ao carregar o perfil");
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [token, usuarioId, tentativa]);

  if (!usuario) return null;

  if (erro) {
    return (
      <ErrorBlock>
        <ErrorText>Não foi possível carregar o perfil: {erro}</ErrorText>
        <PageButton
          $variant="outline"
          onClick={() => {
            setCarregando(true);
            setTentativa((n) => n + 1);
          }}
        >
          Tentar novamente
        </PageButton>
      </ErrorBlock>
    );
  }

  if (carregando) return <PageLoadingBlock />;

  const nomesFrentes = frentes
    .filter((f) => minhasFrentes.includes(f.id))
    .map((f) => f.nome);

  async function aoSalvar(faixas: FaixaGrade[]) {
    if (!token) return;
    const resposta = await salvarGrade(faixas, token);
    // Regravar com o que o backend devolveu, não com o que foi enviado: é
    // isso que faz o botão voltar para "Grade salva" refletindo o banco.
    setSalvas(resposta.faixas);
  }

  return (
    <PageStack>
      <PageHeader>
        <PageHeaderText>
          <PageTitle>Meu perfil</PageTitle>
          <PageSubtitle>Seus dados de cadastro e a sua grade de aulas do semestre.</PageSubtitle>
        </PageHeaderText>
      </PageHeader>

      <PageCard>
        <PageCardHeader>
          <PageCardTitle>Cadastro</PageCardTitle>
        </PageCardHeader>
        <PageCardContent>
          <PerfilCabecalho>
            <Avatar>{iniciais(usuario.nome)}</Avatar>
            <div>
              <PerfilNome>{usuario.nome}</PerfilNome>
              <PerfilSubtitulo>
                {ROTULO_POSICAO[usuario.posicao] ?? usuario.posicao} · {usuario.cargo.nome}
              </PerfilSubtitulo>
            </div>
          </PerfilCabecalho>

          <DadosGrid>
            <DadoItem>
              <DadoRotulo>E-mail</DadoRotulo>
              <DadoValor>{usuario.email_insper}</DadoValor>
            </DadoItem>
            <DadoItem>
              <DadoRotulo>{nomesFrentes.length === 1 ? "Frente" : "Frentes"}</DadoRotulo>
              <DadoValor>{nomesFrentes.length > 0 ? nomesFrentes.join(" · ") : "—"}</DadoValor>
            </DadoItem>
          </DadosGrid>
        </PageCardContent>
      </PageCard>

      <PageCard>
        <PageCardHeader>
          <PageCardTitle>Minha grade de aulas</PageCardTitle>
        </PageCardHeader>
        <PageCardContent>
          <Explicacao>
            Marque os horários em que você tem aula, do mesmo jeito que aparecem na sua grade
            do Insper. É por aqui que a plataforma sabe quando você não está livre.
          </Explicacao>
          <GradeEditor
            faixasDisponiveis={faixasDisponiveis}
            salvas={salvas}
            onSalvar={aoSalvar}
          />
        </PageCardContent>
      </PageCard>
    </PageStack>
  );
}
