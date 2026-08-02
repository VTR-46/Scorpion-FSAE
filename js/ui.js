document.addEventListener('DOMContentLoaded', () => {
    const section = document.getElementById('homeSection');
    const video = document.getElementById('scrollVideo');
    const header = document.querySelector('header');
    const txtImgHome = document.getElementById('txtImgHome');
    const videoDim = document.getElementById('videoDim');

    if (!section || !video) return;

    // Respeita preferência de movimento reduzido
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        video.pause();
        const loader = document.getElementById('videoLoader');
        if (loader) loader.style.display = 'none';
        return;
    }

    let videoReady = false;
    let ticking = false;
    let lastTime = 0;
    let seekThreshold = 0.04; // ~4% de tolerância para evitar seeks desnecessários
    let wasScrolling = false; // controla o estado de visibilidade do header/texto

    // Habilita controle assim que os metadados estiverem disponíveis
    function enableScrollControl() {
        if (videoReady) return;
        videoReady = true;

        const loader = document.getElementById('videoLoader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.style.display = 'none', 500);
        }

        // Congela o primeiro frame sem dar play
        video.currentTime = 0;
        updateVideoTime();
    }

    // Ativa com loadedmetadata (mais rápido que canplaythrough)
    if (video.readyState >= 1) {
        enableScrollControl();
    } else {
        video.addEventListener('loadedmetadata', enableScrollControl, { once: true });
    }

    // Remove o .load() forçado — com preload="metadata" já é suficiente

    // Timeout de segurança reduzido (5s)
    setTimeout(() => {
        if (!videoReady) enableScrollControl();
    }, 5000);

    // Mostra ou esconde header + texto conforme o progresso do scroll
    // function setOverlayVisible(visible) {
    //     if (wasScrolling === visible) return;
    //     wasScrolling = visible;

    //     if (header) header.classList.toggle('header-hidden', !visible);
    //     if (txtImgHome) txtImgHome.classList.toggle('text-hidden', !visible);
    // }

    function updateVideoTime() {
        ticking = false;
        if (!videoReady || !video.duration) return;

        const rect = section.getBoundingClientRect();
        const sectionHeight = section.offsetHeight;
        const viewportHeight = window.innerHeight;
        const scrollable = sectionHeight - viewportHeight;
        const scrolled = Math.max(0, -rect.top);
        const rawProgress = Math.min(1, Math.max(0, scrolled / scrollable));

        // Easing suave (smoothstep) — vídeo avança mais devagar no início e no fim
        const progress = rawProgress * rawProgress * (3 - 2 * rawProgress);

        const targetTime = progress * video.duration;

        // Só faz seek se a diferença for significativa (evita seeks desnecessários)
        if (Math.abs(targetTime - video.currentTime) > seekThreshold && targetTime !== lastTime) {
            lastTime = targetTime;
            video.currentTime = targetTime;
        }

        // Overlay de escurecimento: começa escuro (0.45) e clareia até 0 conforme o scroll avança
        if (videoDim) {
            const dimOpacity = Math.max(0, 0.45 * (1 - progress * 1.4));
            videoDim.style.opacity = dimOpacity.toFixed(3);
        }

        // Esconde header e texto enquanto o vídeo está rolando (progresso entre 1% e 99%)
        const isScrolling = progress > 0.01 && progress < 0.99;
        setOverlayVisible(!isScrolling);
    }

    function onScroll() {
        if (!ticking && videoReady) {
            ticking = true;
            requestAnimationFrame(updateVideoTime);
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateVideoTime);
});