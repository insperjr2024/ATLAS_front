import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { Textarea } from "@/components/ui/textarea";
import { getUsuarios } from "@/lib/usuarios";
import { getPilares, type Acao, type AcaoPayload, type Pilar } from "@/lib/health-track";
import type { UsuarioResumo } from "@/types/auth";
import { FieldGroup, FieldInput, FieldLabel, FieldSelect, FormErrorText, Required } from "@/pages/Bancas.styled";
import { PageButton } from "@/styles/page.styled";
import {
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalTitle,
} from "@/styles/modal.styled";
import { FormAcao } from "./HealthTrack.styled";

/**
 * Criar ou editar uma ação (§15): problema, próxima ação, responsável, prazo
 * e, se quiser, o pilar. Responsável é qualquer membro ativo; quem está no
 * projeto aparece primeiro na lista.
 */
export function AcaoModal({
  projetoNome,
  inicial,
  equipeIds,
  onConfirmar,
  onCancelar,
}: {
  projetoNome: string;
  inicial?: Acao | null;
  /** Ids de quem está no projeto, pra subir no seletor de responsável. */
  equipeIds?: number[];
  onConfirmar: (dados: AcaoPayload) => Promise<void>;
  onCancelar: () => void;
}) {
  const { token } = useAuth();
  const [usuarios, setUsuarios] = useState<UsuarioResumo[]>([]);
  const [pilares, setPilares] = useState<Pilar[]>([]);
  const [form, setForm] = useState<AcaoPayload>({
    problema: inicial?.problema ?? "",
    proxima_acao: inicial?.proxima_acao ?? "",
    responsavel_id: inicial?.responsavel_id ?? null,
    prazo: inicial?.prazo ?? null,
    pilar_id: inicial?.pilar_id ?? null,
  });
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!token) return;
    let vivo = true;
    getUsuarios(token)
      .then((lista) => vivo && setUsuarios(lista.filter((u) => u.status === "ativo")))
      .catch(() => undefined);
    getPilares(token)
      .then((lista) => vivo && setPilares(lista))
      .catch(() => undefined);
    return () => {
      vivo = false;
    };
  }, [token]);

  const equipe = new Set(equipeIds ?? []);
  const ordenados = [...usuarios].sort(
    (a, b) => Number(equipe.has(b.id)) - Number(equipe.has(a.id)) || a.nome.localeCompare(b.nome, "pt-BR"),
  );
  const valido = form.problema.trim().length >= 3 && form.proxima_acao.trim().length >= 3;

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!valido) return;
    setEnviando(true);
    setErro("");
    try {
      await onConfirmar({ ...form, problema: form.problema.trim(), proxima_acao: form.proxima_acao.trim() });
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível salvar a ação");
      setEnviando(false);
    }
  }

  return (
    <ModalOverlay onMouseDown={onCancelar}>
      <ModalContent onMouseDown={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>{inicial ? "Editar ação" : "Nova ação"} · {projetoNome}</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <FormAcao id="form-acao" onSubmit={enviar} noValidate>
            <FieldGroup className="cheio">
              <FieldLabel htmlFor="acao-problema">
                Problema<Required>*</Required>
              </FieldLabel>
              <Textarea
                id="acao-problema"
                rows={2}
                value={form.problema}
                onChange={(e) => setForm({ ...form, problema: e.target.value })}
                placeholder="O que está acontecendo"
                disabled={enviando}
                autoFocus
              />
            </FieldGroup>
            <FieldGroup className="cheio">
              <FieldLabel htmlFor="acao-proxima">
                Próxima ação<Required>*</Required>
              </FieldLabel>
              <Textarea
                id="acao-proxima"
                rows={2}
                value={form.proxima_acao}
                onChange={(e) => setForm({ ...form, proxima_acao: e.target.value })}
                placeholder="O que vai ser feito"
                disabled={enviando}
              />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel htmlFor="acao-responsavel">Responsável</FieldLabel>
              <FieldSelect
                id="acao-responsavel"
                value={form.responsavel_id ?? ""}
                onChange={(e) => setForm({ ...form, responsavel_id: e.target.value ? Number(e.target.value) : null })}
                disabled={enviando}
              >
                <option value="">Sem responsável</option>
                {ordenados.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome}
                    {equipe.has(u.id) ? " (no projeto)" : ""}
                  </option>
                ))}
              </FieldSelect>
            </FieldGroup>
            <FieldGroup>
              <FieldLabel htmlFor="acao-prazo">Prazo</FieldLabel>
              <FieldInput
                id="acao-prazo"
                type="date"
                value={form.prazo ?? ""}
                onChange={(e) => setForm({ ...form, prazo: e.target.value || null })}
                disabled={enviando}
              />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel htmlFor="acao-pilar">Pilar</FieldLabel>
              <FieldSelect
                id="acao-pilar"
                value={form.pilar_id ?? ""}
                onChange={(e) => setForm({ ...form, pilar_id: e.target.value ? Number(e.target.value) : null })}
                disabled={enviando}
              >
                <option value="">Nenhum em específico</option>
                {pilares.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </FieldSelect>
            </FieldGroup>
          </FormAcao>
          {erro && <FormErrorText>{erro}</FormErrorText>}
        </ModalBody>
        <ModalFooter>
          <PageButton type="button" $variant="outline" onClick={onCancelar} disabled={enviando}>
            Cancelar
          </PageButton>
          <PageButton type="submit" form="form-acao" disabled={enviando || !valido}>
            {enviando ? "Salvando…" : inicial ? "Salvar" : "Criar ação"}
          </PageButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
}
