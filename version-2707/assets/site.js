(function () {
    var menuButton = document.querySelector('[data-menu-button]');
    var mobileNav = document.querySelector('[data-mobile-nav]');

    if (menuButton && mobileNav) {
        menuButton.addEventListener('click', function () {
            mobileNav.classList.toggle('open');
        });
    }

    document.querySelectorAll('.cover-img').forEach(function (image) {
        image.addEventListener('error', function () {
            image.classList.add('is-missing');
        });
    });

    var slider = document.querySelector('[data-hero-slider]');

    if (slider) {
        var slides = Array.prototype.slice.call(slider.querySelectorAll('.hero-slide'));
        var thumbs = Array.prototype.slice.call(slider.querySelectorAll('[data-slide-to]'));
        var activeIndex = 0;
        var timer = null;

        var showSlide = function (index) {
            if (!slides.length) {
                return;
            }

            activeIndex = (index + slides.length) % slides.length;

            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('is-active', slideIndex === activeIndex);
            });

            thumbs.forEach(function (thumb, thumbIndex) {
                thumb.classList.toggle('active', thumbIndex === activeIndex);
            });
        };

        var startTimer = function () {
            window.clearInterval(timer);
            timer = window.setInterval(function () {
                showSlide(activeIndex + 1);
            }, 5200);
        };

        thumbs.forEach(function (thumb) {
            thumb.addEventListener('click', function () {
                showSlide(Number(thumb.getAttribute('data-slide-to')) || 0);
                startTimer();
            });
        });

        showSlide(0);
        startTimer();
    }

    var filterInput = document.querySelector('[data-filter-input]');
    var yearSelect = document.querySelector('[data-year-select]');
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-card]'));

    var applyFilters = function () {
        var query = filterInput ? filterInput.value.trim().toLowerCase() : '';
        var year = yearSelect ? yearSelect.value : '';

        cards.forEach(function (card) {
            var searchText = card.getAttribute('data-search') || '';
            var cardYear = card.getAttribute('data-year') || '';
            var matchedQuery = !query || searchText.indexOf(query) !== -1;
            var matchedYear = !year || cardYear === year;
            card.classList.toggle('is-filtered-out', !(matchedQuery && matchedYear));
        });
    };

    if (filterInput) {
        filterInput.addEventListener('input', applyFilters);
    }

    if (yearSelect) {
        yearSelect.addEventListener('change', applyFilters);
    }

    var playerWrap = document.querySelector('[data-player-wrap]');
    var video = document.querySelector('#player');
    var playButton = document.querySelector('[data-play-button]');
    var hlsInstance = null;
    var playReady = false;

    var hideOverlay = function () {
        if (playButton) {
            playButton.classList.add('is-hidden');
        }
    };

    var startPlayer = function () {
        if (!video) {
            return;
        }

        var url = video.getAttribute('data-play-src');

        if (!url) {
            return;
        }

        hideOverlay();

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            if (!video.getAttribute('src')) {
                video.setAttribute('src', url);
            }

            video.play().catch(function () {});
            return;
        }

        if (window.Hls && window.Hls.isSupported()) {
            if (!playReady) {
                hlsInstance = new window.Hls({ enableWorker: true });
                hlsInstance.loadSource(url);
                hlsInstance.attachMedia(video);
                hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
                    video.play().catch(function () {});
                });
                playReady = true;
            } else {
                video.play().catch(function () {});
            }
            return;
        }

        if (!video.getAttribute('src')) {
            video.setAttribute('src', url);
        }

        video.play().catch(function () {});
    };

    if (playButton) {
        playButton.addEventListener('click', function (event) {
            event.preventDefault();
            startPlayer();
        });
    }

    if (playerWrap) {
        playerWrap.addEventListener('click', function (event) {
            if (event.target === video || event.target.closest('[data-play-button]')) {
                return;
            }
            startPlayer();
        });
    }

    if (video) {
        video.addEventListener('play', hideOverlay);
    }

    window.addEventListener('pagehide', function () {
        if (hlsInstance) {
            hlsInstance.destroy();
            hlsInstance = null;
        }
    });
})();
