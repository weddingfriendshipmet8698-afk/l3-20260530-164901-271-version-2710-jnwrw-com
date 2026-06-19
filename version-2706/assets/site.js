(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
      return;
    }
    document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    var menuButton = document.querySelector(".menu-toggle");
    var mobileNav = document.querySelector(".mobile-nav");

    if (menuButton && mobileNav) {
      menuButton.addEventListener("click", function () {
        var isOpen = mobileNav.hasAttribute("hidden");
        if (isOpen) {
          mobileNav.removeAttribute("hidden");
        } else {
          mobileNav.setAttribute("hidden", "");
        }
        menuButton.setAttribute("aria-expanded", String(isOpen));
      });
    }

    setupHero();
    setupGlobalSearch();
    setupFilters();
    setupPlayers();
  });

  function setupHero() {
    var slider = document.querySelector(".hero-slider");
    if (!slider) {
      return;
    }

    var slides = Array.prototype.slice.call(slider.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(slider.querySelectorAll(".hero-dot"));
    var prev = slider.querySelector("[data-hero-prev]");
    var next = slider.querySelector("[data-hero-next]");
    var current = 0;
    var timer = null;

    function show(index) {
      if (!slides.length) {
        return;
      }
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("active", i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("active", i === current);
        dot.setAttribute("aria-current", i === current ? "true" : "false");
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5000);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        show(index);
        start();
      });
    });

    if (prev) {
      prev.addEventListener("click", function () {
        show(current - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(current + 1);
        start();
      });
    }

    slider.addEventListener("mouseenter", stop);
    slider.addEventListener("mouseleave", start);
    show(0);
    start();
  }

  function setupGlobalSearch() {
    var boxes = Array.prototype.slice.call(document.querySelectorAll("[data-global-search]"));
    if (!boxes.length || !window.MOVIE_INDEX) {
      return;
    }

    boxes.forEach(function (box) {
      var input = box.querySelector("input");
      var results = box.querySelector(".search-results");
      if (!input || !results) {
        return;
      }

      input.addEventListener("input", function () {
        var query = normalize(input.value);
        results.innerHTML = "";

        if (!query) {
          return;
        }

        var matched = window.MOVIE_INDEX.filter(function (item) {
          return normalize(item.title + " " + item.year + " " + item.region + " " + item.genre + " " + item.category + " " + item.tags).indexOf(query) !== -1;
        }).slice(0, 12);

        matched.forEach(function (item) {
          var link = document.createElement("a");
          link.className = "search-result";
          link.href = "./" + item.file;
          link.innerHTML =
            '<img src="' + escapeHtml(item.cover) + '" alt="' + escapeHtml(item.title) + '" loading="lazy">' +
            "<span>" +
            "<strong>" + escapeHtml(item.title) + "</strong>" +
            "<em>★ " + escapeHtml(item.rating) + " · " + escapeHtml(item.year) + " · " + escapeHtml(item.category) + "</em>" +
            "</span>";
          results.appendChild(link);
        });

        if (!matched.length) {
          var empty = document.createElement("div");
          empty.className = "search-result";
          empty.innerHTML = "<span><strong>未找到匹配内容</strong><em>请尝试更换关键词</em></span>";
          results.appendChild(empty);
        }
      });
    });
  }

  function setupFilters() {
    var wraps = Array.prototype.slice.call(document.querySelectorAll("[data-filter-scope]"));
    wraps.forEach(function (wrap) {
      var input = wrap.querySelector("[data-filter-text]");
      var year = wrap.querySelector("[data-filter-year]");
      var chips = Array.prototype.slice.call(wrap.querySelectorAll("[data-filter-genre]"));
      var cards = Array.prototype.slice.call(document.querySelectorAll(".filter-card"));
      var empty = document.querySelector(".empty-state");
      var activeGenre = "";

      function apply() {
        var query = normalize(input ? input.value : "");
        var selectedYear = year ? year.value : "";
        var shown = 0;

        cards.forEach(function (card) {
          var text = normalize(card.getAttribute("data-search") || "");
          var cardYear = card.getAttribute("data-year") || "";
          var cardGenre = normalize((card.getAttribute("data-genre") || "") + " " + (card.getAttribute("data-tags") || ""));
          var ok = true;

          if (query && text.indexOf(query) === -1) {
            ok = false;
          }

          if (selectedYear && cardYear !== selectedYear) {
            ok = false;
          }

          if (activeGenre && cardGenre.indexOf(normalize(activeGenre)) === -1) {
            ok = false;
          }

          card.style.display = ok ? "" : "none";
          if (ok) {
            shown += 1;
          }
        });

        if (empty) {
          empty.classList.toggle("show", shown === 0);
        }
      }

      if (input) {
        input.addEventListener("input", apply);
      }

      if (year) {
        year.addEventListener("change", apply);
      }

      chips.forEach(function (chip) {
        chip.addEventListener("click", function () {
          activeGenre = chip.getAttribute("data-filter-genre") || "";
          chips.forEach(function (item) {
            item.classList.toggle("active", item === chip);
          });
          apply();
        });
      });

      apply();
    });
  }

  function setupPlayers() {
    var boxes = Array.prototype.slice.call(document.querySelectorAll(".player-shell"));
    boxes.forEach(function (box) {
      var video = box.querySelector("video");
      var overlay = box.querySelector(".player-overlay");
      var playButton = box.querySelector(".big-play");
      var loading = box.querySelector(".player-loading");
      var error = box.querySelector(".player-error");
      var src = box.getAttribute("data-video-src");
      var hls = null;
      var initialized = false;

      function setHidden(el, hidden) {
        if (!el) {
          return;
        }
        if (hidden) {
          el.setAttribute("hidden", "");
        } else {
          el.removeAttribute("hidden");
        }
      }

      function showError(message) {
        setHidden(loading, true);
        setHidden(error, false);
        if (error) {
          error.innerHTML = "<span>" + escapeHtml(message) + "</span>";
        }
      }

      function playVideo() {
        if (!video) {
          return;
        }
        var attempt = video.play();
        if (attempt && typeof attempt.catch === "function") {
          attempt.catch(function () {});
        }
      }

      function init() {
        if (!video || !src) {
          showError("视频暂时无法播放");
          return;
        }

        if (initialized) {
          playVideo();
          return;
        }

        initialized = true;
        setHidden(overlay, true);
        setHidden(error, true);
        setHidden(loading, false);

        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = src;
          video.addEventListener("loadedmetadata", function () {
            setHidden(loading, true);
            playVideo();
          }, { once: true });
          video.addEventListener("error", function () {
            showError("视频加载失败，请刷新后重试");
          }, { once: true });
          return;
        }

        if (window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hls.loadSource(src);
          hls.attachMedia(video);
          hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
            setHidden(loading, true);
            playVideo();
          });
          hls.on(window.Hls.Events.ERROR, function (event, data) {
            if (data && data.fatal) {
              showError("视频加载失败，请刷新后重试");
              if (hls) {
                hls.destroy();
                hls = null;
              }
            }
          });
          return;
        }

        showError("当前浏览器无法播放此视频");
      }

      if (playButton) {
        playButton.addEventListener("click", function (event) {
          event.preventDefault();
          init();
        });
      }

      if (overlay) {
        overlay.addEventListener("click", function (event) {
          event.preventDefault();
          init();
        });
      }
    });
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
