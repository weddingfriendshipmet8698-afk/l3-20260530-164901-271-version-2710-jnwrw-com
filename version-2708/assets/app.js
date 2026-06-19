(function () {
  var body = document.body;
  var menuButton = document.querySelector("[data-menu-toggle]");
  var menu = document.querySelector("[data-menu]");

  if (menuButton && menu) {
    menuButton.addEventListener("click", function () {
      body.classList.toggle("menu-open");
    });
  }

  var slides = Array.prototype.slice.call(document.querySelectorAll(".hero-slide"));
  var dots = Array.prototype.slice.call(document.querySelectorAll(".slider-dot"));
  var current = 0;

  function showSlide(index) {
    if (!slides.length) {
      return;
    }
    current = (index + slides.length) % slides.length;
    slides.forEach(function (slide, i) {
      slide.classList.toggle("active", i === current);
    });
    dots.forEach(function (dot, i) {
      dot.classList.toggle("active", i === current);
    });
  }

  dots.forEach(function (dot, index) {
    dot.addEventListener("click", function () {
      showSlide(index);
    });
  });

  if (slides.length > 1) {
    setInterval(function () {
      showSlide(current + 1);
    }, 5600);
  }

  var searchInputs = Array.prototype.slice.call(document.querySelectorAll("[data-search-input]"));
  var cards = Array.prototype.slice.call(document.querySelectorAll("[data-search]"));
  var empty = document.querySelector("[data-empty]");

  function applySearch(value) {
    var query = String(value || "").trim().toLowerCase();
    var visible = 0;

    cards.forEach(function (card) {
      var haystack = String(card.getAttribute("data-search") || "").toLowerCase();
      var matched = !query || haystack.indexOf(query) !== -1;
      card.style.display = matched ? "" : "none";
      if (matched) {
        visible += 1;
      }
    });

    if (empty) {
      empty.classList.toggle("show", visible === 0);
    }
  }

  searchInputs.forEach(function (input) {
    input.addEventListener("input", function () {
      applySearch(input.value);
    });
  });
})();

function startMoviePlayer(source) {
  var video = document.getElementById("moviePlayer");
  var overlay = document.getElementById("playOverlay");

  if (!video || !source) {
    return;
  }

  function prepare() {
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = source;
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      var hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hls.loadSource(source);
      hls.attachMedia(video);
      return;
    }

    video.src = source;
  }

  function playNow() {
    if (overlay) {
      overlay.classList.add("hidden");
    }
    var result = video.play();
    if (result && typeof result.catch === "function") {
      result.catch(function () {});
    }
  }

  prepare();

  if (overlay) {
    overlay.addEventListener("click", playNow);
  }

  video.addEventListener("click", function () {
    if (video.paused) {
      playNow();
    }
  });

  video.addEventListener("play", function () {
    if (overlay) {
      overlay.classList.add("hidden");
    }
  });
}
