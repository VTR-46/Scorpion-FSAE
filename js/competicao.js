/* ════════════════════════════════════════════════
       Efeito "Lanterna" na Seção Em Breve
       ════════════════════════════════════════════════ */
    (function() {
        const emBreve = document.getElementById('em-breve-section');
        if (emBreve) {
            function updateEffect(e) {
                const rect = emBreve.getBoundingClientRect();
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                const x = clientX - rect.left;
                const y = clientY - rect.top;
                
                const nx = (x / rect.width) * 2 - 1;
                const ny = (y / rect.height) * 2 - 1;
                
                emBreve.style.setProperty('--x', x + 'px');
                emBreve.style.setProperty('--y', y + 'px');
                emBreve.style.setProperty('--nx', nx);
                emBreve.style.setProperty('--ny', ny);
            }
            
            emBreve.addEventListener('mousemove', updateEffect);
            emBreve.addEventListener('touchmove', updateEffect, {passive: true});
            
            function resetEffect() {
                emBreve.style.setProperty('--x', '50%');
                emBreve.style.setProperty('--y', '50%');
                emBreve.style.setProperty('--nx', '0');
                emBreve.style.setProperty('--ny', '0');
            }
            
            emBreve.addEventListener('mouseleave', resetEffect);
            emBreve.addEventListener('touchend', resetEffect);
        }
    })();

    /* ════════════════════════════════════════════════
       Efeito "Raio-X" na Seção de Render Conceitual
       ════════════════════════════════════════════════ */
    (function() {
        const magicContainer = document.getElementById('render-magic-container');
        if (magicContainer) {
            function updateMagic(e) {
                const rect = magicContainer.getBoundingClientRect();
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                const x = clientX - rect.left;
                const y = clientY - rect.top;
                
                magicContainer.style.setProperty('--rx', x + 'px');
                magicContainer.style.setProperty('--ry', y + 'px');
                magicContainer.classList.add('is-hovered'); // Force opacity on mobile
            }
            
            magicContainer.addEventListener('mousemove', updateMagic);
            magicContainer.addEventListener('touchmove', updateMagic, {passive: true});
            
            function resetMagic() {
                magicContainer.style.setProperty('--rx', '50%');
                magicContainer.style.setProperty('--ry', '50%');
                magicContainer.classList.remove('is-hovered');
            }
            
            magicContainer.addEventListener('mouseleave', resetMagic);
            magicContainer.addEventListener('touchend', resetMagic);
        }
    })();

