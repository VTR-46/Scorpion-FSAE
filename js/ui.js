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

    // ===== REVEAL ON SCROLL (homeSection2 e homeSection4) =====
    // Faz o conteúdo aparecer com fade-in suave quando entra na viewport.
    const revealEls = document.querySelectorAll('.reveal');

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        // Respeita prefers-reduced-motion: mostra tudo imediatamente
        revealEls.forEach(el => el.classList.add('is-visible'));
    } else if (revealEls.length && 'IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    obs.unobserve(entry.target); // anima apenas uma vez
                }
            });
        }, {
            // Dispara quando ~15% do conteúdo entra na viewport
            threshold: 0.15,
            rootMargin: '0px 0px -10% 0px'
        });

        revealEls.forEach(el => revealObserver.observe(el));
    } else {
        // Fallback (sem IntersectionObserver): mostra tudo imediatamente
        revealEls.forEach(el => el.classList.add('is-visible'));
    }

    // ===== TEXT ROTATOR =====
    const txtRotator = document.getElementById('txtRotator');
    const phrases = txtRotator ? txtRotator.querySelectorAll('.txt-phrase') : [];
    let currentPhraseIndex = 0;
    let rotatorInterval = null;
    const ROTATION_INTERVAL = 5000; // 5 segundos
    const ANIMATION_DURATION = 500; // 0.5 segundos

    function initTextRotator() {
        if (!txtRotator || phrases.length === 0) return;

        // Inicia com a primeira frase ativa
        phrases[0].classList.add('active');

        // Função para rotacionar as frases
        function rotatePhrase() {
            const currentPhrase = phrases[currentPhraseIndex];
            const nextIndex = (currentPhraseIndex + 1) % phrases.length;
            const nextPhrase = phrases[nextIndex];

            // Anima a frase atual saindo para cima
            currentPhrase.classList.remove('active');
            currentPhrase.classList.add('exiting-up');

            // Prepara a próxima frase (entrada de baixo)
            nextPhrase.classList.add('entering-up');

            // Após a animação de saída, limpa classes e ativa a próxima
            setTimeout(() => {
                currentPhrase.classList.remove('exiting-up');
                nextPhrase.classList.remove('entering-up');
                nextPhrase.classList.add('active');
                currentPhraseIndex = nextIndex;
            }, ANIMATION_DURATION);
        }

        // Inicia o intervalo
        rotatorInterval = setInterval(rotatePhrase, ROTATION_INTERVAL);

        // Pausa a rotação quando o mouse está sobre o texto
        txtRotator.addEventListener('mouseenter', () => {
            if (rotatorInterval) {
                clearInterval(rotatorInterval);
                rotatorInterval = null;
            }
        });

        // Retoma a rotação quando o mouse sai
        txtRotator.addEventListener('mouseleave', () => {
            if (!rotatorInterval) {
                rotatorInterval = setInterval(rotatePhrase, ROTATION_INTERVAL);
            }
        });

        // Respeita prefers-reduced-motion
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (mediaQuery.matches) {
            if (rotatorInterval) {
                clearInterval(rotatorInterval);
                rotatorInterval = null;
            }
        }
        mediaQuery.addEventListener('change', (e) => {
            if (e.matches) {
                if (rotatorInterval) {
                    clearInterval(rotatorInterval);
                    rotatorInterval = null;
                }
            } else if (!rotatorInterval) {
                rotatorInterval = setInterval(rotatePhrase, ROTATION_INTERVAL);
            }
        });
    }

    // Inicializa o rotator
    initTextRotator();

    // ===== HEADER: mostra ao rolar para CIMA, esconde ao rolar para BAIXO =====
    // Esta lógica é independente dos elementos de vídeo da home e roda em TODAS
    // as páginas (index, equipe, patrocinio), desde que o ui.js esteja incluído.
    let lastScrollY = window.scrollY;
    let headerRafId = 0;

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

    function onScrollHeader() {
        if (headerRafId) return;
        headerRafId = requestAnimationFrame(() => {
            headerRafId = 0;
            updateHeader(window.scrollY);
        });
    }

    window.addEventListener('scroll', onScrollHeader, { passive: true });
    // Garante que o header aparece quando a página carrega no topo
    updateHeader(window.scrollY);

