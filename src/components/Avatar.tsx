/** O conteúdo de um círculo de avatar quando a pessoa tem foto.
 *
 *  Não é o círculo em si — cada tela já tem o próprio (tamanho, cor de
 *  fundo: `CoordAvatar`, `EquipeAvatar`, `Iniciais`, `PessoaIniciais`,
 *  `Avatar` do Meu Perfil). Isto só substitui as iniciais pela imagem
 *  quando ela existe, preenchendo o círculo do pai via `borderRadius:
 *  inherit`. */
export function FotoCircular({ src }: { src: string }) {
  return (
    <img
      src={src}
      alt=""
      style={{
        width: "100%",
        height: "100%",
        borderRadius: "inherit",
        objectFit: "cover",
        display: "block",
      }}
    />
  );
}
