import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  FileText,
  Folder,
  FolderInput,
  FolderPlus,
  LogOut,
  Pencil,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ConfirmarModal } from "@/components/ConfirmarModal";
import {
  abrirItemArquivo,
  apagarItemArquivo,
  apagarPastaArquivo,
  baixarItemArquivo,
  buscarArquivo,
  criarPastaArquivo,
  getPastaArquivo,
  importarItemArquivo,
  moverItemArquivo,
  moverPastaArquivo,
  renomearItemArquivo,
  renomearPastaArquivo,
  substituirItemArquivo,
} from "@/lib/arquivo-contratos";
import type { ConteudoPasta, ItemArquivo, PastaArquivo } from "@/types/arquivo-contratos";
import {
  Acoes,
  Botao,
  BotaoMini,
  Busca,
  Caixa,
  Caminho,
  Campo,
  Erro,
  Etiqueta,
  GradePastas,
  LinhaInline,
  ListaEscolha,
  Marca,
  Painel,
  PainelTitulo,
  Pasta,
  PastaAcoes,
  Tabela,
  Tela,
  Topo,
  Vazio,
  Veu,
} from "./ArquivoContratos.styled";

function tamanhoLegivel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function dataCurta(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

const PREFIXO_DELETADO = "[DELETADO] ";

/**
 * Arquivo de contratos (2026-10-07, a pedido): a pasta compartilhada da
 * Insper Jr, com layout próprio (sem a barra lateral). Gestão > Projeto
 * nasce sozinho a cada contrato assinado; o resto é como um drive: pastas
 * livres, importar, renomear, mover, substituir, apagar. "Sair" volta pra
 * página de Contratos.
 */
export function ArquivoContratos() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [pastaId, setPastaId] = useState<number | null>(null);
  const [conteudo, setConteudo] = useState<ConteudoPasta | null>(null);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<ItemArquivo[] | null>(null);

  const [novaPasta, setNovaPasta] = useState<string | null>(null);
  const [renomeando, setRenomeando] = useState<{ tipo: "pasta" | "item"; id: number; nome: string } | null>(null);
  const [movendo, setMovendo] = useState<{ tipo: "pasta" | "item"; id: number; nome: string } | null>(null);
  const [apagando, setApagando] = useState<{ tipo: "pasta" | "item"; id: number; nome: string } | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const importarRef = useRef<HTMLInputElement>(null);
  const substituirRef = useRef<HTMLInputElement>(null);
  const [substituindoId, setSubstituindoId] = useState<number | null>(null);

  const carregar = useCallback(
    async (id: number | null) => {
      if (!token) return;
      try {
        setConteudo(await getPastaArquivo(id, token));
        setErro("");
      } catch (err) {
        setErro(err instanceof Error ? err.message : "Erro ao carregar a pasta");
      }
    },
    [token],
  );

  useEffect(() => {
    if (!token) return;
    getPastaArquivo(pastaId, token)
      .then((c) => {
        setConteudo(c);
        setErro("");
      })
      .catch((err) => setErro(err instanceof Error ? err.message : "Erro ao carregar a pasta"));
  }, [pastaId, token]);

  // Busca com atraso de digitação. Abaixo de 2 letras não consulta; a tela
  // decide por `mostrandoBusca` se mostra resultados, então não precisa
  // zerar o estado aqui.
  useEffect(() => {
    if (!token) return;
    const termo = busca.trim();
    if (termo.length < 2) return;
    const timer = window.setTimeout(() => {
      buscarArquivo(termo, token)
        .then(setResultados)
        .catch(() => setResultados([]));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [busca, token]);
  const mostrandoBusca = busca.trim().length >= 2 && resultados !== null;

  async function agir(fn: () => Promise<unknown>, fallback: string) {
    if (!token) return;
    setOcupado(true);
    setErro("");
    try {
      await fn();
      await carregar(pastaId);
    } catch (err) {
      setErro(err instanceof Error ? err.message : fallback);
    } finally {
      setOcupado(false);
    }
  }

  async function aoImportar(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo || pastaId == null || !token) return;
    await agir(() => importarItemArquivo(pastaId, arquivo, token), "Não foi possível importar");
  }

  async function aoSubstituir(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    const id = substituindoId;
    setSubstituindoId(null);
    if (!arquivo || id == null || !token) return;
    await agir(() => substituirItemArquivo(id, arquivo, token), "Não foi possível substituir");
  }

  const pastaAtual = conteudo?.pasta ?? null;
  const naRaiz = pastaId == null;

  return (
    <Tela>
      <Topo>
        <Marca>
          <span>Insper Jr · Atlas</span>
          <h1>Arquivo de Contratos</h1>
        </Marca>
        <Acoes>
          <Busca
            type="search"
            placeholder="Buscar arquivo pelo nome..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <Botao type="button" onClick={() => navigate("/contratos")}>
            <LogOut size={16} /> Sair
          </Botao>
        </Acoes>
      </Topo>

      {erro && <Erro>{erro}</Erro>}

      {mostrandoBusca && resultados ? (
        <Painel>
          <PainelTitulo>Resultados da busca</PainelTitulo>
          {resultados.length === 0 ? (
            <Vazio>Nenhum arquivo com esse nome.</Vazio>
          ) : (
            <Tabela>
              <thead>
                <tr>
                  <th>Arquivo</th>
                  <th>Pasta</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {resultados.map((i) => (
                  <tr key={i.id}>
                    <td className="nome">
                      <FileText size={16} /> {i.nome}
                    </td>
                    <td className="mudo">{i.caminho}</td>
                    <td className="acoes">
                      <BotaoMini
                        type="button"
                        onClick={() => {
                          setBusca("");
                          setPastaId(i.pasta_id);
                        }}
                      >
                        <FolderInput size={14} /> Abrir pasta
                      </BotaoMini>{" "}
                      <BotaoMini type="button" onClick={() => token && baixarItemArquivo(i, token).catch((err) => setErro(err.message))}>
                        <Download size={14} /> Baixar
                      </BotaoMini>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Tabela>
          )}
        </Painel>
      ) : (
        <>
          <Caminho aria-label="Caminho">
            <button type="button" onClick={() => setPastaId(null)}>
              Arquivo
            </button>
            {conteudo?.caminho.map((p, i) => (
              <span key={p.id}>
                {" / "}
                {i === conteudo.caminho.length - 1 ? (
                  <strong>{p.nome}</strong>
                ) : (
                  <button type="button" onClick={() => setPastaId(p.id)}>
                    {p.nome}
                  </button>
                )}
              </span>
            ))}
          </Caminho>

          <Acoes style={{ marginBottom: "1rem" }}>
            {!naRaiz && (
              <Botao type="button" onClick={() => setPastaId(pastaAtual?.pai_id ?? null)}>
                <ArrowLeft size={16} /> Voltar
              </Botao>
            )}
            <Botao type="button" onClick={() => setNovaPasta("")} disabled={ocupado}>
              <FolderPlus size={16} /> Nova pasta
            </Botao>
            {!naRaiz && (
              <Botao type="button" $tom="primario" onClick={() => importarRef.current?.click()} disabled={ocupado}>
                <Upload size={16} /> Importar arquivo
              </Botao>
            )}
            <input ref={importarRef} type="file" accept=".pdf,.docx,.doc,.png,.jpg,.jpeg" hidden onChange={aoImportar} />
            <input ref={substituirRef} type="file" accept=".pdf,.docx,.doc,.png,.jpg,.jpeg" hidden onChange={aoSubstituir} />
          </Acoes>

          {novaPasta !== null && (
            <Painel>
              <PainelTitulo>Nova pasta {pastaAtual ? `em ${pastaAtual.nome}` : "na raiz"}</PainelTitulo>
              <LinhaInline>
                <Campo
                  autoFocus
                  placeholder="Nome da pasta"
                  value={novaPasta}
                  onChange={(e) => setNovaPasta(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setNovaPasta(null);
                  }}
                />
                <BotaoMini
                  type="button"
                  $tom="primario"
                  disabled={ocupado || !novaPasta.trim()}
                  onClick={() =>
                    agir(async () => {
                      await criarPastaArquivo(novaPasta.trim(), pastaId, token as string);
                      setNovaPasta(null);
                    }, "Não foi possível criar a pasta")
                  }
                >
                  Criar
                </BotaoMini>
                <BotaoMini type="button" onClick={() => setNovaPasta(null)}>
                  Cancelar
                </BotaoMini>
              </LinhaInline>
            </Painel>
          )}

          <Painel>
            <PainelTitulo>{naRaiz ? "Gestões e pastas" : "Pastas"}</PainelTitulo>
            {!conteudo ? (
              <Vazio>Carregando...</Vazio>
            ) : conteudo.subpastas.length === 0 ? (
              <Vazio>{naRaiz ? "Nenhuma gestão arquivada ainda." : "Sem subpastas."}</Vazio>
            ) : (
              <GradePastas>
                {conteudo.subpastas.map((p) => (
                  <Pasta key={p.id} role="button" tabIndex={0} onClick={() => setPastaId(p.id)}>
                    <Folder size={20} />
                    <span title={p.nome}>{p.nome}</span>
                    <PastaAcoes onClick={(e) => e.stopPropagation()}>
                      <button type="button" title="Renomear" onClick={() => setRenomeando({ tipo: "pasta", id: p.id, nome: p.nome })}>
                        <Pencil size={14} />
                      </button>
                      {!p.automatica && (
                        <button type="button" title="Mover" onClick={() => setMovendo({ tipo: "pasta", id: p.id, nome: p.nome })}>
                          <FolderInput size={14} />
                        </button>
                      )}
                      <button type="button" title="Apagar" onClick={() => setApagando({ tipo: "pasta", id: p.id, nome: p.nome })}>
                        <Trash2 size={14} />
                      </button>
                    </PastaAcoes>
                  </Pasta>
                ))}
              </GradePastas>
            )}
          </Painel>

          {!naRaiz && (
            <Painel>
              <PainelTitulo>Arquivos</PainelTitulo>
              {!conteudo ? null : conteudo.itens.length === 0 ? (
                <Vazio>Nenhum arquivo nesta pasta. Importe um ou aguarde um contrato assinado.</Vazio>
              ) : (
                <Tabela>
                  <thead>
                    <tr>
                      <th>Arquivo</th>
                      <th>Origem</th>
                      <th>Tamanho</th>
                      <th>Atualizado</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {conteudo.itens.map((i) => (
                      <tr key={i.id}>
                        <td className="nome">
                          <FileText size={16} /> {i.nome}
                        </td>
                        <td>
                          {i.nome.startsWith(PREFIXO_DELETADO) ? (
                            <Etiqueta $tom="deletado">apagado no kanban</Etiqueta>
                          ) : (
                            <Etiqueta $tom={i.origem}>{i.origem === "atlas" ? "gerado no Atlas" : "importado"}</Etiqueta>
                          )}
                        </td>
                        <td className="mudo">{tamanhoLegivel(i.tamanho)}</td>
                        <td className="mudo">{dataCurta(i.atualizado_em)}</td>
                        <td className="acoes">
                          {i.mime === "application/pdf" && (
                            <BotaoMini type="button" title="Abrir" onClick={() => token && abrirItemArquivo(i, token).catch((err) => setErro(err.message))}>
                              <ExternalLink size={14} />
                            </BotaoMini>
                          )}{" "}
                          <BotaoMini type="button" title="Baixar" onClick={() => token && baixarItemArquivo(i, token).catch((err) => setErro(err.message))}>
                            <Download size={14} />
                          </BotaoMini>{" "}
                          <BotaoMini type="button" title="Renomear" onClick={() => setRenomeando({ tipo: "item", id: i.id, nome: i.nome })}>
                            <Pencil size={14} />
                          </BotaoMini>{" "}
                          <BotaoMini type="button" title="Mover" onClick={() => setMovendo({ tipo: "item", id: i.id, nome: i.nome })}>
                            <FolderInput size={14} />
                          </BotaoMini>{" "}
                          <BotaoMini
                            type="button"
                            title="Substituir arquivo"
                            onClick={() => {
                              setSubstituindoId(i.id);
                              substituirRef.current?.click();
                            }}
                          >
                            <RefreshCw size={14} />
                          </BotaoMini>{" "}
                          <BotaoMini type="button" $tom="perigo" title="Apagar" onClick={() => setApagando({ tipo: "item", id: i.id, nome: i.nome })}>
                            <Trash2 size={14} />
                          </BotaoMini>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Tabela>
              )}
            </Painel>
          )}
        </>
      )}

      {renomeando && (
        <Veu onMouseDown={() => setRenomeando(null)}>
          <Caixa onMouseDown={(e) => e.stopPropagation()}>
            <h3>Renomear {renomeando.tipo === "pasta" ? "pasta" : "arquivo"}</h3>
            <Campo
              autoFocus
              value={renomeando.nome}
              onChange={(e) => setRenomeando({ ...renomeando, nome: e.target.value })}
              style={{ width: "100%" }}
            />
            <LinhaInline>
              <BotaoMini
                type="button"
                $tom="primario"
                disabled={ocupado || !renomeando.nome.trim()}
                onClick={() =>
                  agir(async () => {
                    if (renomeando.tipo === "pasta") await renomearPastaArquivo(renomeando.id, renomeando.nome.trim(), token as string);
                    else await renomearItemArquivo(renomeando.id, renomeando.nome.trim(), token as string);
                    setRenomeando(null);
                  }, "Não foi possível renomear")
                }
              >
                Salvar
              </BotaoMini>
              <BotaoMini type="button" onClick={() => setRenomeando(null)}>
                Cancelar
              </BotaoMini>
            </LinhaInline>
          </Caixa>
        </Veu>
      )}

      {movendo && token && (
        <EscolherPasta
          titulo={`Mover "${movendo.nome}" para...`}
          token={token}
          excluirPastaId={movendo.tipo === "pasta" ? movendo.id : null}
          permitirRaiz={movendo.tipo === "pasta"}
          onCancelar={() => setMovendo(null)}
          onEscolher={(destino) =>
            agir(async () => {
              if (movendo.tipo === "pasta") await moverPastaArquivo(movendo.id, destino, token);
              else if (destino != null) await moverItemArquivo(movendo.id, destino, token);
              setMovendo(null);
            }, "Não foi possível mover")
          }
        />
      )}

      {apagando && (
        <ConfirmarModal
          titulo={apagando.tipo === "pasta" ? "Apagar pasta" : "Apagar arquivo"}
          mensagem={
            apagando.tipo === "pasta"
              ? `Apagar a pasta "${apagando.nome}"? Só dá pra apagar pasta vazia.`
              : `Apagar "${apagando.nome}" do arquivo? Essa ação não pode ser desfeita.`
          }
          rotuloConfirmar="Apagar"
          rotuloProcessando="Apagando…"
          onCancelar={() => setApagando(null)}
          onConfirmar={async () => {
            if (!token) return;
            if (apagando.tipo === "pasta") await apagarPastaArquivo(apagando.id, token);
            else await apagarItemArquivo(apagando.id, token);
            setApagando(null);
            await carregar(pastaId);
          }}
        />
      )}
    </Tela>
  );
}

/** Navega pelas pastas pra escolher um destino. */
function EscolherPasta({
  titulo,
  token,
  excluirPastaId,
  permitirRaiz,
  onEscolher,
  onCancelar,
}: {
  titulo: string;
  token: string;
  excluirPastaId: number | null;
  permitirRaiz: boolean;
  onEscolher: (pastaId: number | null) => void;
  onCancelar: () => void;
}) {
  const [atual, setAtual] = useState<number | null>(null);
  const [conteudo, setConteudo] = useState<ConteudoPasta | null>(null);

  useEffect(() => {
    getPastaArquivo(atual, token)
      .then(setConteudo)
      .catch(() => setConteudo(null));
  }, [atual, token]);

  const subpastas: PastaArquivo[] = (conteudo?.subpastas ?? []).filter((p) => p.id !== excluirPastaId);

  return (
    <Veu onMouseDown={onCancelar}>
      <Caixa onMouseDown={(e) => e.stopPropagation()}>
        <h3>{titulo}</h3>
        <p>
          {["Arquivo", ...(conteudo?.caminho.map((p) => p.nome) ?? [])].join(" / ")}
        </p>
        <ListaEscolha>
          {atual !== null && (
            <button type="button" onClick={() => setAtual(conteudo?.pasta?.pai_id ?? null)}>
              <ArrowLeft size={14} /> Voltar
            </button>
          )}
          {subpastas.map((p) => (
            <button key={p.id} type="button" onClick={() => setAtual(p.id)}>
              <Folder size={14} /> {p.nome}
            </button>
          ))}
          {subpastas.length === 0 && <Vazio>Sem subpastas aqui.</Vazio>}
        </ListaEscolha>
        <LinhaInline>
          <BotaoMini type="button" $tom="primario" disabled={atual === null && !permitirRaiz} onClick={() => onEscolher(atual)}>
            Mover para cá
          </BotaoMini>
          <BotaoMini type="button" onClick={onCancelar}>
            Cancelar
          </BotaoMini>
        </LinhaInline>
      </Caixa>
    </Veu>
  );
}
