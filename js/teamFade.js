// Fade-in por fileira do team-grid ao entrar na viewport
document.addEventListener('DOMContentLoaded', () => {
    const grids = document.querySelectorAll('.team-grid');
    if (!grids.length) return;

    // Respeita prefers-reduced-motion: mostra tudo imediatamente
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        grids.forEach(g => g.classList.add('is-visible'));
        return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                obs.unobserve(entry.target); // anima apenas uma vez
            }
        });
    }, {
        // Dispara quando ~15% da fileira entra na viewport
        threshold: 0.15,
        rootMargin: '0px 0px -10% 0px'
    });

    grids.forEach(g => observer.observe(g));
});