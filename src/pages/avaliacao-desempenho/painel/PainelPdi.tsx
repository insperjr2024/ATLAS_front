import { useEffect, useState } from "react";
import { AlertTriangle, Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  createItemPdi,
  createPastaPdi,
  deleteItemPdi,
  deletePastaPdi,
  getItensPdi,
  getPastasPdi,
  getPendenciasPdi,
  updateItemPdi,
  updatePastaPdi,
} from "@/lib/desempenho-pdi";
import { formatarData } from "@/lib/projetos";
import { ConfirmarModal } from "@/components/ConfirmarModal";
import type {
  DesempenhoPdiItem,
  DesempenhoPdiItemTipoArquivo,
  DesempenhoPdiPasta,
  DesempenhoPdiPastaTipo,
  DesempenhoPdiPendencia,
} from "@/types/desempenho";
import {
  EmptyText,
  ErrorBlock,
  ErrorText,
  PageBadge,
  PageButton,
  PageButtonSm,
  PageCard,
  PageCardContent,
  PageCardHeader,
  PageCardTitle,
  PageLoadingBlock,
} from "@/styles/page.styled";
import { FieldGroup, FieldInput, FieldLabel, FieldSelect, FormStack } from "@/pages/Bancas.styled";
import {
  LoteCard,
  LoteCardAcoes,
  LoteCardHeader,
  LoteCardMeta,
  LoteCardTitulo,
  LotesStack,
  PendenciaCard,
  PendenciaIcone,
  PendenciaNome,
  PendenciaTexto,
  SubItem,
  SubLista,
} from "./Painel.styled";

const ROTULO_TIPO: Record<DesempenhoPdiPastaTipo, string> = {
  inicial: "PDI inicial (só a diretoria envia)",
  encontro: "Encontro (o mentor envia, pelo mentorado)",
};

const ROTULO_TIPO_ARQUIVO: Record<DesempenhoPdiItemTipoArquivo, string> = {
  documento: "Documento (PDF/Word)",
  foto: "Foto (JPG/PNG)",
  qualquer: "Qualquer arquivo",
};