if (!section || !video) return;

    // NOTE: não fazemos return antecipado por prefers-reduced-motion,
    // pois o site inteiro é construído em torno do vídeo controlado pelo scroll.
    // Em vez disso, apenas respeitamos `scroll-behavior: auto` via CSS.

    let videoReady = false;
    let ticking = false;
    let scrollRafId = 0;
    let latestScrollY = window.scrollY;
    let lastTime = 0;
    let seekThreshold = 0.016; // ~1 frame a 60fps

// Congela o vídeo no primeiro frame e garante que ele está pausado.
    // Dá um play instantâneo e pausa em seguida para forçar o render do
    // primeiro frame (alguns navegadores não pintam nada no preload="metadata").
    function freezeVideo(v, updateFn) {
        if (!v) return;
        v.muted = true;
        v.playsInline = true;
        const apply = () => {
            const playPromise = v.play();
            if (playPromise && playPromise.then) {
                playPromise.then(() => {
                    v.pause();
                    try { v.currentTime = 0; } catch (e) { /* ignora */ }
                    if (updateFn) updateFn();
                }).catch(() => {
                    // Autoplay bloqueado ou já pausado — só faz seek
                    try { v.currentTime = 0; } catch (e) { /* ignora */ }
                    if (updateFn) updateFn();
                });
            } else {
                try { v.currentTime = 0; } catch (e) { /* ignora */ }
                if (updateFn) updateFn();
            }
        };
        if (v.readyState >= 1) {
            apply();
        } else {
            v.addEventListener('loadedmetadata', apply, { once: true });
            v.addEventListener('canplay', apply, { once: true });
            // Fallback: tenta carregar
            v.load();
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

        freezeVideo(video, updateVideoTime);
    }

    // Ativa com loadedmetadata ou canplay (mais robusto)
    if (video.readyState >= 1) {
        enableScrollControl();
    } else {
        video.addEventListener('loadedmetadata', enableScrollControl, { once: true });
        video.addEventListener('canplay', enableScrollControl, { once: true });
    }

    // Timeout de segurança reduzido (5s)
    setTimeout(() => {
        if (!videoReady) enableScrollControl();
    }, 5000);

    // ===== homeSection3: inicialização do vídeo =====
    freezeVideo(video3, updateSection3);

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
        // Mapeia o progresso sobre a ALTURA TOTAL da seção (200vh = 2 scrolls),
        // para que o vídeo toque por completo nos 2 gestos de scroll
        // e termine exatamente quando a homeSection2 entra.
        const scrollable = sectionHeight;
        const scrolled = Math.max(0, -rect.top);
        const rawProgress = Math.min(1, Math.max(0, scrolled / scrollable));

        // Easing suave (smoothstep) — vídeo avança mais devagar no início e no fim
        const progress = rawProgress * rawProgress * (3 - 2 * rawProgress);

        const targetTime = progress * video.duration;

// Só faz seek se a diferença for significativa (evita seeks desnecessários)
        if (Math.abs(targetTime - video.currentTime) > seekThreshold && targetTime !== lastTime) {
            lastTime = targetTime;
            // fastSeek (busca aproximada) é MUITO mais rápido para scrubbing
            // e resolve o lag ao rolar; fallback para currentTime quando não disponível
            if (typeof video.fastSeek === 'function') {
                video.fastSeek(targetTime);
            } else {
                video.currentTime = targetTime;
            }
        }

// Overlay de escurecimento: começa escuro (0.45) e clareia até 0 conforme o scroll avança
        if (videoDim) {
            const dimOpacity = Math.max(0, 0.45 * (1 - progress * 1.4));
            videoDim.style.opacity = dimOpacity.toFixed(3);
        }

// homeSection2 é uma seção normal — apenas esconde o texto do vídeo
        // quando o scroll se aproxima do fim da homeSection.
        if (homeSection2 && txtImgHome) {
            txtImgHome.classList.toggle('text-hidden', progress > 0.72);
        }
    }

