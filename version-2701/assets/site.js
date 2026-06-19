(function () {
  var header = document.querySelector('[data-header]');
  var mobileToggle = document.querySelector('[data-mobile-toggle]');
  var mobileNav = document.querySelector('[data-mobile-nav]');

  function onScroll() {
    if (!header) {
      return;
    }
    header.classList.toggle('is-scrolled', window.scrollY > 18);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (mobileToggle && mobileNav) {
    mobileToggle.addEventListener('click', function () {
      mobileNav.classList.toggle('is-open');
    });
  }

  document.querySelectorAll('[data-hero]').forEach(function (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var index = 0;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === index);
      });
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener('click', function () {
        show(dotIndex);
      });
    });

    if (slides.length > 1) {
      window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }
  });

  document.querySelectorAll('[data-filter-scope]').forEach(function (panel) {
    var section = panel.closest('section') || document;
    var input = panel.querySelector('[data-card-search]');
    var list = section.querySelector('[data-card-list]') || document.querySelector('[data-card-list]');

    function cards() {
      return list ? Array.prototype.slice.call(list.querySelectorAll('.movie-card')) : [];
    }

    function filterCards() {
      var keyword = input ? input.value.trim().toLowerCase() : '';
      cards().forEach(function (card) {
        var haystack = [
          card.getAttribute('data-title'),
          card.getAttribute('data-year'),
          card.getAttribute('data-region'),
          card.getAttribute('data-genre'),
          card.getAttribute('data-tags')
        ].join(' ').toLowerCase();
        card.classList.toggle('is-hidden', keyword && haystack.indexOf(keyword) === -1);
      });
    }

    if (input) {
      input.addEventListener('input', filterCards);
    }

    panel.querySelectorAll('[data-sort]').forEach(function (button) {
      button.addEventListener('click', function () {
        if (!list) {
          return;
        }
        var sortMode = button.getAttribute('data-sort');
        var sorted = cards().sort(function (a, b) {
          var yearA = parseInt(a.getAttribute('data-year'), 10) || 0;
          var yearB = parseInt(b.getAttribute('data-year'), 10) || 0;
          if (sortMode === 'year-desc') {
            return yearB - yearA;
          }
          return (yearB * 1000 + b.textContent.length) - (yearA * 1000 + a.textContent.length);
        });
        sorted.forEach(function (card) {
          list.appendChild(card);
        });
      });
    });

    var clearButton = panel.querySelector('[data-clear-search]');
    if (clearButton && input) {
      clearButton.addEventListener('click', function () {
        input.value = '';
        filterCards();
        input.focus();
      });
    }
  });

  document.querySelectorAll('[data-player-card]').forEach(function (card) {
    var video = card.querySelector('[data-hls-video]');
    var button = card.querySelector('[data-play-button]');

    if (!video || !button) {
      return;
    }

    function startPlayback() {
      var src = button.getAttribute('data-src') || (video.querySelector('source') || {}).src;
      button.classList.add('is-hidden');

      if (window.Hls && window.Hls.isSupported()) {
        var hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
          video.play().catch(function () {});
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
        video.play().catch(function () {});
      } else {
        video.src = src;
        video.play().catch(function () {});
      }
    }

    button.addEventListener('click', startPlayback);
  });
})();
