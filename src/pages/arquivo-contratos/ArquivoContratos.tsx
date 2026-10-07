import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Folder, FolderPlus, LogOut, Search, Upload } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ConfirmarModal } from "@/components/ConfirmarModal";
import { useParticulas } from "@/hooks/useParticulas";
import monograma from "@/assets/insperjr.png";
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
  AcoesCabecalho,
  Barra,
  Botao,
  BotaoCabecalho,
  Cabecalho,
  CabecalhoGrade,
  Caixa,
  Caminho,
  CampoBusca,
  Cartao,
  CartaoPasta,
  Cartoes,
  Conteudo,
  Descricao,
  Entrada,
  Erro,
  Etiqueta,
  Linha,
  LinhaAcoes,
  LinhaInline,
  ListaEscolha,
  MarcaLink,
  NomeUsuario,
  Pagina,
  Particulas,
  SecaoTitulo,
  Titulo,
  TituloCabecalho,
  Vazio,
  Veu,
} from "./ArquivoContratos.styled";

const PREFIXO_DELETADO = "[DELETADO] ";
const FONTE_MONTSERRAT = "https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700&display=swap";

function tamanhoLegivel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function dataCurta(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

/** Montserrat só nesta página (o painel de Contratos a usa nos títulos). */
function useMontserrat() {
  useEffect(() => {
    if (document.querySelector(`link[href="${FONTE_MONTSERRAT}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FONTE_MONTSERRAT;
    document.head.appendChild(link);
  }, []);
}

/**
 * Arquivo de contratos (2026-10-07, a pedido): a pasta compartilhada da
 * Insper Jr, aberta em aba própria, com o visual do painel de Contratos
 * (cabeçalho em vinho, partículas, cards com borda em degradê). Gestão >
 * Projeto nasce sozinho a cada contrato assinado; o resto é como um drive.
 */
export function ArquivoContratos() {
  const { token, usuario } = useAuth();
  const navigate = useNavigate();
  useMontserrat();
  const fundoRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useParticulas(fundoRef, canvasRef);

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
  // decide por `mostrandoBusca` se mostra resultados.
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

  // A página abre em aba própria (window.open na página de Contratos):
  // "Sair" fecha a aba; se foi aberta direto pela URL, volta pra Contratos.
  function sair() {
    window.close();
    window.setTimeout(() => navigate("/contratos"), 150);
  }

  const pastaAtual = conteudo?.pasta ?? null;
  const naRaiz = pastaId == null;

  return (
    <Pagina ref={fundoRef}>
      <Particulas ref={canvasRef} />
      <Cabecalho>
        <CabecalhoGrade>
          <MarcaLink
            href="/arquivo-contratos"
            onClick={(e) => {
              e.preventDefault();
              setBusca("");
              setPastaId(null);
            }}
          >
            <img src={monograma} alt="" />
            <span>Insper Jr.</span>
          </MarcaLink>
          <TituloCabecalho>Arquivo de Contratos</TituloCabecalho>
          <AcoesCabecalho>
            {usuario && <NomeUsuario>{usuario.nome}</NomeUsuario>}
            <BotaoCabecalho type="button" onClick={sair}>
              <LogOut size={14} /> Sair
            </BotaoCabecalho>
          </AcoesCabecalho>
        </CabecalhoGrade>
      </Cabecalho>

      <Conteudo>
        <Titulo>Arquivo de contratos</Titulo>
        <Descricao>
          Os documentos <strong>assinados e arquivados</strong> entram aqui sozinhos, por gestão e projeto, na data em
          que foram assinados. Além deles, qualquer contrato de fora do Atlas pode ser importado em qualquer pasta.
        </Descricao>

        <Barra>
          <CampoBusca>
            <Search size={14} />
            <Entrada
              type="text"
              placeholder="Buscar arquivo pelo nome…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </CampoBusca>
          {!mostrandoBusca && (
            <>
              <Botao type="button" $tom="contorno" onClick={() => setNovaPasta("")} disabled={ocupado}>
                <FolderPlus size={15} /> Nova pasta
              </Botao>
              {!naRaiz && (
                <Botao type="button" $tom="primario" onClick={() => importarRef.current?.click()} disabled={ocupado}>
                  <Upload size={15} /> Importar arquivo
                </Botao>
              )}
            </>
          )}
          <input ref={importarRef} type="file" accept=".pdf,.docx,.doc,.png,.jpg,.jpeg" hidden onChange={aoImportar} />
          <input ref={substituirRef} type="file" accept=".pdf,.docx,.doc,.png,.jpg,.jpeg" hidden onChange={aoSubstituir} />
        </Barra>

        {erro && <Erro>{erro}</Erro>}

        {mostrandoBusca && resultados ? (
          <>
            <SecaoTitulo>Resultados para “{busca.trim()}”</SecaoTitulo>
            {resultados.length === 0 ? (
              <Vazio>Nenhum arquivo com esse nome.</Vazio>
            ) : (
              <Cartao>
                {resultados.map((i) => (
                  <Linha key={i.id}>
                    <div>
                      <p className="titulo">{i.nome}</p>
                      <p className="sub">{i.caminho}</p>
                    </div>
                    <LinhaAcoes>
                      <button
                        type="button"
                        onClick={() => {
                          setBusca("");
                          setPastaId(i.pasta_id);
                        }}
                      >
                        Abrir pasta
                      </button>
                      <button type="button" onClick={() => token && baixarItemArquivo(i, token).catch((err) => setErro(err.message))}>
                        Baixar
                      </button>
                    </LinhaAcoes>
                  </Linha>
                ))}
              </Cartao>
            )}
          </>
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
              {!naRaiz && (
                <button type="button" style={{ marginLeft: "0.5rem" }} onClick={() => setPastaId(pastaAtual?.pai_id ?? null)}>
                  <ArrowLeft size={12} style={{ verticalAlign: "-2px" }} /> voltar
                </button>
              )}
            </Caminho>

            {novaPasta !== null && (
              <Cartao style={{ marginBottom: "1rem" }}>
                <p style={{ margin: "0 0 0.5rem", fontSize: "0.875rem", fontWeight: 500 }}>
                  Nova pasta {pastaAtual ? `em ${pastaAtual.nome}` : "na raiz"}
                </p>
                <LinhaInline style={{ marginTop: 0 }}>
                  <Entrada
                    autoFocus
                    placeholder="Nome da pasta"
                    value={novaPasta}
                    onChange={(e) => setNovaPasta(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setNovaPasta(null);
                    }}
                    style={{ width: "18rem" }}
                  />
                  <Botao
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
                  </Botao>
                  <Botao type="button" $tom="texto" onClick={() => setNovaPasta(null)}>
                    Cancelar
                  </Botao>
                </LinhaInline>
              </Cartao>
            )}

            <SecaoTitulo>{naRaiz ? "Gestões" : "Pastas"}</SecaoTitulo>
            <Cartoes>
              {!conteudo ? (
                <Vazio>Carregando…</Vazio>
              ) : conteudo.subpastas.length === 0 ? (
                <Vazio>{naRaiz ? "Nenhuma gestão arquivada ainda." : "Sem subpastas."}</Vazio>
              ) : (
                conteudo.subpastas.map((p) => (
                  <CartaoPasta
                    key={p.id}
                    role="button"
                    tabIndex={0}
                    title="Clique duas vezes para abrir"
                    onDoubleClick={() => setPastaId(p.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setPastaId(p.id);
                    }}
                  >
                    <Folder className="pasta" size={18} />
                    <span className="nome" title={p.nome}>
                      {p.nome}
                    </span>
                    {p.automatica && <span className="meta">{p.semestre_id ? "gestão" : "projeto"}</span>}
                    <LinhaAcoes onClick={(e) => e.stopPropagation()}>
                      <button type="button" onClick={() => setRenomeando({ tipo: "pasta", id: p.id, nome: p.nome })}>
                        Renomear
                      </button>
                      {!p.automatica && (
                        <button type="button" onClick={() => setMovendo({ tipo: "pasta", id: p.id, nome: p.nome })}>
                          Mover
                        </button>
                      )}
                      <button type="button" className="perigo" onClick={() => setApagando({ tipo: "pasta", id: p.id, nome: p.nome })}>
                        Apagar
                      </button>
                    </LinhaAcoes>
                  </CartaoPasta>
                ))
              )}
            </Cartoes>

            {!naRaiz && (
              <>
                <SecaoTitulo>Arquivos</SecaoTitulo>
                {!conteudo ? null : conteudo.itens.length === 0 ? (
                  <Vazio>Nenhum arquivo nesta pasta. Importe um ou aguarde um contrato assinado.</Vazio>
                ) : (
                  <Cartao>
                    {conteudo.itens.map((i) => {
                      const deletado = i.nome.startsWith(PREFIXO_DELETADO);
                      return (
                        <Linha key={i.id}>
                          <div>
                            <p className="titulo">
                              {i.nome}{" "}
                              {deletado ? (
                                <Etiqueta $tom="atencao">apagado no kanban</Etiqueta>
                              ) : (
                                <Etiqueta $tom="neutro">{i.origem === "atlas" ? "gerado no Atlas" : "importado"}</Etiqueta>
                              )}
                            </p>
                            <p className="sub">
                              {tamanhoLegivel(i.tamanho)} — atualizado em {dataCurta(i.atualizado_em)}
                              {i.criado_por_nome && i.origem === "importado" ? ` por ${i.criado_por_nome}` : ""}
                            </p>
                          </div>
                          <LinhaAcoes>
                            {i.mime === "application/pdf" && (
                              <button type="button" onClick={() => token && abrirItemArquivo(i, token).catch((err) => setErro(err.message))}>
                                Abrir
                              </button>
                            )}
                            <button type="button" onClick={() => token && baixarItemArquivo(i, token).catch((err) => setErro(err.message))}>
                              Baixar
                            </button>
                            <button type="button" onClick={() => setRenomeando({ tipo: "item", id: i.id, nome: i.nome })}>
                              Renomear
                            </button>
                            <button type="button" onClick={() => setMovendo({ tipo: "item", id: i.id, nome: i.nome })}>
                              Mover
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSubstituindoId(i.id);
                                substituirRef.current?.click();
                              }}
                            >
                              Substituir
                            </button>
                            <button type="button" className="perigo" onClick={() => setApagando({ tipo: "item", id: i.id, nome: i.nome })}>
                              Apagar
                            </button>
                          </LinhaAcoes>
                        </Linha>
                      );
                    })}
                  </Cartao>
                )}
              </>
            )}
          </>
        )}
      </Conteudo>

      {renomeando && (
        <Veu onMouseDown={() => setRenomeando(null)}>
          <Caixa onMouseDown={(e) => e.stopPropagation()}>
            <h3>Renomear {renomeando.tipo === "pasta" ? "pasta" : "arquivo"}</h3>
            <Entrada
              autoFocus
              value={renomeando.nome}
              onChange={(e) => setRenomeando({ ...renomeando, nome: e.target.value })}
            />
            <LinhaInline>
              <Botao
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
              </Botao>
              <Botao type="button" $tom="texto" onClick={() => setRenomeando(null)}>
                Cancelar
              </Botao>
            </LinhaInline>
          </Caixa>
        </Veu>
      )}

      {movendo && token && (
        <EscolherPasta
          titulo={`Mover "${movendo.nome}" para…`}
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
    </Pagina>
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
        <p>{["Arquivo", ...(conteudo?.caminho.map((p) => p.nome) ?? [])].join(" / ")}</p>
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
          <Botao type="button" $tom="primario" disabled={atual === null && !permitirRaiz} onClick={() => onEscolher(atual)}>
            Mover para cá
          </Botao>
          <Botao type="button" $tom="texto" onClick={onCancelar}>
            Cancelar
          </Botao>
        </LinhaInline>
      </Caixa>
    </Veu>
  );
}