// ===== homeSection3: vídeo de fundo controlado pelo scroll (2 gestos) =====
    // Altura da seção = 200vh (2 gestos). padding: 5rem 1.5rem vem do CSS global.
    function updateSection3() {
        if (!section3 || !video3 || !video3.duration) return;

        const rect3 = section3.getBoundingClientRect();
        const section3Height = section3.offsetHeight;
        // Mapeia o progresso sobre a ALTURA TOTAL da seção (200vh = 2 scrolls),
        // para que o vídeo toque por completo nos 2 gestos e chegue à homeSection4.
        const scrolled3 = Math.max(0, -rect3.top);
        const scrollable3 = section3Height;
        const p3 = Math.min(1, Math.max(0, scrolled3 / scrollable3));

        // --- Vídeo: avança do início ao fim nos 2 gestos ---
        let video3Time = p3 * video3.duration;

        // Faz seek apenas quando a diferença é relevante (0.08s) e usa fastSeek
        // quando disponível — busca aproximada é muito mais rápida para scrubbing
        if (Math.abs(video3Time - video3.currentTime) > 0.08) {
            if (typeof video3.fastSeek === 'function') {
                video3.fastSeek(video3Time);
            } else {
                video3.currentTime = video3Time;
            }
        }

// --- Conteúdo: aparece conforme o scroll da homeSection3 avança (3 gestos) ---
        if (homeSection3Content) {
            let contentOpacity = 0;

            // Fade in no início do 2º scroll (~30%-37% da seção total de 300vh)
            if (p3 >= 0.30 && p3 < 0.37) {
                contentOpacity = (p3 - 0.30) / 0.07;
            // Visível por ~2 scrolls (2º e 3º gestos) — 37% até 90%
            } else if (p3 >= 0.37 && p3 < 0.90) {
                contentOpacity = 1;
            // Fade out perto do fim da seção (antes de chegar à homeSection4)
            } else if (p3 >= 0.90 && p3 < 0.97) {
                contentOpacity = 1 - (p3 - 0.90) / 0.07;
            }
            contentOpacity = Math.min(1, Math.max(0, contentOpacity));

            homeSection3Content.style.opacity = contentOpacity.toFixed(3);
            homeSection3Content.style.transform = `scale(${(0.94 + 0.06 * contentOpacity).toFixed(3)})`;
            homeSection3Content.style.pointerEvents = contentOpacity > 0.5 ? 'auto' : 'none';
            homeSection3Content.setAttribute('aria-hidden', contentOpacity > 0.5 ? 'false' : 'true');
        }

        // --- Dim: escuro no início, clareia no 1º scroll e re-escurece no 3º scroll ---
        if (videoDim3) {
            let dim3 = 0.45;
            if (p3 < 0.33) {
                // Clareia durante o 1º scroll (0 → 33%)
                dim3 = 0.45 * (1 - p3 / 0.33);
            } else if (p3 >= 0.33 && p3 < 0.67) {
                // Permanece claro durante o 2º scroll
                dim3 = 0;
            } else {
                // Re-escurece levemente durante o 3º scroll (67% → 100%)
                dim3 = 0.45 * ((p3 - 0.67) / 0.33) * 1.2;
            }
            videoDim3.style.opacity = Math.min(0.45, Math.max(0, dim3)).toFixed(3);
        }
    }

    function renderScrollEffects() {
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
            renderScrollEffects();
        });
    }

