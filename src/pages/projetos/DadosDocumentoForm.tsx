import { createContext, useContext } from "react";
import type { ComponentType, ReactNode } from "react";
import type { TipoDocumentoContratual } from "@/types/contratos";
import { FieldGroup, FieldLabel, FieldInput, FieldTextarea, CheckboxLabel } from "../Bancas.styled";
import {
  FormSecoes,
  FormSecaoTitulo,
  FormSubsecaoTitulo,
  FormGrid,
  FormGridEstreito,
  ListaLinha,
  ListaRemoverBotao,
  ListaAdicionarBotao,
  CampoDestacadoWrapper,
  CampoObrigatorioTexto,
} from "./ProjetoContratos.styled";

/**
 * ⭐ 2026-09-17 — formulário campo-a-campo por tipo de documento, substituindo
 * o textarea de JSON cru da primeira versão. O shape de cada seção segue
 * `dados_documento_contratual.py`/`render_template.py` no backend; `dados`
 * aqui fica solto (`Record<string, unknown>`) de propósito — é o mesmo dado
 * que já ia e voltava como JSON, só que agora editado campo a campo em vez
 * de texto livre.
 */

type Dados = Record<string, unknown>;
type Caminho = (string | number)[];
type Setter = (caminho: Caminho, valor: unknown) => void;

// `dados` é um blob JSON de shape variável (muda por tipo de documento) —
// `obter`/`setPath` navegam esse blob por caminho dinâmico, o caso de uso
// que `any` existe pra cobrir. Os chamadores é que sabem, por posição, que
// tipo esperar de volta (daí o `as X[]`/`as string` no lugar de uso).
/* eslint-disable @typescript-eslint/no-explicit-any */
function obter(dados: any, caminho: Caminho): any {
  return caminho.reduce((acc, chave) => (acc == null ? undefined : acc[chave]), dados);
}

