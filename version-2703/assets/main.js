(function () {
  const toggle = document.querySelector("[data-menu-toggle]");
  const nav = document.querySelector("[data-site-nav]");

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      nav.classList.toggle("open");
    });
  }

  document.querySelectorAll("img").forEach(function (img) {
    img.addEventListener("error", function () {
      img.classList.add("is-missing");
    });
  });

  const slides = Array.from(document.querySelectorAll("[data-hero-slide]"));
  const dots = Array.from(document.querySelectorAll("[data-hero-dot]"));
  const prev = document.querySelector("[data-hero-prev]");
  const next = document.querySelector("[data-hero-next]");
  let activeSlide = 0;
  let heroTimer = null;

  function showSlide(index) {
    if (!slides.length) {
      return;
    }

    activeSlide = (index + slides.length) % slides.length;

    slides.forEach(function (slide, slideIndex) {
      slide.classList.toggle("active", slideIndex === activeSlide);
    });

    dots.forEach(function (dot, dotIndex) {
      dot.classList.toggle("active", dotIndex === activeSlide);
    });
  }

  function startHeroTimer() {
    if (heroTimer || slides.length < 2) {
      return;
    }

    heroTimer = window.setInterval(function () {
      showSlide(activeSlide + 1);
    }, 6200);
  }

  function resetHeroTimer() {
    if (heroTimer) {
      window.clearInterval(heroTimer);
      heroTimer = null;
    }

    startHeroTimer();
  }

  if (slides.length) {
    showSlide(0);
    startHeroTimer();

    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        showSlide(index);
        resetHeroTimer();
      });
    });

    if (prev) {
      prev.addEventListener("click", function () {
        showSlide(activeSlide - 1);
        resetHeroTimer();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        showSlide(activeSlide + 1);
        resetHeroTimer();
      });
    }
  }

  const grid = document.querySelector("[data-movie-grid]");
  const cards = grid ? Array.from(grid.querySelectorAll("[data-movie-card]")) : [];
  const searchInput = document.querySelector("[data-filter-search]");
  const yearSelect = document.querySelector("[data-filter-year]");
  const regionSelect = document.querySelector("[data-filter-region]");
  const typeSelect = document.querySelector("[data-filter-type]");
  const sortSelect = document.querySelector("[data-filter-sort]");
  const countEl = document.querySelector("[data-filter-count]");
  const emptyEl = document.querySelector("[data-filter-empty]");

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function getYearValue(card) {
    const raw = card.dataset.year || "";
    const match = raw.match(/\d{4}/);
    return match ? Number(match[0]) : 0;
  }

  function applyFilters() {
    if (!grid || !cards.length) {
      return;
    }

    const query = normalize(searchInput ? searchInput.value : "");
    const year = yearSelect ? yearSelect.value : "";
    const region = regionSelect ? regionSelect.value : "";
    const type = typeSelect ? typeSelect.value : "";
    const sort = sortSelect ? sortSelect.value : "default";

    let visible = cards.filter(function (card) {
      const haystack = normalize([
        card.dataset.title,
        card.dataset.year,
        card.dataset.region,
        card.dataset.type,
        card.dataset.genre,
        card.dataset.category,
        card.textContent
      ].join(" "));

      const queryMatch = !query || haystack.includes(query);
      const yearMatch = !year || card.dataset.year === year;
      const regionMatch = !region || card.dataset.region === region;
      const typeMatch = !type || card.dataset.type === type;

      return queryMatch && yearMatch && regionMatch && typeMatch;
    });

    let ordered = visible.slice();

    if (sort === "year-desc") {
      ordered.sort(function (a, b) {
        return getYearValue(b) - getYearValue(a);
      });
    } else if (sort === "year-asc") {
      ordered.sort(function (a, b) {
        return getYearValue(a) - getYearValue(b);
      });
    } else if (sort === "title-asc") {
      ordered.sort(function (a, b) {
        return (a.dataset.title || "").localeCompare(b.dataset.title || "", "zh-Hans-CN");
      });
    } else {
      ordered.sort(function (a, b) {
        return cards.indexOf(a) - cards.indexOf(b);
      });
    }

    cards.forEach(function (card) {
      card.hidden = true;
    });

    ordered.forEach(function (card) {
      card.hidden = false;
      grid.appendChild(card);
    });

    if (countEl) {
      countEl.textContent = "已显示 " + ordered.length + " 部影片";
    }

    if (emptyEl) {
      emptyEl.hidden = ordered.length !== 0;
    }
  }

  [searchInput, yearSelect, regionSelect, typeSelect, sortSelect].forEach(function (control) {
    if (control) {
      control.addEventListener("input", applyFilters);
      control.addEventListener("change", applyFilters);
    }
  });

  if (searchInput) {
    const params = new URLSearchParams(window.location.search);
    const keyword = params.get("q");

    if (keyword) {
      searchInput.value = keyword;
    }
  }

  applyFilters();

  const player = document.querySelector("[data-player]");
  const playButton = document.querySelector("[data-play-button]");
  const playerError = document.querySelector("[data-player-error]");
  let hlsInstance = null;
  let playerReady = false;

  function showPlayerError(message) {
    if (playerError) {
      playerError.textContent = message;
      playerError.hidden = false;
    }
  }

  function setupPlayer() {
    if (!player || playerReady) {
      return;
    }

    const source = player.dataset.src;

    if (!source) {
      showPlayerError("视频暂时无法加载。");
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      hlsInstance = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });

      hlsInstance.loadSource(source);
      hlsInstance.attachMedia(player);

      hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
        if (data && data.fatal) {
          showPlayerError("视频加载遇到问题，请稍后再试。");
        }
      });

      playerReady = true;
      return;
    }

    if (player.canPlayType("application/vnd.apple.mpegurl")) {
      player.src = source;
      playerReady = true;
      return;
    }

    showPlayerError("当前浏览器暂不支持该视频格式。");
  }

  function startPlayback() {
    if (!player) {
      return;
    }

    setupPlayer();

    const promise = player.play();

    if (promise && typeof promise.then === "function") {
      promise
        .then(function () {
          if (playButton) {
            playButton.hidden = true;
          }
        })
        .catch(function () {
          showPlayerError("请再次点击播放按钮开始播放。");
        });
    } else if (playButton) {
      playButton.hidden = true;
    }
  }

  if (playButton) {
    playButton.addEventListener("click", function (event) {
      event.preventDefault();
      startPlayback();
    });
  }

  if (player) {
    player.addEventListener("play", function () {
      if (playButton) {
        playButton.hidden = true;
      }
    });

    player.addEventListener("click", function () {
      if (player.paused) {
        startPlayback();
      }
    });

    window.addEventListener("beforeunload", function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  }
})();
