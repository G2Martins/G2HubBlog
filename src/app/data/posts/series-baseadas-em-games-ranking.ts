import type { Post } from "../types";

export const post: Post = {
  slug: "series-baseadas-em-games-ranking",
  title: "As 6 melhores séries baseadas em games, segundo a redação",
  dek: "De Arcane a Twisted Metal, ranqueamos as adaptações de videogame para a TV que realmente valem a maratona. Opinião da casa, dados do TMDB.",
  section: "series",
  kind: "lista",
  tags: ["Adaptação", "Netflix", "HBO", "Prime Video", "Animação"],
  date: "2026-11-01",
  hero: { ref: "tv:100088", pick: 0, alt: "Joel e Ellie em cena de The Last of Us" },
  body: [
    { p: "Por muito tempo, “adaptação de game” foi um alerta. A TV mudou isso. Com mais tempo para desenvolver personagens, as séries conseguiram o que o cinema raramente alcançava: respeitar o material original e funcionar para quem nunca encostou no controle. Este é o nosso ranking, puramente opinativo." },
    { entry: "tv:94605", title: "Arcane", text: [
      "Animação de nível cinematográfico, uma história fechada em duas temporadas e personagens que você não esquece. Não precisa conhecer *League of Legends*. Leia a nossa [review completa](/artigo/review-arcane-a-melhor-adaptacao-de-game).",
    ] },
    { entry: "tv:100088", title: "The Last of Us", text: [
      "Craig Mazin e Neil Druckmann, cocriador do jogo, levaram a jornada de Joel e Ellie para a HBO com Pedro Pascal e Bella Ramsey. A primeira temporada é uma das melhores estreias de drama da década, e o terceiro episódio virou referência por si só.",
    ] },
    { entry: "tv:106379", title: "Fallout", text: [
      "Humor ácido, violência estilizada e um entendimento raro do tom dos jogos. Walton Goggins como o Ghoul é o tipo de escalação que define uma série. Veja o nosso [guia para ir da série aos jogos](/artigo/fallout-do-jogo-a-serie-guia).",
    ] },
    { entry: "tv:71024", title: "Castlevania", text: [
      "A série de Warren Ellis provou que a Netflix podia fazer animação adulta de fantasia sombria. São quatro temporadas com Trevor Belmont, Sypha e Alucard, e uma derivada, *Castlevania: Noturno*.",
    ] },
    { entry: "tv:105248", title: "Cyberpunk: Mercenários", text: [
      "O Studio Trigger transformou Night City em uma tragédia curta e intensa sobre David Martinez. A primeira temporada, de 2022, é perfeita do começo ao fim, e a série ganhou uma segunda temporada que terminou em outubro de 2026, segundo o TMDB.",
    ] },
    { entry: "tv:133748", title: "Twisted Metal", text: [
      "A menos séria da lista e, por isso mesmo, divertida. Anthony Mackie é um entregador em uma América pós-apocalíptica, e o palhaço Sweet Tooth rouba todas as cenas. Duas temporadas no Peacock.",
    ] },
    { box: "Ficaram de fora séries baseadas em livros que também viraram jogos, como The Witcher. O critério é ter o game como fonte principal.", title: "Critério" },
  ],
};
