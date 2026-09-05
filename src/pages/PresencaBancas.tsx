import { useMemo } from "react";
import type { Banca, Candidatura } from "@/types/banca";
import type { UsuarioResumo } from "@/types/auth";
import {
  PageCard,
  PageCardHeader,
  PageCardTitle,
  PageCardContent,
  PageBadge,
  EmptyText,
} from "@/styles/page.styled";
import {
  DataTable,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "./Config.styled";
import { TabelaRolagem } from "@/styles/shared.styled";
import { Th, useOrdenacao, type Colunas } from "@/components/tabela/ordenacao";
import {
  ConteudoPaginado,
  POR_PAGINA_TABELA,
  Paginacao,
  usePaginacao,
} from "@/pages/monitoramento/Paginacao";

interface Props {
  usuarios: UsuarioResumo[];
  candidaturas: Candidatura[];
  bancas: Banca[];
}

interface LinhaPresenca {
  usuario: UsuarioResumo;
  inscrito: number;
  presente: number;
  futuras: number;
  faltas: number;
  percentual: number | null;
}

const COLUNAS_PRESENCA: Colunas<LinhaPresenca> = {
  membro: { valor: (l) => l.usuario.nome, inicial: "asc" },
  presente: { valor: (l) => l.presente, inicial: "desc" },
  faltas: { valor: (l) => l.faltas, inicial: "desc" },
  // Quem nunca teve banca realizada não tem percentual: fica no fim nas duas
  // direções, porque "—" não é 0%.
  percentual: { valor: (l) => l.percentual, inicial: "desc" },
  futuras: { valor: (l) => l.futuras, inicial: "desc" },
};

/**
 * Presença por membro, o controle da diretoria.
 *
 * ⚠ Desde que "Registrar realização" saiu (2026-09-04), `confirmado` não
 * distingue mais quem faltou de verdade: a finalização automática marca
 * `presentes` = todo mundo que se candidatou (backend,
 * `finalizacao_automatica.py`), porque não sobrou humano na tela para
 * apontar ausência. `faltas` só volta a significar falta de verdade em
 * banca que ainda tem gente marcando presença à mão — e não sobra mais
 * nenhuma tela que faça isso.
 *
 * A conta só olha bancas JÁ REALIZADAS: numa banca futura ninguém faltou —
 * misturar as duas faria todo mundo parecer ausente por estar inscrito no que
 * ainda vai acontecer.
 */
export function PresencaBancas({ usuarios, candidaturas, bancas }: Props) {
  const linhas = useMemo(() => {
    const realizadas = new Set(bancas.filter((b) => b.realizado_em).map((b) => b.id));

    const porUsuario = new Map<number, { inscrito: number; presente: number; futuras: number }>();
    for (const c of candidaturas) {
      const atual = porUsuario.get(c.usuario_id) ?? { inscrito: 0, presente: 0, futuras: 0 };
      if (realizadas.has(c.banca_id)) {
        atual.inscrito += 1;
        if (c.confirmado) atual.presente += 1;
      } else {
        atual.futuras += 1;
      }
      porUsuario.set(c.usuario_id, atual);
    }

    return usuarios
      .map((u) => {
        const d = porUsuario.get(u.id) ?? { inscrito: 0, presente: 0, futuras: 0 };
        return {
          usuario: u,
          ...d,
          faltas: d.inscrito - d.presente,
          // Sem banca realizada não há percentual, `null` para a tela mostrar
          // um traço em vez de "0%", que soaria como falta.
          percentual: d.inscrito > 0 ? Math.round((d.presente / d.inscrito) * 100) : null,
        };
      })
      // Quem tem mais falta primeiro: é quem a diretoria precisa olhar.
      .sort((a, b) => b.faltas - a.faltas || a.usuario.nome.localeCompare(b.usuario.nome));
  }, [usuarios, candidaturas, bancas]);

  const semNenhuma = linhas.every((l) => l.inscrito === 0 && l.futuras === 0);
  // Sem coluna inicial: a lista já abre por quem tem mais falta, que é a
  // pergunta da tabela e não sai de uma coluna sozinha (empate desempata
  // pelo nome).
  const { itens: ordenadas, ordem, ordenarPor } = useOrdenacao(linhas, COLUNAS_PRESENCA);
  /* Páginas no lugar da rolagem interna. A tabela lista o núcleo INTEIRO — 80
     linhas — e o card virava uma tela sozinho. A rolagem que estava aqui é
     pior que rolar a página: uma área rolável dentro dela captura a roda do
     mouse, e quem queria descer a página fica preso na tabela.
     ⚠ Pagina o ORDENADO, não a lista crua: paginar antes deixaria o clique no
     cabeçalho reordenando só as 15 linhas da página aberta. */
  const pagina = usePaginacao(ordenadas, POR_PAGINA_TABELA);

  return (
    <PageCard>
      <PageCardHeader>
        <PageCardTitle>Presença por membro</PageCardTitle>
      </PageCardHeader>
      <PageCardContent>
        {semNenhuma ? (
          <EmptyText>Ninguém se inscreveu em bancas ainda.</EmptyText>
        ) : (
          <ConteudoPaginado estado={pagina}>
            {/* 5 colunas de números curtos, mas "Ainda vai ter" e "Compareceu"
                não cabem em 375px sem quebrar cada rótulo em três linhas. */}
            <TabelaRolagem $min="44rem">
              <DataTable>
                <TableHead>
                  <TableRow>
                    <Th coluna="membro" ordem={ordem} onOrdenar={ordenarPor}>
                      Membro
                    </Th>
                    <Th coluna="presente" ordem={ordem} onOrdenar={ordenarPor}>
                      Compareceu
                    </Th>
                    <Th coluna="faltas" ordem={ordem} onOrdenar={ordenarPor}>
                      Faltou
                    </Th>
                    <Th coluna="percentual" ordem={ordem} onOrdenar={ordenarPor}>
                      Presença
                    </Th>
                    <Th coluna="futuras" ordem={ordem} onOrdenar={ordenarPor}>
                      Ainda vai ter
                    </Th>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagina.visiveis.map((l) => (
                    <TableRow key={l.usuario.id}>
                      <TableCell>{l.usuario.nome}</TableCell>
                      <TableCell>
                        {l.presente} de {l.inscrito}
                      </TableCell>
                      <TableCell>
                        {l.faltas > 0 ? (
                          <PageBadge $tone="danger">{l.faltas}</PageBadge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        {l.percentual === null ? "—" : `${l.percentual}%`}
                      </TableCell>
                      <TableCell>{l.futuras > 0 ? l.futuras : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </DataTable>
            </TabelaRolagem>
          </ConteudoPaginado>
        )}
        {!semNenhuma && <Paginacao estado={pagina} />}
      </PageCardContent>
    </PageCard>
  );
}
