/**
 * ============================================================
 *  NOTICIAS.JS  -  Scorpion FSAE
 *  Script exclusivo da pagina de noticias (html/noticias.html)
 *
 *  Sections:
 *   1. ANIMACAO DE ENTRADA (fsae-fade) com IntersectionObserver
 *   2. HIGHLIGHT DA NAVEGACAO (marca o link atual como ativo)
 *   3. FALLBACK DE IMAGENS (placeholder quando imagem nao existe)
 * ============================================================
 */

/* ============================================================
   1. ANIMACAO DE ENTRADA (fsae-fade)
   - Mesmo padrao de competicao.js / teamFade.js:
     cada elemento .fsae-fade recebe .is-visible ao entrar
     na viewport, disparando a transicao CSS.
   ============================================================ */
(function initFadeObserver() {
    const targets = document.querySelectorAll('.fsae-fade');

    if (!targets.length) return;

    // Sem suporte ao IntersectionObserver: revela tudo imediatamente
    if (!('IntersectionObserver' in window)) {
        targets.forEach(el => el.classList.add('is-visible'));
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target); // anima so uma vez
                }
            });
        },
        {
            threshold: 0.12,   // 12% do elemento visivel dispara a animacao
            rootMargin: '0px 0px -40px 0px',
        }
    );

    targets.forEach(el => observer.observe(el));
})();


/* ============================================================
   2. HIGHLIGHT DA NAVEGACAO
   - Garante que o link "Noticias" no header seja marcado
     com .nav-active mesmo quando carregado diretamente pela URL.
   ============================================================ */
(function highlightCurrentNav() {
    const currentPath = window.location.pathname;

    document.querySelectorAll('nav ul a').forEach((link) => {
        try {
            const linkPath = new URL(link.href).pathname;
            if (currentPath.endsWith(linkPath.split('/').pop())) {
                link.classList.add('nav-active');
            }
        } catch (_) {
            // href invalido, ignora
        }
    });
})();


/* ============================================================
   3. FALLBACK DE IMAGENS
   - Quando a imagem de uma noticia nao existe (404),
     substitui por um placeholder com a cor do site
     para nao quebrar o layout.
   ============================================================ */
(function initImgFallback() {
    document.querySelectorAll('.news-card-img-wrap img').forEach((img) => {
        img.addEventListener('error', function onError() {
            this.removeEventListener('error', onError);
            this.src = 'data:image/svg+xml,' + encodeURIComponent(
                '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">' +
                '<rect width="800" height="450" fill="#0e1c37"/>' +
                '<rect x="0" y="0" width="800" height="3" fill="#00b3fe"/>' +
                '<text x="400" y="210" font-family="sans-serif" font-size="48" fill="#1d3557" text-anchor="middle">SCORPION</text>' +
                '<text x="400" y="270" font-family="sans-serif" font-size="20" fill="#afadbc" text-anchor="middle">Imagem nao disponivel</text>' +
                '</svg>'
            );
            this.alt = 'Imagem nao disponivel';
        });
    });
})();
