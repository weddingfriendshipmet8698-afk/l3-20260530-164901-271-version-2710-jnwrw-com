(function () {
  var menuButton = document.querySelector('[data-menu-button]');
  var mobileNav = document.querySelector('[data-mobile-nav]');

  if (menuButton && mobileNav) {
    menuButton.addEventListener('click', function () {
      mobileNav.classList.toggle('open');
    });
  }

  var hero = document.querySelector('[data-hero]');

  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var previous = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var current = 0;
    var timer = null;

    function showSlide(index) {
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
        clearInterval(timer);
      }
      timer = setInterval(function () {
        showSlide(current + 1);
      }, 5200);
    }

    if (previous) {
      previous.addEventListener('click', function () {
        showSlide(current - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        showSlide(current + 1);
        restart();
      });
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        showSlide(index);
        restart();
      });
    });

    restart();
  }

  var searchInput = document.querySelector('.catalog-search');
  var cards = Array.prototype.slice.call(document.querySelectorAll('.movie-card'));
  var chips = Array.prototype.slice.call(document.querySelectorAll('.filter-chip'));
  var activeFilter = 'all';

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function cardText(card) {
    return normalize([
      card.getAttribute('data-title'),
      card.getAttribute('data-region'),
      card.getAttribute('data-type'),
      card.getAttribute('data-year'),
      card.getAttribute('data-tags'),
      card.getAttribute('data-category'),
      card.textContent
    ].join(' '));
  }

  function applyFilters() {
    var keyword = searchInput ? normalize(searchInput.value) : '';
    cards.forEach(function (card) {
      var haystack = cardText(card);
      var filterOk = activeFilter === 'all' || haystack.indexOf(normalize(activeFilter)) !== -1;
      var keywordOk = !keyword || haystack.indexOf(keyword) !== -1;
      card.classList.toggle('is-hidden', !(filterOk && keywordOk));
    });
  }

  if (searchInput && cards.length) {
    searchInput.addEventListener('input', applyFilters);
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      activeFilter = chip.getAttribute('data-filter') || 'all';
      chips.forEach(function (item) {
        item.classList.toggle('active', item === chip);
      });
      applyFilters();
    });
  });
})();

function initVideoPlayer(videoId, buttonId, overlayId, messageId, source) {
  var video = document.getElementById(videoId);
  var button = document.getElementById(buttonId);
  var overlay = document.getElementById(overlayId);
  var message = document.getElementById(messageId);
  var hlsInstance = null;
  var isReady = false;

  if (!video || !source) {
    return;
  }

  function setMessage(value) {
    if (!message) {
      return;
    }
    message.textContent = value || '';
    message.classList.toggle('show', Boolean(value));
  }

  function markPlaying() {
    var shell = video.closest('.video-shell');
    if (shell) {
      shell.classList.add('playing');
    }
    video.controls = true;
  }

  function startPlayback() {
    markPlaying();
    var attempt = video.play();
    if (attempt && typeof attempt.catch === 'function') {
      attempt.catch(function () {
        setMessage('点击视频画面继续播放。');
      });
    }
  }

  function loadVideo() {
    if (isReady) {
      startPlayback();
      return;
    }

    isReady = true;
    setMessage('');

    if (window.Hls && window.Hls.isSupported()) {
      hlsInstance = new window.Hls({ enableWorker: true });
      hlsInstance.loadSource(source);
      hlsInstance.attachMedia(video);
      hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
        startPlayback();
      });
      hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
        if (data && data.fatal) {
          if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
            hlsInstance.startLoad();
          } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
            hlsInstance.recoverMediaError();
          } else {
            setMessage('视频加载失败，请稍后重试。');
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = source;
      video.addEventListener('loadedmetadata', startPlayback, { once: true });
      video.load();
    } else {
      video.src = source;
      video.load();
      startPlayback();
    }
  }

  function handleClick(event) {
    event.preventDefault();
    loadVideo();
  }

  if (button) {
    button.addEventListener('click', handleClick);
  }

  if (overlay) {
    overlay.addEventListener('click', handleClick);
  }

  video.addEventListener('click', function () {
    if (video.paused) {
      loadVideo();
    }
  });

  video.addEventListener('playing', markPlaying);

  window.addEventListener('beforeunload', function () {
    if (hlsInstance) {
      hlsInstance.destroy();
    }
  });
}
