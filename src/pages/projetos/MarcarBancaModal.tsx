import { useState } from "react";
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
import { formatarData } from "@/lib/projetos";
import {
  EscopoOpcao,
  EscopoPicker,
  FieldGroup,
  FieldInput,
  FieldLabel,
  FormErrorText,
} from "./Projetos.styled";

/** §13: remarcar uma banca que acontece dentro desta folga exige diretoria. */
const FOLGA_LIVRE_DIAS_UTEIS = 5;

/** O mínimo que o seletor de cobertura precisa saber de cada escopo. */
export interface EscopoCobrivel {
  id: number;
  nome: string;
  frente_id: number;
  status: string;
  /** A banca que já cobre este escopo, se houver. */
  bancaId?: number | null;
}

interface Props {
  nomeEscopo: string;
  /** Os escopos do projeto — a banca pode cobrir mais de um (§8). */
  escoposDoProjeto: EscopoCobrivel[];
  /** O id do escopo em foco (entra na cobertura sempre). */
  escopoId: number;
  /** A banca atual deste escopo, para saber quais outros já são dela. */
  bancaAtualId?: number | null;
  nomeFrente: (id: number) => string;
  /** O dia clicado no calendário, em `yyyy-MM-dd`. */
  dia: string;
  /** A banca já tem data — então isto é uma REMARCAÇÃO, não a primeira. */
  jaTemData: boolean;
  /** O último dia da janela do escopo; fora dela só a diretoria marca. */
  fimJanela: string | null;
  /** Dias úteis até a banca ATUAL acontecer. `null` quando ela não tem data. */
  folgaAtual: number | null;
  ehDiretor: boolean;
  onCancelar: () => void;
  /** Se rejeitar, a mensagem do backend aparece no próprio formulário. */
  onConfirmar: (
    justificativa: string,
    horario: string,
    escopoIds: number[],
  ) => Promise<void> | void;
}

/**
 * A banca marcada pelo calendário (§9) — "uma data só" (§8): escreve na MESMA
 * linha que a tela de Bancas lê, sem espelho nem sincronização.
 *
 * ⭐ **É o único bloqueio duro do cronograma.** Pintar etapa além da janela é
 * livre e só avisa (§15); marcar banca fora dela não passa sem a diretoria — e
 * a tela barra antes de enviar, em vez de deixar o 422 explicar depois.
 *
 * A justificativa é exigida em três casos, e por motivos diferentes:
 *
 * - a data cai **fora da janela** do escopo (só a diretoria, §13);
 * - é uma **remarcação** — §9: remarcar nunca é silencioso;
 * - a banca atual acontece nos **próximos 5 dias úteis** (§13: os avaliadores
 *   já reservaram a agenda), e aí também só a diretoria.
 *
 * Quem decide de verdade continua sendo o backend: se ele recusar, a mensagem
 * dele aparece aqui embaixo.
 */
