document.addEventListener('DOMContentLoaded', () => {
    const section = document.getElementById('homeSection');
    const video = document.getElementById('scrollVideo');
    const header = document.querySelector('header');
    const txtImgHome = document.getElementById('txtImgHome');
    const videoDim = document.getElementById('videoDim');
    const homeSection2 = document.getElementById('homeSection2');

    // Elementos da homeSection3
    const section3 = document.getElementById('homeSection3');
    const video3 = document.getElementById('scrollVideo3');
    const videoDim3 = document.getElementById('videoDim3');
    const homeSection3Content = document.getElementById('homeSection3Content');

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
    let scrollRafId = 0;
    let latestScrollY = window.scrollY;
    let lastTime = 0;
    let seekThreshold = 0.016; // ~1 frame a 60fps

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

    // ===== homeSection3: inicialização do vídeo =====
    if (video3) {
        // Congela no primeiro frame assim que os metadados carregarem
        if (video3.readyState >= 1) {
            video3.currentTime = 0;
            updateSection3();
        } else {
            video3.addEventListener('loadedmetadata', () => {
                video3.currentTime = 0;
                updateSection3();
            }, { once: true });
        }
    }

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

    // ===== homeSection3: vídeo de fundo controlado pelo scroll =====
    function updateSection3() {
        if (!section3 || !video3 || !video3.duration) return;

        const rect3 = section3.getBoundingClientRect();
        const section3Height = section3.offsetHeight;
        const scrolled3 = Math.max(0, -rect3.top);
        const scrollable3 = section3Height - window.innerHeight;
        const p3 = Math.min(1, Math.max(0, scrolled3 / scrollable3));

        // --- Vídeo: Fase 1 (0→0.35): 0s→5s | Fase 2 (0.35→0.75): trava em 5s | Fase 3 (0.75→1): 5s→10s ---
        // O conteúdo fica visível por um longo trecho (0.35→0.75 = 40% do scroll)
        let video3Time;
        if (p3 < 0.35) {
            // Avança 0 → 5s na primeira parte do scroll
            video3Time = (p3 / 0.35) * 5;
        } else if (p3 < 0.75) {
            // Mantém em 5s enquanto o conteúdo aparece e permanece
            video3Time = 5;
        } else {
            // Continua de 5s → 10s no restante
            video3Time = 5 + ((p3 - 0.75) / 0.25) * 5;
        }

        // Faz seek apenas quando a diferença é relevante (0.08s) e usa fastSeek
        // quando disponível — busca aproximada é muito mais rápida para scrubbing
        if (Math.abs(video3Time - video3.currentTime) > 0.08) {
            if (typeof video3.fastSeek === 'function') {
                video3.fastSeek(video3Time);
            } else {
                video3.currentTime = video3Time;
            }
        }

        // --- Conteúdo: surge em fade entre 0.35 e 0.45, some entre 0.75 e 0.85 ---
        // O conteúdo fica 100% visível de 0.45 até 0.75 (30% do scroll — bem mais tempo)
        if (homeSection3Content) {
            let contentOpacity = 0;
            if (p3 >= 0.35 && p3 < 0.45) {
                // Aparece gradualmente (10% do scroll)
                contentOpacity = (p3 - 0.35) / 0.10;
            } else if (p3 >= 0.45 && p3 < 0.75) {
                // Permanece totalmente visível (30% do scroll)
                contentOpacity = 1;
            } else if (p3 >= 0.75 && p3 < 0.85) {
                // Some gradualmente (10% do scroll)
                contentOpacity = 1 - (p3 - 0.75) / 0.10;
            }
            contentOpacity = Math.min(1, Math.max(0, contentOpacity));

            homeSection3Content.style.opacity = contentOpacity.toFixed(3);
            homeSection3Content.style.transform = `scale(${(0.94 + 0.06 * contentOpacity).toFixed(3)})`;
            homeSection3Content.style.pointerEvents = contentOpacity > 0.5 ? 'auto' : 'none';
            homeSection3Content.setAttribute('aria-hidden', contentOpacity > 0.5 ? 'false' : 'true');
        }

        // --- Dim: clareia na fase 1 e re-escurece na fase 3 ---
        if (videoDim3) {
            let dim3 = 0.45;
            if (p3 < 0.35) {
                // Clareia enquanto o vídeo avança na fase 1
                dim3 = 0.45 * (1 - p3 / 0.35);
            } else if (p3 < 0.75) {
                // Mantém claro enquanto o conteúdo está visível
                dim3 = 0;
            } else {
                // Re-escurece na fase 3
                dim3 = ((p3 - 0.75) / 0.25) * 0.45;
            }
            videoDim3.style.opacity = dim3.toFixed(3);
        }
    }

    function renderScrollEffects() {
        updateHeader(latestScrollY);
        updateSection3();
        updateVideoTime();
    }

    function onScroll() {
        latestScrollY = window.scrollY;

        if (scrollRafId) {
            return;
        }

        scrollRafId = requestAnimationFrame(() => {
            scrollRafId = 0;
            ticking = false;
            headerTicking = false;
            renderScrollEffects();
        });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => renderScrollEffects());

    // Garante que o header aparece quando a página carrega no topo
    updateHeader(window.scrollY);
});
