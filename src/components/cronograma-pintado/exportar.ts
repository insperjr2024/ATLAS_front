/**
 * Export do cronograma em PNG e PDF (§6.4: "pronto para apresentações").
 *
 * Atenção: `html-to-image`, não `html2canvas`: o segundo reimplementa um
 * renderizador de CSS e engasga com `color-mix(in srgb, …)`, que este código
 * usa em vários lugares — aquelas células sairiam transparentes.
 * `html-to-image` serializa o DOM num `<foreignObject>` de SVG e deixa o
 * próprio navegador rasterizar: o que o navegador pinta, ele exporta.
 *
 * As duas bibliotecas entram por **import dinâmico**, dentro do handler de
 * clique. O Rollup emite um chunk separado e a primeira pintura da aba não
 * carrega os ~350 KB do jsPDF.
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

function nomeArquivo(projeto: string, extensao: string): string {
  const hoje = new Date().toISOString().slice(0, 10);
  return `cronograma-${slug(projeto)}-${hoje}.${extensao}`;
}

/**
 * A classe `exportando` solta o `max-height`/`overflow` do container e
 * des-stickifica a legenda: elementos sticky ou cortados pelo scroll saem na
 * posição rolada, não na real.
 */
async function comLayoutDeExport<T>(alvo: HTMLElement, acao: () => Promise<T>): Promise<T> {
  alvo.classList.add("exportando");
  try {
    return await acao();
  } finally {
    alvo.classList.remove("exportando");
  }
}

export async function exportarPNG(alvo: HTMLElement, nomeProjeto: string): Promise<void> {
  const { toPng } = await import("html-to-image");
  const dataUrl = await comLayoutDeExport(alvo, () => toPng(alvo, OPCOES));
  baixar(dataUrl, nomeArquivo(nomeProjeto, "png"));
}

export async function exportarPDF(alvo: HTMLElement, nomeProjeto: string): Promise<void> {
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

  pdf.save(nomeArquivo(nomeProjeto, "pdf"));
}

function baixar(dataUrl: string, nome: string): void {
  const link = document.createElement("a");
  link.download = nome;
  link.href = dataUrl;
  link.click();
}
