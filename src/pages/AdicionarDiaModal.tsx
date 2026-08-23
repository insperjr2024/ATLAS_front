import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { TipoDiaNaoLetivo } from "@/lib/calendario-academico";
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
import {
  FieldGroup,
  FieldInput,
  FieldLabel,
  FieldSelect,
  FormErrorText,
} from "./Bancas.styled";

/**
 * Até onde o dia alcança.
 *
 * São três degraus, do mais amplo ao mais estreito, e não dois: a frente
 * deixou de ser o menor recorte quando um curso dela passou a ter calendário
 * próprio.
 */
export type DestinoDoDia = "global" | "frente" | "calendario";

interface Props {
  nomeFrente: string;
  /** O calendário de curso aberto na tela. `null` = a frente tem um só. */
  nomeCalendario?: string | null;
  /** Limites do semestre: o backend recusa data fora dele. */
  semestre: { nome: string; inicio: string; fim: string };
  onCancelar: () => void;
  onSalvar: (dados: {
    data: string;
    tipo: TipoDiaNaoLetivo;
    descricao: string;
    destino: DestinoDoDia;
  }) => Promise<void>;
}

/** Os tipos que o banco aceita. "Aulas canceladas" não é um deles, vira
 *  `recesso` com a descrição preservada, igual ao que a importação do PDF faz. */
const TIPOS: { valor: TipoDiaNaoLetivo; rotulo: string }[] = [
  { valor: "feriado", rotulo: "Feriado" },
  { valor: "prova", rotulo: "Semana de avaliação" },
  { valor: "recesso", rotulo: "Recesso / aulas canceladas" },
];

/**
 * Acrescentar um dia não útil sem passar pelo PDF.
 *
 * O calendário do Insper não cobre tudo: a diretoria precisa poder bloquear um
 * dia que só ela sabe, uma data institucional da Jr, um evento interno.
 */
export function AdicionarDiaModal({
  nomeFrente,
  nomeCalendario,
  semestre,
  onCancelar,
  onSalvar,
}: Props) {
  const [data, setData] = useState("");
  const [tipo, setTipo] = useState<TipoDiaNaoLetivo>("feriado");
  const [descricao, setDescricao] = useState("");
  /* Nasce no recorte mais estreito que está aberto na tela: quem abriu o
     calendário de um curso está mexendo nele, e o dia que vale para todos é a
     exceção, não o padrão. */
  const [destino, setDestino] = useState<DestinoDoDia>(
    nomeCalendario ? "calendario" : "frente",
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

  // Semana de avaliação é do CURSO: o backend recusa gravá-la sem frente. A
  // trava vive lá; aqui o campo só reflete isso em vez de deixar errar.
  const podeSerGlobal = tipo !== "prova";
  const escolhido: DestinoDoDia = destino === "global" && !podeSerGlobal ? "frente" : destino;

  const DESTINOS: { valor: DestinoDoDia; rotulo: string; nota?: string }[] = [
    {
      valor: "global",
      rotulo: "Todas as frentes",
      nota: podeSerGlobal
        ? "Feriado nacional e afins."
        : "Indisponível: cada curso tem as suas datas de avaliação.",
    },
    {
      valor: "frente",
      rotulo: `${nomeFrente} inteira`,
      nota: "Vale para todos os cursos desta frente.",
    },
    ...(nomeCalendario
      ? [
          {
            valor: "calendario" as DestinoDoDia,
            rotulo: nomeCalendario,
            nota: "Só para quem segue este calendário.",
          },
        ]
      : []),
  ];

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!data) {
      setErro("Escolha a data.");
      return;
    }
    setErro("");
    setSalvando(true);
    try {
      await onSalvar({
        data,
        tipo,
        descricao: descricao.trim() || TIPOS.find((t) => t.valor === tipo)!.rotulo,
        destino: escolhido,
      });
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao adicionar");
      setSalvando(false);
    }
  }

  return (
    <ModalOverlay onMouseDown={onCancelar}>
      <ModalContent onMouseDown={(e) => e.stopPropagation()}>
        <form onSubmit={enviar}>
          <ModalHeader>
            <ModalTitle>Adicionar dia não útil</ModalTitle>
            <ModalClose type="button" aria-label="Fechar" onClick={onCancelar}>
              <X size={16} />
            </ModalClose>
          </ModalHeader>

          <ModalBody>
            <FieldGroup>
              <FieldLabel htmlFor="dia-data">Data</FieldLabel>
              <FieldInput
                id="dia-data"
                type="date"
                autoFocus
                value={data}
                min={semestre.inicio}
                max={semestre.fim}
                onChange={(e) => setData(e.target.value)}
              />
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor="dia-tipo">Tipo</FieldLabel>
              <FieldSelect
                id="dia-tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoDiaNaoLetivo)}
              >
                {TIPOS.map((t) => (
                  <option key={t.valor} value={t.valor}>
                    {t.rotulo}
                  </option>
                ))}
              </FieldSelect>
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor="dia-descricao">Descrição</FieldLabel>
              <FieldInput
                id="dia-descricao"
                value={descricao}
                placeholder="Aparece no calendário, ex.: Aulas canceladas"
                onChange={(e) => setDescricao(e.target.value)}
              />
            </FieldGroup>

            <FieldGroup>
              <FieldLabel as="span">Vale para</FieldLabel>
              {DESTINOS.map((d) => (
                <label
                  key={d.valor}
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                >
                  <input
                    type="radio"
                    name="destino-do-dia"
                    checked={escolhido === d.valor}
                    disabled={d.valor === "global" && !podeSerGlobal}
                    onChange={() => setDestino(d.valor)}
                  />
                  <span>
                    {d.rotulo}
                    {d.nota && <small style={{ opacity: 0.75 }}> · {d.nota}</small>}
                  </span>
                </label>
              ))}
            </FieldGroup>

            {erro && <FormErrorText>{erro}</FormErrorText>}
          </ModalBody>

          <ModalFooter>
            <PageButton type="button" $variant="outline" onClick={onCancelar}>
              Cancelar
            </PageButton>
            <PageButton type="submit" disabled={salvando}>
              {salvando ? "Adicionando…" : "Adicionar"}
            </PageButton>
          </ModalFooter>
        </form>
      </ModalContent>
    </ModalOverlay>
  );
}