(function () {
        const section  = document.getElementById('car-parts-scroll');
        const video    = document.getElementById('car-parts-video');
        const canvas   = document.getElementById('car-parts-canvas');
        const loader   = document.getElementById('car-parts-loader');
        const progText = document.getElementById('car-parts-progress');
        const overlay  = document.getElementById('cp-end-overlay');
        const ctx      = canvas.getContext('2d');

        const FPS            = 30;    // frames extraídos por segundo
        const AUTO_TIME      = 3;     // segundo do vídeo que dispara o autoplay
        const PLAYBACK_SPEED = 8.5;  // multiplicador de velocidade do autoplay
        let   VIDEO_DUR      = 8;     // sobrescrito pela duração real

        const frames = [];
        let displayedFrame = -1;
        let autoPlaying    = false;
        let videoFinished  = false;
        let autoRafId      = null;    // ID do requestAnimationFrame do autoplay

        /* ── Desenha frame com object-fit:cover ── */
        function drawCover(bitmap) {
            const cw = canvas.width, ch = canvas.height;
            const bw = bitmap.width, bh = bitmap.height;
            const scale = Math.max(cw / bw, ch / bh);
            const sw = bw * scale, sh = bh * scale;
            ctx.drawImage(bitmap, (cw - sw) / 2, (ch - sh) / 2, sw, sh);
        }

        // Garante que o canvas não fique esticado se a tela for redimensionada
        window.addEventListener('resize', () => {
            canvas.width  = window.innerWidth  * window.devicePixelRatio;
            canvas.height = window.innerHeight * window.devicePixelRatio;
            if (displayedFrame >= 0 && displayedFrame < frames.length) {
                drawCover(frames[displayedFrame]);
            }
        });

        /* ── Seek promise ── */
        function seekTo(t) {
            return new Promise(resolve => {
                video.onseeked = resolve;
                video.currentTime = t;
            });
        }

        /* ── Extrai todos os frames ── */
        async function captureAllFrames() {
            VIDEO_DUR = video.duration;
            const totalFrames = Math.ceil(VIDEO_DUR * FPS);

            canvas.width  = window.innerWidth  * window.devicePixelRatio;
            canvas.height = window.innerHeight * window.devicePixelRatio;

            for (let i = 0; i < totalFrames; i++) {
                await seekTo(i / FPS);
                frames.push(await createImageBitmap(video));
                progText.textContent = `Carregando… ${Math.round((i + 1) / totalFrames * 100)}%`;
            }

            drawCover(frames[0]);
            loader.style.display = 'none';
            setupScroll();
        }

        /* ── Cancela autoplay e restaura controle do scroll ── */
        function cancelAutoPlay() {
            if (autoRafId !== null) {
                cancelAnimationFrame(autoRafId);
                autoRafId = null;
            }
            autoPlaying   = false;
            videoFinished = false;

            // Esconde o overlay com transição suave
            overlay.classList.remove('active');
        }

        /* ── Mostra overlay final ── */
        function showEndOverlay() {
            videoFinished = true;
            overlay.classList.add('active');
        }

        /* ── Autoplay com tempo absoluto (sem drift) e velocidade acelerada ── */
        function startAutoPlay(fromFrame) {
            if (autoPlaying) return;
            autoPlaying = true;

            const startTime = performance.now();
            const startFrame = fromFrame;

            function rafStep() {
                if (!autoPlaying) return;
                
                const now = performance.now();
                const elapsed = (now - startTime) / 1000;
                
                // Calcula frames a avançar baseado no tempo absoluto
                const framesToAdvance = Math.round(elapsed * FPS * PLAYBACK_SPEED);
                const targetFrame = Math.min(startFrame + framesToAdvance, frames.length - 1);

                if (targetFrame !== displayedFrame) {
                    displayedFrame = targetFrame;
                    drawCover(frames[targetFrame]);
                }

                if (targetFrame < frames.length - 1) {
                    autoRafId = requestAnimationFrame(rafStep);
                } else {
                    videoFinished = true;
                    autoPlaying = false;
                    showEndOverlay();
                    
                    // ── ENCURTAR O SCROLL ──
                    // Quando o vídeo termina sozinho, o usuário não precisa rolar todo o espaço vazio.
                    const rect = section.getBoundingClientRect();
                    const scrolled = -rect.top;
                    
                    // Constantes da seção
                    const defaultVideoScroll = window.innerHeight * 3;
                    const defaultFadeScroll = window.innerHeight * 0.8;
                    
                    if (scrolled < defaultVideoScroll) {
                        // Encontra a variável dinâmica de fade no escopo abaixo
                        if (typeof window.dynamicFadeStartRef === 'function') {
                            window.dynamicFadeStartRef(Math.max(scrolled, 0));
                        }
                        // A nova altura ajusta o fim da seção para logo após o scroll atual
                        section.style.height = (Math.max(scrolled, 0) + defaultFadeScroll + window.innerHeight) + 'px';
                    }
                    return; // encerra RAF
                }
            }
            autoRafId = requestAnimationFrame(rafStep);
        }

        /* ── Scroll handler ── */
        function setupScroll() {
            const autoTriggerFrame = Math.round((AUTO_TIME / VIDEO_DUR) * (frames.length - 1));
            const stickyDiv = document.getElementById('car-parts-sticky');
            const blackFade = document.getElementById('cp-black-fade');

            // Configurações de altura (reduzimos o scroll total necessário)
            const defaultVideoScroll = window.innerHeight * 3; // 3 telas completas para o vídeo
            const defaultFadeScroll = window.innerHeight * 0.8; // 0.8 tela para o fade preto
            let dynamicFadeStart = defaultVideoScroll;
            
            // Callback para o autoplay atualizar o início do fade
            window.dynamicFadeStartRef = function(val) {
                dynamicFadeStart = val;
            };
            
            // Aplica altura total inicialmente
            section.style.height = (defaultVideoScroll + defaultFadeScroll + window.innerHeight) + 'px';

            function onScroll() {
                const rect       = section.getBoundingClientRect();
                
                // ── Efeito de transição de entrada (Scale + Radius + Shadow) ──
                if (rect.top > 0 && rect.top <= window.innerHeight) {
                    const ratio = rect.top / window.innerHeight;
                    const scale = 0.85 + (0.15 * (1 - ratio));
                    const br    = 60 * ratio;
                    const alpha = 0.8 * (1 - ratio);
                    
                    stickyDiv.style.transform = `scale(${scale})`;
                    stickyDiv.style.borderRadius = `${br}px ${br}px 0 0`;
                    stickyDiv.style.boxShadow = `0 -20px 80px rgba(0,0,0,${alpha})`;
                    stickyDiv.style.opacity = 0.3 + (0.7 * (1 - ratio));
                } else if (rect.top <= 0) {
                    stickyDiv.style.transform = `scale(1)`;
                    stickyDiv.style.borderRadius = `0`;
                    stickyDiv.style.boxShadow = `none`;
                    stickyDiv.style.opacity = 1;
                }

                const scrolled = -rect.top;
                
                // O progresso sempre usa a distância fixa do vídeo para manter o mapeamento exato
                const progress   = Math.min(Math.max(scrolled / defaultVideoScroll, 0), 1);
                const idx        = Math.round(progress * (frames.length - 1));

                // ── FADE PARA PRETO ──
                let fadeProgress = 0;
                if (scrolled > dynamicFadeStart) {
                    fadeProgress = Math.min((scrolled - dynamicFadeStart) / defaultFadeScroll, 1);
                }
                
                if (blackFade) {
                    blackFade.style.opacity = fadeProgress;
                }

                // ── Scroll para TRÁS abaixo do ponto de disparo ──
                if ((autoPlaying || videoFinished) && idx < autoTriggerFrame) {
                    cancelAutoPlay();
                    // Restaura a altura total caso o usuário volte
                    dynamicFadeStart = defaultVideoScroll;
                    section.style.height = (defaultVideoScroll + defaultFadeScroll + window.innerHeight) + 'px';
                }

                // ── Modo scroll-driven ──
                if (!autoPlaying) {
                    // Só atualiza o frame se o vídeo não estiver terminado (autoplay prende no último frame)
                    if (idx !== displayedFrame && !videoFinished) {
                        displayedFrame = idx;
                        drawCover(frames[idx]);
                    }

                    if (idx >= autoTriggerFrame && !videoFinished) {
                        startAutoPlay(idx);
                    }
                }
            }

            window.addEventListener('scroll', onScroll, { passive: true });
            onScroll();
        }

        if (video.readyState >= 1) {
            captureAllFrames();
        } else {
            video.addEventListener('loadedmetadata', captureAllFrames);
        }
    })();

