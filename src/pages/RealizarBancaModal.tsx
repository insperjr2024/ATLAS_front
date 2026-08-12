import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { nomeUsuario } from "@/lib/nucleo";
import { toDateInputValue, toTimeInputValue } from "@/lib/bancas";
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
import {
  CheckboxGrid,
  CheckboxLabel,
  FieldGroup,
  FieldInput,
  FieldLabel,
  FormErrorText,
} from "./Bancas.styled";

interface Props {
  banca: Banca;
  /** As candidaturas DESTA banca — quem se inscreveu. */
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
 * Registrar que a banca aconteceu, e quem compareceu (§8).
 *
 * ⭐ É esta escrita que separa "a data passou" de "a banca foi feita". Sem
 * ela a banca fica `atrasada` para sempre — e o §7.4 mede o atraso do projeto
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

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") onCancelar();
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [onCancelar]);

  const abaixoDoMinimo = candidaturas.length < banca.piso_minimo;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!data || !hora) {
      setErro("Informe a data e a hora em que a banca aconteceu.");
      return;
    }
    setErro("");
    setSalvando(true);
    try {
      await onConfirmar({
        // ⚠ Os dois campos são hora LOCAL — é o que a pessoa digitou olhando o
        // relógio dela. O banco guarda UTC (ver `paraDataUtc` em
        // `lib/projetos.ts`), então a conversão tem de acontecer AQUI. Mandar a
        // string crua fazia o backend gravar 14:00 local como 14:00 UTC, e a
        // banca reaparecia 3h mais cedo — a cada registro, sempre para trás.
        // O `marcarBancaDoEscopo` do cronograma já fazia certo; era só este.
        realizado_em: new Date(`${data}T${hora}:00`).toISOString(),
        presentes: [...presentes],
        // O backend recusa abaixo do mínimo sem isto, e só aceita de diretor.
        forcar: abaixoDoMinimo && ehDiretor,
      });
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao registrar");
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
                <CheckboxGrid>
                  {candidaturas.map((c) => (
                    <CheckboxLabel key={c.id}>
                      <input
                        type="checkbox"
                        checked={presentes.has(c.usuario_id)}
                        onChange={() =>
                          setPresentes((atual) => {
                            const proximo = new Set(atual);
                            if (proximo.has(c.usuario_id)) proximo.delete(c.usuario_id);
                            else proximo.add(c.usuario_id);
                            return proximo;
                          })
                        }
                      />
                      <span>{nomeUsuario(usuarios, c.usuario_id)}</span>
                    </CheckboxLabel>
                  ))}
                </CheckboxGrid>
              )}
            </FieldGroup>

            {/* A composição do §8 é regra de negócio: quem afrouxa é a
                diretoria. Para os demais isto é um beco, e o texto precisa
                dizer o que fazer em vez de só barrar. */}
            {abaixoDoMinimo && (
              <FormErrorText>
                Esta banca tem {candidaturas.length} de {banca.piso_minimo} pessoas alocadas.{" "}
                {ehDiretor
                  ? "Como diretor, você pode registrá-la assim mesmo."
                  : "Só o Diretor de Projetos pode registrá-la abaixo do mínimo — peça a ele."}
              </FormErrorText>
            )}

            <AvisoRegra mensagem={erro} onFechar={() => setErro("")} />
          </ModalBody>

          <ModalFooter>
            <PageButton type="button" $variant="outline" onClick={onCancelar}>
              Cancelar
            </PageButton>
            <PageButton type="submit" disabled={salvando || (abaixoDoMinimo && !ehDiretor)}>
              {salvando
                ? "Registrando…"
                : abaixoDoMinimo && ehDiretor
                  ? "Registrar assim mesmo"
                  : "Registrar realização"}
            </PageButton>
          </ModalFooter>
        </form>
      </ModalContent>
    </ModalOverlay>
  );
}
