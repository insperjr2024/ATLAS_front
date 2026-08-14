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
  TableHeadCell,
  TableBody,
  TableRow,
  TableCell,
} from "./Config.styled";
import { TableScrollWrap } from "@/styles/shared.styled";

interface Props {
  usuarios: UsuarioResumo[];
  candidaturas: Candidatura[];
  bancas: Banca[];
}

/**
 * Presença por membro, o controle da diretoria.
 *
 * O dado já era gravado e nunca lido: `Registrar realização` marca
 * `candidatura.confirmado` para quem compareceu, e até aqui nenhuma tela
 * consumia isso. Esta é a leitura.
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

  return (
    <PageCard>
      <PageCardHeader>
        <PageCardTitle>Presença por membro</PageCardTitle>
      </PageCardHeader>
      <PageCardContent>
        {semNenhuma ? (
          <EmptyText>Ninguém se inscreveu em bancas ainda.</EmptyText>
        ) : (
          <TableScrollWrap>
            <DataTable>
              <TableHead>
                <TableRow>
                  <TableHeadCell>Membro</TableHeadCell>
                  <TableHeadCell>Compareceu</TableHeadCell>
                  <TableHeadCell>Faltou</TableHeadCell>
                  <TableHeadCell>Presença</TableHeadCell>
                  <TableHeadCell>Ainda vai ter</TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {linhas.map((l) => (
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
          </TableScrollWrap>
        )}
      </PageCardContent>
    </PageCard>
  );
}
