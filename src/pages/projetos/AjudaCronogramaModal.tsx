import { useEffect } from "react";
import { X } from "lucide-react";
import {
  ModalBody,
  ModalClose,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalTitle,
} from "@/styles/modal.styled";
import { PageButton } from "@/styles/page.styled";
import { COR_PAUSA, CORES_PERIODO_ESCOPO } from "@/components/cronograma-pintado/cores";
import {
  Amostra,
  PassoLista,
  PassoItem,
  PassoTitulo,
  PassoTexto,
  Regra,
  SecaoTitulo,
} from "./AjudaCronograma.styled";

interface Props {
  onFechar: () => void;
}

/**
 * "Como funciona", a explicação da tela, sob demanda.
 *
 * Num botão, e não num texto fixo no topo: quem usa a tela todo dia não
 * precisa reler a instrução, e um aviso permanente vira ruído que se aprende
 * a ignorar. Quem chega pela primeira vez procura ajuda, e acha.
 *
 * ⭐ **Escrito para quem nunca abriu a plataforma.** Duas coisas guiam o texto:
 *
 * 1. **O gesto, porque não se descobre olhando.** Um calendário não anuncia
 *    que é clicável, nem que se pinta arrastando, nem que arrastar por cima do
 *    que já está pintado apaga. Cada um desses é dito com o verbo na frente.
 * 2. **A trava, porque ela recusa o clique.** Marcar banca fora da janela,
 *    entregar antes da banca aprovar, pedir dias depois do prazo — o sistema
 *    devolve erro, e quem não sabia da regra lê o erro como defeito. As regras
 *    ficam em destaque próprio (`Regra`), separadas das dicas.
 *
 * ⚠ O vocabulário é o da tela, não o do código: "largada" e não `data_inicio`,
 * "janela" e não `fim_janela`. Quem lê está olhando os botões.
 */
