(function () {
  "use strict";

  const form = document.querySelector(".filtro form");
  const busca = document.getElementById("busca");
  const categoria = document.getElementById("categoria");
  const tecnologia = document.getElementById("tecnologia");
  const cards = Array.from(document.querySelectorAll("#cursos-lista .projeto"));
  const semResultados = document.getElementById("sem-resultados");

  if (!form || !cards.length) {
    return;
  }

  const TAGS_DE_CATEGORIA = ["tecnico", "tecnologo", "bacharelado", "licenciatura"];

  function normalizar(texto) {
    return (texto || "")
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function tagsDoCard(card) {
    return Array.from(card.querySelectorAll(".projeto-tags li")).map(function (tag) {
      return {
        texto: tag.textContent.trim(),
        chave: normalizar(tag.textContent),
      };
    });
  }

  const tagsDosCards = new Map();
  const textoDeBuscaDosCards = new Map();
  const categorias = new Map();
  const tecnologias = new Map();

  cards.forEach(function (card) {
    const tags = tagsDoCard(card);
    tagsDosCards.set(card, tags);

    const textosAlternativos = Array.from(card.querySelectorAll("img[alt]")).map(function (img) {
      return img.alt;
    });

    textoDeBuscaDosCards.set(
      card,
      normalizar(
        [card.textContent, card.dataset.termos || ""]
          .concat(textosAlternativos)
          .join(" ")
      )
    );

    tags.forEach(function (tag) {
      if (!tag.chave) {
        return;
      }

      if (TAGS_DE_CATEGORIA.indexOf(tag.chave) !== -1) {
        categorias.set(tag.chave, tag.texto);
      } else {
        tecnologias.set(tag.chave, tag.texto);
      }
    });
  });

  function preencherSelect(select, opcoes) {
    select.innerHTML = "";

    const todas = document.createElement("option");
    todas.value = "";
    todas.textContent = "Todas";
    select.appendChild(todas);

    Array.from(opcoes.entries())
      .sort(function (a, b) {
        return a[1].localeCompare(b[1], "pt-BR");
      })
      .forEach(function (entrada) {
        const option = document.createElement("option");
        option.value = entrada[0];
        option.textContent = entrada[1];
        select.appendChild(option);
      });
  }

  preencherSelect(categoria, categorias);
  preencherSelect(tecnologia, tecnologias);

  function cardCombina(card, termo, categoriaSelecionada, tecnologiaSelecionada) {
    const tags = tagsDosCards.get(card);
    const chaves = tags.map(function (tag) {
      return tag.chave;
    });

    const combinaBusca =
      !termo || textoDeBuscaDosCards.get(card).indexOf(termo) !== -1;

    const combinaCategoria =
      !categoriaSelecionada || chaves.indexOf(categoriaSelecionada) !== -1;

    const combinaTecnologia =
      !tecnologiaSelecionada || chaves.indexOf(tecnologiaSelecionada) !== -1;

    return combinaBusca && combinaCategoria && combinaTecnologia;
  }

  function aplicarFiltros() {
    const termo = normalizar(busca.value);
    const categoriaSelecionada = normalizar(categoria.value);
    const tecnologiaSelecionada = normalizar(tecnologia.value);
    let visiveis = 0;

    cards.forEach(function (card) {
      const visivel = cardCombina(
        card,
        termo,
        categoriaSelecionada,
        tecnologiaSelecionada
      );

      card.hidden = !visivel;

      if (visivel) {
        visiveis++;
      }
    });

    if (semResultados) {
      semResultados.hidden = visiveis > 0;
    }
  }

  function sincronizarUrl() {
    if (location.protocol === "file:") {
      return;
    }

    const params = new URLSearchParams();

    if (busca.value.trim()) {
      params.set("busca", busca.value.trim());
    }
    if (categoria.value) {
      params.set("categoria", categoria.value);
    }
    if (tecnologia.value) {
      params.set("tecnologia", tecnologia.value);
    }

    const query = params.toString();

    try {
      history.replaceState(null, "", query ? "?" + query : location.pathname);
    } catch (erro) {
      /* Alguns navegadores bloqueiam alterar a URL em arquivos locais. */
    }
  }

  function carregarDaUrl() {
    const params = new URLSearchParams(location.search);
    busca.value = params.get("busca") || "";
    categoria.value = params.get("categoria") || "";
    tecnologia.value = params.get("tecnologia") || "";
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    aplicarFiltros();
    sincronizarUrl();
  });

  carregarDaUrl();
  aplicarFiltros();
})();
