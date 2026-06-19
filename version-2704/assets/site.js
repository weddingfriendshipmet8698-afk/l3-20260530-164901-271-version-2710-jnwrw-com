(function () {
  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  ready(function () {
    setupMobileNavigation();
    setupHeroSlider();
    setupPageFiltering();
    setupGlobalSearch();
    setupPlayers();
    setupImageFallbacks();
  });

  function setupMobileNavigation() {
    var toggle = document.querySelector('[data-mobile-toggle]');
    var nav = document.querySelector('[data-site-nav]');

    if (!toggle || !nav) {
      return;
    }

    toggle.addEventListener('click', function () {
      nav.classList.toggle('open');
    });
  }

  function setupHeroSlider() {
    var slides = Array.prototype.slice.call(document.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(document.querySelectorAll('[data-hero-dot]'));
    var prev = document.querySelector('[data-hero-prev]');
    var next = document.querySelector('[data-hero-next]');
    var current = 0;
    var timer = null;

    if (!slides.length) {
      return;
    }

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('active', dotIndex === current);
      });
    }

    function restart() {
      if (timer) {
        window.clearInterval(timer);
      }
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        show(index);
        restart();
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        show(current - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(current + 1);
        restart();
      });
    }

    show(0);
    restart();
  }

  function setupPageFiltering() {
    var roots = Array.prototype.slice.call(document.querySelectorAll('[data-filter-root]'));

    roots.forEach(function (root) {
      var input = root.querySelector('[data-page-filter]');
      var list = document.querySelector('[data-card-list]');
      var yearButtons = Array.prototype.slice.call(root.querySelectorAll('[data-filter-year]'));
      var activeYear = 'all';

      if (!list) {
        return;
      }

      function filterCards() {
        var query = input ? input.value.trim().toLowerCase() : '';
        var cards = Array.prototype.slice.call(list.querySelectorAll('.movie-card'));

        cards.forEach(function (card) {
          var haystack = [
            card.dataset.title,
            card.dataset.year,
            card.dataset.region,
            card.dataset.genre,
            card.dataset.tags
          ].join(' ').toLowerCase();
          var matchesQuery = !query || haystack.indexOf(query) !== -1;
          var matchesYear = activeYear === 'all' || card.dataset.year === activeYear;
          card.classList.toggle('hidden-card', !(matchesQuery && matchesYear));
        });
      }

      if (input) {
        input.addEventListener('input', filterCards);
      }

      yearButtons.forEach(function (button) {
        button.addEventListener('click', function () {
          activeYear = button.dataset.filterYear || 'all';
          yearButtons.forEach(function (item) {
            item.classList.toggle('active', item === button);
          });
          filterCards();
        });
      });
    });
  }

  function setupGlobalSearch() {
    var input = document.getElementById('globalSearchInput');
    var button = document.getElementById('globalSearchButton');
    var results = document.getElementById('globalSearchResults');
    var meta = document.getElementById('globalSearchMeta');
    var movies = window.SITE_MOVIES || [];

    if (!input || !button || !results || !meta || !movies.length) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var initialQuery = params.get('q') || '';
    input.value = initialQuery;

    function renderCard(movie) {
      var tags = (movie.tags || []).slice(0, 4).map(function (tag) {
        return '<span>' + escapeHtml(tag) + '</span>';
      }).join('');

      return '' +
        '<article class="movie-card">' +
        '  <a class="poster-media" href="' + escapeHtml(movie.detail) + '">' +
        '    <img src="' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">' +
        '    <span class="poster-gradient"></span>' +
        '    <span class="rating-badge">' + escapeHtml(movie.rating) + '</span>' +
        '    <span class="play-chip">播放</span>' +
        '  </a>' +
        '  <div class="movie-card-body">' +
        '    <h3><a href="' + escapeHtml(movie.detail) + '">' + escapeHtml(movie.title) + '</a></h3>' +
        '    <p class="movie-meta">' + escapeHtml(movie.year) + ' · ' + escapeHtml(movie.region) + ' · ' + escapeHtml(movie.type) + '</p>' +
        '    <p class="movie-desc">' + escapeHtml(movie.oneLine) + '</p>' +
        '    <div class="tag-row">' + tags + '</div>' +
        '  </div>' +
        '</article>';
    }

    function doSearch() {
      var query = input.value.trim().toLowerCase();

      if (!query) {
        results.innerHTML = '';
        meta.textContent = '请输入关键词开始搜索。';
        return;
      }

      var words = query.split(/\s+/).filter(Boolean);
      var matched = movies.filter(function (movie) {
        var haystack = [
          movie.title,
          movie.year,
          movie.region,
          movie.type,
          movie.genre,
          (movie.tags || []).join(' '),
          movie.oneLine
        ].join(' ').toLowerCase();

        return words.every(function (word) {
          return haystack.indexOf(word) !== -1;
        });
      }).slice(0, 120);

      meta.textContent = '找到 ' + matched.length + ' 条结果，最多显示前 120 条。';
      results.innerHTML = matched.map(renderCard).join('');
      setupImageFallbacks();
    }

    button.addEventListener('click', doSearch);
    input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        doSearch();
      }
    });

    if (initialQuery) {
      doSearch();
    }
  }

  function setupPlayers() {
    var frames = Array.prototype.slice.call(document.querySelectorAll('.video-frame'));

    frames.forEach(function (frame) {
      var video = frame.querySelector('.movie-player');
      var button = frame.querySelector('[data-player-play]');
      var message = frame.querySelector('[data-player-message]');
      var loaded = false;

      if (!video) {
        return;
      }

      function setMessage(text) {
        if (message) {
          message.textContent = text || '';
        }
      }

      function loadVideo() {
        if (loaded) {
          return Promise.resolve();
        }

        var source = video.dataset.src;
        loaded = true;

        if (!source) {
          setMessage('暂无可用播放源。');
          return Promise.reject(new Error('missing source'));
        }

        if (window.Hls && window.Hls.isSupported()) {
          var hls = new window.Hls();
          hls.loadSource(source);
          hls.attachMedia(video);
          hls.on(window.Hls.Events.ERROR, function (_, data) {
            if (data && data.fatal) {
              setMessage('视频加载失败，请刷新页面重试。');
            }
          });
          frame._hls = hls;
          return Promise.resolve();
        }

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = source;
          return Promise.resolve();
        }

        setMessage('当前浏览器不支持 HLS 播放。');
        return Promise.reject(new Error('hls unsupported'));
      }

      function playVideo() {
        loadVideo().then(function () {
          return video.play();
        }).then(function () {
          frame.classList.add('playing');
          setMessage('');
        }).catch(function () {
          if (!message || !message.textContent) {
            setMessage('点击播放失败，请再次尝试或更换浏览器。');
          }
        });
      }

      if (button) {
        button.addEventListener('click', playVideo);
      }

      video.addEventListener('play', function () {
        frame.classList.add('playing');
      });

      video.addEventListener('pause', function () {
        frame.classList.remove('playing');
      });

      video.addEventListener('click', function () {
        if (video.paused) {
          playVideo();
        } else {
          video.pause();
        }
      });
    });
  }

  function setupImageFallbacks() {
    var images = Array.prototype.slice.call(document.querySelectorAll('img'));

    images.forEach(function (image) {
      if (image.dataset.fallbackReady) {
        return;
      }
      image.dataset.fallbackReady = '1';
      image.addEventListener('error', function () {
        image.style.opacity = '0';
        image.closest('.poster-media, .hero-poster, .detail-poster, .category-tile')?.classList.add('image-pending');
      });
    });
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
})();