export function AjudaCronogramaModal({ onFechar }: Props) {
  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") onFechar();
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [onFechar]);

  return (
    <ModalOverlay onMouseDown={onFechar}>
      <ModalContent onMouseDown={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Como montar o cronograma</ModalTitle>
          <ModalClose type="button" aria-label="Fechar" onClick={onFechar}>
            <X size={16} />
          </ModalClose>
        </ModalHeader>

        <ModalBody>
          <SecaoTitulo>O que esta tela é</SecaoTitulo>
          <PassoTexto>
            O calendário do projeto. Aqui você marca as <strong>datas</strong> que importam
            (kickoff, reuniões, banca e entrega) e <strong>pinta</strong> os dias em que cada
            etapa do trabalho acontece. O que você pinta vira a contagem de dias do escopo:
            é dela que saem o "dias usados" e o atraso na aba Visão geral.
          </PassoTexto>

          <SecaoTitulo>Marcar uma data</SecaoTitulo>
          <PassoLista>
            <PassoItem>
              <PassoTitulo>1. Escolha o escopo no seletor de cima</PassoTitulo>
              <PassoTexto>
                No seletor acima. Em <strong>Todos os escopos</strong> você vê o projeto
                inteiro, mas só consegue marcar kickoff e reunião semanal, as datas de
                banca e entrega pertencem a um escopo específico.
              </PassoTexto>
            </PassoItem>

            <PassoItem>
              <PassoTitulo>2. Ligue o botão do que quer marcar</PassoTitulo>
              <PassoTexto>
                <strong>Kickoff</strong>, <strong>Reunião inicial</strong>,{" "}
                <strong>Reunião geral</strong>, <strong>Banca</strong> ou{" "}
                <strong>Entrega</strong>. O botão acende, e é isso que diz que o próximo
                clique no calendário vale para ele.
              </PassoTexto>
            </PassoItem>

            <PassoItem>
              <PassoTitulo>3. Clique no dia</PassoTitulo>
              <PassoTexto>
                No calendário. Abre uma confirmação antes de gravar, nenhum clique crava
                data direto. Para sair do modo sem marcar nada, aperte{" "}
                <strong>Esc</strong> ou clique no botão de novo.
              </PassoTexto>
            </PassoItem>

            <PassoItem>
              <PassoTitulo>Errou? Dá para desfazer</PassoTitulo>
              <PassoTexto>
                Logo depois de marcar aparece uma barra embaixo com <strong>Desfazer</strong>{" "}
                e uma contagem de 30 segundos. Passou disso, a correção é marcar de novo na
                data certa.
              </PassoTexto>
            </PassoItem>
          </PassoLista>

          <SecaoTitulo>Pintar as etapas</SecaoTitulo>
          <PassoLista>
            <PassoItem>
              <PassoTitulo>Crie a etapa e arraste pelos dias</PassoTitulo>
              <PassoTexto>
                Clique em <strong>Nova etapa</strong>, dê um nome e escolha a cor. Ela vira o
                "pincel", e a barra mostra <em>Pintando: nome da etapa</em>. Aí é{" "}
                <strong>arrastar pelos dias</strong> do calendário, não clicar um a um.
              </PassoTexto>
            </PassoItem>

            <PassoItem>
              <PassoTitulo>Para apagar, arraste por cima do que já está pintado</PassoTitulo>
              <PassoTexto>
                Não existe borracha: começar o arrasto num dia já pintado desmarca aquele
                trecho. Para excluir a etapa inteira, use o <strong>×</strong> ao lado do nome
                dela na legenda à direita.
              </PassoTexto>
            </PassoItem>

            <PassoItem>
              <PassoTitulo>Só dias úteis contam</PassoTitulo>
              <PassoTexto>
                Fins de semana, feriados, provas e recessos aparecem hachurados e ficam fora
                da conta. Você pode pintá-los; eles simplesmente não consomem dia nenhum.
              </PassoTexto>
            </PassoItem>
          </PassoLista>

          <SecaoTitulo>A janela do escopo</SecaoTitulo>
          <PassoTexto>
            {/* Cada escopo recebe uma cor do ciclo; a primeira ilustra a ideia. */}
            <Amostra $cor={CORES_PERIODO_ESCOPO[0]} />
            A faixa clara no calendário é a <strong>janela</strong>: os dias úteis que foram
            vendidos ao cliente. Ela abre na <strong>reunião inicial</strong> daquele escopo. Enquanto
            essa reunião não for marcada, o escopo não conta dia nenhum e a legenda
            avisa que a janela não começou.
          </PassoTexto>
          <Regra>
            A <strong>banca precisa caber dentro da janela</strong>. Marcá-la depois do fim só
            passa com autorização da diretoria e uma justificativa: é o único bloqueio duro
            do cronograma.
          </Regra>

          <SecaoTitulo>Precisa de mais dias?</SecaoTitulo>
          <PassoTexto>
            Se o escopo foi vendido apertado, o coordenador do projeto ou a diretoria de
            projetos podem pedir dias extras, e eles <strong>aumentam a janela</strong>. Quem
            decide é sempre a diretoria de projetos. Há dois caminhos: o botão{" "}
            <strong>Pedir mais dias</strong> na barra, ou simplesmente arrastar a etapa além
            do fim da janela, que abre o mesmo pedido já com os dias contados.
          </PassoTexto>
          <Regra>
            O prazo depende de qual escopo é. No <strong>primeiro escopo vendido</strong> ele
            vai até o <strong>último dia da ambientação</strong> (inclusive) — é nela que dá
            para perceber que o escopo foi vendido apertado, e depois dela a largada já é o
            time produzindo. Nos <strong>escopos seguintes</strong>, que não têm ambientação,
            são <strong>3 dias úteis contados da reunião inicial</strong> daquele escopo.
            Passado o prazo o botão some, porque a porta deixa de existir: todo dia além da
            janela vira atraso do projeto, sem autorização envolvida.
          </Regra>

          <SecaoTitulo>Depois da banca</SecaoTitulo>
          <PassoTexto>
            Quando a banca acontece, a contagem do escopo <strong>congela</strong>. O que você
            pintar dali em diante continua aparecendo no calendário, mas não consome dias
            vendidos nem vira atraso, e a legenda marca esses trechos:
          </PassoTexto>
          <PassoTexto>
            <strong>correção</strong> quando a banca <em>não</em> foi aprovada: é o
            retrabalho que ela apontou. <strong>ajustes</strong> quando foi aprovada: são os
            acertos finos antes de entregar.
          </PassoTexto>
          <PassoTexto>
            Marcar a entrega aqui grava o <strong>dia</strong> em que ela aconteceu, e só
            isso. O escopo passa a <strong>Entregue</strong> num segundo passo, na aba{" "}
            <strong>Visão geral</strong>, onde o coordenador do projeto ou a diretoria
            clica em <em>Confirmar entrega</em>. São coisas diferentes de propósito:
            clicar num dia do calendário é fácil de errar, e o status é o que a diretoria
            lê como "foi ao cliente".
          </PassoTexto>
          <Regra>
            Banca não aprovada <strong>trava a entrega ao cliente</strong>. É preciso marcar
            uma nova banca no calendário e ela aprovar. Cada tentativa fica registrada: o
            calendário mostra "Banca" e "2ª banca" nos respectivos dias, e a aba{" "}
            <strong>Banca</strong> guarda o resultado e os votos de cada uma.
          </Regra>

          <SecaoTitulo>Detalhes que ajudam</SecaoTitulo>
          <PassoLista>
            <PassoItem>
              <PassoTitulo>Clique na banca para ver a ficha</PassoTitulo>
              <PassoTexto>
                A marcação de banca no calendário é clicável: abre quem avalia, quem é a
                equipe e o resultado, sem sair do cronograma.
              </PassoTexto>
            </PassoItem>

            <PassoItem>
              <PassoTitulo>
                <Amostra $cor={COR_PAUSA} />
                Faixas que você não pintou
              </PassoTitulo>
              <PassoTexto>
                O cronograma desenha sozinho a <strong>ambientação</strong> (os primeiros dias
                depois do kickoff) e o <strong>tempo parado entre escopos</strong>, o vão
                entre a entrega de um e a largada do próximo. Elas explicam buracos no
                calendário que não são esquecimento.
              </PassoTexto>
            </PassoItem>

            <PassoItem>
              <PassoTitulo>Dia, Semana e Mês</PassoTitulo>
              <PassoTexto>
                Trocam o zoom do calendário. <strong>Exportar</strong> gera uma imagem do que
                está na tela, para colar em apresentação ou mandar ao cliente.
              </PassoTexto>
            </PassoItem>

            <PassoItem>
              <PassoTitulo>Entrega prevista ao cliente</PassoTitulo>
              <PassoTexto>
                O campo de data na barra é a <strong>promessa</strong> feita na venda, do
                projeto inteiro. Ela aparece como marco no calendário e convive com a entrega
                real de cada escopo: é a diferença entre as duas que responde se entregamos
                no prazo.
              </PassoTexto>
            </PassoItem>
          </PassoLista>
        </ModalBody>

        <ModalFooter>
          <PageButton type="button" onClick={onFechar}>
            Entendi
          </PageButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
}
