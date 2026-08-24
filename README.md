# Scorpion FSAE - Site Oficial

> Site da equipe Scorpion FSAE - IFSP Araraquara

---

## Visao Geral

Este e o site oficial da Scorpion FSAE, equipe de Formula SAE do IFSP Campus Araraquara. O site foi desenvolvido para apresentar a equipe, seus membros, patrocinadores, loja de produtos e facilitar o contato com interessados.

### Objetivo

Criar uma presenca digital profissional que:
- Apresente a equipe e sua missao
- Mostre os membros organizados por areas tecnicas
- Exiba patrocinadores e apoiadores
- Venda produtos da equipe (loja)
- Facilite o contato para parcerias, duvidas e imprensa

---
## Stack Tecnologico

| Tecnologia | Versao | Uso |
|------------|--------|-----|
| Tailwind CSS | 4.3.0 | Framework CSS utility-first |
| Flowbite | 4.0.2 | Biblioteca de componentes UI baseada no Tailwind |
| Vanilla JavaScript | ES6+ | Interatividade, animacoes, scroll snap |
| EmailJS | 4.x | Envio de formularios de contato sem backend |
| Google Fonts | - | Fontes Oswald (display) + Inter (body) |
| HTML5 | - | Estrutura semantica |
| CSS Custom Properties | - | Design system (cores, fontes, espacamentos) |

### Dependencias de Desenvolvimento

- @tailwindcss/cli - CLI do Tailwind CSS v4
- fmpeg-static - Processamento de video (assets)

---
## Estrutura do Projeto

`
Scorpion-FSAE/
├── index.html              # Pagina principal (Home)
├── package.json            # Configuracao npm e scripts
├── README.md               # Esta documentacao
├── css/
│   ├── input.css           # Source CSS (Tailwind + custom)
│   └── output.css          # CSS compilado (nao versionado)
├── dist/
│   └── output.css          # CSS final minificado para producao
├── html/
│   ├── equipe.html         # Pagina da equipe/membros
│   ├── patrocinio.html     # Patrocinadores, apoiadores, competicao, sobre
│   ├── loja.html           # Loja de produtos da equipe
│   └── contato.html        # Contato + formulario EmailJS
├── js/
│   ├── ui.js               # Modulo principal (scroll, animacoes, video)
│   ├── startLoading.js     # Tela de loading inicial (2s)
│   ├── teamFade.js         # Fade-in por fileira da equipe
│   └── email.js            # Integracao EmailJS
├── img/
│   ├── Scorpion/           # Assets da equipe (logos, banners, videos)
│   ├── Patrocinadores/     # Logos de patrocinadores/apoiadores
│   └── Icons/              # Icones SVG (WhatsApp, Email)
├── src/
│   └── input.css           # CSS fonte alternativo (contato)
└── node_modules/           # Dependencias npm
`

---