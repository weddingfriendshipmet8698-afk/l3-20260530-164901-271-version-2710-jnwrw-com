(function() {
  var header = document.querySelector('.site-header');
  var navToggle = document.querySelector('[data-nav-toggle]');
  var navMenu = document.querySelector('[data-nav-menu]');

  function updateHeader() {
    if (!header) {
      return;
    }
    header.classList.toggle('is-scrolled', window.scrollY > 12);
  }

  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function() {
      navMenu.classList.toggle('is-open');
    });
  }

  document.querySelectorAll('[data-hero-slider]').forEach(function(slider) {
    var slides = Array.prototype.slice.call(slider.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(slider.querySelectorAll('[data-hero-dot]'));
    var prev = slider.querySelector('[data-hero-prev]');
    var next = slider.querySelector('[data-hero-next]');
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function(slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === index);
      });
      dots.forEach(function(dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === index);
      });
    }

    function restart() {
      if (timer) {
        clearInterval(timer);
      }
      timer = setInterval(function() {
        show(index + 1);
      }, 5200);
    }

    if (prev) {
      prev.addEventListener('click', function() {
        show(index - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener('click', function() {
        show(index + 1);
        restart();
      });
    }

    dots.forEach(function(dot) {
      dot.addEventListener('click', function() {
        show(Number(dot.getAttribute('data-hero-dot')) || 0);
        restart();
      });
    });

    show(0);
    restart();
  });

  var activeFilter = '';

  function normalize(value) {
    return String(value || '').toLowerCase().replace(/\s+/g, '');
  }

  function applyFilter(targetSelector) {
    var scope = document.querySelector(targetSelector);
    if (!scope) {
      return;
    }
    var searchInput = document.querySelector('[data-search-input][data-target="' + targetSelector + '"]');
    var query = normalize(searchInput ? searchInput.value : '');
    var cards = Array.prototype.slice.call(scope.querySelectorAll('[data-movie-card]'));
    var visible = 0;

    cards.forEach(function(card) {
      var haystack = normalize([
        card.getAttribute('data-title'),
        card.getAttribute('data-tags'),
        card.getAttribute('data-genre'),
        card.getAttribute('data-region'),
        card.textContent
      ].join(' '));
      var matchQuery = !query || haystack.indexOf(query) !== -1;
      var matchFilter = !activeFilter || haystack.indexOf(normalize(activeFilter)) !== -1;
      var show = matchQuery && matchFilter;
      card.hidden = !show;
      if (show) {
        visible += 1;
      }
    });

    var panel = scope.closest('.library-panel') || scope.closest('.ranking-strip') || document;
    var empty = panel.querySelector('[data-empty-state]');
    if (empty) {
      empty.classList.toggle('is-visible', visible === 0);
    }
  }

  document.querySelectorAll('[data-search-input]').forEach(function(input) {
    input.addEventListener('input', function() {
      applyFilter(input.getAttribute('data-target'));
    });
  });

  document.querySelectorAll('[data-filter-button]').forEach(function(button) {
    button.addEventListener('click', function() {
      var group = button.parentElement;
      if (group) {
        group.querySelectorAll('[data-filter-button]').forEach(function(other) {
          other.classList.remove('is-active');
        });
      }
      button.classList.add('is-active');
      activeFilter = button.getAttribute('data-filter-button') || '';
      document.querySelectorAll('[data-search-input]').forEach(function(input) {
        applyFilter(input.getAttribute('data-target'));
      });
    });
  });
}());
