
document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initHeroCarousel();
  initSearchAndFilter();
  initPlayer();
});

function initMobileMenu() {
  const toggle = document.querySelector('[data-menu-toggle]');
  const nav = document.querySelector('[data-nav]');
  if (!toggle || !nav) return;
  toggle.addEventListener('click', () => {
    nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', nav.classList.contains('open') ? 'true' : 'false');
  });
}

function initHeroCarousel() {
  const strip = document.querySelector('[data-hero-strip]');
  if (!strip) return;
  let timer = null;
  const step = () => {
    const max = strip.scrollWidth - strip.clientWidth;
    if (max <= 0) return;
    const next = strip.scrollLeft + strip.clientWidth * 0.92;
    strip.scrollTo({ left: next >= max - 4 ? 0 : next, behavior: 'smooth' });
  };
  timer = window.setInterval(step, 5200);
  strip.addEventListener('mouseenter', () => timer && window.clearInterval(timer));
  strip.addEventListener('mouseleave', () => { if (!timer) timer = window.setInterval(step, 5200); });
}

function initSearchAndFilter() {
  const inputs = document.querySelectorAll('[data-search-input]');
  inputs.forEach((input) => {
    const target = document.querySelector(input.dataset.target);
    if (!target) return;
    const items = Array.from(target.querySelectorAll('[data-item]'));
    const countEl = document.querySelector(input.dataset.countTarget || '');

    const apply = () => {
      const query = input.value.trim().toLowerCase();
      const filter = (input.dataset.typeFilter || 'all').toLowerCase();
      let visible = 0;
      items.forEach((item) => {
        const text = [
          item.dataset.title,
          item.dataset.genre,
          item.dataset.region,
          item.dataset.type,
          item.dataset.year,
          item.textContent,
        ].join(' ').toLowerCase();
        const typeOk = filter === 'all' || (item.dataset.type || '').toLowerCase().includes(filter);
        const queryOk = !query || text.includes(query);
        const show = typeOk && queryOk;
        item.classList.toggle('hidden', !show);
        if (show) visible += 1;
      });
      if (countEl) countEl.textContent = String(visible);
    };

    input.addEventListener('input', apply);
    apply();
  });

  document.querySelectorAll('[data-filter-btn]').forEach((btn) => {
    const group = btn.dataset.filterGroup;
    btn.addEventListener('click', () => {
      document.querySelectorAll(`[data-filter-group="${group}"] [data-filter-btn]`).forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const targetSelector = btn.dataset.target;
      const filterValue = btn.dataset.filterBtn;
      const input = document.querySelector(`${targetSelector}`);
      if (input) {
        input.dataset.typeFilter = filterValue;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  });
}

function initPlayer() {
  document.querySelectorAll('[data-player-shell]').forEach((shell) => {
    const video = shell.querySelector('video');
    const overlay = shell.querySelector('[data-play-overlay]');
    const btn = shell.querySelector('[data-play-btn]');
    if (!video) return;

    const fallback = video.dataset.fallback;
    const m3u8 = video.dataset.m3u8;

    // HLS hook: works when an HLS runtime is supplied; otherwise falls back to MP4 preview.
    if (m3u8 && window.Hls && Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(m3u8);
      hls.attachMedia(video);
    } else if (fallback && !video.getAttribute('src')) {
      video.src = fallback;
    }

    const playNow = async () => {
      try {
        await video.play();
        if (overlay) overlay.classList.add('hidden');
      } catch (_) {
        // keep controls visible if autoplay is blocked
      }
    };

    if (btn) btn.addEventListener('click', playNow);
    video.addEventListener('play', () => overlay && overlay.classList.add('hidden'));
    video.addEventListener('pause', () => overlay && overlay.classList.remove('hidden'));
    video.addEventListener('ended', () => overlay && overlay.classList.remove('hidden'));

    shell.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      if (video.paused) playNow();
      else video.pause();
    });
  });
}