export function MarcarBancaModal({
  nomeEscopo,
  escoposDoProjeto,
  escopoId,
  bancaAtualId,
  nomeFrente,
  dia,
  jaTemData,
  fimJanela,
  folgaAtual,
  ehDiretor,
  onCancelar,
  onConfirmar,
}: Props) {
  const [justificativa, setJustificativa] = useState("");
  /**
   * Os OUTROS escopos que esta banca passa a cobrir (§8).
   *
   * Vive aqui, e não numa tela à parte, porque a cobertura muda o que a data
   * significa: uma banca que cobre dois escopos precisa caber na janela dos
   * dois, e a composição exigida passa a somar as frentes dos dois.
   */
  const [cobertos, setCobertos] = useState<number[]>(
    escoposDoProjeto.filter((e) => e.id !== escopoId && e.bancaId && e.bancaId === bancaAtualId)
      .map((e) => e.id),
  );
  // 14h é o horário padrão das bancas; editável porque a trava de choque de
  // horário do §8 compara data E hora — sem o campo, duas bancas do mesmo dia
  // colidiriam sempre.
  const [horario, setHorario] = useState("14:00");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const foraDaJanela = !!fimJanela && dia > fimJanela;
  const emCimaDaHora =
    jaTemData && folgaAtual !== null && folgaAtual <= FOLGA_LIVRE_DIAS_UTEIS;
  const exigeJustificativa = jaTemData || foraDaJanela;
  const exigeDiretoria = foraDaJanela || emCimaDaHora;
  const bloqueado = exigeDiretoria && !ehDiretor;

  const candidatos = escoposDoProjeto.filter(
    (e) => e.id === escopoId || e.status !== "cancelado",
  );
  // Escopo preso a OUTRA banca não pode ser juntado: como cada escopo tem no
  // máximo uma, juntá-lo aqui apagaria em silêncio a data que já estava nele.
  const travado = (e: EscopoCobrivel) =>
    e.id !== escopoId && !!e.bancaId && e.bancaId !== bancaAtualId;
  const frentesEnvolvidas = [
    ...new Set(
      candidatos
        .filter((e) => e.id === escopoId || cobertos.includes(e.id))
        .map((e) => e.frente_id),
    ),
  ];

  async function enviar() {
    setErro("");
    setEnviando(true);
    try {
      await onConfirmar(justificativa.trim(), horario, [
        ...new Set([escopoId, ...cobertos]),
      ]);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível marcar a banca");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <ModalOverlay onClick={onCancelar}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>{jaTemData ? "Remarcar banca" : "Marcar banca"}</ModalTitle>
          <ModalClose type="button" onClick={onCancelar} aria-label="Fechar">
            <X size={16} />
          </ModalClose>
        </ModalHeader>

        <ModalBody>
          <p>
            <strong>{nomeEscopo}</strong> — banca em {formatarData(dia)}.
          </p>

          {foraDaJanela && (
            <p>
              ⚠ Esta data está <strong>fora da janela</strong> do escopo, que termina
              em {formatarData(fimJanela)}.{" "}
              {ehDiretor
                ? "Os dias além da janela entram como atraso do projeto."
                : "Marcar aqui é decisão da diretoria — escolha um dia dentro da janela ou peça autorização."}
            </p>
          )}

          {emCimaDaHora && (
            <p>
              ⚠ A banca atual acontece em{" "}
              <strong>
                {folgaAtual} {folgaAtual === 1 ? "dia útil" : "dias úteis"}
              </strong>{" "}
              e os avaliadores já estão escalados.{" "}
              {ehDiretor
                ? "A remarcação fica registrada com a justificativa."
                : "Remarcar em cima da hora é decisão da diretoria."}
            </p>
          )}

          {candidatos.length > 1 && (
            <FieldGroup>
              <FieldLabel as="span">Escopos nesta banca</FieldLabel>
              <EscopoPicker>
                {candidatos.map((e) => (
                  <EscopoOpcao key={e.id} $bloqueado={travado(e)}>
                    <input
                      type="checkbox"
                      checked={e.id === escopoId || cobertos.includes(e.id)}
                      // O escopo de onde a banca está sendo marcada entra
                      // sempre — desmarcá-lo deixaria a ação sem sentido.
                      disabled={travado(e) || e.id === escopoId}
                      onChange={() =>
                        setCobertos((atuais) =>
                          atuais.includes(e.id)
                            ? atuais.filter((x) => x !== e.id)
                            : [...atuais, e.id],
                        )
                      }
                    />
                    <span>{e.nome}</span>
                    <small>{travado(e) ? "já tem banca própria" : nomeFrente(e.frente_id)}</small>
                  </EscopoOpcao>
                ))}
              </EscopoPicker>
            </FieldGroup>
          )}

          {frentesEnvolvidas.length > 1 && (
            <p>
              Esta banca vai cobrir {frentesEnvolvidas.map(nomeFrente).join(" e ")} — a composição
              exigida passa a somar as duas frentes.
            </p>
          )}

          <FieldGroup>
            <FieldLabel htmlFor="horario-banca">Horário</FieldLabel>
            <FieldInput
              id="horario-banca"
              type="time"
              value={horario}
              onChange={(e) => setHorario(e.target.value)}
            />
          </FieldGroup>

          {exigeJustificativa && !bloqueado && (
            <FieldGroup>
              <FieldLabel htmlFor="justificativa-banca">Justificativa</FieldLabel>
              <FieldInput
                as="textarea"
                id="justificativa-banca"
                rows={3}
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
              />
            </FieldGroup>
          )}

          {erro && <FormErrorText>{erro}</FormErrorText>}
        </ModalBody>

        <ModalFooter>
          <PageButton type="button" $variant="ghost" onClick={onCancelar}>
            Cancelar
          </PageButton>
          <PageButton
            type="button"
            disabled={
              enviando || bloqueado || !horario || (exigeJustificativa && !justificativa.trim())
            }
            onClick={enviar}
          >
            {jaTemData ? "Remarcar" : "Marcar"}
          </PageButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
}