export function PainelPdi() {
  const { token } = useAuth();
  const [pastas, setPastas] = useState<DesempenhoPdiPasta[]>([]);
  const [itensPorPasta, setItensPorPasta] = useState<Record<number, DesempenhoPdiItem[]>>({});
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [paraExcluir, setParaExcluir] = useState<DesempenhoPdiPasta | null>(null);
  const [erroExcluir, setErroExcluir] = useState("");

  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<DesempenhoPdiPastaTipo>("encontro");
  const [prazo, setPrazo] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState("");

  // Checklist sendo montada junto com a pasta nova — os itens só são
  // criados de fato depois que a pasta existe (o backend exige pasta_id),
  // então ficam aqui como rascunho até o submit.
  const [itensNovaPasta, setItensNovaPasta] = useState<{ nome: string; tipo_arquivo: DesempenhoPdiItemTipoArquivo }[]>(
    [],
  );
  const [builderItemNome, setBuilderItemNome] = useState("");
  const [builderItemTipo, setBuilderItemTipo] = useState<DesempenhoPdiItemTipoArquivo>("qualquer");

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editPrazo, setEditPrazo] = useState("");
  const [editSalvando, setEditSalvando] = useState(false);
  const [editErro, setEditErro] = useState("");

  const [adicionandoItemPastaId, setAdicionandoItemPastaId] = useState<number | null>(null);
  const [novoItemNome, setNovoItemNome] = useState("");
  const [novoItemTipo, setNovoItemTipo] = useState<DesempenhoPdiItemTipoArquivo>("qualquer");
  const [itemSalvando, setItemSalvando] = useState(false);
  const [itemErroForm, setItemErroForm] = useState("");

  const [editandoItemId, setEditandoItemId] = useState<number | null>(null);
  const [editItemNome, setEditItemNome] = useState("");
  const [editItemTipo, setEditItemTipo] = useState<DesempenhoPdiItemTipoArquivo>("qualquer");
  const [editItemSalvando, setEditItemSalvando] = useState(false);
  const [editItemErro, setEditItemErro] = useState("");

  const [paraExcluirItem, setParaExcluirItem] = useState<DesempenhoPdiItem | null>(null);
  const [erroExcluirItem, setErroExcluirItem] = useState("");

  const [pendenciasItemId, setPendenciasItemId] = useState<number | null>(null);
  const [pendencias, setPendencias] = useState<DesempenhoPdiPendencia[]>([]);

  async function buscar() {
    if (!token) return;
    setCarregando(true);
    setErro("");
    try {
      const listaPastas = await getPastasPdi(token);
      setPastas(listaPastas);
      const listasItens = await Promise.all(listaPastas.map((p) => getItensPdi(p.id, token)));
      const mapa: Record<number, DesempenhoPdiItem[]> = {};
      listaPastas.forEach((p, i) => {
        mapa[p.id] = listasItens[i];
      });
      setItensPorPasta(mapa);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar as pastas de PDI");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    buscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function adicionarItemAoBuilder() {
    if (!builderItemNome.trim()) return;
    setItensNovaPasta((atual) => [...atual, { nome: builderItemNome.trim(), tipo_arquivo: builderItemTipo }]);
    setBuilderItemNome("");
    setBuilderItemTipo("qualquer");
  }

  function removerItemDoBuilder(index: number) {
    setItensNovaPasta((atual) => atual.filter((_, i) => i !== index));
  }

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (!nome.trim() || !prazo) {
      setErroForm("Preencha nome e prazo.");
      return;
    }
    setSalvando(true);
    setErroForm("");
    try {
      const nova = await createPastaPdi({ nome: nome.trim(), tipo, prazo }, token);
      const itensCriados = await Promise.all(
        itensNovaPasta.map((item) => createItemPdi(nova.id, item, token)),
      );
      setPastas((atual) => [...atual, nova]);
      setItensPorPasta((atual) => ({ ...atual, [nova.id]: itensCriados }));
      setNome("");
      setPrazo("");
      setItensNovaPasta([]);
    } catch (err) {
      setErroForm(err instanceof Error ? err.message : "Erro ao criar a pasta");
    } finally {
      setSalvando(false);
    }
  }

  function handleIniciarEdicao(pasta: DesempenhoPdiPasta) {
    setEditandoId(pasta.id);
    setEditNome(pasta.nome);
    setEditPrazo(pasta.prazo);
    setEditErro("");
  }

  async function handleSalvarEdicao(pastaId: number) {
    if (!token) return;
    if (!editNome.trim() || !editPrazo) {
      setEditErro("Preencha nome e prazo.");
      return;
    }
    setEditSalvando(true);
    setEditErro("");
    try {
      const atualizada = await updatePastaPdi(pastaId, { nome: editNome.trim(), prazo: editPrazo }, token);
      setPastas((atual) => atual.map((p) => (p.id === pastaId ? atualizada : p)));
      setEditandoId(null);
    } catch (err) {
      setEditErro(err instanceof Error ? err.message : "Erro ao salvar a pasta");
    } finally {
      setEditSalvando(false);
    }
  }

  async function confirmarExclusao() {
    if (!token || !paraExcluir) return;
    setErroExcluir("");
    try {
      await deletePastaPdi(paraExcluir.id, token);
      setPastas((atual) => atual.filter((p) => p.id !== paraExcluir.id));
      setParaExcluir(null);
    } catch (err) {
      setErroExcluir(
        err instanceof Error
          ? err.message
          : "Erro ao excluir a pasta — provavelmente ainda tem item cadastrado nela.",
      );
    }
  }

  function abrirAdicionarItem(pastaId: number) {
    setAdicionandoItemPastaId((atual) => (atual === pastaId ? null : pastaId));
    setNovoItemNome("");
    setNovoItemTipo("qualquer");
    setItemErroForm("");
  }

  async function handleCriarItem(e: React.FormEvent, pastaId: number) {
    e.preventDefault();
    if (!token) return;
    if (!novoItemNome.trim()) {
      setItemErroForm("Dê um nome pro item.");
      return;
    }
    setItemSalvando(true);
    setItemErroForm("");
    try {
      const novo = await createItemPdi(pastaId, { nome: novoItemNome.trim(), tipo_arquivo: novoItemTipo }, token);
      setItensPorPasta((atual) => ({ ...atual, [pastaId]: [...(atual[pastaId] ?? []), novo] }));
      setAdicionandoItemPastaId(null);
    } catch (err) {
      setItemErroForm(err instanceof Error ? err.message : "Erro ao criar o item");
    } finally {
      setItemSalvando(false);
    }
  }

  function handleIniciarEdicaoItem(item: DesempenhoPdiItem) {
    setEditandoItemId(item.id);
    setEditItemNome(item.nome);
    setEditItemTipo(item.tipo_arquivo);
    setEditItemErro("");
  }

  async function handleSalvarEdicaoItem(pastaId: number, itemId: number) {
    if (!token) return;
    if (!editItemNome.trim()) {
      setEditItemErro("Dê um nome pro item.");
      return;
    }
    setEditItemSalvando(true);
    setEditItemErro("");
    try {
      const atualizado = await updateItemPdi(itemId, { nome: editItemNome.trim(), tipo_arquivo: editItemTipo }, token);
      setItensPorPasta((atual) => ({
        ...atual,
        [pastaId]: (atual[pastaId] ?? []).map((i) => (i.id === itemId ? atualizado : i)),
      }));
      setEditandoItemId(null);
    } catch (err) {
      setEditItemErro(err instanceof Error ? err.message : "Erro ao salvar o item");
    } finally {
      setEditItemSalvando(false);
    }
  }

  async function confirmarExclusaoItem() {
    if (!token || !paraExcluirItem) return;
    setErroExcluirItem("");
    try {
      await deleteItemPdi(paraExcluirItem.id, token);
      setItensPorPasta((atual) => ({
        ...atual,
        [paraExcluirItem.pasta_id]: (atual[paraExcluirItem.pasta_id] ?? []).filter((i) => i.id !== paraExcluirItem.id),
      }));
      setParaExcluirItem(null);
    } catch (err) {
      setErroExcluirItem(
        err instanceof Error ? err.message : "Erro ao excluir o item — provavelmente já existe envio nele.",
      );
    }
  }

  async function handleVerPendencias(itemId: number) {
    if (!token) return;
    if (pendenciasItemId === itemId) {
      setPendenciasItemId(null);
      return;
    }
    setPendenciasItemId(itemId);
    setPendencias(await getPendenciasPdi(itemId, token));
  }

  if (erro) {
    return (
      <ErrorBlock>
        <ErrorText>{erro}</ErrorText>
        <PageButton $variant="outline" onClick={buscar}>
          Tentar novamente
        </PageButton>
      </ErrorBlock>
    );
  }

  if (carregando) return <PageLoadingBlock />;

  return (
    <>
      <PageCard>
        <PageCardHeader>
          <PageCardTitle>Nova pasta</PageCardTitle>
        </PageCardHeader>
        <PageCardContent>
          <FormStack onSubmit={handleCriar}>
            <FieldGroup>
              <FieldLabel htmlFor="pdi-nome">Nome</FieldLabel>
              <FieldInput
                id="pdi-nome"
                placeholder="Ex.: Encontro 3"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel htmlFor="pdi-tipo">Tipo</FieldLabel>
              <FieldSelect
                id="pdi-tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as DesempenhoPdiPastaTipo)}
              >
                <option value="encontro">{ROTULO_TIPO.encontro}</option>
                <option value="inicial">{ROTULO_TIPO.inicial}</option>
              </FieldSelect>
            </FieldGroup>
            <FieldGroup>
              <FieldLabel htmlFor="pdi-prazo">Prazo</FieldLabel>
              <FieldInput id="pdi-prazo" type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} required />
            </FieldGroup>

            <FieldGroup>
              <FieldLabel>Documentos exigidos nesta pasta</FieldLabel>
              {itensNovaPasta.length > 0 && (
                <SubLista style={{ padding: 0 }}>
                  {itensNovaPasta.map((item, index) => (
                    <SubItem key={index}>
                      <div>
                        {item.nome} <PageBadge $tone="muted">{ROTULO_TIPO_ARQUIVO[item.tipo_arquivo]}</PageBadge>
                      </div>
                      <PageButtonSm type="button" $variant="ghost" onClick={() => removerItemDoBuilder(index)}>
                        Remover
                      </PageButtonSm>
                    </SubItem>
                  ))}
                </SubLista>
              )}
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "flex-end" }}>
                <FieldInput
                  placeholder="Ex.: Foto do encontro"
                  value={builderItemNome}
                  onChange={(e) => setBuilderItemNome(e.target.value)}
                  style={{ flex: "1 1 12rem" }}
                />
                <FieldSelect
                  value={builderItemTipo}
                  onChange={(e) => setBuilderItemTipo(e.target.value as DesempenhoPdiItemTipoArquivo)}
                  style={{ flex: "0 1 12rem" }}
                >
                  <option value="qualquer">{ROTULO_TIPO_ARQUIVO.qualquer}</option>
                  <option value="documento">{ROTULO_TIPO_ARQUIVO.documento}</option>
                  <option value="foto">{ROTULO_TIPO_ARQUIVO.foto}</option>
                </FieldSelect>
                <PageButtonSm type="button" $variant="outline" onClick={adicionarItemAoBuilder}>
                  <Plus size={14} />
                  Adicionar
                </PageButtonSm>
              </div>
            </FieldGroup>

            {erroForm && <ErrorText>{erroForm}</ErrorText>}
            <PageButton type="submit" disabled={salvando}>
              {salvando ? "Criando..." : "Criar pasta"}
            </PageButton>
          </FormStack>
        </PageCardContent>
      </PageCard>

      <PageCard>
        <PageCardHeader>
          <PageCardTitle>Pastas de PDI</PageCardTitle>
        </PageCardHeader>
        <PageCardContent>
          {pastas.length === 0 ? (
            <EmptyText>Nenhuma pasta cadastrada ainda.</EmptyText>
          ) : (
            <LotesStack>
              {pastas.map((pasta) => {
                const itens = itensPorPasta[pasta.id] ?? [];
                return (
                  <LoteCard key={pasta.id}>
                    <LoteCardHeader>
                      <LoteCardTitulo>
                        {pasta.nome}
                        {pasta.semestre && ` (${pasta.semestre})`}
                      </LoteCardTitulo>
                      <LoteCardAcoes>
                        <PageButtonSm
                          $variant="outline"
                          type="button"
                          onClick={() =>
                            editandoId === pasta.id ? setEditandoId(null) : handleIniciarEdicao(pasta)
                          }
                        >
                          {editandoId === pasta.id ? "Cancelar" : "Editar"}
                        </PageButtonSm>
                        {editandoId === pasta.id && (
                          <PageButtonSm $variant="ghost" type="button" onClick={() => setParaExcluir(pasta)}>
                            Excluir
                          </PageButtonSm>
                        )}
                      </LoteCardAcoes>
                    </LoteCardHeader>

                    {editandoId === pasta.id ? (
                      <FormStack
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSalvarEdicao(pasta.id);
                        }}
                      >
                        <FieldGroup>
                          <FieldLabel htmlFor={`edit-pdi-nome-${pasta.id}`}>Nome</FieldLabel>
                          <FieldInput
                            id={`edit-pdi-nome-${pasta.id}`}
                            value={editNome}
                            onChange={(e) => setEditNome(e.target.value)}
                            required
                          />
                        </FieldGroup>
                        <FieldGroup>
                          <FieldLabel htmlFor={`edit-pdi-prazo-${pasta.id}`}>Prazo</FieldLabel>
                          <FieldInput
                            id={`edit-pdi-prazo-${pasta.id}`}
                            type="date"
                            value={editPrazo}
                            onChange={(e) => setEditPrazo(e.target.value)}
                            required
                          />
                        </FieldGroup>
                        {editErro && <ErrorText>{editErro}</ErrorText>}
                        <PageButtonSm type="submit" disabled={editSalvando}>
                          {editSalvando ? "Salvando..." : "Salvar"}
                        </PageButtonSm>
                      </FormStack>
                    ) : (
                      <LoteCardMeta>
                        {ROTULO_TIPO[pasta.tipo]} · Prazo: {formatarData(pasta.prazo)}
                      </LoteCardMeta>
                    )}

                    <SubLista>
                      {itens.length === 0 && <EmptyText>Nenhum documento exigido nesta pasta ainda.</EmptyText>}

                      {itens.map((item) => (
                        <div key={item.id}>
                          {editandoItemId === item.id ? (
                            <FormStack
                              onSubmit={(e) => {
                                e.preventDefault();
                                handleSalvarEdicaoItem(pasta.id, item.id);
                              }}
                            >
                              <FieldGroup>
                                <FieldLabel htmlFor={`edit-item-nome-${item.id}`}>Nome do item</FieldLabel>
                                <FieldInput
                                  id={`edit-item-nome-${item.id}`}
                                  value={editItemNome}
                                  onChange={(e) => setEditItemNome(e.target.value)}
                                  required
                                />
                              </FieldGroup>
                              <FieldGroup>
                                <FieldLabel htmlFor={`edit-item-tipo-${item.id}`}>Formato aceito</FieldLabel>
                                <FieldSelect
                                  id={`edit-item-tipo-${item.id}`}
                                  value={editItemTipo}
                                  onChange={(e) => setEditItemTipo(e.target.value as DesempenhoPdiItemTipoArquivo)}
                                >
                                  <option value="qualquer">{ROTULO_TIPO_ARQUIVO.qualquer}</option>
                                  <option value="documento">{ROTULO_TIPO_ARQUIVO.documento}</option>
                                  <option value="foto">{ROTULO_TIPO_ARQUIVO.foto}</option>
                                </FieldSelect>
                              </FieldGroup>
                              {editItemErro && <ErrorText>{editItemErro}</ErrorText>}
                              <div style={{ display: "flex", gap: "0.5rem" }}>
                                <PageButtonSm type="submit" disabled={editItemSalvando}>
                                  {editItemSalvando ? "Salvando..." : "Salvar"}
                                </PageButtonSm>
                                <PageButtonSm
                                  type="button"
                                  $variant="outline"
                                  onClick={() => setEditandoItemId(null)}
                                >
                                  Cancelar
                                </PageButtonSm>
                              </div>
                            </FormStack>
                          ) : (
                            <SubItem>
                              <div>
                                {item.nome} <PageBadge $tone="muted">{ROTULO_TIPO_ARQUIVO[item.tipo_arquivo]}</PageBadge>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                                {editandoId === pasta.id && (
                                  <PageButtonSm
                                    type="button"
                                    $variant="outline"
                                    onClick={() => handleIniciarEdicaoItem(item)}
                                  >
                                    Editar
                                  </PageButtonSm>
                                )}
                                <PageButtonSm type="button" onClick={() => handleVerPendencias(item.id)}>
                                  {pendenciasItemId === item.id ? "Ocultar pendências" : "Pendências"}
                                </PageButtonSm>
                                {editandoId === pasta.id && (
                                  <PageButtonSm
                                    type="button"
                                    $variant="ghost"
                                    onClick={() => setParaExcluirItem(item)}
                                  >
                                    Excluir
                                  </PageButtonSm>
                                )}
                              </div>
                            </SubItem>
                          )}

                          {pendenciasItemId === item.id && (
                            <SubLista>
                              {pendencias.length === 0 ? (
                                <EmptyText>Ninguém pendente neste item.</EmptyText>
                              ) : (
                                pendencias.map((p) => (
                                  <PendenciaCard key={p.mentorado_id}>
                                    <PendenciaIcone>
                                      <AlertTriangle size={16} />
                                    </PendenciaIcone>
                                    <PendenciaTexto>
                                      <PendenciaNome>{p.mentorado_nome}</PendenciaNome> · mentor: {p.mentor_nome}
                                    </PendenciaTexto>
                                  </PendenciaCard>
                                ))
                              )}
                            </SubLista>
                          )}
                        </div>
                      ))}
                    </SubLista>

                    {editandoId === pasta.id &&
                      (adicionandoItemPastaId === pasta.id ? (
                        <FormStack
                          onSubmit={(e) => handleCriarItem(e, pasta.id)}
                          style={{ padding: "0 1rem 1rem" }}
                        >
                          <FieldGroup>
                            <FieldLabel htmlFor={`novo-item-nome-${pasta.id}`}>Nome do item</FieldLabel>
                            <FieldInput
                              id={`novo-item-nome-${pasta.id}`}
                              placeholder="Ex.: Foto do encontro"
                              value={novoItemNome}
                              onChange={(e) => setNovoItemNome(e.target.value)}
                              required
                            />
                          </FieldGroup>
                          <FieldGroup>
                            <FieldLabel htmlFor={`novo-item-tipo-${pasta.id}`}>Formato aceito</FieldLabel>
                            <FieldSelect
                              id={`novo-item-tipo-${pasta.id}`}
                              value={novoItemTipo}
                              onChange={(e) => setNovoItemTipo(e.target.value as DesempenhoPdiItemTipoArquivo)}
                            >
                              <option value="qualquer">{ROTULO_TIPO_ARQUIVO.qualquer}</option>
                              <option value="documento">{ROTULO_TIPO_ARQUIVO.documento}</option>
                              <option value="foto">{ROTULO_TIPO_ARQUIVO.foto}</option>
                            </FieldSelect>
                          </FieldGroup>
                          {itemErroForm && <ErrorText>{itemErroForm}</ErrorText>}
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <PageButtonSm type="submit" disabled={itemSalvando}>
                              {itemSalvando ? "Adicionando..." : "Adicionar item"}
                            </PageButtonSm>
                            <PageButtonSm type="button" $variant="outline" onClick={() => setAdicionandoItemPastaId(null)}>
                              Cancelar
                            </PageButtonSm>
                          </div>
                        </FormStack>
                      ) : (
                        <div style={{ padding: "0 1rem 1rem" }}>
                          <PageButtonSm type="button" $variant="outline" onClick={() => abrirAdicionarItem(pasta.id)}>
                            <Plus size={14} />
                            Adicionar item
                          </PageButtonSm>
                        </div>
                      ))}
                  </LoteCard>
                );
              })}
            </LotesStack>
          )}
        </PageCardContent>
      </PageCard>

      {paraExcluir && (
        <ConfirmarModal
          titulo="Excluir pasta"
          mensagem={`Excluir a pasta "${paraExcluir.nome}"? Só é possível se ela não tiver mais nenhum item cadastrado.${erroExcluir ? ` ${erroExcluir}` : ""}`}
          onCancelar={() => {
            setParaExcluir(null);
            setErroExcluir("");
          }}
          onConfirmar={confirmarExclusao}
        />
      )}

      {paraExcluirItem && (
        <ConfirmarModal
          titulo="Excluir item"
          mensagem={`Excluir o item "${paraExcluirItem.nome}"? Só é possível se ainda não houver nenhum envio nele.${erroExcluirItem ? ` ${erroExcluirItem}` : ""}`}
          onCancelar={() => {
            setParaExcluirItem(null);
            setErroExcluirItem("");
          }}
          onConfirmar={confirmarExclusaoItem}
        />
      )}
    </>
  );
}
