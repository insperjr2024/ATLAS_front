import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { nomeUsuario } from "@/lib/nucleo";
import { toDateInputValue, toTimeInputValue } from "@/lib/bancas";
import { CODIGO_BANCA_ABAIXO_DO_MINIMO, codigoDoErro } from "@/lib/api";
import type { Banca, Candidatura } from "@/types/banca";
import type { UsuarioResumo } from "@/types/auth";
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
import { AvisoRegra } from "@/components/AvisoRegra";
import { ListaMarcavel } from "@/components/ListaMarcavel";
import { FieldGroup, FieldInput, FieldLabel, FormErrorText } from "./Bancas.styled";

interface Props {
  banca: Banca;
  /** As candidaturas DESTA banca, quem se inscreveu. */
  candidaturas: Candidatura[];
  usuarios: UsuarioResumo[];
  ehDiretor: boolean;
  onCancelar: () => void;
  onConfirmar: (dados: {
    realizado_em: string;
    presentes: number[];
    forcar: boolean;
  }) => Promise<void>;
}

/**
 * Registrar que a banca aconteceu, e quem compareceu.
 *
 * É esta escrita que separa "a data passou" de "a banca foi feita". Sem
 * ela a banca fica `atrasada` para sempre, e o  mede o atraso do projeto
 * exatamente por isso, então o monitoramento acusaria atraso de uma banca que
 * correu bem.
 */
