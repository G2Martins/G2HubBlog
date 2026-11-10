import type { Post } from "../types";

export const post: Post = {
  slug: "fallout-do-jogo-a-serie-guia",
  title: "Guia Fallout: da série do Prime Video aos jogos, por onde começar",
  dek: "Terminou a série e quer explorar o deserto nuclear no controle? Explicamos o que cada jogo moderno oferece e qual combina com você.",
  section: "series",
  kind: "guia",
  tags: ["Fallout", "Prime Video", "Bethesda", "RPG", "Adaptação"],
  date: "2026-10-26",
  hero: { ref: "tv:106379", pick: 0, alt: "Lucy MacLean em cena da série Fallout" },
  body: [
    { p: "A série *Fallout*, do Prime Video, fez muita gente que nunca tinha jogado se interessar pelo universo pós-apocalíptico da Bethesda. Com duas temporadas lançadas, a segunda encerrada em fevereiro de 2026, é um bom momento para responder a pergunta que mais recebemos: qual jogo jogar primeiro?" },
    { ficha: "tv:106379" },
    { h2: "O que a série conta" },
    { p: "A protagonista é Lucy MacLean, vivida por Ella Purnell, que deixa a segurança de um Refúgio subterrâneo para procurar o pai, o Supervisor Hank MacLean, interpretado por Kyle MacLachlan. No caminho cruza com Maximus, de Aaron Moten, e com o Ghoul, personagem de Walton Goggins que também aparece em flashbacks como Cooper Howard, antes das bombas. A primeira temporada termina apontando para New Vegas, um nome que os fãs dos jogos reconhecem na hora." },
    { p: "A série não adapta um jogo específico. Ela conta uma história nova dentro do mesmo mundo, o que permite começar pelos jogos em qualquer ordem." },
    { h2: "Os jogos modernos" },
    { entry: "game:9630", title: "Fallout 4", text: [
      "O mais acessível. Tiro mais fluido, construção de assentamentos e uma Boston pós-apocalíptica enorme. Ganhou versões de PS5 e Xbox Series em abril de 2024, o que facilita jogar hoje. **Comece por aqui se quiser ação.**",
    ] },
    { entry: "game:16", title: "Fallout: New Vegas", text: [
      "Feito pela Obsidian, é o favorito de muitos fãs pelo texto, pelas facções e pelas escolhas com consequência. A parte técnica envelheceu, mas a escrita não. **Comece por aqui se quiser história.**",
    ] },
    { entry: "game:15", title: "Fallout 3", text: [
      "O jogo que levou a série para o 3D em primeira pessoa, em uma Washington destruída. Clima melancólico e exploração marcante. Ótimo para quem gosta de descobrir o mundo sem pressa.",
    ] },
    { entry: "game:103020", title: "Fallout 76", text: [
      "O Fallout online, com outros jogadores no mesmo mapa da Virgínia Ocidental. Começou mal em 2018, mas recebeu muitas atualizações e hoje é uma opção para quem quer jogar com amigos.",
    ] },
    { img: "game:16", pick: 1, caption: "Fallout: New Vegas, de 2010, voltou ao centro das atenções por causa da série. Imagem de divulgação." },
    { h2: "Nossa recomendação" },
    { list: [
      "**Nunca jogou um RPG de mundo aberto:** *Fallout 4*.",
      "**Gostou mais dos diálogos e das facções da série:** *Fallout: New Vegas*.",
      "**Quer jogar com alguém:** *Fallout 76*.",
    ] },
    { box: "Os jogos têm classificação indicativa de 16 ou 18 anos, conforme o IGDB. A série tem classificação de 18 anos no Brasil, segundo o TMDB.", title: "Classificação" },
    { p: "Outras séries que acertaram ao adaptar games estão no nosso [ranking](/artigo/series-baseadas-em-games-ranking)." },
  ],
};
