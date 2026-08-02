// ===================== TELA DE LOADING (5s) =====================
(function () {
    const LOADING_DURATION = 2000; // 5 segundos

    function startLoading() {
        const screen = document.getElementById('loadingScreen');
        const barFill = document.getElementById('loadingBarFill');
        const loadingVideo = document.getElementById('loadingVideo');

        if (!screen || !barFill) return;

        // Bloqueia o scroll durante o loading
        document.body.style.overflow = 'hidden';

        // Garante o vídeo tocando
        if (loadingVideo) {
            loadingVideo.play().catch(() => { });
        }

        const startTime = performance.now();

        function tick(now) {
            const elapsed = now - startTime;
            const progress = Math.min(1, elapsed / LOADING_DURATION);

            // Preenche a barra de 0 a 100%
            barFill.style.width = (progress * 100).toFixed(2) + '%';

            if (progress < 1) {
                requestAnimationFrame(tick);
            } else {
                finishLoading(screen);
            }
        }

        requestAnimationFrame(tick);

        // Fallback de segurança: esconde mesmo se algo falhar
        setTimeout(() => finishLoading(screen), LOADING_DURATION + 1000);
    }

    function finishLoading(screen) {
        if (screen.dataset.done) return;
        screen.dataset.done = 'true';

        // Libera o scroll
        document.body.style.overflow = '';

        // Fade out da tela de loading
        screen.classList.add('hidden');

        // Remove do DOM após a transição
        setTimeout(() => {
            if (screen.parentNode) screen.parentNode.removeChild(screen);
        }, 700);
    }

    // Inicia quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startLoading);
    } else {
        startLoading();
    }
})();