function setPath(dados: any, caminho: Caminho, valor: unknown): Dados {
  if (caminho.length === 0) return valor as Dados;
  const [cabeca, ...resto] = caminho;
  const atual = Array.isArray(dados) ? [...dados] : { ...(dados ?? {}) };
  const filhoAtual = dados?.[cabeca];
  atual[cabeca] =
    resto.length === 0 ? valor : setPath(filhoAtual ?? (typeof resto[0] === "number" ? [] : {}), resto, valor);
  return atual;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** As caminhos (já em formato "a.b.c", igual o backend manda em `campos`)
 *  que faltam preencher — populado por `DadosDocumentoForm` a partir do erro
 *  de "Faltam campos obrigatórios". Context em vez de prop em cada campo:
 *  são dezenas de `<Texto>`/`<Numero>` espalhados pelas seções por tipo, e
 *  nenhum precisa saber que esta trava existe. */
const CamposFaltandoContext = createContext<Set<string>>(new Set());

/** Mesma régua de "vazio" que o backend usa em `_vazio()` — só serve pra
 *  decidir se ainda mostra o destaque; quem decide se falta de verdade
 *  continua sendo o backend na próxima tentativa de Confirmar/Gerar. */
function campoAindaVazio(valor: unknown): boolean {
  if (valor === null || valor === undefined) return true;
  if (typeof valor === "string") return valor.trim() === "";
  if (typeof valor === "number") return valor === 0;
  return false;
}

function Campo({
  label,
  caminho,
  valor,
  children,
}: {
  label: string;
  caminho?: Caminho;
  valor?: unknown;
  children: ReactNode;
}) {
  const camposFaltando = useContext(CamposFaltandoContext);
  const emFalta = !!caminho && camposFaltando.has(caminho.join(".")) && campoAindaVazio(valor);
  return (
    <FieldGroup>
      <FieldLabel>{label}</FieldLabel>
      <CampoDestacadoWrapper $destacar={emFalta}>{children}</CampoDestacadoWrapper>
      {emFalta && <CampoObrigatorioTexto>Campo obrigatório</CampoObrigatorioTexto>}
    </FieldGroup>
  );
}

function Texto({ dados, set, caminho, label }: { dados: Dados; set: Setter; caminho: Caminho; label: string }) {
  const valor = obter(dados, caminho);
  return (
    <Campo label={label} caminho={caminho} valor={valor}>
      <FieldInput value={valor ?? ""} onChange={(e) => set(caminho, e.target.value)} />
    </Campo>
  );
}

function Numero({ dados, set, caminho, label }: { dados: Dados; set: Setter; caminho: Caminho; label: string }) {
  const valor = obter(dados, caminho);
  return (
    <Campo label={label} caminho={caminho} valor={valor}>
      <FieldInput
        type="number"
        value={valor ?? ""}
        onChange={(e) => set(caminho, e.target.value === "" ? null : Number(e.target.value))}
      />
    </Campo>
  );
}

function DataCampo({ dados, set, caminho, label }: { dados: Dados; set: Setter; caminho: Caminho; label: string }) {
  const valor = obter(dados, caminho);
  return (
    <Campo label={label} caminho={caminho} valor={valor}>
      <FieldInput type="date" value={valor ?? ""} onChange={(e) => set(caminho, e.target.value)} />
    </Campo>
  );
}

function TextoLongo({ dados, set, caminho, label }: { dados: Dados; set: Setter; caminho: Caminho; label: string }) {
  const valor = obter(dados, caminho);
  return (
    <Campo label={label} caminho={caminho} valor={valor}>
      <FieldTextarea value={valor ?? ""} onChange={(e) => set(caminho, e.target.value)} />
    </Campo>
  );
}

function Marcar({ dados, set, caminho, label }: { dados: Dados; set: Setter; caminho: Caminho; label: string }) {
  return (
    <CheckboxLabel>
      <input
        type="checkbox"
        checked={!!obter(dados, caminho)}
        onChange={(e) => set(caminho, e.target.checked)}
      />
      {label}
    </CheckboxLabel>
  );
}

function ListaTexto({
  itens,
  onChange,
  label,
  placeholder,
}: {
  itens: string[];
  onChange: (itens: string[]) => void;
  label: string;
  placeholder?: string;
}) {
  const lista = itens ?? [];
  return (
    <FieldGroup>
      <FieldLabel>{label}</FieldLabel>
      {lista.map((item, i) => (
        <ListaLinha key={i}>
          <FieldInput
            value={item}
            placeholder={placeholder}
            onChange={(e) => {
              const novo = [...lista];
              novo[i] = e.target.value;
              onChange(novo);
            }}
          />
          <ListaRemoverBotao type="button" aria-label="Remover" onClick={() => onChange(lista.filter((_, idx) => idx !== i))}>
            ×
          </ListaRemoverBotao>
        </ListaLinha>
      ))}
      <ListaAdicionarBotao type="button" onClick={() => onChange([...lista, ""])}>
        + adicionar
      </ListaAdicionarBotao>
    </FieldGroup>
  );
}

// ---------- Seções compartilhadas por todos os tipos ----------

function ContratanteSecao({ dados, set }: { dados: Dados; set: Setter }) {
  return (
    <section>
      <FormSecaoTitulo>Contratante</FormSecaoTitulo>
      <FormGrid $colunas={2}>
        <Texto dados={dados} set={set} caminho={["contratante", "razao_social"]} label="Razão social" />
        <Texto dados={dados} set={set} caminho={["contratante", "cnpj"]} label="CNPJ / CPF" />
      </FormGrid>
      <FormGrid $colunas={2} style={{ marginTop: "0.75rem" }}>
        <TextoLongo dados={dados} set={set} caminho={["contratante", "endereco"]} label="Endereço" />
        <Texto dados={dados} set={set} caminho={["contratante", "email_cobranca"]} label="E-mail de cobrança" />
      </FormGrid>

      <FormSubsecaoTitulo>Representante</FormSubsecaoTitulo>
      <FormGrid $colunas={2}>
        <Texto dados={dados} set={set} caminho={["contratante", "representante", "nome"]} label="Nome" />
        <Texto dados={dados} set={set} caminho={["contratante", "representante", "cargo"]} label="Cargo" />
        <Texto dados={dados} set={set} caminho={["contratante", "representante", "nacionalidade"]} label="Nacionalidade" />
        <Texto dados={dados} set={set} caminho={["contratante", "representante", "estado_civil"]} label="Estado civil" />
        <Texto dados={dados} set={set} caminho={["contratante", "representante", "profissao"]} label="Profissão" />
        <Texto dados={dados} set={set} caminho={["contratante", "representante", "rg"]} label="RG (nº e órgão emissor)" />
        <Texto dados={dados} set={set} caminho={["contratante", "representante", "cpf"]} label="CPF" />
        <TextoLongo dados={dados} set={set} caminho={["contratante", "representante", "endereco"]} label="Endereço" />
        <Texto dados={dados} set={set} caminho={["contratante", "representante", "email"]} label="E-mail" />
        <Texto dados={dados} set={set} caminho={["contratante", "representante", "telefone"]} label="Telefone" />
      </FormGrid>
    </section>
  );
}

function TestemunhasSecao({ dados, set }: { dados: Dados; set: Setter }) {
  // Sempre 2 posições fixas (decisão do backend: o formulário só edita
  // posições já existentes, sem botão de adicionar — ver render_template.py).
  return (
    <section>
      <FormSecaoTitulo>Testemunhas do contratante</FormSecaoTitulo>
      <FormGrid $colunas={2}>
        {[0, 1].map((i) => (
          <FormGrid key={i} $colunas={2}>
            <Texto dados={dados} set={set} caminho={["testemunhas", i, "nome"]} label={`Testemunha ${i + 1}`} />
            <Texto dados={dados} set={set} caminho={["testemunhas", i, "cpf"]} label="CPF" />
          </FormGrid>
        ))}
      </FormGrid>
    </section>
  );
}

function AssinaturaSecao({ dados, set }: { dados: Dados; set: Setter }) {
  return (
    <section>
      <FormSecaoTitulo>Assinatura</FormSecaoTitulo>
      <FormGridEstreito>
        <Numero dados={dados} set={set} caminho={["assinatura", "dia"]} label="Dia" />
        <Texto dados={dados} set={set} caminho={["assinatura", "mes"]} label="Mês (número ou nome)" />
        <Numero dados={dados} set={set} caminho={["assinatura", "ano"]} label="Ano" />
      </FormGridEstreito>
    </section>
  );
}

// ---------- Seções específicas por tipo ----------

function ContratoSecoes({ dados, set }: { dados: Dados; set: Setter }) {
  const escopos: { nome: string; prazo_dias_uteis: number }[] = obter(dados, ["projeto", "escopos"]) ?? [];
  const diasExcecao: { inicio: string; fim: string }[] = obter(dados, ["projeto", "dias_excecao"]) ?? [];
  const parcelado = !!obter(dados, ["financeiro", "parcelado"]);

  return (
    <>
      <section>
        <FormSecaoTitulo>Projeto</FormSecaoTitulo>
        <TextoLongo dados={dados} set={set} caminho={["projeto", "servico"]} label="Serviço contratado" />
        <FormGrid $colunas={2} style={{ marginTop: "0.75rem" }}>
          <Numero dados={dados} set={set} caminho={["projeto", "num_consultores"]} label="Nº de consultores" />
          <Numero dados={dados} set={set} caminho={["projeto", "num_coordenadores"]} label="Nº de coordenadores" />
          <DataCampo dados={dados} set={set} caminho={["projeto", "data_inicio"]} label="Início" />
          <DataCampo dados={dados} set={set} caminho={["projeto", "data_termino"]} label="Término previsto" />
        </FormGrid>

        <FormSubsecaoTitulo>Escopos (o primeiro é sempre a Ambientação)</FormSubsecaoTitulo>
        <FieldGroup>
          {escopos.map((escopo, i) => (
            <ListaLinha key={i}>
              <FieldInput
                value={escopo?.nome ?? ""}
                placeholder="Nome do escopo"
                onChange={(e) => set(["projeto", "escopos", i, "nome"], e.target.value)}
              />
              <FieldInput
                type="number"
                style={{ maxWidth: "9rem" }}
                value={escopo?.prazo_dias_uteis ?? ""}
                placeholder="Dias úteis"
                onChange={(e) => set(["projeto", "escopos", i, "prazo_dias_uteis"], Number(e.target.value))}
              />
              <ListaRemoverBotao
                type="button"
                aria-label="Remover escopo"
                onClick={() => set(["projeto", "escopos"], escopos.filter((_, idx) => idx !== i))}
              >
                ×
              </ListaRemoverBotao>
            </ListaLinha>
          ))}
          <ListaAdicionarBotao
            type="button"
            onClick={() => set(["projeto", "escopos"], [...escopos, { nome: "", prazo_dias_uteis: 0 }])}
          >
            + adicionar escopo
          </ListaAdicionarBotao>
        </FieldGroup>

        <FormSubsecaoTitulo>Dias de exceção</FormSubsecaoTitulo>
        <FieldGroup>
          {diasExcecao.map((dia, i) => (
            <ListaLinha key={i}>
              <FieldInput
                type="date"
                value={dia?.inicio ?? ""}
                onChange={(e) => set(["projeto", "dias_excecao", i, "inicio"], e.target.value)}
              />
              <FieldInput
                type="date"
                value={dia?.fim ?? ""}
                onChange={(e) => set(["projeto", "dias_excecao", i, "fim"], e.target.value)}
              />
              <ListaRemoverBotao
                type="button"
                aria-label="Remover dia de exceção"
                onClick={() => set(["projeto", "dias_excecao"], diasExcecao.filter((_, idx) => idx !== i))}
              >
                ×
              </ListaRemoverBotao>
            </ListaLinha>
          ))}
          <ListaAdicionarBotao
            type="button"
            onClick={() => set(["projeto", "dias_excecao"], [...diasExcecao, { inicio: "", fim: "" }])}
          >
            + adicionar dia de exceção
          </ListaAdicionarBotao>
        </FieldGroup>
      </section>

      <section>
        <FormSecaoTitulo>Financeiro</FormSecaoTitulo>
        <FormGrid $colunas={2}>
          <Numero dados={dados} set={set} caminho={["financeiro", "valor_total"]} label="Valor total (R$)" />
          <Texto dados={dados} set={set} caminho={["financeiro", "forma_pagamento"]} label="Forma de pagamento" />
        </FormGrid>
        <div style={{ marginTop: "0.75rem" }}>
          <Marcar dados={dados} set={set} caminho={["financeiro", "parcelado"]} label="Pagamento parcelado" />
        </div>
        {parcelado && (
          <FormGrid $colunas={2} style={{ marginTop: "0.75rem" }}>
            <Numero dados={dados} set={set} caminho={["financeiro", "numero_parcelas"]} label="Nº de parcelas" />
            <Numero dados={dados} set={set} caminho={["financeiro", "valor_parcela"]} label="Valor da parcela (R$)" />
            <DataCampo dados={dados} set={set} caminho={["financeiro", "primeiro_vencimento"]} label="Primeiro vencimento" />
            <Numero dados={dados} set={set} caminho={["financeiro", "dia_vencimento_mensal"]} label="Dia de vencimento mensal" />
          </FormGrid>
        )}
      </section>
    </>
  );
}

function TepSecoes({ dados, set }: { dados: Dados; set: Setter }) {
  const escoposEntregues: string[] = obter(dados, ["projeto", "escopos_entregues"]) ?? [];
  return (
    <section>
      <FormSecaoTitulo>Projeto</FormSecaoTitulo>
      <Texto dados={dados} set={set} caminho={["projeto", "nome"]} label="Nome do projeto" />
      <div style={{ marginTop: "0.75rem" }}>
        <ListaTexto
          label="Escopos entregues"
          itens={escoposEntregues}
          onChange={(v) => set(["projeto", "escopos_entregues"], v)}
        />
      </div>
      <FormSubsecaoTitulo>Execução</FormSubsecaoTitulo>
      <FormGrid $colunas={2}>
        <DataCampo dados={dados} set={set} caminho={["execucao", "data_inicio"]} label="Início" />
        <DataCampo dados={dados} set={set} caminho={["execucao", "data_fim"]} label="Fim" />
      </FormGrid>
    </section>
  );
}

function UsoImagemSecoes({ dados, set }: { dados: Dados; set: Setter }) {
  return (
    <section>
      <FormSecaoTitulo>Contexto</FormSecaoTitulo>
      <TextoLongo
        dados={dados}
        set={set}
        caminho={["contexto"]}
        label='Contexto em que as imagens foram captadas (Cláusula 2ª: "captados no contexto de ...")'
      />
    </section>
  );
}

function AditivoSecoes({ dados, set }: { dados: Dados; set: Setter }) {
  const secoes = obter(dados, ["secoes"]) ?? {};
  const objetoItens: string[] = obter(dados, ["objeto", "itens"]) ?? [];
  const precoParcelado = !!obter(dados, ["preco", "parcelado"]);

  return (
    <>
      <section>
        <FormSecaoTitulo>Contrato principal</FormSecaoTitulo>
        <FormGrid $colunas={2}>
          <Texto dados={dados} set={set} caminho={["contrato_principal", "referencia"]} label="Referência" />
          <DataCampo dados={dados} set={set} caminho={["contrato_principal", "data"]} label="Data de assinatura" />
        </FormGrid>
      </section>

      <section>
        <FormSecaoTitulo>O que este aditivo altera</FormSecaoTitulo>
        <FieldGroup>
          <Marcar dados={dados} set={set} caminho={["secoes", "objeto"]} label="Objeto" />
          <Marcar dados={dados} set={set} caminho={["secoes", "alteracao"]} label="Alteração de cláusula" />
          <Marcar dados={dados} set={set} caminho={["secoes", "preco"]} label="Preço" />
          <Marcar dados={dados} set={set} caminho={["secoes", "prazo"]} label="Prazo" />
        </FieldGroup>
      </section>

      {secoes.objeto && (
        <section>
          <FormSecaoTitulo>Objeto</FormSecaoTitulo>
          <TextoLongo dados={dados} set={set} caminho={["objeto", "descricao"]} label="Descrição" />
          <div style={{ marginTop: "0.75rem" }}>
            <ListaTexto label="Itens" itens={objetoItens} onChange={(v) => set(["objeto", "itens"], v)} />
          </div>
        </section>
      )}

      {secoes.alteracao && (
        <section>
          <FormSecaoTitulo>Alteração de cláusula</FormSecaoTitulo>
          <Texto dados={dados} set={set} caminho={["alteracao", "clausula"]} label="Cláusula alterada" />
          <div style={{ marginTop: "0.75rem" }}>
            <TextoLongo dados={dados} set={set} caminho={["alteracao", "nova_redacao"]} label="Nova redação" />
          </div>
        </section>
      )}

      {secoes.preco && (
        <section>
          <FormSecaoTitulo>Preço</FormSecaoTitulo>
          <FormGrid $colunas={2}>
            <Numero dados={dados} set={set} caminho={["preco", "valor_antigo"]} label="Valor anterior (R$)" />
            <Numero dados={dados} set={set} caminho={["preco", "valor_novo"]} label="Valor novo (R$)" />
          </FormGrid>
          <div style={{ marginTop: "0.75rem" }}>
            <Marcar dados={dados} set={set} caminho={["preco", "parcelado"]} label="Pagamento parcelado" />
          </div>
          {precoParcelado && (
            <FormGrid $colunas={2} style={{ marginTop: "0.75rem" }}>
              <Numero dados={dados} set={set} caminho={["preco", "numero_parcelas"]} label="Nº de parcelas" />
              <Numero dados={dados} set={set} caminho={["preco", "valor_parcela"]} label="Valor da parcela (R$)" />
              <DataCampo dados={dados} set={set} caminho={["preco", "primeiro_vencimento"]} label="Primeiro vencimento" />
              <Numero dados={dados} set={set} caminho={["preco", "dia_vencimento_mensal"]} label="Dia de vencimento mensal" />
            </FormGrid>
          )}
        </section>
      )}

      {secoes.prazo && (
        <section>
          <FormSecaoTitulo>Prazo</FormSecaoTitulo>
          <Numero dados={dados} set={set} caminho={["prazo", "dias_uteis"]} label="Novo prazo (dias úteis)" />
        </section>
      )}
    </>
  );
}

const SECOES_ESPECIFICAS: Partial<Record<TipoDocumentoContratual, ComponentType<{ dados: Dados; set: Setter }>>> = {
  contrato: ContratoSecoes,
  tep: TepSecoes,
  uso_imagem: UsoImagemSecoes,
  aditivo: AditivoSecoes,
  // nda: só usa as seções comuns (contratante, testemunhas, assinatura).
};

export function DadosDocumentoForm({
  tipo,
  dados,
  onChange,
  camposFaltando,
}: {
  tipo: TipoDocumentoContratual;
  dados: Dados;
  onChange: (dados: Dados) => void;
  /** Os caminhos ("contratante.cnpj", "assinatura.dia"...) que a última
   *  recusa de "campos obrigatórios" apontou — ver `camposFaltandoDoErro`
   *  em `lib/api.ts`. Cada `<Texto>`/`<Numero>`/etc. nesse caminho ganha
   *  destaque; some assim que o campo é preenchido e reenviado. */
  camposFaltando?: string[];
}) {
  function set(caminho: Caminho, valor: unknown) {
    onChange(setPath(dados, caminho, valor));
  }

  const Especifica = SECOES_ESPECIFICAS[tipo];

  if (tipo === "outro") {
    return null;
  }

  return (
    <CamposFaltandoContext.Provider value={new Set(camposFaltando ?? [])}>
      <FormSecoes>
        <ContratanteSecao dados={dados} set={set} />
        {Especifica && <Especifica dados={dados} set={set} />}
        <TestemunhasSecao dados={dados} set={set} />
        <AssinaturaSecao dados={dados} set={set} />
      </FormSecoes>
    </CamposFaltandoContext.Provider>
  );
}
