(function () {
  'use strict';

  const bar = document.getElementById('reading-progress-bar');
  if (!bar) return;

  let ticking = false;

  function updateProgress() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight =
      document.documentElement.scrollHeight - window.innerHeight;

    if (docHeight <= 0) {
      bar.style.width = '100%';
      return;
    }

    const progress = Math.min((scrollTop / docHeight) * 100, 100);
    bar.style.width = progress + '%';
    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(updateProgress);
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  // 페이지 진입 시 초기값 설정
  updateProgress();
})();
