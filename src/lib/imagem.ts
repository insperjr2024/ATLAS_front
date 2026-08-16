/**
 * Redimensiona uma foto no PRÓPRIO NAVEGADOR antes do upload.
 *
 * O backend guarda a foto como data URI direto na coluna `usuario.foto`
 * (ver `atualizar_foto.py`), sem arquivo em disco — o limite de 2MB de lá só
 * segura o abuso; é aqui que uma foto de 4000x3000 vira ~200x200 ANTES de
 * sair da máquina da pessoa, senão cada avatar da equipe carregaria uma foto
 * de câmera inteira.
 */
export function redimensionarParaDataUri(
  arquivo: File,
  tamanho = 256,
  qualidade = 0.82,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    leitor.onload = () => {
      const imagem = new Image();
      imagem.onerror = () => reject(new Error("Arquivo não é uma imagem válida."));
      imagem.onload = () => {
        // Corte central quadrado: o círculo do avatar não sobra espaço para
        // uma foto retangular, e esticar deformaria o rosto da pessoa.
        const lado = Math.min(imagem.width, imagem.height);
        const origemX = (imagem.width - lado) / 2;
        const origemY = (imagem.height - lado) / 2;

        const canvas = document.createElement("canvas");
        canvas.width = tamanho;
        canvas.height = tamanho;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Não foi possível processar a imagem."));
          return;
        }
        ctx.drawImage(imagem, origemX, origemY, lado, lado, 0, 0, tamanho, tamanho);
        resolve(canvas.toDataURL("image/jpeg", qualidade));
      };
      imagem.src = leitor.result as string;
    };
    leitor.readAsDataURL(arquivo);
  });
}
