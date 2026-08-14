/**
 * Export do cronograma em PDF ou imagem ("pronto para apresentações").
 *
 * A rasterização é sempre por `toPng`, o PDF só embute essa imagem numa
 * página; a saída em PNG é o mesmo dataUrl baixado direto, sem o jsPDF.
 *
 * Atenção: `html-to-image`, não `html2canvas`: o segundo reimplementa um
 * renderizador de CSS e engasga com `color-mix(in srgb, …)`, que este código
 * usa em vários lugares, aquelas células sairiam transparentes.
 * `html-to-image` serializa o DOM num `<foreignObject>` de SVG e deixa o
 * próprio navegador rasterizar: o que o navegador pinta, ele exporta.
 *
 * As bibliotecas entram por **import dinâmico**, dentro do handler de
 * clique. O Rollup emite um chunk separado e a primeira pintura da aba não
 * carrega os ~350 KB do jsPDF (nem sequer para quem só exporta PNG).
 */

const OPCOES = { pixelRatio: 2, backgroundColor: "#ffffff", cacheBust: true } as const;

function slug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function nomeArquivo(projeto: string, extensao: string, prefixo = "cronograma"): string {
  const hoje = new Date().toISOString().slice(0, 10);
  return `${prefixo}-${slug(projeto)}-${hoje}.${extensao}`;
}

/**
 * A classe `exportando` solta o `max-height`/`overflow` do container e
 * des-stickifica a legenda: elementos sticky ou cortados pelo scroll saem na
 * posição rolada, não na real.
 */
async function comLayoutDeExport<T>(alvo: HTMLElement, acao: () => Promise<T>): Promise<T> {
  alvo.classList.add("exportando");
  try {
    // As fontes precisam estar prontas antes de rasterizar: com elas ainda
    // carregando, o texto sai deslocado ou simplesmente não sai.
    if (document.fonts?.ready) await document.fonts.ready;
    return await acao();
  } finally {
    alvo.classList.remove("exportando");
  }
}

export async function exportarPNG(
  alvo: HTMLElement,
  nomeProjeto: string,
  prefixoArquivo = "cronograma",
): Promise<void> {
  const { toPng } = await import("html-to-image");
  const dataUrl = await comLayoutDeExport(alvo, () => toPng(alvo, OPCOES));

  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = nomeArquivo(nomeProjeto, "png", prefixoArquivo);
  link.click();
}

export async function exportarPDF(
  alvo: HTMLElement,
  nomeProjeto: string,
  /** Prefixo do arquivo. O relatório de desempenho reusa esta função e precisa
   *  sair como "relatorio-desempenho-…", não como "cronograma-…". */
  prefixoArquivo = "cronograma",
): Promise<void> {
  const [{ toPng }, { jsPDF }] = await Promise.all([
    import("html-to-image"),
    import("jspdf"),
  ]);
  const dataUrl = await comLayoutDeExport(alvo, () => toPng(alvo, OPCOES));

  const imagem = new Image();
  imagem.src = dataUrl;
  await new Promise((resolve) => {
    imagem.onload = resolve;
  });

  const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
  const larguraPagina = pdf.internal.pageSize.getWidth();
  const alturaPagina = pdf.internal.pageSize.getHeight();
  const margem = 24;
  const largura = larguraPagina - margem * 2;
  const altura = (imagem.height / imagem.width) * largura;

  if (altura <= alturaPagina - margem * 2) {
    pdf.addImage(dataUrl, "PNG", margem, margem, largura, altura);
  } else {
    // Mais alto que uma página: fatia por altura em vez de encolher até
    // ficar ilegível.
    const alturaUtil = alturaPagina - margem * 2;
    let deslocamento = 0;
    while (deslocamento < altura) {
      if (deslocamento > 0) pdf.addPage();
      pdf.addImage(dataUrl, "PNG", margem, margem - deslocamento, largura, altura);
      deslocamento += alturaUtil;
    }
  }

  pdf.save(nomeArquivo(nomeProjeto, "pdf", prefixoArquivo));
}
