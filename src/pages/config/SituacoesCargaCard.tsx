import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { theme } from "@/styles/theme";
import { useAuth } from "@/context/AuthContext";
import {
  atualizarSituacaoCarga,
  descreverFaixa,
  getSituacoesCarga,
  ROTULO_TOM,
  type PapelCarga,
  type SituacaoCarga,
  type TomSituacao,
} from "@/lib/situacoes-carga";
import { Input } from "@/components/ui/input";
import {
  PageCard,
  PageCardHeader,
  PageCardTitle,
  PageCardContent,
  EmptyText,
  ErrorText,
} from "@/styles/page.styled";
import {
  DataTable,
  TableHead,
  TableHeadCell,
  TableBody,
  TableRow,
  TableCell,
  FieldSelect,
} from "../Membros.styled";
import { TabelaRolagem } from "@/styles/shared.styled";

const FaixaTexto = styled.p`
  margin: 0.25rem 0 0;
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
`;

const PAPEIS: { chave: PapelCarga; titulo: string }[] = [
  { chave: "consultor", titulo: "Consultores" },
  { chave: "coordenador", titulo: "Coordenadores" },
];

/**
 * A escala de carga por papel.
 *
 * A diretoria descreve o que cada quantidade de projetos significa, "0 a 1
 * disponível, 2 é o ideal, 3 ou mais é demanda alta". Não é um limite único: um
 * número só não distingue "está no ponto" de "passou do ponto", e o ponto de
 * saturação muda entre frentes e entre gestões.
 *
 * São sempre três faixas, e a tela só edita: nome, a partir de quantos projetos
 * e a cor. Sem criar nem excluir, a faixa mais alta existe por construção, é
 * ela que alimenta o card de demanda alta do monitoramento, que assim nunca
 * fica vazio porque alguém apagou a faixa errada.
 */
export function SituacoesCargaCard() {
  const { token } = useAuth();
  const [situacoes, setSituacoes] = useState<SituacaoCarga[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function buscar() {
    if (!token) return;
    try {
      setSituacoes(await getSituacoesCarga(token));
      setErro("");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    buscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function editar(id: number, dados: Partial<SituacaoCarga>) {
    try {
      await atualizarSituacaoCarga(id, dados, token!);
      setErro("");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar");
    }
    // Rebusca mesmo em caso de erro: o mínimo recusado tem que voltar ao valor
    // que o banco tem, senão a tela fica mostrando algo que não foi salvo.
    await buscar();
  }

  return (
    <PageCard>
      <PageCardHeader>
        <PageCardTitle>Situações de carga</PageCardTitle>
      </PageCardHeader>
      <PageCardContent>
        <EmptyText>
          O que cada quantidade de projetos significa. Cada situação vale a partir do mínimo até a
          próxima começar, e quem cai na última aparece em destaque no monitoramento.
        </EmptyText>

        {erro && <ErrorText>{erro}</ErrorText>}
        {carregando && <EmptyText>Carregando...</EmptyText>}

        {!carregando &&
          PAPEIS.map(({ chave, titulo }) => (
            <TabelaPapel
              key={chave}
              titulo={titulo}
              situacoes={situacoes.filter((s) => s.papel === chave)}
              onEditar={editar}
            />
          ))}
      </PageCardContent>
    </PageCard>
  );
}

function TabelaPapel({
  titulo,
  situacoes,
  onEditar,
}: {
  titulo: string;
  situacoes: SituacaoCarga[];
  onEditar: (id: number, dados: Partial<SituacaoCarga>) => void;
}) {
  // Ordenadas pelo mínimo: é assim que a escala se lê, e é o que permite
  // descrever a faixa de cada uma olhando a seguinte.
  const ordenadas = useMemo(
    () => [...situacoes].sort((a, b) => a.min_projetos - b.min_projetos),
    [situacoes],
  );

  // A escala não precisa começar em zero, subir o mínimo da primeira faixa
  // deixa os menos carregados sem rótulo, e eles aparecem com um travessão no
  // monitoramento. Isso não é óbvio olhando só a tabela.
  const comecaEm = ordenadas[0]?.min_projetos ?? 0;

  return (
    <>
      <PageCardTitle style={{ marginTop: "1.5rem" }}>{titulo}</PageCardTitle>
      {comecaEm > 0 && (
        <EmptyText>
          Quem tem menos de {comecaEm} {comecaEm === 1 ? "projeto" : "projetos"} fica sem situação.
        </EmptyText>
      )}
      {/* 3 colunas, mas duas delas são campos editáveis e um select — o
          conteúdo pesa mais que o número de colunas sugere. */}
      <TabelaRolagem $min="34rem">
        <DataTable>
          <TableHead>
            <TableRow>
              <TableHeadCell>A partir de quantos projetos</TableHeadCell>
              <TableHeadCell>Situação</TableHeadCell>
              <TableHeadCell>Cor</TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ordenadas.map((s, i) => (
              <TableRow key={s.id}>
                <TableCell>
                  <Input
                    type="number"
                    min={0}
                    defaultValue={s.min_projetos}
                    onBlur={(e) => {
                      const valor = Number(e.target.value);
                      if (e.target.value !== "" && valor !== s.min_projetos) {
                        onEditar(s.id, { min_projetos: valor });
                      }
                    }}
                  />
                  {/* Texto de apoio, não editável, só traduz o número acima
                      em "vale até onde": um "3" sozinho não diz se é "só 3" ou
                      "3 pra cima". Antes isso era uma coluna própria ("Faixa"),
                      que duplicava a mesma informação lado a lado com o campo
                      editável e confundia mais do que ajudava. */}
                  <FaixaTexto>vale de {descreverFaixa(s, ordenadas[i + 1])} projeto(s)</FaixaTexto>
                </TableCell>
                <TableCell>
                  <Input
                    defaultValue={s.nome}
                    onBlur={(e) =>
                      e.target.value.trim() &&
                      e.target.value !== s.nome &&
                      onEditar(s.id, { nome: e.target.value.trim() })
                    }
                  />
                </TableCell>
                <TableCell>
                  <FieldSelect
                    value={s.tom}
                    onChange={(e) => onEditar(s.id, { tom: e.target.value as TomSituacao })}
                  >
                    {Object.entries(ROTULO_TOM).map(([valor, rotulo]) => (
                      <option key={valor} value={valor}>
                        {rotulo}
                      </option>
                    ))}
                  </FieldSelect>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      </TabelaRolagem>
    </>
  );
}