window.addEventListener('resize', () => renderScrollEffects());

    // ===== LISTENER DE SCROLL PRINCIPAL =====
    // (crítico — sem isso o vídeo nunca é atualizado durante o scroll)
    window.addEventListener('scroll', onScroll, { passive: true });

    // ===== SNAP AUTOMÁTICO ENTRE SEÇÕES =====
    // Cada gesto de scroll avança/sai automaticamente até o próximo "ponto de parada"
    // (borda de cada seção + ponto do meio dos vídeos de 200vh), sem ficar
    // parado entre duas seções diferentes.
    const snapTargets = [];
    let snapListLocked = false;

    function buildSnapTargets() {
        snapTargets.length = 0;
        const vh = window.innerHeight;

        const push = (offsetY) => {
            const y = Math.max(0, Math.min(document.documentElement.scrollHeight - window.innerHeight, offsetY));
            if (snapTargets.length === 0 || snapTargets[snapTargets.length - 1] !== y) {
                snapTargets.push(Math.round(y));
            }
        };

        // homeSection: topo (0), meio (100vh) e fim (200vh)
        push(0);
        if (section) {
            push(section.offsetTop);                  // topo = 0
            push(section.offsetTop + vh);             // ponto do meio
            push(section.offsetTop + section.offsetHeight); // fim = início da homeSection2
        }

// homeSection2 (100vh)
        if (homeSection2) {
            push(homeSection2.offsetTop);
            push(homeSection2.offsetTop + homeSection2.offsetHeight);
        }

        // homeSection3: topo, meio (100vh), 2/3 (200vh) e fim (início da homeSection4)
        if (section3) {
            push(section3.offsetTop);
            push(section3.offsetTop + vh);           // 100vh (1º scroll)
            push(section3.offsetTop + vh * 2);       // 200vh (2º scroll)
            push(section3.offsetTop + section3.offsetHeight); // 300vh (fim = início da homeSection4)
        }

        // homeSection4 (fim da página)
        if (document.getElementById('homeSection4')) {
            push(document.getElementById('homeSection4').offsetTop);
            push(document.documentElement.scrollHeight - window.innerHeight); // fim absoluto
        }
    }

    function getNearestSnapIndex(currentY) {
        let best = 0;
        let bestDist = Infinity;
        for (let i = 0; i < snapTargets.length; i++) {
            const d = Math.abs(snapTargets[i] - currentY);
            if (d < bestDist) {
                bestDist = d;
                best = i;
            }
        }
        return best;
    }

    let wheelCooldown = false;
    let suppressSnap = false;

    function handleWheel(e) {
        // Ignora o evento se já estamos rolando automaticamente ou em cooldown
        if (wheelCooldown || suppressSnap) return;

        // Só faz snap quando o gesto é essencialmente vertical
        if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;

        const currentY = window.scrollY;
        const currentIndex = getNearestSnapIndex(currentY);
        const goingDown = e.deltaY > 0;

        let targetIndex;
        if (goingDown) {
            targetIndex = currentIndex + 1;
        } else {
            targetIndex = currentIndex - 1;
        }

        if (targetIndex < 0 || targetIndex >= snapTargets.length) return;

        const targetY = snapTargets[targetIndex];
        const distance = Math.abs(targetY - currentY);

        // Se já estiver muito perto do alvo, não faz nada
        if (distance < 2) return;

        // Só intercepta o wheel para o snap quando o gesto é forte o bastante
        // para ir até o próximo ponto. Se o gesto é fraco, deixamos o scroll
        // nativo continuar (evita a sensação de "travado").
        const naturalStep = Math.abs(e.deltaY);
        if (naturalStep < distance * 0.5) {
            return; // deixa o scroll nativo rolar sem snap forçado
        }

        // Bloqueia novos snaps durante e logo após a rolagem automática
        wheelCooldown = true;
        suppressSnap = true;
        e.preventDefault();

        window.scrollTo({ top: targetY, behavior: 'smooth' });

        // Libera depois da animação terminar
        const duration = Math.min(1000, Math.max(400, distance / 2));
        setTimeout(() => {
            wheelCooldown = false;
            // Pequena margem extra para evitar que o scroll residual dispare outro snap
            setTimeout(() => { suppressSnap = false; }, 120);
        }, duration);
    }

    // Recalcula os pontos de snap em resize e no carregamento
    buildSnapTargets();
    window.addEventListener('resize', buildSnapTargets);

    // O snap via wheel é aplicado apenas em telas onde o scroll vertical é o esperado
    window.addEventListener('wheel', handleWheel, { passive: false });
});