export function RealizarBancaModal({
  banca,
  candidaturas,
  usuarios,
  ehDiretor,
  onCancelar,
  onConfirmar,
}: Props) {
  const dataPadrao = banca.data_hora ? toDateInputValue(banca.data_hora) : "";
  const horaPadrao = banca.data_hora ? toTimeInputValue(banca.data_hora) : "";

  const [data, setData] = useState(dataPadrao);
  const [hora, setHora] = useState(horaPadrao);
  // Todo mundo que se inscreveu começa marcado: o normal é a banca acontecer
  // com quem se comprometeu, e desmarcar a falta é mais rápido que marcar
  // presença um a um.
  const [presentes, setPresentes] = useState<Set<number>>(
    () => new Set(candidaturas.map((c) => c.usuario_id)),
  );
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  /* Quem se inscreveu, por nome: a ordem das candidaturas é a de quem clicou
     primeiro, que não ajuda ninguém a achar uma pessoa na lista. */
  const inscritos = useMemo(
    () =>
      candidaturas
        .map((c) => ({ id: c.usuario_id, nome: nomeUsuario(usuarios, c.usuario_id) }))
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    [candidaturas, usuarios],
  );

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") onCancelar();
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [onCancelar]);

  /**
   * **Só o TOTAL, e é por isso que isto não decide mais o `forcar`.**
   *
   * O  tem três regras de composição, e esta é uma: o piso total. As outras
   * duas são por FRENTE (piso de cada uma, e a liderança de cada uma), e o
   * front não tem como calculá-las, nenhum endpoint expõe os déficits por
   * frente, e reimplementar `ComposicaoBancaChecker` aqui criaria uma segunda
   * régua que divergiria da primeira.
   *
   * O efeito de usá-la como gate era um BECO: uma banca com 5 de 5 alocados
   * mas sem ninguém de Direito passava por aqui como completa, ia sem
   * `forcar`, e o backend recusava com "faltam 1 de Direito", sem que a
   * diretora tivesse qualquer botão para seguir. Continua servindo para o
   * aviso adiantado, que é o que ela sabe responder.
   */
  const totalAbaixoDoMinimo = candidaturas.length < banca.piso_minimo;

  /**
   * A recusa de composição que o BACKEND devolveu, a régua completa.
   *
   * Enquanto não há uma, `forcar` vai `false`: ninguém força o que ainda não
   * foi barrado. Depois dela, a diretora ganha o botão de registrar assim
   * mesmo, e a decisão continua morando num lugar só (o servidor).
   */
  const [recusaDeComposicao, setRecusaDeComposicao] = useState(false);

  async function enviar(e: React.FormEvent, forcar = false) {
    e.preventDefault();
    if (!data || !hora) {
      setErro("Informe a data e a hora em que a banca aconteceu.");
      return;
    }
    setErro("");
    setSalvando(true);
    try {
      await onConfirmar({
        // Os dois campos são hora LOCAL, é o que a pessoa digitou olhando o
        // relógio dela. O banco guarda UTC (ver `paraDataUtc` em
        // `lib/projetos.ts`), então a conversão tem de acontecer AQUI. Mandar a
        // string crua fazia o backend gravar 14:00 local como 14:00 UTC, e a
        // banca reaparecia 3h mais cedo, a cada registro, sempre para trás.
        // O `marcarBancaDoEscopo` do cronograma já fazia certo; era só este.
        realizado_em: new Date(`${data}T${hora}:00`).toISOString(),
        presentes: [...presentes],
        forcar,
      });
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : "Erro ao registrar";
      setErro(mensagem);
      // ⭐ O CÓDIGO da recusa, não um trecho do texto. Só ele destrava o
      // "registrar assim mesmo" — erro de rede ou de data não deve virar
      // convite para forçar.
      //
      // Antes isto procurava a frase "Composição incompleta" dentro da
      // mensagem. A frase mudou quando o piso por frente saiu do §8, e o botão
      // da diretoria sumiu sem ninguém perceber: a plataforma recusava e não
      // oferecia saída. Texto é para ler; código é contrato.
      setRecusaDeComposicao(codigoDoErro(err) === CODIGO_BANCA_ABAIXO_DO_MINIMO);
      setSalvando(false);
    }
  }

  return (
    <ModalOverlay onMouseDown={onCancelar}>
      <ModalContent onMouseDown={(e) => e.stopPropagation()}>
        <form onSubmit={enviar}>
          <ModalHeader>
            <ModalTitle>Registrar realização · {banca.nome_projeto}</ModalTitle>
            <ModalClose type="button" aria-label="Fechar" onClick={onCancelar}>
              <X size={16} />
            </ModalClose>
          </ModalHeader>

          <ModalBody>
            <FieldGroup>
              <FieldLabel htmlFor="realizado-data">Quando aconteceu</FieldLabel>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <FieldInput
                  id="realizado-data"
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                />
                <FieldInput
                  type="time"
                  aria-label="Hora"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                />
              </div>
            </FieldGroup>

            <FieldGroup>
              <FieldLabel as="span">
                Quem compareceu ({presentes.size} de {candidaturas.length})
              </FieldLabel>
              {candidaturas.length === 0 ? (
                <small style={{ opacity: 0.75 }}>Ninguém se inscreveu nesta banca.</small>
              ) : (
                <ListaMarcavel
                  opcoes={inscritos}
                  marcados={(id) => presentes.has(id)}
                  onAlternar={(id) =>
                    setPresentes((atual) => {
                      const proximo = new Set(atual);
                      if (proximo.has(id)) proximo.delete(id);
                      else proximo.add(id);
                      return proximo;
                    })
                  }
                  vazio="Ninguém se inscreveu nesta banca."
                  placeholder="Buscar quem compareceu…"
                  aria-label="Buscar quem compareceu"
                />
              )}
            </FieldGroup>

            {/* Aviso ADIANTADO do que o front sabe conferir sozinho (o total).
                Não barra nada: quem barra é o backend, que também olha as
                frentes. Some depois da recusa, para não ficar dois blocos
                vermelhos dizendo quase a mesma coisa. */}
            {totalAbaixoDoMinimo && !erro && (
              <FormErrorText>
                Esta banca tem {candidaturas.length} de {banca.piso_minimo} pessoas alocadas.{" "}
                {ehDiretor
                  ? "Como diretor, você pode registrá-la assim mesmo."
                  : "Só o Diretor de Projetos pode registrá-la abaixo do mínimo, peça a ele."}
              </FormErrorText>
            )}

            <AvisoRegra mensagem={erro} onFechar={() => setErro("")} />
          </ModalBody>

          <ModalFooter>
            <PageButton type="button" $variant="outline" onClick={onCancelar}>
              Cancelar
            </PageButton>
            {/* A saída do beco: o backend recusou por composição e quem está
                aqui é a diretoria, então ela reenvia com `forcar`. O botão só
                nasce DEPOIS da recusa, antes dela não há o que forçar, e
                oferecer o atalho de largada convidaria a pular a regra. */}
            {recusaDeComposicao && ehDiretor ? (
              <PageButton
                type="button"
                disabled={salvando}
                onClick={(e) => enviar(e as unknown as React.FormEvent, true)}
              >
                {salvando ? "Registrando…" : "Registrar assim mesmo"}
              </PageButton>
            ) : (
              /* ⭐ Desligado para quem NUNCA vai conseguir forçar.
                 O aviso acima já diz quantos faltam; deixar o botão aceso
                 fazia o coordenador clicar para receber de volta a mesma frase
                 que estava na tela. Só para ele: para a diretoria o botão
                 continua ativo, porque é o clique dela que revela a recusa do
                 backend — a régua completa, com os pisos por frente — e destrava
                 o "Registrar assim mesmo". Desligá-lo para ela recriaria o beco
                 que este modal existe para não ter. */
              <PageButton
                type="submit"
                disabled={salvando || (totalAbaixoDoMinimo && !ehDiretor)}
              >
                {salvando ? "Registrando…" : "Registrar realização"}
              </PageButton>
            )}
          </ModalFooter>
        </form>
      </ModalContent>
    </ModalOverlay>
  );
}
