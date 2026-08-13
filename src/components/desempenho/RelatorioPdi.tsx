import { useEffect, useRef, useState } from "react";
import { Download, Trash2, Upload } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { baixarEnvioPdi, deleteEnvioPdi, getEnviosPdi, uploadEnvioPdi } from "@/lib/desempenho-pdi";
import { formatarData } from "@/lib/projetos";
import type { DesempenhoPdiItemComEnvio, DesempenhoPdiPastaComItens } from "@/types/desempenho";
import { EmptyText, PageBadge, PageButtonSm, PageLoadingBlock } from "@/styles/page.styled";
import { FormErrorText } from "@/pages/Bancas.styled";
import {
  LoteCard,
  LoteCardHeader,
  LoteCardInfo,
  LoteCardMeta,
  LoteCardTitulo,
  LotesStack,
  SubItem,
  SubItemMeta,
  SubLista,
} from "@/pages/avaliacao-desempenho/painel/Painel.styled";

interface RelatorioPdiProps {
  usuarioId: number;
  /** Quem está vendo pode enviar/reenviar/remover itens do "PDI inicial"?
   *  Só a diretoria, o mentor não tem essa pasta liberada (backend recusa
   *  mesmo se o botão aparecesse, mas não faz sentido oferecer um botão
   *  fadado a dar erro). */
  podeEnviarInicial: boolean;
  /** E os itens de "Encontro"? Diretoria sempre; o mentor só quando é o
   *  mentor DESTE mentorado, quem chama já garante isso (a tela "Meus
   *  Mentorados" só abre com o próprio mentorado da pessoa logada). */
  podeEnviarEncontro: boolean;
}

function statusDoItem(
  item: DesempenhoPdiItemComEnvio,
  prazo: string,
): { tom: "success" | "warning" | "danger"; rotulo: string } {
  if (item.envio) return { tom: "success", rotulo: "Enviado" };
  const hoje = new Date().toISOString().slice(0, 10);
  if (prazo < hoje) return { tom: "danger", rotulo: "Atrasado" };
  return { tom: "warning", rotulo: "Pendente" };
}

export function RelatorioPdi({ usuarioId, podeEnviarInicial, podeEnviarEncontro }: RelatorioPdiProps) {
  const { token } = useAuth();
  const [pastas, setPastas] = useState<DesempenhoPdiPastaComItens[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState<number | null>(null);
  const [itemAlvo, setItemAlvo] = useState<number | null>(null);
  const inputArquivo = useRef<HTMLInputElement>(null);

  async function carregar() {
    if (!token) return;
    setCarregando(true);
    setErro("");
    try {
      setPastas(await getEnviosPdi(usuarioId, token));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar o PDI");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioId, token]);

  function podeEnviarNestaPasta(pasta: DesempenhoPdiPastaComItens): boolean {
    return pasta.pasta_tipo === "inicial" ? podeEnviarInicial : podeEnviarEncontro;
  }

  function abrirSeletorDeArquivo(itemId: number) {
    setItemAlvo(itemId);
    inputArquivo.current?.click();
  }

  async function aoEscolherArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo || !token || itemAlvo == null) return;
    setOcupado(itemAlvo);
    setErro("");
    try {
      await uploadEnvioPdi(usuarioId, itemAlvo, arquivo, token);
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao enviar o arquivo");
    } finally {
      setOcupado(null);
      setItemAlvo(null);
    }
  }

  async function remover(itemId: number) {
    if (!token) return;
    setOcupado(itemId);
    setErro("");
    try {
      await deleteEnvioPdi(usuarioId, itemId, token);
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao remover o envio");
    } finally {
      setOcupado(null);
    }
  }

  async function baixar(itemId: number, item: DesempenhoPdiItemComEnvio) {
    if (!token || !item.envio) return;
    try {
      await baixarEnvioPdi(usuarioId, itemId, item.envio.arquivo_nome, token);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao baixar o arquivo");
    }
  }

  if (carregando) return <PageLoadingBlock />;

  return (
    <div>
      <input
        ref={inputArquivo}
        type="file"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        hidden
        onChange={aoEscolherArquivo}
      />

      {pastas.length === 0 ? (
        <EmptyText>Nenhuma pasta de PDI cadastrada ainda.</EmptyText>
      ) : (
        <LotesStack>
          {pastas.map((pasta) => {
            const podeAgir = podeEnviarNestaPasta(pasta);
            return (
              <LoteCard key={pasta.pasta_id}>
                <LoteCardHeader>
                  <LoteCardInfo>
                    <LoteCardTitulo>
                      {pasta.pasta_nome}
                      {pasta.pasta_semestre && ` (${pasta.pasta_semestre})`}
                    </LoteCardTitulo>
                    <LoteCardMeta>Prazo: {formatarData(pasta.prazo)}</LoteCardMeta>
                  </LoteCardInfo>
                </LoteCardHeader>

                {pasta.itens.length === 0 ? (
                  <SubLista>
                    <EmptyText>Nenhum documento exigido nesta pasta ainda.</EmptyText>
                  </SubLista>
                ) : (
                  <SubLista>
                    {pasta.itens.map((item) => {
                      const status = statusDoItem(item, pasta.prazo);
                      const ocupadoAqui = ocupado === item.item_id;
                      return (
                        <SubItem key={item.item_id}>
                          <div>
                            {item.item_nome}
                            {item.envio && (
                              <SubItemMeta>
                                {" "}
                                · enviado por {item.envio.enviado_por_nome ?? "—"} em{" "}
                                {formatarData(item.envio.enviado_em)}
                              </SubItemMeta>
                            )}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                            <PageBadge $tone={status.tom}>{status.rotulo}</PageBadge>
                            {item.envio && (
                              <PageButtonSm type="button" $variant="outline" onClick={() => baixar(item.item_id, item)}>
                                <Download size={14} />
                                Baixar
                              </PageButtonSm>
                            )}
                            {podeAgir && (
                              <PageButtonSm
                                type="button"
                                $variant="outline"
                                disabled={ocupadoAqui}
                                onClick={() => abrirSeletorDeArquivo(item.item_id)}
                              >
                                <Upload size={14} />
                                {ocupadoAqui ? "Enviando…" : item.envio ? "Reenviar" : "Enviar"}
                              </PageButtonSm>
                            )}
                            {podeAgir && item.envio && (
                              <PageButtonSm
                                type="button"
                                $variant="ghost"
                                disabled={ocupadoAqui}
                                onClick={() => remover(item.item_id)}
                              >
                                <Trash2 size={14} />
                                Remover
                              </PageButtonSm>
                            )}
                          </div>
                        </SubItem>
                      );
                    })}
                  </SubLista>
                )}
              </LoteCard>
            );
          })}
        </LotesStack>
      )}

      {erro && <FormErrorText>{erro}</FormErrorText>}
    </div>
  );
}