/* ════════════════════════════════════════════════
       1. FADE-IN — IntersectionObserver
       ════════════════════════════════════════════════ */
    (function () {
        const fadeEls = document.querySelectorAll('.fsae-fade');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target); // animação acontece só 1 vez
                }
            });
        }, {
            threshold: 0.12   // dispara quando 12% do elemento está visível
        });

        fadeEls.forEach(el => observer.observe(el));
    })();

    /* ════════════════════════════════════════════════
       2. COUNTER ANIMADO — sobe de 0 até o valor real
       ════════════════════════════════════════════════ */
    (function () {
        const DURATION = 1600; // ms

        // easeOutQuart: rápido no início, desacelera no fim
        function easeOutQuart(t) {
            return 1 - Math.pow(1 - t, 4);
        }

        function animateCounter(el, target, prefix) {
            const start = performance.now();

            function step(now) {
                const elapsed  = now - start;
                const progress = Math.min(elapsed / DURATION, 1);
                const eased    = easeOutQuart(progress);
                const current  = Math.round(eased * target);

                el.textContent = prefix + current;

                if (progress < 1) requestAnimationFrame(step);
            }

            requestAnimationFrame(step);
        }

        // Observa o bloco de stats: quando entrar na viewport, dispara os contadores
        const statsBlock = document.querySelector('.fsae-stats');
        if (!statsBlock) return;

        let counted = false;

        const counterObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !counted) {
                counted = true;
                counterObserver.disconnect();

                // Pequeno delay para o fade-in da stat começar primeiro
                setTimeout(() => {
                    document.querySelectorAll('.fsae-stat-num[data-count]').forEach(el => {
                        const target = parseInt(el.dataset.count, 10);
                        const prefix = el.dataset.prefix || '';
                        animateCounter(el, target, prefix);
                    });
                }, 400);
            }
        }, { threshold: 0.2 });

        counterObserver.observe(statsBlock);
    })();