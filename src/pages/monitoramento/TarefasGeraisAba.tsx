import { Fragment, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getTarefasGerais, type TarefasGerais } from "@/lib/monitoramento";
import { CORES_SUGERIDAS, tonsDaColuna } from "@/lib/colunas-tarefa";
import { SINAL_URGENCIA } from "@/lib/tarefas";
import { formatarData } from "@/lib/projetos";
import {
  PageStack,
  PageLoadingBlock,
  ErrorBlock,
  ErrorText,
  PageButton,
  EmptyText,
} from "@/styles/page.styled";
import { Card, CardMeta, CardTitulo, CardTopo, ColunaPilula, Ponto } from "@/components/kanban/Kanban.styled";
import {
  AvisoSomenteLeitura,
  SwimCell,
  SwimCellVazia,
  SwimDivisor,
  SwimGrid,
  SwimHeaderCell,
  SwimLabelCell,
  SwimLabelCliente,
  SwimLabelNome,
} from "./Monitoramento.styled";
import { useFiltroFrente } from "./FiltroFrente";

/**
 * Board macro (§7): todas as tarefas de todos os projetos visíveis, num
 * lugar só. Em swimlanes — uma faixa por projeto — porque um board com os
 * cards misturados dentro da mesma coluna não deixa ver de relance quais
 * são do mesmo projeto; a faixa já é o agrupamento.
 *
 * Read-only de propósito — arrastar move a tarefa DE VERDADE dentro de um
 * projeto, e aqui não tem "o projeto" único pra isso fazer sentido. Clicar
 * no card leva pro board real, onde a ação existe.
 *
 * As colunas vêm do backend já agrupadas por nome (§ TarefasGeraisUseCase):
 * projetos com o fluxo padrão caem nas mesmas 5 colunas de sempre; um
 * projeto com coluna própria só alarga a grade, sem quebrar o resto.
 */
/** Cor fixa por projeto — mesma paleta das colunas de tarefa, pra não
 *  inventar uma segunda linguagem de cor na mesma tela. Não é a cor da
 *  frente nem de nada do domínio, só uma identidade visual estável (o id
 *  não muda, então o projeto sempre cai na mesma cor). */
function corDoProjeto(projetoId: number): string {
  return CORES_SUGERIDAS[projetoId % CORES_SUGERIDAS.length];
}

/** Pra "Voltar" (no header do projeto) devolver pra cá, e não pra listagem
 *  de projetos — ver `voltarDoLocation` em `ProjetoPage.tsx`. */
const VOLTAR_PARA_AQUI = { voltarPara: "/monitoramento/tarefas", voltarRotulo: "Voltar para Monitoramento" };

export function TarefasGeraisAba() {
  const { token } = useAuth();
  const { frenteId, seletor } = useFiltroFrente();
  const navigate = useNavigate();

  function abrirProjeto(projetoId: number) {
    navigate(`/projetos/${projetoId}/tarefas`, { state: VOLTAR_PARA_AQUI });
  }
  const [dados, setDados] = useState<TarefasGerais | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregar() {
    if (!token) return;
    setCarregando(true);
    setErro("");
    try {
      setDados(await getTarefasGerais(token, frenteId));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar as tarefas");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, frenteId]);

  if (erro) {
    return (
      <PageStack>
        {seletor}
        <ErrorBlock>
          <ErrorText>{erro}</ErrorText>
          <PageButton $variant="outline" onClick={carregar}>
            Tentar novamente
          </PageButton>
        </ErrorBlock>
      </PageStack>
    );
  }

  if (carregando || !dados) {
    return (
      <PageStack>
        {seletor}
        <PageLoadingBlock />
      </PageStack>
    );
  }

  if (dados.tarefas.length === 0 || dados.colunas.length === 0) {
    return (
      <PageStack>
        {seletor}
        <EmptyText>Nenhuma tarefa na sua visão.</EmptyText>
      </PageStack>
    );
  }

  // Uma linha por projeto — só quem tem alguma tarefa na visão atual entra.
  const projetos = Array.from(
    new Map(
      dados.tarefas.map((t) => [t.projeto_id, { nome: t.projeto_nome, cliente: t.cliente }]),
    ),
    ([id, info]) => ({ id, ...info }),
  ).sort((a, b) => a.nome.localeCompare(b.nome));

  return (
    <PageStack>
      {seletor}
      <AvisoSomenteLeitura>
        Este quadro é só para consulta. Para mover ou editar uma tarefa, clique nela e abra o
        projeto correspondente.
      </AvisoSomenteLeitura>

      <SwimGrid $colunas={dados.colunas.length}>
        <SwimHeaderCell />
        {dados.colunas.map((coluna) => {
          const tons = tonsDaColuna(coluna.cor);
          return (
            <SwimHeaderCell key={coluna.chave}>
              <ColunaPilula $cor={tons}>
                <Ponto $cor={tons.ponto} />
                {coluna.nome}
              </ColunaPilula>
            </SwimHeaderCell>
          );
        })}

        {projetos.map((projeto, indice) => (
          <Fragment key={projeto.id}>
            {indice > 0 && <SwimDivisor />}
            <SwimLabelCell
              $cor={corDoProjeto(projeto.id)}
              role="button"
              tabIndex={0}
              title="Abrir projeto"
              onClick={() => abrirProjeto(projeto.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter") abrirProjeto(projeto.id);
              }}
            >
              <SwimLabelNome>{projeto.nome}</SwimLabelNome>
              <SwimLabelCliente>{projeto.cliente}</SwimLabelCliente>
            </SwimLabelCell>

            {dados.colunas.map((coluna) => {
              const tons = tonsDaColuna(coluna.cor);
              const tarefas = dados.tarefas.filter(
                (t) => t.projeto_id === projeto.id && t.grupo_coluna === coluna.chave,
              );
              return (
                <SwimCell key={`${projeto.id}-${coluna.chave}`}>
                  {tarefas.length === 0 && <SwimCellVazia>—</SwimCellVazia>}
                  {tarefas.map((tarefa) => {
                    const sinal = SINAL_URGENCIA[tarefa.urgencia];
                    return (
                      <Card
                        key={tarefa.id}
                        $cor={tons}
                        style={{ cursor: "pointer" }}
                        role="button"
                        tabIndex={0}
                        title="Abrir no projeto"
                        onClick={() => abrirProjeto(tarefa.projeto_id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") abrirProjeto(tarefa.projeto_id);
                        }}
                      >
                        <CardTopo>
                          <CardTitulo>{tarefa.titulo}</CardTitulo>
                          {sinal && (
                            <span title={sinal.rotulo(tarefa.dias_para_prazo)}>{sinal.glifo}</span>
                          )}
                        </CardTopo>
                        <CardMeta>
                          <span>{tarefa.responsavel_nome}</span>
                          <span>{formatarData(tarefa.prazo)}</span>
                        </CardMeta>
                      </Card>
                    );
                  })}
                </SwimCell>
              );
            })}
          </Fragment>
        ))}
      </SwimGrid>
    </PageStack>
  );
}
