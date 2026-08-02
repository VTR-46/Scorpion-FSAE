document.addEventListener('DOMContentLoaded', () => {
    const section = document.getElementById('homeSection');
    const video = document.getElementById('scrollVideo');
    const header = document.querySelector('header');
    const txtImgHome = document.getElementById('txtImgHome');
    const videoDim = document.getElementById('videoDim');
    const homeSection2 = document.getElementById('homeSection2');

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

    // ===== HEADER: mostra ao rolar para CIMA, esconde ao rolar para BAIXO =====
    let lastScrollY = window.scrollY;
    let headerTicking = false;

    function updateHeader(scrollY) {
        if (!header) return;

        const scrollDelta = scrollY - lastScrollY;
        lastScrollY = scrollY;

        // No topo da página (ou quase), o header fica sempre visível
        if (scrollY <= 0) {
            header.classList.remove('header-hidden');
            return;
        }

        if (scrollDelta > 2) {
            // Rolar para baixo → esconde o header
            header.classList.add('header-hidden');
        } else if (scrollDelta < -2) {
            // Rolar para cima → mostra o header
            header.classList.remove('header-hidden');
        }
    }

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
    //  function setOverlayVisible(visible) {
    //      if (wasScrolling === visible) return;
    //      wasScrolling = visible;

    //      if (header) header.classList.toggle('header-hidden', !visible);
    //      if (txtImgHome) txtImgHome.classList.toggle('text-hidden', !visible);
    //  }

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

        // homeSection2 com FADE GRADUAL conforme o usuário rola
        // fade começa em 72% e termina em 100% do progresso do vídeo
        if (homeSection2) {
            const fadeStart = 0.72;
            const fadeEnd = 1.0;
            const fadeProgress = Math.min(1, Math.max(0, (progress - fadeStart) / (fadeEnd - fadeStart)));

            // Opacidade gradual (0 → 1)
            homeSection2.style.opacity = fadeProgress.toFixed(3);

            // Leve zoom acompanhando o fade (0.94x → 1x)
            homeSection2.style.transform = `scale(${(0.94 + 0.06 * fadeProgress).toFixed(3)})`;

            // Desfoque que some conforme o fade avança
            homeSection2.style.filter = `blur(${(10 * (1 - fadeProgress)).toFixed(2)}px)`;

            // Habilita interação (botões) quando já estiver bem visível
            const interactive = fadeProgress > 0.5;
            homeSection2.style.pointerEvents = interactive ? 'auto' : 'none';
            homeSection2.setAttribute('aria-hidden', interactive ? 'false' : 'true');

            // Esconde o texto principal para dar lugar ao overlay durante o fade
            if (txtImgHome) txtImgHome.classList.toggle('text-hidden', fadeProgress > 0.05);
        }
    }

    function onScroll() {
        const scrollY = window.scrollY;

        // Atualiza o header (mostrar ao rolar para cima / esconder ao rolar para baixo)
        if (!headerTicking) {
            headerTicking = true;
            requestAnimationFrame(() => {
                updateHeader(scrollY);
                headerTicking = false;
            });
        }

        // Atualiza o tempo do vídeo
        if (!ticking && videoReady) {
            ticking = true;
            requestAnimationFrame(updateVideoTime);
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateVideoTime);

    // Garante que o header aparece quando a página carrega no topo
    updateHeader(window.scrollY);
});
