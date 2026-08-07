import { Fragment, useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
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
  BarraBusca,
  BotaoLimparBusca,
  CabecalhoQuadro,
  LinhaColunas,
  SwimGrid,
  SwimHeaderCell,
  SwimLabelCell,
  SwimLabelCliente,
  SwimLabelNome,
  SwimLabelTexto,
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
  const [busca, setBusca] = useState("");
  /* O cabeçalho é um elemento separado do quadro (ver o JSX); esta referência
     existe só para manter os dois na mesma posição horizontal. */
  const refCabecalho = useRef<HTMLDivElement>(null);
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
  )
    // A busca casa com NOME e CLIENTE: quem procura "Padaria" costuma ter o
    // cliente na cabeça, não o nome interno do projeto.
    .filter((p) =>
      `${p.nome} ${p.cliente}`.toLowerCase().includes(busca.trim().toLowerCase()),
    )
    .sort((a, b) => a.nome.localeCompare(b.nome));

  return (
    <PageStack>
      {seletor}
      <AvisoSomenteLeitura>
        Este quadro é só para consulta. Para mover ou editar uma tarefa, clique nela e abra o
        projeto correspondente.
      </AvisoSomenteLeitura>

      <BarraBusca>
        <Search size={15} aria-hidden="true" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar projeto ou cliente"
          aria-label="Buscar projeto ou cliente"
        />
        {busca && (
          <BotaoLimparBusca type="button" onClick={() => setBusca("")} aria-label="Limpar busca">
            <X size={14} />
          </BotaoLimparBusca>
        )}
      </BarraBusca>

      {projetos.length === 0 ? (
        <EmptyText>Nenhum projeto com "{busca}".</EmptyText>
      ) : (
        <>
        {/* O cabeçalho fica FORA do quadro para poder grudar no topo da página:
            dentro dele, que rola na horizontal, o sticky se ancoraria no quadro e
            não na página. O preço é alinhar as colunas na mão, logo abaixo. */}
        <CabecalhoQuadro ref={refCabecalho}>
          <LinhaColunas $colunas={dados.colunas.length}>
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
          </LinhaColunas>
        </CabecalhoQuadro>

        <SwimGrid
          $colunas={dados.colunas.length}
          onScroll={(e) => {
            // Espelha a rolagem horizontal no cabeçalho. Sem isto as pílulas
            // ficariam paradas enquanto os cards andam, e cada card passaria a
            // ser lido sob a coluna errada.
            if (refCabecalho.current) {
              refCabecalho.current.scrollLeft = e.currentTarget.scrollLeft;
            }
          }}
        >
          {projetos.map((projeto) => (
            <Fragment key={projeto.id}>
              {/* Linha PRÓPRIA, ocupando a largura toda — não é mais uma coluna
                  congelada à esquerda. Como coluna, os cards passavam por baixo
                  dela ao rolar para o lado, que é o comportamento inerente de
                  `position: sticky` e não tinha conserto por CSS. Aqui não há
                  nada embaixo para cobrir. */}
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
                {/* O texto é que gruda à esquerda, não a linha: assim o nome
                    continua legível com o quadro rolado, sem tapar coisa
                    nenhuma. */}
                <SwimLabelTexto>
                  <SwimLabelNome>{projeto.nome}</SwimLabelNome>
                  <SwimLabelCliente>{projeto.cliente}</SwimLabelCliente>
                </SwimLabelTexto>
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
        </>
      )}
    </PageStack>
  );
}
