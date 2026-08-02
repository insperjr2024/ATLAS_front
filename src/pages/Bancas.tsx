import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  alocar,
  desalocar,
  getBancas,
  getBancasFrentes,
  getCandidaturas,
  getBancasParaAvaliar,
  getEquipesProjeto,
  getEscopos,
  getFrentes,
} from "@/lib/bancas";
import { getUsuarios } from "@/lib/usuarios";
import { createAvaliacao, createAvaliacaoNota, getFormularioAtivo, submeterAvaliacao } from "@/lib/avaliacoes";
import type { Banca, BancaFrente, Candidatura, EquipeProjeto, Escopo, Frente, FormularioAtivo } from "@/types/banca";
import type { UsuarioResumo } from "@/types/auth";
import { avaliadoresDaBanca, frentesDaBanca, membrosDaBanca, nomeEscopo, nomeUsuario } from "@/lib/nucleo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageStack, EmptyText, PageLoadingSkeleton, ErrorState, ErrorMessage } from "@/styles/shared.styled";
import {
  NameCell,
  ActionsCell,
  DetailList,
  DetailRow,
  DetailTerm,
  DetailValue,
  NarrowDialogContent,
  FormStack,
  FieldGroup,
  ErrorText,
} from "./Bancas.styled";

interface Contexto {
  usuarios: UsuarioResumo[];
  escopos: Escopo[];
  frentes: Frente[];
  bancasFrentes: BancaFrente[];
  equipesProjeto: EquipeProjeto[];
  candidaturas: Candidatura[];
}

export function Bancas() {
  const { usuario, token } = useAuth();
  const [bancas, setBancas] = useState<Banca[]>([]);
  const [candidaturas, setCandidaturas] = useState<Candidatura[]>([]);
  const [paraAvaliar, setParaAvaliar] = useState<Banca[]>([]);
  const [contexto, setContexto] = useState<Contexto | null>(null);
  const [formulario, setFormulario] = useState<FormularioAtivo | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [bancaDetalhe, setBancaDetalhe] = useState<Banca | null>(null);
  const [bancaAvaliar, setBancaAvaliar] = useState<Banca | null>(null);

  async function recarregar() {
    if (!token || !usuario) return;
    setCarregando(true);
    setErro("");
    try {
      const [bancasResp, candidaturasResp, avaliarResp, usuarios, escopos, frentes, bancasFrentes, equipesProjeto, formularioAtivo] =
        await Promise.all([
          getBancas(token),
          getCandidaturas(token),
          getBancasParaAvaliar(usuario.id, token),
          getUsuarios(token),
          getEscopos(token),
          getFrentes(token),
          getBancasFrentes(token),
          getEquipesProjeto(token),
          getFormularioAtivo(token).catch(() => null),
        ]);
      setBancas(bancasResp);
      setCandidaturas(candidaturasResp);
      setParaAvaliar(avaliarResp);
      setContexto({ usuarios, escopos, frentes, bancasFrentes, equipesProjeto, candidaturas: candidaturasResp });
      setFormulario(formularioAtivo);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar bancas");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    recarregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, usuario]);

  if (erro) {
    return (
      <ErrorState>
        <ErrorMessage>Não foi possível carregar as bancas: {erro}</ErrorMessage>
        <Button variant="outline" onClick={recarregar}>
          Tentar novamente
        </Button>
      </ErrorState>
    );
  }

  if (carregando || !contexto) return <PageLoadingSkeleton />;

  function candidaturaDe(bancaId: number) {
    return candidaturas.find((c) => c.banca_id === bancaId && c.usuario_id === usuario?.id);
  }

  const jaAlocado = bancas.filter((b) => b.status === "aberta para inscrições" && candidaturaDe(b.id));
  const disponiveis = bancas.filter((b) => b.status === "aberta para inscrições" && !candidaturaDe(b.id));

  async function handleAlocar(bancaId: number) {
    if (!token) return;
    await alocar(bancaId, token);
    recarregar();
  }

  async function handleDesalocar(bancaId: number) {
    const candidatura = candidaturaDe(bancaId);
    if (!token || !candidatura) return;
    await desalocar(candidatura.id, token);
    recarregar();
  }

  return (
    <PageStack>
      <SecaoBancas
        titulo="Bancas futuras já alocado"
        bancas={jaAlocado}
        contexto={contexto}
        acao="deslocar"
        onAcao={handleDesalocar}
        onVerMais={setBancaDetalhe}
      />
      <SecaoBancas
        titulo="Bancas futuras disponíveis"
        bancas={disponiveis}
        contexto={contexto}
        acao="alocar"
        onAcao={handleAlocar}
        onVerMais={setBancaDetalhe}
      />
      <SecaoBancas
        titulo="Bancas passadas — avaliar"
        bancas={paraAvaliar}
        contexto={contexto}
        acao="avaliar"
        onAcao={(id) => setBancaAvaliar(bancas.find((b) => b.id === id) ?? paraAvaliar.find((b) => b.id === id) ?? null)}
        onVerMais={setBancaDetalhe}
      />

      <VerMaisDialog banca={bancaDetalhe} contexto={contexto} onClose={() => setBancaDetalhe(null)} />

      {bancaAvaliar && usuario && token && (
        <AvaliarDialog
          banca={bancaAvaliar}
          formulario={formulario}
          token={token}
          onClose={() => setBancaAvaliar(null)}
          onEnviada={() => {
            setBancaAvaliar(null);
            recarregar();
          }}
        />
      )}
    </PageStack>
  );
}

function SecaoBancas({
  titulo,
  bancas,
  contexto,
  acao,
  onAcao,
  onVerMais,
}: {
  titulo: string;
  bancas: Banca[];
  contexto: Contexto;
  acao: "alocar" | "deslocar" | "avaliar";
  onAcao: (bancaId: number) => void;
  onVerMais: (banca: Banca) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        {bancas.length === 0 && <EmptyText>Nenhuma banca aqui.</EmptyText>}
        {bancas.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Coord</TableHead>
                <TableHead>Alocados</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {bancas.map((banca) => {
                const dataHora = new Date(banca.data_hora);
                const lotada = acao === "alocar" && banca.alocados >= banca.vagas;
                return (
                  <TableRow key={banca.id}>
                    <NameCell>{banca.nome_projeto}</NameCell>
                    <TableCell>{dataHora.toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>{dataHora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</TableCell>
                    <TableCell>{nomeUsuario(contexto.usuarios, banca.coordenador_id)}</TableCell>
                    <TableCell>
                      {banca.alocados}/{banca.vagas}
                    </TableCell>
                    <ActionsCell>
                      <Button variant="outline" size="sm" onClick={() => onVerMais(banca)}>
                        Ver mais
                      </Button>
                      <Button
                        variant={acao === "deslocar" ? "outline" : "default"}
                        size="sm"
                        disabled={lotada}
                        onClick={() => onAcao(banca.id)}
                      >
                        {lotada ? "Lotada" : acao === "alocar" ? "Alocar-se" : acao === "deslocar" ? "Deslocar-se" : "Avaliar"}
                      </Button>
                    </ActionsCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function VerMaisDialog({ banca, contexto, onClose }: { banca: Banca | null; contexto: Contexto; onClose: () => void }) {
  return (
    <Dialog open={!!banca} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {banca && (
          <>
            <DialogHeader>
              <DialogTitle>{banca.nome_projeto}</DialogTitle>
            </DialogHeader>
            <DetailList>
              <DetailRow>
                <DetailTerm>Data</DetailTerm>
                <DetailValue>{new Date(banca.data_hora).toLocaleDateString("pt-BR")}</DetailValue>
              </DetailRow>
              <DetailRow>
                <DetailTerm>Horário</DetailTerm>
                <DetailValue>
                  {new Date(banca.data_hora).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </DetailValue>
              </DetailRow>
              <DetailRow>
                <DetailTerm>Escopo</DetailTerm>
                <DetailValue>{nomeEscopo(contexto.escopos, banca.escopo_id)}</DetailValue>
              </DetailRow>
              <DetailRow>
                <DetailTerm>Frentes</DetailTerm>
                <DetailValue>{frentesDaBanca(contexto.bancasFrentes, contexto.frentes, banca.id).join(", ") || "—"}</DetailValue>
              </DetailRow>
              <DetailRow>
                <DetailTerm>Coordenador</DetailTerm>
                <DetailValue>{nomeUsuario(contexto.usuarios, banca.coordenador_id)}</DetailValue>
              </DetailRow>
              <DetailRow>
                <DetailTerm>Membros</DetailTerm>
                <DetailValue>{membrosDaBanca(contexto.equipesProjeto, contexto.usuarios, banca.id).join(", ") || "—"}</DetailValue>
              </DetailRow>
              <DetailRow>
                <DetailTerm>Avaliadores</DetailTerm>
                <DetailValue>{avaliadoresDaBanca(contexto.candidaturas, contexto.usuarios, banca.id).join(", ") || "—"}</DetailValue>
              </DetailRow>
            </DetailList>
          </>
        )}
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}

function AvaliarDialog({
  banca,
  formulario,
  token,
  onClose,
  onEnviada,
}: {
  banca: Banca;
  formulario: FormularioAtivo | null;
  token: string;
  onClose: () => void;
  onEnviada: () => void;
}) {
  const [respostas, setRespostas] = useState<Record<number, string>>({});
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formulario) return;
    setEnviando(true);
    setErro("");
    try {
      const avaliacao = await createAvaliacao({ banca_id: banca.id, formulario_id: formulario.id }, token);
      for (const pergunta of formulario.perguntas) {
        const valor = respostas[pergunta.id];
        if (valor === undefined || valor === "") continue;
        await createAvaliacaoNota(
          {
            avaliacao_id: avaliacao.id,
            pergunta_id: pergunta.id,
            nota: pergunta.tipo_resposta === "nota" ? Number(valor) : undefined,
            resposta_texto: pergunta.tipo_resposta === "texto" ? valor : undefined,
          },
          token,
        );
      }
      await submeterAvaliacao(avaliacao.id, comentario || null, token);
      onEnviada();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao enviar avaliação");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <NarrowDialogContent>
        <DialogHeader>
          <DialogTitle>Formulário de avaliação — {banca.nome_projeto}</DialogTitle>
        </DialogHeader>
        {!formulario ? (
          <EmptyText>Nenhum formulário ativo configurado no momento.</EmptyText>
        ) : (
          <FormStack onSubmit={handleSubmit}>
            {formulario.perguntas
              .slice()
              .sort((a, b) => a.ordem - b.ordem)
              .map((pergunta) => (
                <FieldGroup key={pergunta.id}>
                  <Label htmlFor={`pergunta-${pergunta.id}`}>{pergunta.texto}</Label>
                  {pergunta.tipo_resposta === "nota" ? (
                    <Input
                      id={`pergunta-${pergunta.id}`}
                      type="number"
                      min={0}
                      max={5}
                      step={0.1}
                      value={respostas[pergunta.id] ?? ""}
                      onChange={(e) => setRespostas((r) => ({ ...r, [pergunta.id]: e.target.value }))}
                      required
                    />
                  ) : (
                    <Textarea
                      id={`pergunta-${pergunta.id}`}
                      value={respostas[pergunta.id] ?? ""}
                      onChange={(e) => setRespostas((r) => ({ ...r, [pergunta.id]: e.target.value }))}
                      required
                    />
                  )}
                </FieldGroup>
              ))}
            <FieldGroup>
              <Label htmlFor="comentario">Comentário (opcional)</Label>
              <Textarea id="comentario" value={comentario} onChange={(e) => setComentario(e.target.value)} />
            </FieldGroup>
            {erro && <ErrorText>{erro}</ErrorText>}
            <DialogFooter>
              <Button type="submit" disabled={enviando}>
                {enviando ? "Enviando..." : "Enviar avaliação"}
              </Button>
            </DialogFooter>
          </FormStack>
        )}
      </NarrowDialogContent>
    </Dialog>
  );
}
