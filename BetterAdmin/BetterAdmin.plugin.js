/**
 * @name BetterAdmin
 * @author AaronL2L
 * @version 1.0.0
 * @description Admin dashboard to manage your servers in bulk: events, security, channels, roles, backups and studio, with Discord's interface. English and French.
 * @invite HdXp7sWRY3
 * @website https://valientebot.xyz
 * @source https://github.com/AaronL2L/BetterDiscordPlugins/tree/main/BetterAdmin
 * @updateUrl https://raw.githubusercontent.com/AaronL2L/BetterDiscordPlugins/main/BetterAdmin/BetterAdmin.plugin.js
 */

const MAX_RETRIES = 5; // 429 : nombre de nouvelles tentatives max (avant : récursion infinie)

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

// ─── Kit d'interface Discord ─────────────────────────────────────────────────
// Bloc identique dans tous mes plugins (seul le préfixe change). Il ne s'appuie
// que sur les variables CSS de Discord (avec valeurs de repli), donc il suit
// automatiquement le thème clair/sombre et les thèmes BetterDiscord.
// Version du kit : 2
const discordKitCSS = (p) => `
.${p}-ui {
    --${p}-bg: var(--modal-background, var(--background-primary, #313338));
    --${p}-bg-alt: var(--background-secondary, #2b2d31);
    --${p}-bg-deep: var(--background-tertiary, #1e1f22);
    --${p}-bg-float: var(--background-floating, #111214);
    --${p}-input: var(--input-background, var(--background-tertiary, #1e1f22));
    --${p}-text: var(--text-normal, #dbdee1);
    --${p}-muted: var(--text-muted, #949ba4);
    --${p}-header: var(--header-primary, #f2f3f5);
    --${p}-header-alt: var(--header-secondary, #b5bac1);
    --${p}-link: var(--text-link, #00a8fc);
    --${p}-brand: var(--brand-500, var(--brand-experiment, #5865f2));
    --${p}-danger: var(--status-danger, #da373c);
    --${p}-success: var(--status-positive, #23a559);
    --${p}-warning: var(--status-warning, #f0b232);
    --${p}-hover: var(--background-modifier-hover, rgba(78, 80, 88, 0.3));
    --${p}-active: var(--background-modifier-active, rgba(78, 80, 88, 0.48));
    --${p}-selected: var(--background-modifier-selected, rgba(78, 80, 88, 0.6));
    --${p}-accent: var(--background-modifier-accent, rgba(78, 80, 88, 0.48));
    --${p}-border: var(--border-subtle, rgba(255, 255, 255, 0.06));
    --${p}-focus: var(--focus-primary, #00b0f4);
    --${p}-radius: 8px;
    color-scheme: dark;
    color: var(--${p}-text);
    font-family: var(--font-primary, "gg sans", "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif);
    font-size: 14px;
    line-height: 1.375;
    -webkit-font-smoothing: antialiased;
}
.theme-light .${p}-ui { color-scheme: light; }
.${p}-ui, .${p}-ui *, .${p}-ui *::before, .${p}-ui *::after { box-sizing: border-box; }
/* L’attribut hidden l’emporte sur les display des composants */
.${p}-ui[hidden], .${p}-ui [hidden] { display: none !important; }

/* Textes */
.${p}-title { margin: 0; color: var(--${p}-header); font-size: 20px; font-weight: 600; line-height: 24px; }
.${p}-heading { margin: 0; color: var(--${p}-header); font-size: 16px; font-weight: 600; line-height: 20px; }
.${p}-subtitle { margin: 4px 0 0; color: var(--${p}-header-alt); font-size: 14px; font-weight: 400; line-height: 20px; }
.${p}-label { display: block; margin: 0 0 8px; color: var(--${p}-header-alt); font-size: 12px; font-weight: 700; line-height: 16px; letter-spacing: .02em; text-transform: uppercase; }
.${p}-hint { margin: 8px 0 0; color: var(--${p}-muted); font-size: 14px; line-height: 20px; }
.${p}-muted { color: var(--${p}-muted); }
.${p}-small { font-size: 12px; line-height: 16px; }
.${p}-link { color: var(--${p}-link); cursor: pointer; text-decoration: none; }
.${p}-link:hover { text-decoration: underline; }
.${p}-field { margin-bottom: 20px; }
.${p}-field:last-child { margin-bottom: 0; }

/* Boutons */
.${p}-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    min-width: 60px; min-height: 38px; margin: 0; padding: 2px 16px;
    border: none; border-radius: var(--${p}-radius);
    color: var(--button-filled-brand-text, #fff);
    background: var(--button-filled-brand-background, var(--${p}-brand));
    font: inherit; font-size: 14px; font-weight: 500; line-height: 16px;
    white-space: nowrap; cursor: pointer; user-select: none;
    transition: background-color .17s ease, color .17s ease, box-shadow .17s ease, opacity .17s ease;
}
.${p}-btn:hover { background: var(--button-filled-brand-background-hover, #4752c4); }
.${p}-btn:active { background: var(--button-filled-brand-background-active, #3c45a5); }
.${p}-btn:focus-visible { outline: 2px solid var(--${p}-focus); outline-offset: 2px; }
.${p}-btn:disabled, .${p}-btn[aria-disabled="true"] { opacity: .5; cursor: not-allowed; pointer-events: none; }
.${p}-btn-sm { min-height: 32px; padding: 2px 12px; }
.${p}-btn-xs { min-width: 0; min-height: 24px; padding: 2px 8px; font-size: 12px; }
.${p}-btn-block { display: flex; width: 100%; }
.${p}-btn-secondary { color: var(--button-secondary-text, #fff); background: var(--button-secondary-background, #4e5058); }
.${p}-btn-secondary:hover { background: var(--button-secondary-background-hover, #6d6f78); }
.${p}-btn-secondary:active { background: var(--button-secondary-background-active, #80848e); }
.${p}-btn-danger { color: #fff; background: var(--button-danger-background, #da373c); }
.${p}-btn-danger:hover { background: var(--button-danger-background-hover, #a12828); }
.${p}-btn-danger:active { background: var(--button-danger-background-active, #8f2022); }
.${p}-btn-success { color: #fff; background: var(--button-positive-background, #248046); }
.${p}-btn-success:hover { background: var(--button-positive-background-hover, #1a6334); }
.${p}-btn-success:active { background: var(--button-positive-background-active, #15562b); }
.${p}-btn-outline { color: var(--${p}-text); background: transparent; box-shadow: inset 0 0 0 1px var(--${p}-accent); }
.${p}-btn-outline:hover { background: var(--${p}-hover); }
.${p}-btn-outline:active { background: var(--${p}-active); }
.${p}-btn-outline-danger { color: var(--${p}-danger); background: transparent; box-shadow: inset 0 0 0 1px var(--${p}-danger); }
.${p}-btn-outline-danger:hover { color: #fff; background: var(--button-danger-background, #da373c); }
.${p}-btn-link { min-width: 0; color: var(--${p}-text); background: transparent; }
.${p}-btn-link:hover, .${p}-btn-link:active { background: transparent; text-decoration: underline; }
.${p}-btn-ghost { color: var(--interactive-normal, #b5bac1); background: transparent; }
.${p}-btn-ghost:hover { color: var(--interactive-hover, #dbdee1); background: var(--${p}-hover); }
.${p}-btn-ghost:active { color: var(--interactive-active, #fff); background: var(--${p}-active); }
.${p}-icon-btn {
    display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto;
    width: 32px; height: 32px; margin: 0; padding: 0;
    border: none; border-radius: var(--${p}-radius); background: transparent;
    color: var(--interactive-normal, #b5bac1); cursor: pointer;
    transition: background-color .17s ease, color .17s ease;
}
.${p}-icon-btn:hover { color: var(--interactive-hover, #dbdee1); background: var(--${p}-hover); }
.${p}-icon-btn:active { color: var(--interactive-active, #fff); background: var(--${p}-active); }
.${p}-icon-btn:focus-visible { outline: 2px solid var(--${p}-focus); outline-offset: 2px; }
.${p}-icon-btn-danger:hover { color: var(--${p}-danger); }
.${p}-icon-btn svg { width: 20px; height: 20px; }

/* Champs */
.${p}-input, .${p}-select, .${p}-textarea {
    display: block; width: 100%; min-height: 40px; margin: 0; padding: 10px;
    border: 1px solid var(--input-border, transparent); border-radius: var(--${p}-radius);
    color: var(--${p}-text); background-color: var(--${p}-input);
    font: inherit; font-size: 16px; line-height: 20px;
    outline: none; transition: border-color .15s ease;
}
.${p}-input::placeholder, .${p}-textarea::placeholder { color: var(--input-placeholder-text, var(--${p}-muted)); }
.${p}-input:focus, .${p}-select:focus, .${p}-textarea:focus { border-color: var(--${p}-link); }
.${p}-input:disabled, .${p}-select:disabled, .${p}-textarea:disabled { opacity: .5; cursor: not-allowed; }
.${p}-input-sm, .${p}-select.${p}-input-sm { min-height: 32px; padding: 6px 8px; font-size: 14px; line-height: 18px; }
.${p}-textarea { min-height: 80px; resize: vertical; }
.${p}-select {
    appearance: none; padding-right: 32px; cursor: pointer;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24'%3E%3Cpath fill='%23949ba4' d='M5.3 9.3a1 1 0 0 1 1.4 0L12 14.58l5.3-5.3a1 1 0 1 1 1.4 1.42l-6 6a1 1 0 0 1-1.4 0l-6-6a1 1 0 0 1 0-1.42Z'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 10px center;
}
.${p}-select.${p}-input-sm { padding-right: 28px; background-position: right 8px center; }
.${p}-select option { color: var(--${p}-text); background: var(--${p}-bg-float); }
.${p}-input-group {
    display: flex; align-items: center;
    border: 1px solid var(--input-border, transparent); border-radius: var(--${p}-radius);
    background: var(--${p}-input); transition: border-color .15s ease;
}
.${p}-input-group:focus-within { border-color: var(--${p}-link); }
.${p}-input-group .${p}-input { border: none; background: transparent; }
.${p}-input-group .${p}-input:focus { border: none; }
.${p}-input-suffix { padding: 0 10px 0 0; color: var(--${p}-muted); font-size: 14px; font-weight: 500; user-select: none; }

/* Case à cocher et interrupteur */
.${p}-check { display: flex; align-items: flex-start; gap: 8px; color: var(--${p}-text); font-size: 14px; line-height: 20px; cursor: pointer; }
.${p}-check input {
    flex: 0 0 auto; width: 20px; height: 20px; margin: 0; appearance: none;
    border: 1px solid var(--interactive-normal, #b5bac1); border-radius: 6px;
    background: transparent no-repeat center / 14px; cursor: pointer;
    transition: background-color .15s ease, border-color .15s ease;
}
.${p}-check input:checked {
    border-color: var(--${p}-brand); background-color: var(--${p}-brand);
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23fff' d='M8.99 16.17 4.83 12l-1.42 1.41L8.99 19 21 7l-1.41-1.41Z'/%3E%3C/svg%3E");
}
.${p}-check input:focus-visible, .${p}-switch:focus-visible { outline: 2px solid var(--${p}-focus); outline-offset: 2px; }
.${p}-switch {
    position: relative; flex: 0 0 auto; width: 40px; height: 24px; margin: 0; appearance: none;
    border-radius: 14px; background: var(--${p}-switch-off, #80848e); cursor: pointer;
    transition: background-color .2s ease;
}
.${p}-switch::after {
    content: ""; position: absolute; top: 3px; left: 3px; width: 18px; height: 18px;
    border-radius: 50%; background: #fff; transition: transform .2s ease;
}
.${p}-switch:checked { background: var(--${p}-success); }
.${p}-switch:checked::after { transform: translateX(16px); }
.${p}-switch:disabled { opacity: .3; cursor: not-allowed; }

/* Ligne de réglage (comme dans les paramètres Discord) */
.${p}-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px 0; border-bottom: 1px solid var(--${p}-border); }
.${p}-row:first-child { padding-top: 0; }
.${p}-row:last-child { padding-bottom: 0; border-bottom: none; }
.${p}-row-title { color: var(--${p}-header); font-size: 16px; font-weight: 500; line-height: 20px; }
.${p}-row-desc { margin-top: 4px; color: var(--${p}-muted); font-size: 14px; line-height: 20px; }

/* Curseur */
.${p}-range { --${p}-fill: 50%; display: block; width: 100%; height: 24px; margin: 0; appearance: none; background: transparent; cursor: pointer; }
.${p}-range::-webkit-slider-runnable-track {
    height: 8px; border-radius: 4px;
    background: linear-gradient(to right, var(--${p}-brand) var(--${p}-fill), var(--${p}-accent) var(--${p}-fill));
}
.${p}-range::-webkit-slider-thumb {
    width: 10px; height: 24px; margin-top: -8px; appearance: none;
    border: 1px solid var(--interactive-muted, #dbdee1); border-radius: 3px; background: #fff;
    box-shadow: 0 3px 1px 0 rgba(0, 0, 0, .05), 0 2px 2px 0 rgba(0, 0, 0, .1), 0 3px 3px 0 rgba(0, 0, 0, .05);
    cursor: grab;
}
.${p}-range:active::-webkit-slider-thumb { cursor: grabbing; }
.${p}-range:focus { outline: none; }
.${p}-range:focus-visible::-webkit-slider-thumb { outline: 2px solid var(--${p}-focus); outline-offset: 2px; }
.${p}-range-marks { display: flex; justify-content: space-between; margin-top: 4px; color: var(--${p}-muted); font-size: 12px; font-weight: 500; line-height: 16px; }

/* Conteneurs */
.${p}-card { padding: 16px; border: 1px solid var(--${p}-border); border-radius: var(--${p}-radius); background: var(--${p}-bg-alt); }
.${p}-divider { height: 1px; margin: 16px 0; border: none; background: var(--${p}-border); }
.${p}-list-item { display: flex; align-items: center; gap: 12px; padding: 8px 12px; border-radius: var(--${p}-radius); transition: background-color .1s ease; }
.${p}-list-item:hover { background: var(--${p}-hover); }
.${p}-avatar { flex: 0 0 auto; width: 32px; height: 32px; border-radius: 50%; object-fit: cover; background: var(--${p}-bg-deep); }
.${p}-stat-value { color: var(--${p}-header); font-size: 20px; font-weight: 700; line-height: 24px; }
.${p}-stat-label { color: var(--${p}-muted); font-size: 12px; font-weight: 500; line-height: 16px; }
.${p}-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 40px 16px; color: var(--${p}-muted); text-align: center; }
.${p}-empty-title { color: var(--${p}-header); font-size: 16px; font-weight: 600; line-height: 20px; }

/* Étiquettes et encadrés */
.${p}-tag {
    display: inline-flex; align-items: center; height: 16px; padding: 0 5px;
    border-radius: 4px; background: var(--${p}-brand); color: #fff;
    font-size: 10px; font-weight: 600; line-height: 16px; letter-spacing: .02em; text-transform: uppercase; vertical-align: middle;
}
.${p}-pill {
    display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px;
    border-radius: 999px; background: var(--${p}-accent); color: var(--${p}-header-alt);
    font-size: 12px; font-weight: 500; line-height: 16px; white-space: nowrap;
}
.${p}-pill-brand { color: var(--${p}-brand); background: color-mix(in srgb, var(--${p}-brand) 16%, transparent); }
.${p}-pill-danger { color: var(--${p}-danger); background: color-mix(in srgb, var(--${p}-danger) 16%, transparent); }
.${p}-pill-success { color: var(--${p}-success); background: color-mix(in srgb, var(--${p}-success) 16%, transparent); }
.${p}-pill-warning { color: var(--${p}-warning); background: color-mix(in srgb, var(--${p}-warning) 16%, transparent); }
/* Thème clair : jaune et vert assombris pour rester lisibles sur fond pâle */
.theme-light .${p}-pill-warning { color: color-mix(in srgb, var(--${p}-warning) 55%, #000); }
.theme-light .${p}-pill-success { color: color-mix(in srgb, var(--${p}-success) 70%, #000); }
.${p}-notice {
    display: flex; align-items: flex-start; gap: 8px; padding: 10px 12px;
    border: 1px solid color-mix(in srgb, var(--${p}-brand) 40%, transparent); border-radius: var(--${p}-radius);
    background: color-mix(in srgb, var(--${p}-brand) 10%, transparent);
    color: var(--${p}-text); font-size: 14px; line-height: 20px;
}
.${p}-notice-warning { border-color: color-mix(in srgb, var(--${p}-warning) 40%, transparent); background: color-mix(in srgb, var(--${p}-warning) 10%, transparent); }
.${p}-notice-danger { border-color: color-mix(in srgb, var(--${p}-danger) 40%, transparent); background: color-mix(in srgb, var(--${p}-danger) 10%, transparent); }
.${p}-notice-success { border-color: color-mix(in srgb, var(--${p}-success) 40%, transparent); background: color-mix(in srgb, var(--${p}-success) 10%, transparent); }

/* Onglets */
.${p}-tabs { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.${p}-tab {
    margin: 0; padding: 2px 8px; border: none; border-radius: 6px; background: transparent;
    color: var(--interactive-normal, #b5bac1); font: inherit; font-size: 16px; font-weight: 500; line-height: 24px;
    cursor: pointer; transition: background-color .1s ease, color .1s ease;
}
.${p}-tab:hover { color: var(--interactive-hover, #dbdee1); background: var(--${p}-hover); }
.${p}-tab.${p}-active, .${p}-tab[aria-selected="true"] { color: var(--interactive-active, #fff); background: var(--${p}-selected); cursor: default; }
.${p}-tab:focus-visible { outline: 2px solid var(--${p}-focus); outline-offset: 2px; }

/* Progression */
.${p}-progress { height: 8px; overflow: hidden; border-radius: 4px; background: var(--${p}-accent); }
.${p}-progress-bar { width: 0; height: 100%; border-radius: inherit; background: var(--${p}-brand); transition: width .3s ease; }

/* Barre de défilement fine (comme Discord) */
.${p}-scroller { overflow-y: auto; }
.${p}-scroller::-webkit-scrollbar { width: 8px; height: 8px; }
.${p}-scroller::-webkit-scrollbar-track { background: transparent; }
.${p}-scroller::-webkit-scrollbar-thumb {
    min-height: 40px; border: 2px solid transparent; border-radius: 4px;
    background: var(--scrollbar-thin-thumb, #1a1b1e) padding-box;
}
.${p}-scroller::-webkit-scrollbar-corner { background: transparent; }

/* Infobulle (comme Discord) : left/top = point d'ancrage, posés en JS ; --${p}-tip-shift garde
   la flèche sur l'ancre quand l'infobulle est décalée pour rester dans l'écran */
.${p}-tooltip {
    position: fixed; z-index: 1; width: max-content; max-width: 240px; padding: 8px 12px;
    border-radius: var(--${p}-radius); background: var(--${p}-bg-float); color: var(--${p}-text);
    box-shadow: var(--shadow-high, 0 8px 16px rgba(0, 0, 0, .24));
    font-size: 14px; font-weight: 500; line-height: 18px; white-space: pre-line; overflow-wrap: anywhere;
    pointer-events: none; transform: translate(-50%, -100%); animation: ${p}-fade .1s ease-out;
}
.${p}-tooltip::after { content: ""; position: absolute; top: 100%; left: calc(50% - var(--${p}-tip-shift, 0px)); margin-left: -5px; border: 5px solid transparent; border-top-color: var(--${p}-bg-float); }
.${p}-tooltip-bottom { transform: translate(-50%, 0); }
.${p}-tooltip-bottom::after { top: auto; bottom: 100%; border-top-color: transparent; border-bottom-color: var(--${p}-bg-float); }

/* Fenêtre modale (sous les calques de Discord : notifications, menus et
   fenêtres de BetterDiscord restent visibles par-dessus) */
.${p}-backdrop {
    position: fixed; inset: 0; z-index: 1000;
    display: flex; align-items: center; justify-content: center; padding: 40px 16px;
    background: rgba(0, 0, 0, .7); animation: ${p}-fade .15s ease-out;
}
.${p}-modal {
    display: flex; flex-direction: column; width: 440px; max-width: 100%; max-height: 100%;
    overflow: hidden; border-radius: 12px; background: var(--${p}-bg);
    box-shadow: 0 0 0 1px var(--${p}-border), var(--elevation-high, 0 8px 16px rgba(0, 0, 0, .24));
    animation: ${p}-pop .2s cubic-bezier(.2, .9, .3, 1.1);
}
.${p}-modal-header { display: flex; align-items: flex-start; gap: 12px; padding: 16px 16px 12px; }
.${p}-modal-header > div { flex: 1 1 auto; min-width: 0; }
.${p}-modal-body { flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 4px 16px 20px; }
.${p}-modal-footer {
    display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 8px;
    padding: 16px; background: var(--modal-footer-background, var(--${p}-bg-alt));
}
.${p}-close { margin: -4px -4px 0 0; }

@keyframes ${p}-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes ${p}-pop { from { opacity: 0; transform: scale(.96); } to { opacity: 1; transform: scale(1); } }
@media (prefers-reduced-motion: reduce) {
    .${p}-ui, .${p}-ui * { animation: none !important; transition: none !important; }
}
.reduce-motion .${p}-ui, .reduce-motion .${p}-ui * { animation: none !important; transition: none !important; }
`;

// Icône « fermer » de Discord (24 px, prend la couleur du texte)
const ICON_CLOSE = `<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M17.3 18.7a1 1 0 0 0 1.4-1.4L13.42 12l5.3-5.3a1 1 0 0 0-1.42-1.4L12 10.58l-5.3-5.3a1 1 0 0 0-1.4 1.42L10.58 12l-5.3 5.3a1 1 0 1 0 1.42 1.4L12 13.42l5.3 5.3Z"/></svg>`;

// Icônes au trait (24 px, couleur du texte), à la place des emojis
const ICON_PATHS = {
    text: "M10 3 8 21M16 3l-2 18M4 8h17M3 16h17",
    voice: "M11 5 6 9H3v6h3l5 4V5ZM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13",
    announcement: "m3 11 18-5v12L3 14v-3ZM11.6 16.8a3 3 0 1 1-5.8-1.6",
    forum: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z",
    category: "m6 9 6 6 6-6",
    trash: "M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6",
    edit: "M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z",
    plus: "M12 5v14M5 12h14"
};
const CHANNEL_ICON = { 0: "text", 2: "voice", 4: "category", 5: "announcement", 13: "voice", 15: "forum" };
const Icon = ({ name, size = 16, className }) => BdApi.React.createElement("svg", {
    "aria-hidden": "true", width: size, height: size, viewBox: "0 0 24 24", className,
    fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round"
}, BdApi.React.createElement("path", { d: ICON_PATHS[name] }));

// Aperçu du markdown Discord (sous-ensemble courant), rendu en éléments React : aucun HTML injecté
const MD_INLINE = /\*\*([\s\S]+?)\*\*(?!\*)|__([\s\S]+?)__|~~([\s\S]+?)~~|\|\|([\s\S]+?)\|\||`([^`]+)`|\*([^*\s][^*]*?)\*|(?<!\w)_([^_\s][^_]*?)_(?!\w)|(https?:\/\/[^\s<]+[^\s<.,:;"')\]])/;
const mdInline = (text, key = "m") => {
    const h = BdApi.React.createElement;
    const out = [];
    let rest = text, i = 0;
    while (rest) {
        const m = rest.match(MD_INLINE);
        if (!m) { out.push(rest); break; }
        if (m.index) out.push(rest.slice(0, m.index));
        const k = `${key}-${i++}`;
        if (m[1] != null) out.push(h("strong", { key: k }, mdInline(m[1], k)));
        else if (m[2] != null) out.push(h("u", { key: k }, mdInline(m[2], k)));
        else if (m[3] != null) out.push(h("s", { key: k }, mdInline(m[3], k)));
        else if (m[4] != null) out.push(h("span", { key: k, className: "ba-md-spoiler" }, mdInline(m[4], k)));
        else if (m[5] != null) out.push(h("code", { key: k, className: "ba-md-code" }, m[5]));
        else if (m[6] != null || m[7] != null) out.push(h("em", { key: k }, mdInline(m[6] ?? m[7], k)));
        else out.push(h("span", { key: k, className: "ba-md-link" }, m[8]));
        rest = rest.slice(m.index + m[0].length);
    }
    return out;
};
const renderMarkdown = text => text.split("\n").map((line, i) => {
    const h = BdApi.React.createElement;
    const k = `l${i}`;
    let m;
    if ((m = line.match(/^(#{1,3}) (.+)/))) return h("div", { key: i, className: `ba-md-h${m[1].length}` }, mdInline(m[2], k));
    if ((m = line.match(/^-# (.+)/))) return h("div", { key: i, className: "ba-md-sub" }, mdInline(m[1], k));
    if ((m = line.match(/^> ?(.*)/))) return h("div", { key: i, className: "ba-md-quote" }, m[1] ? mdInline(m[1], k) : "\u200b");
    if ((m = line.match(/^\s*[-*] (.+)/))) return h("div", { key: i, className: "ba-md-li" }, mdInline(m[1], k));
    return h("div", { key: i }, line ? mdInline(line, k) : "\u200b");
});

// Rôles du pack « Hiérarchie du staff », du plus haut au plus bas
const STAFF_PACK = [
    { get name() { return t("staff.founder"); }, color: 0xe91e63, hoist: true, mentionable: true, permissions: "8" },
    { get name() { return t("staff.admin"); }, color: 0x9b59b6, hoist: true, mentionable: true, permissions: "8" },
    // Membre + droits du Helper + expulser, bannir, voir les logs, rendre sourd, déplacer, gérer les pseudos
    { get name() { return t("staff.mod"); }, color: 0x3498db, hoist: true, mentionable: true, permissions: "2188553744071" },
    // Membre + gérer les messages et les fils, exclure temporairement, couper le micro
    { name: "🌱 Helper", color: 0x2ecc71, hoist: true, mentionable: true, permissions: "2188394360385" },
    { get name() { return t("staff.member"); }, color: 0x95a5a6, hoist: false, mentionable: false, permissions: "1071698660929" }
];

const STYLE_ID = "better-admin-cockpit-styles";

// ─── Traductions ─────────────────────────────────────────────────────────────
// Bloc identique dans tous mes plugins. Le texte suit la langue de Discord :
// français si Discord est en français, anglais pour toutes les autres langues.
// Une valeur peut être une fonction, pour les pluriels et les textes à trous.
// Version des traductions : 2
let localeStore;
const getLang = () => {
    if (localeStore === undefined) localeStore = BdApi.Webpack.getStore("LocaleStore") ?? null;
    const locale = localeStore?.locale || document.documentElement.lang || "en";
    return String(locale).toLowerCase().startsWith("fr") ? "fr" : "en";
};
const makeT = (strings) => (key, ...args) => {
    const s = strings[getLang()]?.[key] ?? strings.en[key] ?? key;
    return typeof s === "function" ? s(...args) : s;
};

// Pluriel : en français, 0 et 1 sont au singulier ; en anglais, seul 1 l'est
const plural = (n, one, many) => ((getLang() === "fr" ? n > 1 : n !== 1) ? many : one);

const t = makeT({
    en: {
        "unknown": "Unknown",
        "task.abortedByUser": "Task stopped by the user.",
        "err.noHttp": "Discord's internal HTTP module was not found.",
        "err.network": "Network error",
        "err.download": (a) => `${a} – download failed`,
        "err.readFile": "Couldn't read the file",
        "task.busy": "An action is already running.",
        "task.starting": "Starting…",
        "task.cancelling": "Cancelling…",
        "task.stopped": "Action stopped.",
        "cal.server": "Discord server",
        "cal.event": "Discord event",
        "cal.eventOn": (a) => `Event on the ${a} server`,
        "cal.reminder": (a) => `Reminder: ${a}`,
        "cal.icsDone": "Calendar file (.ics) downloaded, with a reminder 30 min before.",
        "cal.hostedOn": (a) => `Hosted on: ${a}`,
        "menu.open": "Open BetterAdmin",
        "member": "Member",
        "lock.on": "Server locked: @everyone can no longer write, react, speak or invite.",
        "lock.off": "Server unlocked, original permissions restored.",
        "nuke.message": "💥 *This channel has been reset successfully.*",
        "nuke.done": (a) => `Channel #${a} reset.`,
        "purge.task": "Channel purge",
        "purge.done": (a) => `${a} ${plural(a, "message", "messages")} deleted.`,
        "export.extracting": (a) => `Extracting #${a}…`,
        "export.empty": "No messages to export.",
        "server": "Server",
        "export.done": (a) => `Archive downloaded (${a})!`,
        "export.failed": (a) => `Export failed: ${a}`,
        "webhook.name": "Official Announcement",
        "deploy.badFormat": "Invalid template format: the 'roles' and 'channels' lists are required.",
        "deploy.none": "Nothing selected to deploy.",
        "deploy.task": (a) => `Deploying “${a}”`,
        "untitled": "Untitled",
        "deploy.role": (a) => `Role: ${a}`,
        "deploy.category": (a) => `Category: ${a}`,
        "deploy.channel": (a) => `Channel: #${a}`,
        "deploy.done": "Server structure deployed.",
        "bulk.delChannelsTask": (a) => `Deleting ${a} ${plural(a, "channel", "channels")}`,
        "bulk.delChannelsDone": (a) => `${a} ${plural(a, "channel", "channels")} deleted.`,
        "bulk.delRolesTask": (a) => `Deleting ${a} ${plural(a, "role", "roles")}`,
        "bulk.delRolesDone": (a) => `${a} ${plural(a, "role", "roles")} deleted.`,
        "bulk.slowTask": (a, b) => `Slow mode ${a} s on ${b} ${plural(b, "channel", "channels")}`,
        "bulk.slowDone": (a, b) => `Slow mode of ${a} s applied to ${b} ${plural(b, "channel", "channels")}.`,
        "bulk.editRolesTask": (a) => `Editing ${a} ${plural(a, "role", "roles")}`,
        "bulk.editRolesDone": (a) => `${a} ${plural(a, "role", "roles")} updated.`,
        "staff.founder": "👑 Founder",
        "staff.admin": "🛡️ Administrator",
        "staff.mod": "🔨 Moderator",
        "staff.member": "👤 Member",
        "tab.error": "This tab ran into an error. The other tabs still work.",
        "tab.retry": "Retry",
        "color.hex": (a) => `${a} (hexadecimal)`,
        "pick.subtitle": "Check the items to include.",
        "close": "Close",
        "pick.typeTabs": "Item type",
        "pick.tabAll": (a) => `All (${a})`,
        "pick.tabRoles": (a, b) => `Roles (${a}/${b})`,
        "pick.tabChannels": (a, b) => `Channels (${a}/${b})`,
        "pick.filter": "Filter",
        "pick.filterLabel": "Filter roles and channels",
        "pick.checkAll": "Check all",
        "pick.uncheckAll": "Uncheck all",
        "pick.rolesOnly": "Roles only",
        "pick.channelsOnly": "Channels only",
        "pick.rolesHead": (a, b) => `Roles — ${a}/${b}`,
        "pick.noRoles": "No roles found.",
        "role.hoistTip": "Displayed separately in the member list",
        "role.hoisted": "Separate",
        "pick.channelsHead": (a, b) => `Channels and categories — ${a}/${b}`,
        "pick.noChannels": "No channels found.",
        "pick.catTip": "Check or uncheck the whole category",
        "count.channels": (a) => `${a} ${plural(a, "channel", "channels")}`,
        "pick.noCategory": "No category",
        "pick.footer": (a, b) => `${a} ${plural(a, "role", "roles")} · ${b} ${plural(b, "channel", "channels")} selected`,
        "cancel": "Cancel",
        "pick.needOne": "Select at least one item.",
        "pick.confirm": (a) => `Confirm (${a})`,
        "ev.defaultName": "🏆 Community Night / Tournament",
        "ev.defaultDesc": "Join us for our exclusive event!",
        "grad.defaultPrefix": "✦ Rank",
        "canned.d1Title": "Rules reminder",
        "canned.d1Text": "Please follow the server rules and stay polite with other members.",
        "canned.d2Title": "No DM advertising",
        "canned.d2Text": "Reminder: soliciting or unsolicited advertising in DMs is strictly forbidden.",
        "members.partial": (a, b) => `Only ${a} of ${b} members are loaded locally by Discord: the lists and bulk actions below only cover these members.`,
        "members.unknown": (a) => `Total member count unknown (${a} loaded locally): the lists and bulk actions below may be incomplete.`,
        "vault.saved": (a, b) => `Backup saved (${a} ${plural(a, "role", "roles")}, ${b} ${plural(b, "channel", "channels")}).`,
        "vault.exported": (a, b) => `JSON template exported (${a} ${plural(a, "role", "roles")}, ${b} ${plural(b, "channel", "channels")}).`,
        "nav.sEvents": "Events",
        "nav.events": "Events and calendar",
        "nav.sSecurity": "Security",
        "nav.security": "Anti-raid and lockdown",
        "nav.ghostpings": "Ghost pings",
        "nav.bios": "Suspicious statuses",
        "nav.sBulk": "Bulk management",
        "nav.channels": "Channels and categories",
        "nav.styler": "Channel styler",
        "nav.catPerms": "Category permissions",
        "nav.gradients": "Role gradients",
        "nav.cleanRoles": "Roles and cleanup",
        "nav.massRoles": "Role assignment",
        "nav.assets": "Emojis and soundboard",
        "nav.vault": "Backups and templates",
        "nav.media": "Media gallery",
        "nav.embed": "Embed studio",
        "nav.canned": "Canned responses",
        "nav.packs": "Express packs",
        "closeEsc": "Close (Esc)",
        "ev.createHead": "Create a Discord event",
        "ev.name": "Event name",
        "ev.locType": "Location type",
        "ev.voice": "Voice channel",
        "ev.external": "External location (link or address)",
        "ev.linkOrAddress": "Link or address",
        "ev.start": "Start",
        "ev.end": "End",
        "ev.descPh": "Event description...",
        "ev.created": "Event created.",
        "ev.create": "Create event",
        "ev.downloadIcs": "Download the .ics",
        "ev.gLinkCopied": "Google Calendar link copied.",
        "ev.copyGLink": "Copy the Google Calendar link",
        "ev.listHead": (a) => `Scheduled events (${a})`,
        "refresh": "Refresh",
        "ev.none": "No scheduled events found on this server.",
        "ev.interested": (a) => `${a} interested`,
        "ev.icsFile": ".ics file",
        "ev.addToCal": "Add to your calendar:",
        "ev.gCalLink": "Google Calendar link",
        "ev.msgCopied": "Message copied.",
        "ev.copyReminder": "Copy reminder",
        "ev.cancelTitle": "Cancel event",
        "ev.cancelConfirm": (a) => `Do you really want to cancel the event "${a}"?`,
        "ev.cancelled": "Event cancelled.",
        "styler.textPrefix": "Text channel prefix",
        "styler.voicePrefix": "Voice channel prefix",
        "styler.smallCaps": "Write names in small caps (e.g. ɢᴇɴᴇʀᴀʟ)",
        "styler.preview": "Preview: ",
        "styler.renameTitle": "Rename channels",
        "styler.renameConfirm": (a) => `Do you want to format the name of ${a} ${plural(a, "channel", "channels")}?`,
        "styler.task": "Renaming channels",
        "styler.done": "Channels renamed.",
        "styler.apply": "Apply to all channels",
        "perms.source": "Template category",
        "perms.target": "Category to sync",
        "perms.pickTwo": "Pick two different categories.",
        "perms.hint": "The template category's permissions replace those of the category to sync.",
        "perms.done": "Permissions copied.",
        "perms.sync": "Sync permissions",
        "clean.empty": (a) => `Empty roles: ${a}`,
        "clean.emptyHint": "Roles with 0 members.",
        "clean.disabled": "Disabled: member list incomplete.",
        "clean.deleteEmptyTitle": "Delete empty roles",
        "clean.deleteEmptyConfirm": (a) => `Permanently delete ${a} orphan ${plural(a, "role", "roles")}?`,
        "deleteN": (a) => `Delete (${a})`,
        "clean.hoisted": (a) => `Hoisted members: ${a}`,
        "clean.hoistedHint": "Nicknames starting with !, ? or .",
        "clean.dehoist": "Dehoist",
        "clean.dehoistConfirm": (a) => `Reset the nickname prefix of ${a} ${plural(a, "member", "members")}?`,
        "clean.dehoistTask": "Fixing nicknames",
        "clean.dehoistDone": "Nicknames fixed.",
        "clean.dehoistN": (a) => `Dehoist (${a})`,
        "roles.all": (a) => `All roles (${a})`,
        "selectAllN": (a) => `Select all (${a})`,
        "deselectAll": "Deselect all",
        "roles.filter": "Filter roles by name...",
        "roles.selected": (a) => `${a} ${plural(a, "role", "roles")} selected`,
        "roles.bulkDeleteTitle": "Bulk role deletion",
        "roles.bulkDeleteConfirm": (a) => `Do you want to permanently delete ${a} checked ${plural(a, "role", "roles")}?`,
        "roles.color": "Role color",
        "roles.applyColor": "Apply color",
        "roles.hoist": "Display separately",
        "roles.mentionable": "Mentionable",
        "roles.countTip": "Counted among locally loaded members only",
        "roles.memberCount": (a, b) => `${a}${b} ${plural(a, "member", "members")}`,
        "roles.deleteTitle": "Delete role",
        "roles.deleteConfirm": (a) => `Do you want to delete the role "${a}"?`,
        "roles.deleted": (a) => `Role ${a} deleted.`,
        "delete": "Delete",
        "mass.role": "Role to assign",
        "mass.targets": "Target members",
        "mass.allServer": "All server members",
        "mass.allLoaded": "All loaded members",
        "mass.noRole": "Only members without any role",
        "mass.botsExcluded": "Bots are always excluded.",
        "mass.confirmTitle": "Role assignment",
        "mass.confirm": (a) => `Assign this role to ${a} ${plural(a, "member", "members")}?`,
        "mass.task": (a) => `Assigning the role to ${a} ${plural(a, "member", "members")}`,
        "mass.done": (a) => `Role assigned to ${a} ${plural(a, "member", "members")}.`,
        "mass.start": "Start assigning",
        "assets.source": "Source server",
        "assets.noEmojis": "No emojis on the source server.",
        "assets.emojisTask": (a) => `Cloning ${a} ${plural(a, "emoji", "emojis")}`,
        "assets.emojisDone": (a) => `${a} ${plural(a, "emoji", "emojis")} cloned`,
        "assets.failed": (a) => `, ${a} failed (slots full?)`,
        "assets.stopped": (a) => `Cloning stopped: ${a}`,
        "assets.cloneEmojis": "Clone emojis",
        "assets.noSounds": "No sounds on the source server.",
        "assets.soundsTask": (a) => `Cloning ${a} ${plural(a, "sound", "sounds")}`,
        "assets.soundsDone": (a) => `${a} ${plural(a, "sound", "sounds")} cloned`,
        "assets.cloneSounds": "Clone soundboard",
        "vault.badJson": "Invalid JSON format (roles or channels missing).",
        "vault.importTitle": (a) => `Import template “${a}”`,
        "vault.importSub": "Select the roles, categories and channels to import on this server.",
        "vault.readError": (a) => `Read error: ${a}`,
        "vault.backupHead": "Backup and restore",
        "vault.backupHint": "Save this server's structure to your local vault, or export/import a JSON template file with a custom selection.",
        "vault.reading": "Reading the current structure...",
        "vault.backupTitle": (a) => `Back up ${a}`,
        "vault.backupSub": "Check the roles and channels of the current server to save in your local vault.",
        "vault.error": (a) => `Error: ${a}`,
        "vault.create": "Create a backup",
        "vault.exportTitle": (a) => `Export ${a} as JSON`,
        "vault.exportSub": "Check the roles and channels to include in the exported JSON template file.",
        "vault.exportError": (a) => `Export error: ${a}`,
        "vault.exportJson": "Export as JSON",
        "vault.importJson": "Import a JSON",
        "vault.cloneHead": "Clone from another server",
        "vault.cloneHint": "Copy the structure (roles, categories, channels and permissions) of one of your other servers straight to this one, with a custom selection.",
        "vault.pickSource": "Select a source server.",
        "vault.loadingSource": "Loading the source structure...",
        "vault.cloneTitle": (a, b) => `Clone ${a} to ${b}`,
        "vault.cloneSub": (a) => `Select the roles, categories and channels of "${a}" to clone straight to this server.`,
        "vault.sourceError": (a) => `Couldn't read the source server: ${a}`,
        "vault.cloneHere": "Clone to this server",
        "vault.localHead": (a) => `Local backups (${a})`,
        "vault.emptyTitle": "Empty the vault",
        "vault.emptyConfirm": "Do you want to delete all saved snapshots?",
        "vault.emptied": "Vault emptied.",
        "vault.deleteAll": "Delete all",
        "vault.none": "No snapshots in your vault yet. Click “Create a backup” to save the current state.",
        "vault.snapMeta": (a, b) => `${a} ${plural(a, "role", "roles")} · ${b} ${plural(b, "channel or category", "channels and categories")}`,
        "vault.deployTitle": (a) => `Deploy backup “${a}”`,
        "vault.deploySub": (a) => `Select the roles, categories and channels from the ${a} snapshot to deploy on this server.`,
        "vault.deploy": "Deploy",
        "vault.downloaded": "Backup downloaded as JSON.",
        "vault.export": "Export",
        "vault.snapDeleted": "Snapshot deleted.",
        "canned.editHead": "Edit response",
        "canned.new": "New response",
        "canned.name": "Name",
        "canned.namePh": "E.g. Rules reminder",
        "canned.textPh": "The text that will be sent in the channel",
        "save": "Save",
        "canned.sentIn": (a) => `Sent in the open channel: #${a}`,
        "canned.openChannel": "Open a text channel to be able to send a response.",
        "canned.none": "No canned responses. Create one to send it later in one click.",
        "edit": "Edit",
        "canned.editLabel": (a) => `Edit “${a}”`,
        "canned.deleteLabel": (a) => `Delete “${a}”`,
        "canned.deleteTitle": "Delete response",
        "canned.deleteConfirm": (a) => `Delete the response “${a}”?`,
        "canned.sent": (a) => `Sent in #${a}.`,
        "canned.sendError": (a) => `Couldn't send: ${a}`,
        "send": "Send",
        "lock.head": "Panic mode (emergency lockdown)",
        "lock.hint": "Instantly cuts writing, reactions and voice for @everyone, saving the previous state.",
        "lock.title": "Lock the server",
        "lock.confirm": "Do you want to immediately lock writing and invites for @everyone across the whole server?",
        "lock.btn": "Lock",
        "unlock.title": "Unlock the server",
        "unlock.confirm": "Restore the exact original permissions of @everyone?",
        "unlock.btn": "Unlock",
        "grad.prefix": "Role prefix",
        "grad.count": "Number of roles",
        "grad.countHint": "Between 2 and 50.",
        "grad.colorA": "Start color",
        "grad.colorB": "End color",
        "grad.title": "Generate gradient",
        "grad.confirm": (a) => `Create a palette of ${a} roles with these colors?`,
        "grad.task": (a) => `Creating ${a} gradient roles`,
        "grad.done": "Gradient roles created.",
        "grad.btn": (a) => `Generate ${a} roles`,
        "media.head": (a) => `Media gallery (${a})`,
        "media.channel": "Channel to scan",
        "media.readError": (a) => `Couldn't read this channel: ${a}`,
        "media.searching": "Searching…",
        "media.search": "Search media",
        "media.none": "No images or videos in the last 100 messages of this channel.",
        "media.intro": "Pick a channel, then start the search: images and videos from the last 100 messages will show up here.",
        "media.deleted": "Message deleted.",
        "media.deleteError": (a) => `Couldn't delete: ${a}`,
        "media.deleteTitle": "Delete message",
        "media.deleteConfirm": (a) => `Delete ${a}'s message? All its attachments will be deleted.`,
        "media.deleteTip": "Delete (Shift + click: no confirmation)",
        "gp.head": (a) => `Ghost pings (${a})`,
        "gp.cleared": "History cleared.",
        "gp.clear": "Clear history",
        "gp.none": "No ghost pings detected recently on this server.",
        "gp.mentioned": (a, b) => `${a} mentioned ${b}`,
        "gp.empty": "Empty message or attachment",
        "bios.head": (a) => `Suspicious statuses (${a})`,
        "bios.none": "No suspicious statuses detected.",
        "bios.status": (a) => `Status: "${a}"`,
        "bios.kickTitle": "Kick member",
        "bios.kickConfirm": (a, b) => `Do you want to kick ${a} for a suspicious status ("${b}")?`,
        "bios.kicking": (a) => `Kicking ${a}`,
        "bios.kick": "Kick",
        "ch.head": (a) => `Channels and categories (${a})`,
        "ch.filter": "Filter channels...",
        "ch.filterType": "Filter by type",
        "ch.all": (a) => `All (${a})`,
        "ch.cats": (a) => `Categories (${a})`,
        "ch.text": (a) => `Text (${a})`,
        "ch.voice": (a) => `Voice (${a})`,
        "ch.selected": (a) => `${a} ${plural(a, "item", "items")} selected`,
        "ch.bulkDeleteTitle": "Bulk channel deletion",
        "ch.bulkDeleteConfirm": (a) => `Are you sure you want to permanently delete ${a} ${plural(a, "channel / category", "channels / categories")}? Warning, this can't be undone!`,
        "ch.noText": "No text channels in the selection.",
        "ch.bulkPurgeTitle": "Bulk purge",
        "ch.bulkPurgeConfirm": (a) => `Purge the last 50 messages of ${a} selected text ${plural(a, "channel", "channels")}?`,
        "ch.bulkPurgeTask": (a) => `Purging ${a} ${plural(a, "channel", "channels")}`,
        "ch.bulkPurgeDone": (a, b) => `Purge complete: ${a} ${plural(a, "message", "messages")} deleted in ${b} ${plural(b, "channel", "channels")}.`,
        "ch.purgeMessages": "Purge messages",
        "slow.label": "Slow mode",
        "slow.off": "Slow mode off",
        "slow.sec": (a) => `${a} ${plural(a, "second", "seconds")}`,
        "slow.min": (a) => `${a} ${plural(a, "minute", "minutes")}`,
        "slow.hour": (a) => `${a} ${plural(a, "hour", "hours")}`,
        "slow.needText": "Select at least one text channel for slow mode.",
        "slow.apply": "Apply slow mode",
        "ch.none": "No channels or categories found.",
        "ch.catPill": "CATEGORY",
        "slow.pill": (a) => `Slow mode ${a} s`,
        "ch.purgeTitle": "Channel purge",
        "ch.purgeConfirm": (a) => `Do you want to purge the last 50 messages of #${a}?`,
        "ch.purge": "Purge",
        "ch.nukeTitle": "Nuke channel",
        "ch.nukeConfirm": (a) => `Are you absolutely sure you want to reset and recreate #${a} from scratch?`,
        "ch.deleteTitle": "Delete channel",
        "ch.deleteCatConfirm": (a) => `Do you want to permanently delete the category "${a}"?`,
        "ch.deleteChConfirm": (a) => `Do you want to permanently delete the channel "${a}"?`,
        "ch.deleted": (a) => `Channel ${a} deleted.`,
        "embed.channel": "Channel",
        "embed.title": "Title",
        "embed.titlePh": "Announcement title",
        "embed.descPh": "Your message…",
        "embed.mdHint": "Markdown supported: **bold**, *italic*, __underline__, ~~strikethrough~~, `code`, ||spoiler||, # heading, > quote, - list.",
        "embed.color": "Color",
        "embed.colorLabel": "Embed color",
        "embed.sent": "Announcement sent.",
        "embed.send": "Send announcement",
        "embed.preview": "Preview",
        "embed.today": "Today",
        "embed.empty": "Write a title or a message to see the preview.",
        "staff.head": "Staff hierarchy",
        "staff.hint": "Creates these 5 roles, from highest to lowest:",
        "staff.adminTip": "This role will have the Administrator permission",
        "staff.title": "Deploy the staff hierarchy",
        "staff.confirm": (a, b) => `Create the ${a} staff roles on this server?\n${b} of them will have the Administrator permission.`,
        "staff.done": "Staff hierarchy created.",
        "staff.stopped": (a, b) => `Stopped after ${a} ${plural(a, "role", "roles")}: ${b}`,
        "staff.generate": "Generate",
        "confirm": "Confirm",
        "dock.busy": "Running",
        "dock.ready": "Ready",
        "dock.summary": (a, b) => `${a} ${plural(a, "role", "roles")} · ${b} ${plural(b, "channel", "channels")}`,
        "dock.cancelTask": "Cancel task",
        "ch.inCat": (a) => `in ${a}`
    },
    fr: {
        "unknown": "Inconnu",
        "task.abortedByUser": "Tâche interrompue par l'utilisateur.",
        "err.noHttp": "Module HTTP interne de Discord introuvable.",
        "err.network": "Erreur réseau",
        "err.download": (a) => `${a} – téléchargement impossible`,
        "err.readFile": "Lecture du fichier impossible",
        "task.busy": "Une action est déjà en cours d'exécution.",
        "task.starting": "Démarrage…",
        "task.cancelling": "Annulation…",
        "task.stopped": "Action interrompue.",
        "cal.server": "Serveur Discord",
        "cal.event": "Événement Discord",
        "cal.eventOn": (a) => `Événement sur le serveur ${a}`,
        "cal.reminder": (a) => `Rappel : ${a}`,
        "cal.icsDone": "Fichier calendrier (.ics) téléchargé, avec un rappel 30 min avant.",
        "cal.hostedOn": (a) => `Organisé sur : ${a}`,
        "menu.open": "Ouvrir BetterAdmin",
        "member": "Membre",
        "lock.on": "Serveur verrouillé : @everyone ne peut plus écrire, réagir, parler ni inviter.",
        "lock.off": "Serveur déverrouillé, permissions d'origine restaurées.",
        "nuke.message": "💥 *Ce salon a été réinitialisé avec succès.*",
        "nuke.done": (a) => `Salon #${a} réinitialisé.`,
        "purge.task": "Purge du salon",
        "purge.done": (a) => `${a} ${plural(a, "message supprimé", "messages supprimés")}.`,
        "export.extracting": (a) => `Extraction de #${a}…`,
        "export.empty": "Aucun message à exporter.",
        "server": "Serveur",
        "export.done": (a) => `Archive téléchargée (${a}) !`,
        "export.failed": (a) => `Échec de l’export : ${a}`,
        "webhook.name": "Annonce Officielle",
        "deploy.badFormat": "Format de template invalide : les listes 'roles' et 'channels' sont requises.",
        "deploy.none": "Aucun élément sélectionné pour le déploiement.",
        "deploy.task": (a) => `Déploiement de « ${a} »`,
        "untitled": "Sans nom",
        "deploy.role": (a) => `Rôle : ${a}`,
        "deploy.category": (a) => `Catégorie : ${a}`,
        "deploy.channel": (a) => `Salon : #${a}`,
        "deploy.done": "Structure du serveur déployée.",
        "bulk.delChannelsTask": (a) => `Suppression de ${a} ${plural(a, "salon", "salons")}`,
        "bulk.delChannelsDone": (a) => `${a} ${plural(a, "salon supprimé", "salons supprimés")}.`,
        "bulk.delRolesTask": (a) => `Suppression de ${a} ${plural(a, "rôle", "rôles")}`,
        "bulk.delRolesDone": (a) => `${a} ${plural(a, "rôle supprimé", "rôles supprimés")}.`,
        "bulk.slowTask": (a, b) => `Mode lent ${a} s sur ${b} ${plural(b, "salon", "salons")}`,
        "bulk.slowDone": (a, b) => `Mode lent de ${a} s appliqué à ${b} ${plural(b, "salon", "salons")}.`,
        "bulk.editRolesTask": (a) => `Modification de ${a} ${plural(a, "rôle", "rôles")}`,
        "bulk.editRolesDone": (a) => `${a} ${plural(a, "rôle", "rôles")} mis à jour.`,
        "staff.founder": "👑 Fondateur",
        "staff.admin": "🛡️ Administrateur",
        "staff.mod": "🔨 Modérateur",
        "staff.member": "👤 Membre",
        "tab.error": "Cet onglet a rencontré une erreur. Les autres onglets restent utilisables.",
        "tab.retry": "Réessayer",
        "color.hex": (a) => `${a} (hexadécimal)`,
        "pick.subtitle": "Cochez les éléments à inclure.",
        "close": "Fermer",
        "pick.typeTabs": "Type d'éléments",
        "pick.tabAll": (a) => `Tout (${a})`,
        "pick.tabRoles": (a, b) => `Rôles (${a}/${b})`,
        "pick.tabChannels": (a, b) => `Salons (${a}/${b})`,
        "pick.filter": "Filtrer",
        "pick.filterLabel": "Filtrer les rôles et les salons",
        "pick.checkAll": "Tout cocher",
        "pick.uncheckAll": "Tout décocher",
        "pick.rolesOnly": "Rôles seuls",
        "pick.channelsOnly": "Salons seuls",
        "pick.rolesHead": (a, b) => `Rôles — ${a}/${b}`,
        "pick.noRoles": "Aucun rôle trouvé.",
        "role.hoistTip": "Affiché séparément dans la liste des membres",
        "role.hoisted": "Séparé",
        "pick.channelsHead": (a, b) => `Salons et catégories — ${a}/${b}`,
        "pick.noChannels": "Aucun salon trouvé.",
        "pick.catTip": "Cocher ou décocher toute la catégorie",
        "count.channels": (a) => `${a} ${plural(a, "salon", "salons")}`,
        "pick.noCategory": "Sans catégorie",
        "pick.footer": (a, b) => `${a} ${plural(a, "rôle", "rôles")} · ${b} ${plural(b, "salon", "salons")} sélectionnés`,
        "cancel": "Annuler",
        "pick.needOne": "Sélectionnez au moins un élément.",
        "pick.confirm": (a) => `Confirmer (${a})`,
        "ev.defaultName": "🏆 Soirée Communautaire / Tournoi",
        "ev.defaultDesc": "Rejoignez-nous pour notre événement exclusif !",
        "grad.defaultPrefix": "✦ Rang",
        "canned.d1Title": "Rappel des règles",
        "canned.d1Text": "Merci de respecter les règles du serveur et de rester courtois avec les autres membres.",
        "canned.d2Title": "Pas de pub en MP",
        "canned.d2Text": "Rappel : Le démarchage ou la publicité sauvage en message privé est strictement interdit.",
        "members.partial": (a, b) => `Seuls ${a} membres sur ${b} sont chargés localement par Discord : les listes et actions de masse ci-dessous ne concernent que ces membres.`,
        "members.unknown": (a) => `Nombre total de membres inconnu (${a} chargés localement) : les listes et actions de masse ci-dessous peuvent être incomplètes.`,
        "vault.saved": (a, b) => `Sauvegarde enregistrée (${a} ${plural(a, "rôle", "rôles")}, ${b} ${plural(b, "salon", "salons")}).`,
        "vault.exported": (a, b) => `Modèle JSON exporté (${a} ${plural(a, "rôle", "rôles")}, ${b} ${plural(b, "salon", "salons")}).`,
        "nav.sEvents": "Événements",
        "nav.events": "Événements et calendrier",
        "nav.sSecurity": "Sécurité",
        "nav.security": "Anti-raid et verrouillage",
        "nav.ghostpings": "Ghostpings",
        "nav.bios": "Statuts suspects",
        "nav.sBulk": "Gestion en masse",
        "nav.channels": "Salons et catégories",
        "nav.styler": "Styliseur de salons",
        "nav.catPerms": "Permissions de catégorie",
        "nav.gradients": "Dégradés de rôles",
        "nav.cleanRoles": "Rôles et nettoyage",
        "nav.massRoles": "Attribution de rôles",
        "nav.assets": "Emojis et soundboard",
        "nav.vault": "Sauvegardes et modèles",
        "nav.media": "Galerie médias",
        "nav.embed": "Studio d'embeds",
        "nav.canned": "Réponses types",
        "nav.packs": "Packs express",
        "closeEsc": "Fermer (Échap)",
        "ev.createHead": "Créer un événement Discord",
        "ev.name": "Nom de l'événement",
        "ev.locType": "Type de lieu",
        "ev.voice": "Salon vocal",
        "ev.external": "Lieu externe (lien ou adresse)",
        "ev.linkOrAddress": "Lien ou adresse",
        "ev.start": "Début",
        "ev.end": "Fin",
        "ev.descPh": "Description de l'événement...",
        "ev.created": "Événement créé.",
        "ev.create": "Créer l'événement",
        "ev.downloadIcs": "Télécharger le .ics",
        "ev.gLinkCopied": "Lien Google Agenda copié.",
        "ev.copyGLink": "Copier le lien Google Agenda",
        "ev.listHead": (a) => `Événements prévus (${a})`,
        "refresh": "Actualiser",
        "ev.none": "Aucun événement planifié trouvé sur ce serveur.",
        "ev.interested": (a) => `${a} ${plural(a, "intéressé", "intéressés")}`,
        "ev.icsFile": "Fichier .ics",
        "ev.addToCal": "Ajouter à votre calendrier :",
        "ev.gCalLink": "Lien Google Calendar",
        "ev.msgCopied": "Message copié.",
        "ev.copyReminder": "Copier le rappel",
        "ev.cancelTitle": "Annuler l'événement",
        "ev.cancelConfirm": (a) => `Voulez-vous vraiment annuler l'événement "${a}" ?`,
        "ev.cancelled": "Événement annulé.",
        "styler.textPrefix": "Préfixe des salons textuels",
        "styler.voicePrefix": "Préfixe des salons vocaux",
        "styler.smallCaps": "Écrire les noms en petites capitales (ex. : ɢᴇɴᴇʀᴀʟ)",
        "styler.preview": "Aperçu : ",
        "styler.renameTitle": "Renommer les salons",
        "styler.renameConfirm": (a) => `Voulez-vous formater le nom de ${a} ${plural(a, "salon", "salons")} ?`,
        "styler.task": "Renommage des salons",
        "styler.done": "Salons renommés.",
        "styler.apply": "Appliquer à tous les salons",
        "perms.source": "Catégorie modèle",
        "perms.target": "Catégorie à synchroniser",
        "perms.pickTwo": "Choisissez deux catégories différentes.",
        "perms.hint": "Les permissions de la catégorie modèle remplacent celles de la catégorie à synchroniser.",
        "perms.done": "Permissions copiées.",
        "perms.sync": "Synchroniser les permissions",
        "clean.empty": (a) => `Rôles vides : ${a}`,
        "clean.emptyHint": "Rôles avec 0 membre.",
        "clean.disabled": "Désactivé : liste des membres incomplète.",
        "clean.deleteEmptyTitle": "Supprimer les rôles vides",
        "clean.deleteEmptyConfirm": (a) => `Supprimer définitivement ${a} ${plural(a, "rôle orphelin", "rôles orphelins")} ?`,
        "deleteN": (a) => `Supprimer (${a})`,
        "clean.hoisted": (a) => `Membres hoistés : ${a}`,
        "clean.hoistedHint": "Pseudos commençant par !, ? ou .",
        "clean.dehoist": "Dé-hoister",
        "clean.dehoistConfirm": (a) => `Réinitialiser le préfixe de pseudo de ${a} ${plural(a, "membre", "membres")} ?`,
        "clean.dehoistTask": "Correction des pseudos",
        "clean.dehoistDone": "Pseudos corrigés.",
        "clean.dehoistN": (a) => `Dé-hoister (${a})`,
        "roles.all": (a) => `Tous les rôles (${a})`,
        "selectAllN": (a) => `Tout sélectionner (${a})`,
        "deselectAll": "Tout désélectionner",
        "roles.filter": "Filtrer les rôles par nom...",
        "roles.selected": (a) => `${a} ${plural(a, "rôle sélectionné", "rôles sélectionnés")}`,
        "roles.bulkDeleteTitle": "Suppression groupée de rôles",
        "roles.bulkDeleteConfirm": (a) => `Voulez-vous supprimer définitivement ${a} ${plural(a, "rôle coché", "rôles cochés")} ?`,
        "roles.color": "Couleur des rôles",
        "roles.applyColor": "Appliquer la couleur",
        "roles.hoist": "Afficher séparément",
        "roles.mentionable": "Mentionnable",
        "roles.countTip": "Compté parmi les membres chargés localement uniquement",
        "roles.memberCount": (a, b) => `${a}${b} ${plural(a, "membre", "membres")}`,
        "roles.deleteTitle": "Supprimer le rôle",
        "roles.deleteConfirm": (a) => `Voulez-vous supprimer le rôle "${a}" ?`,
        "roles.deleted": (a) => `Rôle ${a} supprimé.`,
        "delete": "Supprimer",
        "mass.role": "Rôle à attribuer",
        "mass.targets": "Membres concernés",
        "mass.allServer": "Tous les membres du serveur",
        "mass.allLoaded": "Tous les membres chargés",
        "mass.noRole": "Uniquement les membres sans aucun rôle",
        "mass.botsExcluded": "Les bots sont toujours exclus.",
        "mass.confirmTitle": "Attribution de rôle",
        "mass.confirm": (a) => `Attribuer ce rôle à ${a} ${plural(a, "membre", "membres")} ?`,
        "mass.task": (a) => `Attribution du rôle à ${a} ${plural(a, "membre", "membres")}`,
        "mass.done": (a) => `Rôle attribué à ${a} ${plural(a, "membre", "membres")}.`,
        "mass.start": "Lancer l'attribution",
        "assets.source": "Serveur source",
        "assets.noEmojis": "Aucun emoji sur le serveur source.",
        "assets.emojisTask": (a) => `Clonage de ${a} ${plural(a, "emoji", "emojis")}`,
        "assets.emojisDone": (a) => `${a} ${plural(a, "emoji cloné", "emojis clonés")}`,
        "assets.failed": (a) => `, ${a} en échec (emplacements pleins ?)`,
        "assets.stopped": (a) => `Clonage interrompu : ${a}`,
        "assets.cloneEmojis": "Cloner les emojis",
        "assets.noSounds": "Aucun son sur le serveur source.",
        "assets.soundsTask": (a) => `Clonage de ${a} ${plural(a, "son", "sons")}`,
        "assets.soundsDone": (a) => `${a} ${plural(a, "son cloné", "sons clonés")}`,
        "assets.cloneSounds": "Cloner le soundboard",
        "vault.badJson": "Format JSON invalide (rôles ou salons manquants).",
        "vault.importTitle": (a) => `Importer le modèle « ${a} »`,
        "vault.importSub": "Sélectionnez les rôles, catégories et salons à importer sur ce serveur.",
        "vault.readError": (a) => `Erreur de lecture : ${a}`,
        "vault.backupHead": "Sauvegarde et restauration",
        "vault.backupHint": "Enregistrez la structure de ce serveur dans votre coffre local ou exportez/importez un fichier template JSON avec sélection personnalisée.",
        "vault.reading": "Lecture de la structure actuelle...",
        "vault.backupTitle": (a) => `Sauvegarder ${a}`,
        "vault.backupSub": "Cochez les rôles et salons du serveur actuel à sauvegarder dans votre coffre local.",
        "vault.error": (a) => `Erreur : ${a}`,
        "vault.create": "Créer une sauvegarde",
        "vault.exportTitle": (a) => `Exporter ${a} en JSON`,
        "vault.exportSub": "Cochez les rôles et salons à inclure dans le fichier template JSON exporté.",
        "vault.exportError": (a) => `Erreur export : ${a}`,
        "vault.exportJson": "Exporter en JSON",
        "vault.importJson": "Importer un JSON",
        "vault.cloneHead": "Cloner depuis un autre serveur",
        "vault.cloneHint": "Dupliquez directement l'arborescence (rôles, catégories, salons et permissions) d'un de vos autres serveurs vers ce serveur avec sélection personnalisée.",
        "vault.pickSource": "Sélectionnez un serveur source.",
        "vault.loadingSource": "Chargement de la structure source...",
        "vault.cloneTitle": (a, b) => `Cloner ${a} vers ${b}`,
        "vault.cloneSub": (a) => `Sélectionnez les rôles, catégories et salons de "${a}" à cloner directement sur ce serveur.`,
        "vault.sourceError": (a) => `Impossible de lire le serveur source : ${a}`,
        "vault.cloneHere": "Cloner vers ce serveur",
        "vault.localHead": (a) => `Sauvegardes locales (${a})`,
        "vault.emptyTitle": "Vider le coffre",
        "vault.emptyConfirm": "Voulez-vous supprimer tous les snapshots sauvegardés ?",
        "vault.emptied": "Coffre vidé.",
        "vault.deleteAll": "Tout supprimer",
        "vault.none": "Aucun snapshot dans votre coffre pour l'instant. Cliquez sur « Créer une sauvegarde » pour enregistrer l'état actuel.",
        "vault.snapMeta": (a, b) => `${a} ${plural(a, "rôle", "rôles")} · ${b} ${plural(b, "salon ou catégorie", "salons et catégories")}`,
        "vault.deployTitle": (a) => `Déployer la sauvegarde « ${a} »`,
        "vault.deploySub": (a) => `Sélectionnez les rôles, catégories et salons du snapshot du ${a} à déployer sur ce serveur.`,
        "vault.deploy": "Déployer",
        "vault.downloaded": "Sauvegarde téléchargée au format JSON.",
        "vault.export": "Exporter",
        "vault.snapDeleted": "Snapshot supprimé.",
        "canned.editHead": "Modifier la réponse",
        "canned.new": "Nouvelle réponse",
        "canned.name": "Nom",
        "canned.namePh": "Ex. : Rappel des règles",
        "canned.textPh": "Le texte qui sera envoyé dans le salon",
        "save": "Enregistrer",
        "canned.sentIn": (a) => `Envoyées dans le salon ouvert : #${a}`,
        "canned.openChannel": "Ouvrez un salon textuel pour pouvoir envoyer une réponse.",
        "canned.none": "Aucune réponse type. Créez-en une pour l'envoyer ensuite en un clic.",
        "edit": "Modifier",
        "canned.editLabel": (a) => `Modifier « ${a} »`,
        "canned.deleteLabel": (a) => `Supprimer « ${a} »`,
        "canned.deleteTitle": "Supprimer la réponse",
        "canned.deleteConfirm": (a) => `Supprimer la réponse « ${a} » ?`,
        "canned.sent": (a) => `Envoyé dans #${a}.`,
        "canned.sendError": (a) => `Envoi impossible : ${a}`,
        "send": "Envoyer",
        "lock.head": "Mode panique (verrouillage d'urgence)",
        "lock.hint": "Coupe l'écriture, les réactions et la voix pour @everyone instantanément avec sauvegarde d'état.",
        "lock.title": "Verrouiller le serveur",
        "lock.confirm": "Voulez-vous verrouiller immédiatement l'écriture et les invitations pour @everyone sur tout le serveur ?",
        "lock.btn": "Verrouiller",
        "unlock.title": "Déverrouiller le serveur",
        "unlock.confirm": "Restaurer l'état exact des permissions d'origine de @everyone ?",
        "unlock.btn": "Déverrouiller",
        "grad.prefix": "Préfixe des rôles",
        "grad.count": "Nombre de rôles",
        "grad.countHint": "Entre 2 et 50.",
        "grad.colorA": "Couleur de départ",
        "grad.colorB": "Couleur d'arrivée",
        "grad.title": "Générer le dégradé",
        "grad.confirm": (a) => `Créer une palette de ${a} rôles avec ces couleurs ?`,
        "grad.task": (a) => `Création de ${a} rôles en dégradé`,
        "grad.done": "Rôles en dégradé créés.",
        "grad.btn": (a) => `Générer ${a} rôles`,
        "media.head": (a) => `Galerie médias (${a})`,
        "media.channel": "Salon à analyser",
        "media.readError": (a) => `Impossible de lire ce salon : ${a}`,
        "media.searching": "Recherche…",
        "media.search": "Rechercher les médias",
        "media.none": "Aucune image ni vidéo dans les 100 derniers messages de ce salon.",
        "media.intro": "Choisissez un salon puis lancez la recherche : les images et vidéos des 100 derniers messages s'afficheront ici.",
        "media.deleted": "Message supprimé.",
        "media.deleteError": (a) => `Suppression impossible : ${a}`,
        "media.deleteTitle": "Supprimer le message",
        "media.deleteConfirm": (a) => `Supprimer le message de ${a} ? Toutes ses pièces jointes seront supprimées.`,
        "media.deleteTip": "Supprimer (Maj + clic : sans confirmation)",
        "gp.head": (a) => `Ghostpings (${a})`,
        "gp.cleared": "Historique vidé.",
        "gp.clear": "Vider l'historique",
        "gp.none": "Aucun ghostping détecté récemment sur ce serveur.",
        "gp.mentioned": (a, b) => `${a} a mentionné ${b}`,
        "gp.empty": "Message vide ou pièce jointe",
        "bios.head": (a) => `Statuts suspects (${a})`,
        "bios.none": "Aucun statut suspect détecté.",
        "bios.status": (a) => `Statut : "${a}"`,
        "bios.kickTitle": "Expulser le membre",
        "bios.kickConfirm": (a, b) => `Voulez-vous expulser ${a} pour statut suspect ("${b}") ?`,
        "bios.kicking": (a) => `Expulsion de ${a}`,
        "bios.kick": "Expulser",
        "ch.head": (a) => `Salons et catégories (${a})`,
        "ch.filter": "Filtrer les salons...",
        "ch.filterType": "Filtrer par type",
        "ch.all": (a) => `Tous (${a})`,
        "ch.cats": (a) => `Catégories (${a})`,
        "ch.text": (a) => `Textuels (${a})`,
        "ch.voice": (a) => `Vocaux (${a})`,
        "ch.selected": (a) => `${a} ${plural(a, "élément sélectionné", "éléments sélectionnés")}`,
        "ch.bulkDeleteTitle": "Suppression groupée de salons",
        "ch.bulkDeleteConfirm": (a) => `Êtes-vous sûr de vouloir supprimer définitivement ${a} ${plural(a, "salon / catégorie", "salons / catégories")} ? Attention, cette action est irréversible !`,
        "ch.noText": "Aucun salon textuel dans la sélection.",
        "ch.bulkPurgeTitle": "Purge groupée",
        "ch.bulkPurgeConfirm": (a) => `Purger les 50 derniers messages de ${a} ${plural(a, "salon textuel sélectionné", "salons textuels sélectionnés")} ?`,
        "ch.bulkPurgeTask": (a) => `Purge de ${a} ${plural(a, "salon", "salons")}`,
        "ch.bulkPurgeDone": (a, b) => `Purge terminée : ${a} ${plural(a, "message supprimé", "messages supprimés")} dans ${b} ${plural(b, "salon", "salons")}.`,
        "ch.purgeMessages": "Purger les messages",
        "slow.label": "Mode lent",
        "slow.off": "Mode lent désactivé",
        "slow.sec": (a) => `${a} ${plural(a, "seconde", "secondes")}`,
        "slow.min": (a) => `${a} ${plural(a, "minute", "minutes")}`,
        "slow.hour": (a) => `${a} ${plural(a, "heure", "heures")}`,
        "slow.needText": "Sélectionnez au moins un salon textuel pour le slowmode.",
        "slow.apply": "Appliquer le mode lent",
        "ch.none": "Aucun salon ou catégorie trouvé.",
        "ch.catPill": "CATÉGORIE",
        "slow.pill": (a) => `Mode lent ${a} s`,
        "ch.purgeTitle": "Purge de salon",
        "ch.purgeConfirm": (a) => `Voulez-vous purger les 50 derniers messages de #${a} ?`,
        "ch.purge": "Purger",
        "ch.nukeTitle": "Nuke du salon",
        "ch.nukeConfirm": (a) => `Êtes-vous absolument sûr de vouloir réinitialiser et recréer à neuf #${a} ?`,
        "ch.deleteTitle": "Supprimer le salon",
        "ch.deleteCatConfirm": (a) => `Voulez-vous supprimer définitivement la catégorie "${a}" ?`,
        "ch.deleteChConfirm": (a) => `Voulez-vous supprimer définitivement le salon "${a}" ?`,
        "ch.deleted": (a) => `Salon ${a} supprimé.`,
        "embed.channel": "Salon",
        "embed.title": "Titre",
        "embed.titlePh": "Titre de l'annonce",
        "embed.descPh": "Votre message…",
        "embed.mdHint": "Markdown accepté : **gras**, *italique*, __souligné__, ~~barré~~, `code`, ||spoiler||, # titre, > citation, - liste.",
        "embed.color": "Couleur",
        "embed.colorLabel": "Couleur de l'embed",
        "embed.sent": "Annonce envoyée.",
        "embed.send": "Envoyer l'annonce",
        "embed.preview": "Aperçu",
        "embed.today": "Aujourd'hui",
        "embed.empty": "Écrivez un titre ou un message pour voir l'aperçu.",
        "staff.head": "Hiérarchie du staff",
        "staff.hint": "Crée ces 5 rôles, du plus haut au plus bas :",
        "staff.adminTip": "Ce rôle aura la permission Administrateur",
        "staff.title": "Déployer la hiérarchie du staff",
        "staff.confirm": (a, b) => `Créer les ${a} rôles du staff sur ce serveur ?\n${b} ${plural(b, "d'entre eux aura", "d'entre eux auront")} la permission Administrateur.`,
        "staff.done": "Hiérarchie du staff créée.",
        "staff.stopped": (a, b) => `Arrêt après ${a} ${plural(a, "rôle", "rôles")} : ${b}`,
        "staff.generate": "Générer",
        "confirm": "Confirmer",
        "dock.busy": "En cours",
        "dock.ready": "Prêt",
        "dock.summary": (a, b) => `${a} ${plural(a, "rôle", "rôles")} · ${b} ${plural(b, "salon", "salons")}`,
        "dock.cancelTask": "Annuler la tâche",
        "ch.inCat": (a) => `dans ${a}`
    }
});

// Styles propres au tableau de bord (le reste vient du kit)
const BA_CSS = `
.ba-command-center { padding: 24px; }
.ba-dialog {
    position: relative; display: flex; flex-direction: column;
    width: 1180px; height: 840px; max-width: 100%; max-height: 100%;
    overflow: hidden; border-radius: 12px; outline: none; background: var(--ba-bg);
    box-shadow: 0 0 0 1px var(--ba-border), var(--elevation-high, 0 8px 16px rgba(0, 0, 0, .24));
    animation: ba-pop .2s cubic-bezier(.2, .9, .3, 1.1);
}
.ba-command-center h2, .ba-command-center h3 { margin: 0; }

/* En-tête */
.ba-header {
    display: flex; flex: 0 0 auto; align-items: center; gap: 12px;
    min-height: 56px; padding: 12px 12px 12px 16px; border-bottom: 1px solid var(--ba-border);
}
.ba-header-text { flex: 1 1 auto; min-width: 0; }
.ba-header-text > * { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ba-avatar-acronym {
    display: flex; align-items: center; justify-content: center; overflow: hidden;
    background: var(--ba-bg-alt); color: var(--ba-header); font-size: 12px; font-weight: 600; white-space: nowrap;
}

/* Corps : navigation + contenu */
.ba-body { position: relative; display: flex; flex: 1 1 auto; min-height: 0; }
.ba-sidebar {
    display: flex; flex: 0 0 240px; flex-direction: column; gap: 2px;
    padding: 16px 8px 16px 12px; background: var(--ba-bg-alt); user-select: none;
}
.ba-nav-title {
    padding: 16px 10px 6px; color: var(--ba-muted);
    font-size: 12px; font-weight: 700; line-height: 16px; letter-spacing: .02em; text-transform: uppercase;
}
.ba-nav-title:first-child { padding-top: 0; }
.ba-nav-btn {
    display: block; flex: 0 0 auto; width: 100%; min-height: 32px; margin: 0; padding: 6px 10px;
    border: none; border-radius: 4px; background: transparent; color: var(--ba-muted);
    font: inherit; font-size: 15px; font-weight: 500; line-height: 20px; text-align: left; cursor: pointer;
    transition: background-color .1s ease, color .1s ease;
}
.ba-nav-btn:hover { background: var(--ba-hover); color: var(--ba-text); }
.ba-nav-btn.active, .ba-nav-btn[aria-current="page"] { background: var(--ba-selected); color: var(--ba-header); }
.ba-nav-btn:focus-visible { outline: 2px solid var(--ba-focus); outline-offset: -2px; }
.ba-content-area { flex: 1 1 auto; min-width: 0; padding: 24px 32px; background: var(--ba-bg); }

/* Barre d'état */
.ba-dock {
    position: relative; display: flex; flex: 0 0 auto; align-items: center; justify-content: space-between; gap: 12px;
    min-height: 52px; padding: 8px 16px; border-top: 1px solid var(--ba-border);
    background: var(--ba-bg-alt); color: var(--ba-muted); font-size: 14px;
}
.ba-dock-progress { position: absolute; top: -1px; left: 0; height: 3px; background: var(--ba-brand); transition: width .3s ease; }
.ba-dock-info { display: flex; align-items: center; gap: 12px; min-width: 0; }
.ba-dock-status { display: flex; flex: 0 0 auto; align-items: center; gap: 8px; color: var(--ba-header); font-weight: 600; }
.ba-dock-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ba-dot { flex: 0 0 auto; width: 8px; height: 8px; border-radius: 50%; background: var(--ba-success); }
.ba-dot-busy { background: var(--ba-brand); animation: ba-pulse 1.2s ease-in-out infinite; }
@keyframes ba-pulse { 50% { opacity: .35; } }

/* Modales internes (au-dessus du tableau de bord) */
.ba-layer {
    position: absolute; inset: 0; z-index: 10; display: flex; align-items: center; justify-content: center;
    padding: 24px; background: rgba(0, 0, 0, .7); animation: ba-fade .15s ease-out;
}
.ba-modal-lg { width: 740px; }

/* Cases à cocher natives, au style Discord */
.ba-command-center input[type="checkbox"] {
    flex: 0 0 auto; width: 20px; height: 20px; margin: 0; appearance: none;
    border: 1px solid var(--interactive-normal, #b5bac1); border-radius: 6px;
    background: transparent no-repeat center / 14px; cursor: pointer;
    transition: background-color .15s ease, border-color .15s ease;
}
.ba-command-center input[type="checkbox"]:checked {
    border-color: var(--ba-brand); background-color: var(--ba-brand);
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23fff' d='M8.99 16.17 4.83 12l-1.42 1.41L8.99 19 21 7l-1.41-1.41Z'/%3E%3C/svg%3E");
}
.ba-command-center input[type="checkbox"]:focus-visible { outline: 2px solid var(--ba-focus); outline-offset: 2px; }

/* Pastille de couleur */
.ba-swatch { flex: 0 0 auto; width: 32px; height: 32px; padding: 0; border: none; background: transparent; cursor: pointer; }
.ba-swatch::-webkit-color-swatch-wrapper { padding: 0; }
.ba-swatch::-webkit-color-swatch { border: 1px solid var(--ba-border); border-radius: 6px; }
.ba-input-group .ba-swatch { width: 28px; height: 28px; margin-left: 6px; }

/* Listes à cocher (modale de clonage) */
.ba-grid-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 2px 8px; }
.ba-pick {
    display: flex; align-items: center; gap: 8px; min-width: 0; padding: 6px 8px;
    border-radius: 4px; color: var(--ba-text); font-size: 14px; line-height: 20px; cursor: pointer; user-select: none;
}
.ba-pick:hover { background: var(--ba-hover); }
.ba-pick-on { background: color-mix(in srgb, var(--ba-brand) 12%, transparent); color: var(--ba-header); }
.ba-pick-on:hover { background: color-mix(in srgb, var(--ba-brand) 18%, transparent); }
.ba-pick-name { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ba-pick-icon { display: inline-flex; flex: 0 0 auto; color: var(--ba-muted); }
.ba-ch-name { display: inline-flex; align-items: center; gap: 6px; min-width: 0; }
.ba-ch-name > svg { flex: 0 0 auto; color: var(--ba-muted); }
.ba-group { display: flex; flex-direction: column; gap: 2px; padding: 8px; border: 1px solid var(--ba-border); border-radius: 8px; background: var(--ba-bg-alt); }
.ba-dot-color { flex: 0 0 auto; width: 10px; height: 10px; border-radius: 50%; }
.ba-role-chip {
    display: inline-flex; align-items: center; gap: 6px; height: 24px; padding: 0 8px;
    border-radius: 4px; background: var(--ba-bg-deep); color: var(--ba-text);
    font-size: 12px; font-weight: 500; white-space: nowrap;
}

/* Aperçu de message (studio d'embeds) */
.ba-msg { display: flex; gap: 16px; padding: 16px; border-radius: 8px; background: var(--ba-bg); border: 1px solid var(--ba-border); }
.ba-msg-avatar { width: 40px; height: 40px; }
.ba-msg-head { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 6px; margin-bottom: 4px; }
.ba-msg-name { color: var(--ba-header); font-size: 16px; font-weight: 500; line-height: 22px; }
.ba-embed {
    max-width: 520px; padding: 8px 16px 16px 12px; border-left: 4px solid var(--ba-brand);
    border-radius: 4px; background: var(--ba-bg-alt);
}
.ba-embed-title { margin-top: 8px; color: var(--ba-header); font-size: 16px; font-weight: 600; line-height: 22px; word-break: break-word; }
.ba-embed-desc { margin-top: 8px; color: var(--ba-text); font-size: 14px; line-height: 18px; white-space: pre-wrap; word-break: break-word; }
.ba-md-h1, .ba-md-h2, .ba-md-h3 { margin: 8px 0 0; color: var(--ba-header); font-weight: 700; line-height: 1.375; }
.ba-md-h1 { font-size: 20px; }
.ba-md-h2 { font-size: 18px; }
.ba-md-h3 { font-size: 16px; }
.ba-md-sub { color: var(--ba-muted); font-size: 12px; }
.ba-md-quote { padding-left: 12px; border-left: 4px solid var(--ba-accent); }
.ba-md-li { position: relative; padding-left: 16px; }
.ba-md-li::before { content: "•"; position: absolute; left: 4px; }
.ba-md-code { padding: 0 0.2em; border-radius: 4px; background: var(--ba-bg-deep); font-family: var(--font-code, Consolas, "Andale Mono WT", "Andale Mono", "Lucida Console", monospace); font-size: 85%; }
.ba-md-spoiler { border-radius: 4px; background: var(--spoiler-hidden-background, color-mix(in srgb, var(--ba-muted) 45%, var(--ba-bg-deep))); color: transparent; transition: color 0.1s, background-color 0.1s; }
.ba-md-spoiler:hover { background: var(--spoiler-revealed-background, var(--ba-active)); color: inherit; }
.ba-md-link { color: var(--ba-link); }

/* Cartes avec liseré */
.ba-accent-danger { border-left: 4px solid var(--ba-danger); }
.ba-accent-warning { border-left: 4px solid var(--ba-warning); }
`;

module.exports = class BetterAdmin {
    getName()        { return "BetterAdmin"; }
    getDescription() { return "Admin dashboard to manage your servers in bulk, with Discord's interface. English and French."; }
    getVersion()     { return "1.0.0"; }
    getAuthor()      { return "AaronL2L"; }

    // ─── Webpack Stores & Modules ──────────────────────────────────────────────
    get Stores() {
        return {
            GuildStore: BdApi.Webpack.getStore("GuildStore"),
            ChannelStore: BdApi.Webpack.getStore("ChannelStore"),
            GuildChannelStore: BdApi.Webpack.getStore("GuildChannelStore"),
            GuildRoleStore: BdApi.Webpack.getStore("GuildRoleStore") || BdApi.Webpack.getByKeys("getRole", "getRoles"),
            GuildMemberStore: BdApi.Webpack.getStore("GuildMemberStore") || BdApi.Webpack.getStore("MemberStore"),
            UserStore: BdApi.Webpack.getStore("UserStore"),
            PresenceStore: BdApi.Webpack.getStore("PresenceStore"),
            PermissionStore: BdApi.Webpack.getStore("PermissionStore"),
            SelectedGuildStore: BdApi.Webpack.getStore("SelectedGuildStore"),
            SelectedChannelStore: BdApi.Webpack.getStore("SelectedChannelStore"),
            FluxDispatcher: BdApi.Webpack.getModule(m => m.dispatch && m.subscribe && !m._actionHandlers) || BdApi.Webpack.getByKeys("dispatch", "subscribe")
        };
    }

    // ─── État Global & Mutex ───────────────────────────────────────────────────
    copiedData = null;
    activeTask = null;
    listeners = new Set();
    recentMentionMsgs = new Map();

    subscribeTask(fn) {
        this.listeners.add(fn);
        return () => this.listeners.delete(fn);
    }

    _notifyTask() {
        this.listeners.forEach(fn => fn(this.activeTask));
    }

    // ─── Lifecycle ────────────────────────────────────────────────────────────

    start() {
        this._patches = [];
        this._injectStyles();

        const patchMenu = (navId, handler) => {
            const unpatch = BdApi.ContextMenu.patch(navId, (res, props) => {
                try { handler(res, props); } catch (e) { console.error(`[BetterAdmin] Erreur context menu (${navId}):`, e); }
            });
            this._patches.push(unpatch);
        };

        patchMenu("channel-context", (res, props) => this.injectChannelContextMenu(res, props));
        patchMenu("guild-category-context", (res, props) => this.injectChannelContextMenu(res, props));
        patchMenu("category-context", (res, props) => this.injectChannelContextMenu(res, props));
        patchMenu("guild-channel-context", (res, props) => this.injectChannelContextMenu(res, props));
        patchMenu("guild-context", (res, props) => this.injectGuildContextMenu(res, props));
        patchMenu("guild-header-popout", (res, props) => this.injectGuildContextMenu(res, props));

        this._initPassiveListeners();
    }

    stop() {
        for (const unpatch of this._patches) {
            try { unpatch(); } catch (_) {}
        }
        this._patches = [];
        this._cleanupPassiveListeners();
        this.abortTask();
        this.activeTask = null;
        this._closeDashboard();
        this._removeStyles();
        this.copiedData = null;
        this.recentMentionMsgs.clear();
    }

    // ─── Écouteurs Passifs (Ghostpings uniquement) ─────────────────────────────

    _initPassiveListeners() {
        const Dispatcher = this.Stores.FluxDispatcher;
        if (!Dispatcher) return;

        this._onMessageCreate = ({ message, optimistic }) => {
            if (optimistic || !message?.id) return;
            const channelId = message.channel_id;
            const channel = this.Stores.ChannelStore?.getChannel(channelId);
            const guildId = channel?.guild_id || channel?.guildId;

            const hasMentions = (message.mentions && message.mentions.length > 0) || (message.mention_roles && message.mention_roles.length > 0) || message.mention_everyone;
            if (hasMentions) {
                this.recentMentionMsgs.set(message.id, {
                    id: message.id,
                    channelId,
                    guildId,
                    author: message.author,
                    content: message.content || "",
                    mentions: message.mentions || [],
                    roles: message.mention_roles || [],
                    everyone: !!message.mention_everyone,
                    timestamp: Date.now()
                });
                if (this.recentMentionMsgs.size > 1500) {
                    const firstKey = this.recentMentionMsgs.keys().next().value;
                    this.recentMentionMsgs.delete(firstKey);
                }
            }
        };

        this._onMessageDelete = ({ id, channelId }) => {
            const cached = this.recentMentionMsgs.get(id);
            if (!cached) return;

            const guildId = cached.guildId || "global";
            const ghostpings = BdApi.Data.load("BetterAdmin", `ghostpings_${guildId}`) || [];
            const targets = [
                ...cached.mentions.map(u => `@${u.username}`),
                ...cached.roles.map(r => `<@&${r}>`),
                ...(cached.everyone ? ["@everyone / @here"] : [])
            ].join(", ");

            ghostpings.unshift({
                id: Date.now().toString(),
                authorName: cached.author?.global_name || cached.author?.username || t("unknown"),
                authorId: cached.author?.id,
                channelId,
                content: cached.content,
                targets,
                date: new Date().toLocaleTimeString()
            });

            BdApi.Data.save("BetterAdmin", `ghostpings_${guildId}`, ghostpings.slice(0, 50));
            this.recentMentionMsgs.delete(id);
        };

        Dispatcher.subscribe("MESSAGE_CREATE", this._onMessageCreate);
        Dispatcher.subscribe("MESSAGE_DELETE", this._onMessageDelete);
    }

    _cleanupPassiveListeners() {
        const Dispatcher = this.Stores.FluxDispatcher;
        if (!Dispatcher) return;
        if (this._onMessageCreate) Dispatcher.unsubscribe("MESSAGE_CREATE", this._onMessageCreate);
        if (this._onMessageDelete) Dispatcher.unsubscribe("MESSAGE_DELETE", this._onMessageDelete);
    }

    // ─── Moteur de Requêtes (module HTTP interne de Discord : aucun token manipulé) ──

    getRestAPI() {
        if (!this.restAPI) {
            this.restAPI = BdApi.Webpack.getModule(
                m => typeof m === "object" && typeof m?.get === "function" && typeof m?.put === "function" && typeof m?.del === "function",
                { searchExports: true }
            );
        }
        return this.restAPI;
    }

    _abortError() {
        const err = new Error(t("task.abortedByUser"));
        err.name = "AbortError";
        return err;
    }

    // Rejette dès que la tâche en cours est annulée, sans attendre la fin de la requête
    _abortable(promise) {
        const signal = this.activeTask?.controller?.signal;
        if (!signal) return promise;
        return new Promise((resolve, reject) => {
            const onAbort = () => reject(this._abortError());
            if (signal.aborted) return onAbort();
            signal.addEventListener("abort", onAbort, { once: true });
            promise.then(resolve, reject).finally(() => signal.removeEventListener("abort", onAbort));
        });
    }

    async request(method, endpoint, body = null) {
        const RestAPI = this.getRestAPI();
        if (!RestAPI) throw new Error(t("err.noHttp"));

        const fn = { GET: "get", POST: "post", PUT: "put", PATCH: "patch", DELETE: "del" }[method.toUpperCase()];
        if (!fn || typeof RestAPI[fn] !== "function") throw new Error(`Méthode HTTP non supportée : ${method}`);

        // "/chemin?a=1&b=2" → { url: "/chemin", query: { a: "1", b: "2" } }
        const [url, qs] = endpoint.split("?");
        const opts = { url };
        if (qs) opts.query = Object.fromEntries(new URLSearchParams(qs));
        if (body != null) opts.body = body;

        for (let attempt = 0; ; attempt++) {
            if (this.activeTask?.controller?.signal?.aborted) throw this._abortError();
            try {
                const res = await this._abortable(RestAPI[fn](opts));
                if (res?.ok === false) throw res;
                return res?.status === 204 ? null : (res?.body ?? null);
            } catch (err) {
                if (err?.name === "AbortError") throw err;
                if (err?.status === 429 && attempt < MAX_RETRIES) {
                    const waitMs = (Number(err.body?.retry_after) || 1.5) * 1000 + 250;
                    console.warn(`[BetterAdmin] 429 Rate-limited, pause sécurisée de ${waitMs}ms…`);
                    await this._abortable(this.sleep(waitMs));
                    continue;
                }
                if (err instanceof Error) throw err;
                throw new Error(`${err?.status ?? "?"} – ${err?.body?.message || t("err.network")}`);
            }
        }
    }

    // Télécharge un fichier du CDN Discord et le convertit en data URL
    // (avant : btoa(String.fromCharCode(...octets)) plantait au-delà de ~100 Ko, donc sur la plupart des sons)
    async fetchAsDataURL(url, fallbackMime) {
        const res = await this._abortable(fetch(url));
        if (!res.ok) throw new Error(t("err.download", res.status));
        let blob = await res.blob();
        if (!blob.type && fallbackMime) blob = new Blob([blob], { type: fallbackMime });
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error || new Error(t("err.readFile")));
            reader.readAsDataURL(blob);
        });
    }

    // Nombre total de membres connu de Discord (null si indisponible)
    getGuildMemberCount(guildId) {
        try {
            const count = BdApi.Webpack.getStore("GuildMemberCountStore")?.getMemberCount?.(guildId);
            return typeof count === "number" ? count : null;
        } catch (_) {
            return null;
        }
    }

    sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }

    startTask(name, total) {
        if (this.activeTask) throw new Error(t("task.busy"));
        this.activeTask = {
            name,
            controller: new AbortController(),
            progress: 0,
            total,
            text: t("task.starting")
        };
        this._notifyTask();
    }

    updateTask(progress, text) {
        if (!this.activeTask) return;
        this.activeTask.progress = progress;
        if (text) this.activeTask.text = text;
        this._notifyTask();
    }

    endTask() {
        this.activeTask = null;
        this._notifyTask();
    }

    abortTask() {
        const task = this.activeTask;
        if (!task || task.aborting) return;
        // La tâche reste en place jusqu'au finally de la boucle, sinon ses tests « aborted » ne la voient plus
        task.aborting = true;
        task.controller.abort();
        task.text = t("task.cancelling");
        this._notifyTask();
        BdApi.UI.showToast(t("task.stopped"), { type: "info" });
        setTimeout(() => { if (this.activeTask === task) this.endTask(); }, 10000); // filet de sécurité
    }

    // ─── Module Calendrier & Export iCal (.ics) / Google Calendar ─────────────

    static exportToAppleCalendarICS(event, guildName = t("cal.server")) {
        const formatICSDate = d => {
            const date = new Date(d);
            return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
        };

        const startTime = formatICSDate(event.scheduled_start_time || event.startTime || Date.now());
        const endTime = event.scheduled_end_time || event.endTime
            ? formatICSDate(event.scheduled_end_time || event.endTime)
            : formatICSDate(new Date(event.scheduled_start_time || Date.now()).getTime() + 3600000);

        const summary = (event.name || t("cal.event")).replace(/,/g, "\\,").replace(/;/g, "\\;");
        const description = (event.description || t("cal.eventOn", guildName)).replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
        const location = (event.entity_metadata?.location || event.location || guildName).replace(/,/g, "\\,").replace(/;/g, "\\;");

        const icsContent = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//BetterAdmin//Apple Calendar Exporter//FR",
            "CALSCALE:GREGORIAN",
            "METHOD:PUBLISH",
            "BEGIN:VEVENT",
            `UID:discord-event-${event.id || Date.now()}@betteradmin`,
            `DTSTAMP:${formatICSDate(Date.now())}`,
            `DTSTART:${startTime}`,
            `DTEND:${endTime}`,
            `SUMMARY:${summary}`,
            `DESCRIPTION:${description}`,
            `LOCATION:${location}`,
            "STATUS:CONFIRMED",
            "BEGIN:VALARM",
            "TRIGGER:-PT30M",
            "ACTION:DISPLAY",
            `DESCRIPTION:${t("cal.reminder", summary)}`,
            "END:VALARM",
            "END:VEVENT",
            "END:VCALENDAR"
        ].join("\r\n");

        const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = Object.assign(document.createElement("a"), {
            href: url,
            download: `${summary.slice(0, 25).replace(/[^a-zA-Z0-9_-]/g, "_")}.ics`
        });
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000); // révoquer trop tôt peut annuler le téléchargement
        BdApi.UI.showToast(t("cal.icsDone"), { type: "success" });
    }

    static getGoogleCalendarLink(event, guildName = t("cal.server")) {
        const formatGoogleDate = d => new Date(d).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
        const start = formatGoogleDate(event.scheduled_start_time || event.startTime || Date.now());
        const end = formatGoogleDate(event.scheduled_end_time || event.endTime || (new Date(event.scheduled_start_time || Date.now()).getTime() + 3600000));
        const title = encodeURIComponent(event.name || t("cal.event"));
        const details = encodeURIComponent((event.description || "") + `\n\n${t("cal.hostedOn", guildName)}`);
        const location = encodeURIComponent(event.entity_metadata?.location || event.location || guildName);

        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
    }

    // ─── Helpers d'Interpolation Chromatique & Unicode ─────────────────────────

    static hexToRgb(hex) {
        const num = parseInt(hex.replace("#", ""), 16);
        return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
    }

    static rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        if (max === min) { h = s = 0; }
        else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
                case g: h = ((b - r) / d + 2) * 60; break;
                case b: h = ((r - g) / d + 4) * 60; break;
            }
        }
        return { h, s, l };
    }

    static hslToRgb(h, s, l) {
        if (s === 0) { const v = Math.round(l * 255); return { r: v, g: v, b: v }; }
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        const k = h / 360;
        return {
            r: Math.round(hue2rgb(p, q, k + 1/3) * 255),
            g: Math.round(hue2rgb(p, q, k) * 255),
            b: Math.round(hue2rgb(p, q, k - 1/3) * 255)
        };
    }

    static generateHslGradient(hexA, hexB, steps = 10) {
        const rgbA = BetterAdmin.hexToRgb(hexA);
        const rgbB = BetterAdmin.hexToRgb(hexB);
        const hslA = BetterAdmin.rgbToHsl(rgbA.r, rgbA.g, rgbA.b);
        const hslB = BetterAdmin.rgbToHsl(rgbB.r, rgbB.g, rgbB.b);

        let deltaH = (hslB.h - hslA.h) % 360;
        if (deltaH > 180) deltaH -= 360;
        if (deltaH < -180) deltaH += 360;

        const palette = [];
        for (let i = 0; i < steps; i++) {
            const t = steps === 1 ? 0 : i / (steps - 1);
            const curH = (hslA.h + deltaH * t + 360) % 360;
            const curS = hslA.s + (hslB.s - hslA.s) * t;
            const curL = hslA.l + (hslB.l - hslA.l) * t;
            const rgb = BetterAdmin.hslToRgb(curH, curS, curL);
            const intVal = (rgb.r << 16) | (rgb.g << 8) | rgb.b;
            const hex = "#" + [rgb.r, rgb.g, rgb.b].map(x => x.toString(16).padStart(2, "0")).join("");
            palette.push({ step: i + 1, hex, colorInt: intVal === 0 ? 1 : intVal });
        }
        return palette;
    }

    static toSmallCaps(str) {
        const map = {
            a: "ᴀ", b: "ʙ", c: "ᴄ", d: "ᴅ", e: "ᴇ", f: "ғ", g: "ɢ", h: "ʜ", i: "ɪ", j: "ᴊ",
            k: "ᴋ", l: "ʟ", m: "ᴍ", n: "ɴ", o: "ᴏ", p: "ᴘ", q: "ǫ", r: "ʀ", s: "s", t: "ᴛ",
            u: "ᴜ", v: "ᴠ", w: "ᴡ", x: "x", y: "ʏ", z: "ᴢ"
        };
        return str.toLowerCase().split("").map(c => map[c] || c).join("");
    }

    // ─── Styles CSS ───────────────────────────────────────────────────────────

    _injectStyles() { BdApi.DOM.addStyle(STYLE_ID, discordKitCSS("ba") + BA_CSS); }

    _removeStyles() { BdApi.DOM.removeStyle(STYLE_ID); }

    // ─── Menus Contextuels ────────────────────────────────────────────────────

    injectChannelContextMenu(res, props) {
        const ChannelStore = this.Stores.ChannelStore;
        let channel = props?.channel;
        if (!channel && props?.channelId) channel = ChannelStore?.getChannel?.(props.channelId);
        if (!channel?.guild_id && !channel?.guildId) return;

        const guildId = channel.guild_id || channel.guildId;
        const children = res?.props?.children;
        if (!Array.isArray(children)) return;

        children.push(
            BdApi.ContextMenu.buildItem({ type: "separator" }),
            BdApi.ContextMenu.buildItem({
                label: t("menu.open"),
                action: () => this.openDashboard(guildId, "events")
            })
        );
    }

    injectGuildContextMenu(res, props) {
        const guildId = props?.guild?.id || props?.guildId;
        if (!guildId) return;

        const children = res?.props?.children;
        if (!Array.isArray(children)) return;

        children.push(
            BdApi.ContextMenu.buildItem({ type: "separator" }),
            BdApi.ContextMenu.buildItem({
                label: t("menu.open"),
                action: () => this.openDashboard(guildId, "events")
            })
        );
    }

    // ─── Helpers Données Serveur ──────────────────────────────────────────────

    getGuildMembers(guildId) {
        const GuildMemberStore = this.Stores.GuildMemberStore;
        const UserStore = this.Stores.UserStore;
        const PresenceStore = this.Stores.PresenceStore;

        let members = [];
        if (GuildMemberStore?.getMembers) {
            try {
                const raw = GuildMemberStore.getMembers(guildId);
                if (Array.isArray(raw)) members = raw;
                else if (raw && typeof raw === "object") members = Object.values(raw);
            } catch(_) {}
        }

        if (members.length === 0 && GuildMemberStore?.getMemberIds) {
            try {
                const ids = GuildMemberStore.getMemberIds(guildId) || [];
                members = ids.map(id => GuildMemberStore.getMember(guildId, id)).filter(Boolean);
            } catch(_) {}
        }

        return members.map(m => {
            const userId = m.userId || m.id || m.user?.id;
            const user = UserStore?.getUser(userId) || m.user || {};
            const createdAtMs = userId ? Number((BigInt(userId) >> 22n) + 1420070400000n) : Date.now();
            const ageDays = Math.round((Date.now() - createdAtMs) / (24 * 60 * 60 * 1000));
            const hasCustomAvatar = !!(user.avatar || m.avatar);

            const activities = PresenceStore?.getActivities?.(userId) || [];
            const customActivity = activities.find(a => a.type === 4);
            const customStatus = customActivity?.state || "";

            return {
                userId,
                roles: m.roles || [],
                nick: m.nick || m.nickname || null,
                username: user.username || user.globalName || m.nick || t("member"),
                isBot: !!(user.bot || m.bot),
                hasCustomAvatar,
                createdAt: new Date(createdAtMs),
                ageDays,
                customStatus
            };
        }).filter(m => !!m.userId);
    }

    // ─── Actions Métier Administrateur (TOS-Safe & State-Preserving) ───────────

    async triggerLockdown(guildId) {
        const roles = await this.request("GET", `/guilds/${guildId}/roles`);
        const everyoneRole = roles.find(r => r.id === guildId);
        if (!everyoneRole) return;

        // Sauvegarder l'état exact des permissions avant verrouillage
        BdApi.Data.save("BetterAdmin", `lockdown_prev_${guildId}`, everyoneRole.permissions);

        // Bloquer l'écriture, les réactions, la voix et les invitations
        const BLOCKED_BITS = (1n << 11n) | (1n << 6n) | (1n << 21n) | (1n << 0n) | (1n << 35n);
        const lockedPerms = (BigInt(everyoneRole.permissions) & ~BLOCKED_BITS).toString();
        await this.request("PATCH", `/guilds/${guildId}/roles/${guildId}`, { permissions: lockedPerms });
        BdApi.UI.showToast(t("lock.on"), { type: "warning" });
    }

    async releaseLockdown(guildId) {
        const roles = await this.request("GET", `/guilds/${guildId}/roles`);
        const everyoneRole = roles.find(r => r.id === guildId);
        if (!everyoneRole) return;

        // Restaurer fidèlement les permissions exactes d'origine sauvegardées
        const prevPerms = BdApi.Data.load("BetterAdmin", `lockdown_prev_${guildId}`);
        const restoredPerms = prevPerms || (BigInt(everyoneRole.permissions) | (1n << 11n) | (1n << 6n) | (1n << 21n)).toString();

        await this.request("PATCH", `/guilds/${guildId}/roles/${guildId}`, { permissions: restoredPerms });
        BdApi.UI.showToast(t("lock.off"), { type: "success" });
    }

    async extractChannelMedia(channelId) {
        const msgs = await this.request("GET", `/channels/${channelId}/messages?limit=100`);
        if (!Array.isArray(msgs)) return [];
        const media = [];
        for (const m of msgs) {
            (m.attachments || []).forEach(att => {
                const isImage = att.content_type?.startsWith("image/") || /\.(jpg|png|webp|gif)$/i.test(att.filename);
                const isVideo = att.content_type?.startsWith("video/") || /\.(mp4|webm|mov)$/i.test(att.filename);
                if (isImage || isVideo) {
                    media.push({
                        id: att.id,
                        messageId: m.id,
                        channelId,
                        url: att.url,
                        filename: att.filename,
                        author: m.author?.username || t("unknown"),
                        isVideo
                    });
                }
            });
        }
        return media;
    }

    async nukeChannel(channel) {
        const guildId = channel.guild_id || channel.guildId;
        const body = {
            name: channel.name, type: channel.type ?? 0, position: channel.position ?? 0,
            topic: channel.topic || null, nsfw: channel.nsfw || false,
            rate_limit_per_user: channel.rateLimitPerUser || channel.rate_limit_per_user || 0,
            parent_id: channel.parentId || channel.parent_id || null,
            permission_overwrites: (channel.permissionOverwrites || channel.permission_overwrites || []).map(o => ({
                id: o.id, type: o.type, allow: o.allow, deny: o.deny
            }))
        };

        const newChannel = await this.request("POST", `/guilds/${guildId}/channels`, body);
        await this.request("DELETE", `/channels/${channel.id}`);
        try { await this.request("POST", `/channels/${newChannel.id}/messages`, { content: t("nuke.message") }); } catch(_) {}
        BdApi.UI.showToast(t("nuke.done", channel.name), { type: "success" });
    }

    async smartPurge(channelId, { limit = 50 } = {}) {
        // Purge sécurisée pour compte personnel : suppression unitaire rythmée (pas de bot-only endpoint / 0 risque de 403)
        // Appelée seule, elle crée sa tâche ; depuis la purge groupée, elle s'exécute dans la tâche déjà ouverte
        const ownTask = !this.activeTask;
        if (ownTask) this.startTask(t("purge.task"), limit);
        let done = 0;
        try {
            const messages = await this.request("GET", `/channels/${channelId}/messages?limit=${Math.min(100, limit)}`);
            if (!Array.isArray(messages)) return done;
            for (const m of messages) {
                if (this.activeTask?.controller?.signal?.aborted) break;
                try {
                    await this.request("DELETE", `/channels/${channelId}/messages/${m.id}`);
                    done++;
                    if (ownTask) this.updateTask(done, `${done}/${messages.length}`);
                } catch(_) {}
                await this.sleep(450); // Pause humaine sûre
            }
            if (ownTask && !this.activeTask?.aborting) BdApi.UI.showToast(t("purge.done", done), { type: "success" });
            return done;
        } finally { if (ownTask) this.endTask(); }
    }

    async exportChatTranscript(guildId, channel, format = "html") {
        const toast = (msg, type = "info") => BdApi.UI.showToast(msg, { type });
        toast(t("export.extracting", channel.name));
        try {
            const messages = await this.request("GET", `/channels/${channel.id}/messages?limit=100`);
            if (!Array.isArray(messages) || messages.length === 0) return toast(t("export.empty"));

            const guild = this.Stores.GuildStore?.getGuild?.(guildId);
            let content = "";
            let filename = `archive_${channel.name}_${Date.now()}`;
            let mimeType = "text/plain";

            if (format === "html") {
                mimeType = "text/html";
                filename += ".html";
                // Tout est échappé : un pseudo ou un message contenant du HTML ne peut plus injecter de script dans l'archive
                const rows = [...messages].reverse().map(m => {
                    const time = new Date(m.timestamp).toLocaleString();
                    const author = m.author?.global_name || m.author?.username || t("unknown");
                    const avatar = /^\d+$/.test(m.author?.id || "") && /^[\w-]+$/.test(m.author?.avatar || "")
                        ? `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}.png`
                        : "https://cdn.discordapp.com/embed/avatars/0.png";
                    return `<div style="display:flex;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);"><img src="${escapeHtml(avatar)}" alt="" style="width:40px;height:40px;border-radius:50%;object-fit:cover;background:#1e1f22;"/><div style="flex:1;"><div style="display:flex;gap:8px;margin-bottom:4px;"><span style="font-weight:700;color:#f2f3f5;">${escapeHtml(author)}</span><span style="color:#949ba4;font-size:11px;">${escapeHtml(time)}</span></div><div style="color:#dbdee1;white-space:pre-wrap;">${escapeHtml(m.content)}</div></div></div>`;
                }).join("");
                content = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Archive - #${escapeHtml(channel.name)}</title><style>body { font-family: "gg sans", sans-serif; background: #313338; color: #dbdee1; padding: 24px; } .container { max-width: 900px; margin: 0 auto; }</style></head><body><div class="container"><div style="background:#2b2d31;padding:16px 24px;border-radius:8px;margin-bottom:20px;"><h2>📁 #${escapeHtml(channel.name)} (${escapeHtml(guild?.name || t("server"))})</h2></div><div style="background:#2b2d31;padding:16px 24px;border-radius:8px;">${rows}</div></div></body></html>`;
            } else {
                filename += ".txt";
                content = [...messages].reverse().map(m => `[${new Date(m.timestamp).toLocaleString()}] ${m.author?.username}: ${m.content}`).join("\n");
            }

            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = Object.assign(document.createElement("a"), { href: url, download: filename });
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            toast(t("export.done", filename), "success");
        } catch(e) { toast(t("export.failed", e.message), "error"); }
    }

    async sendWebhookEmbed(channelId, { title, description, color }) {
        const webhooks = await this.request("GET", `/channels/${channelId}/webhooks`).catch(() => []);
        let wh = Array.isArray(webhooks) ? webhooks.find(w => w.name === "BetterAdmin-Announce") : null;
        if (!wh) wh = await this.request("POST", `/channels/${channelId}/webhooks`, { name: "BetterAdmin-Announce" });

        const payload = {
            username: t("webhook.name"),
            avatar_url: "https://cdn.discordapp.com/embed/avatars/0.png",
            embeds: [{
                title,
                description,
                color: typeof color === "string" ? parseInt(color.replace("#", ""), 16) : color
            }]
        };

        // Le webhook porte son propre jeton dans l'URL : aucun token de compte n'est envoyé ici
        const webhookUrl = `https://discord.com/api/v9/webhooks/${wh.id}/${wh.token}`;
        const res = await fetch(webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        // Avant : le toast "Annonce envoyée" s'affichait même si Discord refusait le message
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(`${res.status} – ${err.message || res.statusText}`);
        }
        return res;
    }

    async deployServerTemplate(targetGuildId, templateData, options = {}) {
        if (!templateData || !Array.isArray(templateData.roles) || !Array.isArray(templateData.channels)) {
            throw new Error(t("deploy.badFormat"));
        }

        const roleIdFilter = options.selectedRoleIds ? new Set(options.selectedRoleIds) : null;
        const channelIdFilter = options.selectedChannelIds ? new Set(options.selectedChannelIds) : null;

        const templateRoles = (templateData.roles || []).filter(r => r.name !== "@everyone" && !r.managed && (!roleIdFilter || roleIdFilter.has(r.id)));
        const categories = (templateData.channels || []).filter(c => c.type === 4 && (!channelIdFilter || channelIdFilter.has(c.id))).sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
        const nonCategories = (templateData.channels || []).filter(c => c.type !== 4 && (!channelIdFilter || channelIdFilter.has(c.id))).sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

        const totalSteps = templateRoles.length + categories.length + nonCategories.length;
        if (totalSteps === 0) {
            BdApi.UI.showToast(t("deploy.none"), { type: "warning" });
            return;
        }

        this.startTask(t("deploy.task", templateData.name || t("untitled")), totalSteps);

        try {
            let currentStep = 0;
            const roleMap = new Map();     // oldRoleId -> newRoleId
            const categoryMap = new Map(); // oldCatId -> newCatId

            // 1. Déploiement des Rôles (du bas vers le haut pour respecter la hiérarchie)
            const sortedRoles = [...templateRoles].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
            for (const r of sortedRoles) {
                if (this.activeTask?.controller?.signal?.aborted) break;
                currentStep++;
                this.updateTask(currentStep, t("deploy.role", r.name));

                try {
                    const newRole = await this.request("POST", `/guilds/${targetGuildId}/roles`, {
                        name: r.name,
                        color: r.color || 0,
                        hoist: !!r.hoist,
                        mentionable: !!r.mentionable,
                        permissions: r.permissions || "0"
                    });
                    if (newRole?.id) {
                        roleMap.set(r.id, newRole.id);
                        if (options.onRoleCreated) options.onRoleCreated(newRole);
                    }
                } catch (err) {
                    console.warn(`[BetterAdmin] Erreur création rôle ${r.name}:`, err);
                }
                await this.sleep(450);
            }

            // Helper pour transposer les permission_overwrites
            const mapOverwrites = (overwrites) => {
                if (!Array.isArray(overwrites)) return [];
                return overwrites.map(ow => {
                    let newTargetId = ow.id;
                    if (ow.id === templateData.guildId || ow.id === templateData.id) {
                        newTargetId = targetGuildId;
                    } else if (roleMap.has(ow.id)) {
                        newTargetId = roleMap.get(ow.id);
                    } else {
                        return null; // Rôle non sélectionné ou absent, ignoré pour éviter erreur 400
                    }
                    return {
                        id: newTargetId,
                        type: ow.type, // 0 = role, 1 = member
                        allow: ow.allow,
                        deny: ow.deny
                    };
                }).filter(ow => ow !== null && ow.id !== null);
            };

            // 2. Déploiement des Catégories (type 4)
            for (const cat of categories) {
                if (this.activeTask?.controller?.signal?.aborted) break;
                currentStep++;
                this.updateTask(currentStep, t("deploy.category", cat.name));

                try {
                    const body = {
                        name: cat.name,
                        type: 4,
                        position: cat.position ?? 0,
                        permission_overwrites: mapOverwrites(cat.permission_overwrites || cat.permissionOverwrites)
                    };
                    const newCat = await this.request("POST", `/guilds/${targetGuildId}/channels`, body);
                    if (newCat?.id) {
                        categoryMap.set(cat.id, newCat.id);
                        if (options.onChannelCreated) options.onChannelCreated(newCat);
                    }
                } catch (err) {
                    console.warn(`[BetterAdmin] Erreur création catégorie ${cat.name}:`, err);
                }
                await this.sleep(450);
            }

            // 3. Déploiement des Salons (textuels, vocaux, etc.)
            for (const ch of nonCategories) {
                if (this.activeTask?.controller?.signal?.aborted) break;
                currentStep++;
                this.updateTask(currentStep, t("deploy.channel", ch.name));

                try {
                    const parentId = ch.parent_id || ch.parentId;
                    const newParentId = parentId ? categoryMap.get(parentId) || null : null;

                    const body = {
                        name: ch.name,
                        type: ch.type ?? 0,
                        position: ch.position ?? 0,
                        topic: ch.topic || null,
                        nsfw: !!ch.nsfw,
                        rate_limit_per_user: ch.rate_limit_per_user || ch.rateLimitPerUser || 0,
                        parent_id: newParentId,
                        permission_overwrites: mapOverwrites(ch.permission_overwrites || ch.permissionOverwrites)
                    };
                    const newChan = await this.request("POST", `/guilds/${targetGuildId}/channels`, body);
                    if (newChan?.id && options.onChannelCreated) {
                        options.onChannelCreated(newChan);
                    }
                } catch (err) {
                    console.warn(`[BetterAdmin] Erreur création salon ${ch.name}:`, err);
                }
                await this.sleep(450);
            }

            if (!this.activeTask?.aborting) BdApi.UI.showToast(t("deploy.done"), { type: "success" });
        } finally {
            this.endTask();
        }
    }

    async bulkDeleteChannels(channelIds, onProgress) {
        this.startTask(t("bulk.delChannelsTask", channelIds.length), channelIds.length);
        const deleted = [];
        try {
            for (let i = 0; i < channelIds.length; i++) {
                if (this.activeTask?.controller?.signal?.aborted) break;
                const id = channelIds[i];
                try {
                    await this.request("DELETE", `/channels/${id}`);
                    deleted.push(id);
                    if (onProgress) onProgress(id);
                    this.updateTask(i + 1, `${i + 1}/${channelIds.length}`);
                } catch (e) {
                    console.warn(`[BetterAdmin] Erreur suppression salon ${id}:`, e);
                }
                await this.sleep(400);
            }
            if (!this.activeTask?.aborting) BdApi.UI.showToast(t("bulk.delChannelsDone", deleted.length), { type: "success" });
        } finally {
            this.endTask();
        }
        return deleted;
    }

    async bulkDeleteRoles(guildId, roleIds, onProgress) {
        this.startTask(t("bulk.delRolesTask", roleIds.length), roleIds.length);
        const deleted = [];
        try {
            for (let i = 0; i < roleIds.length; i++) {
                if (this.activeTask?.controller?.signal?.aborted) break;
                const id = roleIds[i];
                try {
                    await this.request("DELETE", `/guilds/${guildId}/roles/${id}`);
                    deleted.push(id);
                    if (onProgress) onProgress(id);
                    this.updateTask(i + 1, `${i + 1}/${roleIds.length}`);
                } catch (e) {
                    console.warn(`[BetterAdmin] Erreur suppression rôle ${id}:`, e);
                }
                await this.sleep(400);
            }
            if (!this.activeTask?.aborting) BdApi.UI.showToast(t("bulk.delRolesDone", deleted.length), { type: "success" });
        } finally {
            this.endTask();
        }
        return deleted;
    }

    async bulkSetSlowmode(channelIds, seconds) {
        this.startTask(t("bulk.slowTask", seconds, channelIds.length), channelIds.length);
        try {
            for (let i = 0; i < channelIds.length; i++) {
                if (this.activeTask?.controller?.signal?.aborted) break;
                const id = channelIds[i];
                try {
                    await this.request("PATCH", `/channels/${id}`, { rate_limit_per_user: seconds });
                    this.updateTask(i + 1, `${i + 1}/${channelIds.length}`);
                } catch (_) {}
                await this.sleep(350);
            }
            if (!this.activeTask?.aborting) BdApi.UI.showToast(t("bulk.slowDone", seconds, channelIds.length), { type: "success" });
        } finally {
            this.endTask();
        }
    }

    async bulkUpdateRoles(guildId, roleIds, patchData) {
        this.startTask(t("bulk.editRolesTask", roleIds.length), roleIds.length);
        try {
            for (let i = 0; i < roleIds.length; i++) {
                if (this.activeTask?.controller?.signal?.aborted) break;
                const id = roleIds[i];
                try {
                    await this.request("PATCH", `/guilds/${guildId}/roles/${id}`, patchData);
                    this.updateTask(i + 1, `${i + 1}/${roleIds.length}`);
                } catch (_) {}
                await this.sleep(350);
            }
            if (!this.activeTask?.aborting) BdApi.UI.showToast(t("bulk.editRolesDone", roleIds.length), { type: "success" });
        } finally {
            this.endTask();
        }
    }

    // ─── Mega Dashboard React UI avec Modale de Confirmation Sécurisée ────────

    openDashboard(guildId, defaultTab = "events") {
        this._closeDashboard();

        const container = document.createElement("div");
        container.id = "ba-command-center-root";
        document.body.appendChild(container);

        const React = BdApi.React;

        class TabErrorBoundary extends React.Component {
            constructor(props) { super(props); this.state = { hasError: false }; }
            static getDerivedStateFromError() { return { hasError: true }; }
            componentDidCatch(err) { console.error("[BetterAdmin Dashboard Error]", err); }
            render() {
                if (this.state.hasError) {
                    return React.createElement("div", { className: "ba-notice ba-notice-danger", role: "alert", style: { flexDirection: "column", alignItems: "flex-start", gap: "8px" } }, [
                        React.createElement("div", { key: "t" }, t("tab.error")),
                        React.createElement("button", { key: "b", type: "button", onClick: () => this.setState({ hasError: false }), className: "ba-btn ba-btn-sm" }, t("tab.retry"))
                    ]);
                }
                return this.props.children;
            }
        }

        // Pastille de couleur + saisie hexadécimale, comme dans les réglages de rôles de Discord
        const ColorField = ({ value, onChange, label }) => {
            const [draft, setDraft] = React.useState(value);
            React.useEffect(() => setDraft(value), [value]);
            return React.createElement("div", { className: "ba-input-group" }, [
                React.createElement("input", { key: "s", type: "color", className: "ba-swatch", value, "aria-label": label, onChange: e => onChange(e.target.value) }),
                React.createElement("input", {
                    key: "t", className: "ba-input", value: draft, maxLength: 7, spellCheck: false, "aria-label": t("color.hex", label),
                    onChange: e => {
                        const v = e.target.value.trim();
                        setDraft(v);
                        const hex = v.startsWith("#") ? v : "#" + v;
                        if (/^#[0-9a-f]{6}$/i.test(hex)) onChange(hex.toLowerCase());
                    },
                    onBlur: () => setDraft(value)
                })
            ]);
        };

        const SelectiveCloneModal = ({ data, onClose, onConfirm }) => {
            if (!data) return null;

            const templateRoles = (data.templateData?.roles || []).filter(r => r.name !== "@everyone" && !r.managed);
            const allChannels = data.templateData?.channels || [];
            const categories = allChannels.filter(c => c.type === 4).sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
            const nonCategories = allChannels.filter(c => c.type !== 4).sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

            const [selectedRoleIds, setSelectedRoleIds] = React.useState(() => new Set(templateRoles.map(r => r.id)));
            const [selectedChannelIds, setSelectedChannelIds] = React.useState(() => new Set(allChannels.map(c => c.id)));
            const [modalTab, setModalTab] = React.useState("all"); // "all", "roles", "channels"
            const [filterText, setFilterText] = React.useState("");

            const toggleRole = (id) => {
                setSelectedRoleIds(prev => {
                    const next = new Set(prev);
                    if (next.has(id)) next.delete(id);
                    else next.add(id);
                    return next;
                });
            };

            const toggleChannel = (id) => {
                setSelectedChannelIds(prev => {
                    const next = new Set(prev);
                    if (next.has(id)) next.delete(id);
                    else next.add(id);
                    return next;
                });
            };

            const toggleCategory = (catId) => {
                const childIds = allChannels.filter(c => (c.parent_id || c.parentId) === catId).map(c => c.id);
                setSelectedChannelIds(prev => {
                    const next = new Set(prev);
                    const isCatSelected = next.has(catId);
                    if (isCatSelected) {
                        next.delete(catId);
                        childIds.forEach(id => next.delete(id));
                    } else {
                        next.add(catId);
                        childIds.forEach(id => next.add(id));
                    }
                    return next;
                });
            };

            const selectAll = () => {
                setSelectedRoleIds(new Set(templateRoles.map(r => r.id)));
                setSelectedChannelIds(new Set(allChannels.map(c => c.id)));
            };

            const deselectAll = () => {
                setSelectedRoleIds(new Set());
                setSelectedChannelIds(new Set());
            };

            const selectRolesOnly = () => {
                setSelectedRoleIds(new Set(templateRoles.map(r => r.id)));
                setSelectedChannelIds(new Set());
            };

            const selectChannelsOnly = () => {
                setSelectedRoleIds(new Set());
                setSelectedChannelIds(new Set(allChannels.map(c => c.id)));
            };

            const totalSelected = selectedRoleIds.size + selectedChannelIds.size;
            const filteredRoles = templateRoles.filter(r => r.name.toLowerCase().includes(filterText.toLowerCase()));

            const filteredCategories = categories.filter(cat => {
                if (!filterText) return true;
                const matchName = cat.name.toLowerCase().includes(filterText.toLowerCase());
                const matchChild = allChannels.some(c => (c.parent_id || c.parentId) === cat.id && c.name.toLowerCase().includes(filterText.toLowerCase()));
                return matchName || matchChild;
            });

            const orphanChannels = nonCategories.filter(ch => {
                const pId = ch.parent_id || ch.parentId;
                return !categories.some(cat => cat.id === pId) && ch.name.toLowerCase().includes(filterText.toLowerCase());
            });

            const tabButton = (id, label) => React.createElement("button", {
                key: id, type: "button", role: "tab", className: "ba-tab",
                "aria-selected": modalTab === id ? "true" : "false",
                onClick: () => setModalTab(id)
            }, label);
            const channelIcon = ch => React.createElement(Icon, { name: CHANNEL_ICON[ch.type] || "text" });
            const channelPick = ch => {
                const on = selectedChannelIds.has(ch.id);
                return React.createElement("label", { key: ch.id, className: `ba-pick${on ? " ba-pick-on" : ""}` }, [
                    React.createElement("input", { key: "c", type: "checkbox", checked: on, onChange: () => toggleChannel(ch.id) }),
                    React.createElement("span", { key: "i", className: "ba-pick-icon", "aria-hidden": "true" }, channelIcon(ch)),
                    React.createElement("span", { key: "n", className: "ba-pick-name" }, ch.name)
                ]);
            };

            return React.createElement("div", { className: "ba-layer", onMouseDown: e => { if (e.target === e.currentTarget) onClose(); } },
                React.createElement("div", { className: "ba-modal ba-modal-lg", role: "dialog", "aria-modal": "true", "aria-labelledby": "ba-clone-title" }, [
                    // En-tête
                    React.createElement("div", { key: "h", className: "ba-modal-header" }, [
                        React.createElement("div", { key: "t" }, [
                            React.createElement("div", { key: "a", id: "ba-clone-title", className: "ba-title" }, data.title),
                            React.createElement("div", { key: "b", className: "ba-subtitle" }, data.subtitle || t("pick.subtitle"))
                        ]),
                        React.createElement("button", { key: "x", type: "button", className: "ba-icon-btn ba-close", "aria-label": t("close"), onClick: onClose, dangerouslySetInnerHTML: { __html: ICON_CLOSE } })
                    ]),

                    // Onglets, filtre et sélection rapide
                    React.createElement("div", { key: "tb", style: { display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "12px 16px", padding: "0 16px 16px", borderBottom: "1px solid var(--ba-border)" } }, [
                        React.createElement("div", { key: "tabs", className: "ba-tabs", role: "tablist", "aria-label": t("pick.typeTabs") }, [
                            tabButton("all", t("pick.tabAll", templateRoles.length + allChannels.length)),
                            tabButton("roles", t("pick.tabRoles", selectedRoleIds.size, templateRoles.length)),
                            tabButton("channels", t("pick.tabChannels", selectedChannelIds.size, allChannels.length))
                        ]),
                        React.createElement("input", {
                            key: "f", className: "ba-input ba-input-sm", style: { width: "200px" },
                            placeholder: t("pick.filter"), "aria-label": t("pick.filterLabel"),
                            value: filterText, onChange: e => setFilterText(e.target.value)
                        }),
                        React.createElement("div", { key: "q", style: { display: "flex", flexWrap: "wrap", gap: "8px", width: "100%" } },
                            [[t("pick.checkAll"), selectAll], [t("pick.uncheckAll"), deselectAll], [t("pick.rolesOnly"), selectRolesOnly], [t("pick.channelsOnly"), selectChannelsOnly]]
                                .map(([label, fn]) => React.createElement("button", { key: label, type: "button", className: "ba-btn ba-btn-xs ba-btn-secondary", onClick: fn }, label))
                        )
                    ]),

                    // Liste
                    React.createElement("div", { key: "b", className: "ba-modal-body ba-scroller", style: { display: "flex", flexDirection: "column", gap: "20px", paddingTop: "16px" } }, [
                        // Rôles
                        (modalTab === "all" || modalTab === "roles") && React.createElement("section", { key: "r" }, [
                            React.createElement("div", { key: "l", className: "ba-label" }, t("pick.rolesHead", selectedRoleIds.size, templateRoles.length)),
                            filteredRoles.length === 0
                                ? React.createElement("div", { key: "e", className: "ba-muted" }, t("pick.noRoles"))
                                : React.createElement("div", { key: "g", className: "ba-grid-2" }, filteredRoles.map(r => {
                                    const on = selectedRoleIds.has(r.id);
                                    const roleColorHex = r.color ? "#" + r.color.toString(16).padStart(6, "0") : "#99aab5";
                                    return React.createElement("label", { key: r.id, className: `ba-pick${on ? " ba-pick-on" : ""}` }, [
                                        React.createElement("input", { key: "c", type: "checkbox", checked: on, onChange: () => toggleRole(r.id) }),
                                        React.createElement("span", { key: "d", className: "ba-dot-color", style: { backgroundColor: roleColorHex } }),
                                        React.createElement("span", { key: "n", className: "ba-pick-name" }, r.name),
                                        r.hoist && React.createElement("span", { key: "h", className: "ba-pill", title: t("role.hoistTip") }, t("role.hoisted"))
                                    ]);
                                }))
                        ]),

                        // Salons et catégories
                        (modalTab === "all" || modalTab === "channels") && React.createElement("section", { key: "c", style: { display: "flex", flexDirection: "column", gap: "8px" } }, [
                            React.createElement("div", { key: "l", className: "ba-label", style: { margin: 0 } }, t("pick.channelsHead", selectedChannelIds.size, allChannels.length)),
                            filteredCategories.length === 0 && orphanChannels.length === 0 && React.createElement("div", { key: "e", className: "ba-muted" }, t("pick.noChannels")),
                            ...filteredCategories.map(cat => {
                                const on = selectedChannelIds.has(cat.id);
                                const children = nonCategories.filter(c => (c.parent_id || c.parentId) === cat.id);
                                const filteredChildren = children.filter(c => !filterText || c.name.toLowerCase().includes(filterText.toLowerCase()));
                                return React.createElement("div", { key: cat.id, className: "ba-group" }, [
                                    React.createElement("label", { key: "h", className: `ba-pick${on ? " ba-pick-on" : ""}`, title: t("pick.catTip") }, [
                                        React.createElement("input", { key: "c", type: "checkbox", checked: on, onChange: () => toggleCategory(cat.id) }),
                                        React.createElement("span", { key: "n", className: "ba-pick-name", style: { fontSize: "12px", fontWeight: 700, letterSpacing: ".02em", textTransform: "uppercase" } }, cat.name),
                                        React.createElement("span", { key: "p", className: "ba-pill" }, t("count.channels", children.length))
                                    ]),
                                    filteredChildren.length > 0 && React.createElement("div", { key: "g", className: "ba-grid-2", style: { paddingLeft: "16px" } }, filteredChildren.map(channelPick))
                                ]);
                            }),
                            orphanChannels.length > 0 && React.createElement("div", { key: "o", className: "ba-group" }, [
                                React.createElement("div", { key: "t", className: "ba-label", style: { margin: "6px 8px" } }, t("pick.noCategory")),
                                React.createElement("div", { key: "g", className: "ba-grid-2", style: { paddingLeft: "16px" } }, orphanChannels.map(channelPick))
                            ])
                        ])
                    ]),

                    // Pied
                    React.createElement("div", { key: "f", className: "ba-modal-footer", style: { justifyContent: "space-between" } }, [
                        React.createElement("span", { key: "s", className: "ba-muted" }, t("pick.footer", selectedRoleIds.size, selectedChannelIds.size)),
                        React.createElement("div", { key: "a", style: { display: "flex", gap: "8px" } }, [
                            React.createElement("button", { key: "c", type: "button", className: "ba-btn ba-btn-link", onClick: onClose }, t("cancel")),
                            React.createElement("button", {
                                key: "o", type: "button", className: "ba-btn", disabled: totalSelected === 0,
                                onClick: () => {
                                    if (totalSelected === 0) return BdApi.UI.showToast(t("pick.needOne"), { type: "warning" });
                                    onConfirm(selectedRoleIds, selectedChannelIds);
                                }
                            }, t("pick.confirm", totalSelected))
                        ])
                    ])
                ])
            );
        };

        const DashboardUI = () => {
            const [tab, setTab] = React.useState(defaultTab);
            const [taskState, setTaskState] = React.useState(this.activeTask);
            const [roles, setRoles] = React.useState([]);
            const [channels, setChannels] = React.useState([]);
            const [membersList, setMembersList] = React.useState([]);
            const [guilds, setGuilds] = React.useState([]);
            const [searchFilter, setSearchFilter] = React.useState("");

            // Modale de Confirmation de Sécurité (Senior Safety Guard)
            const [confirmModal, setConfirmModal] = React.useState(null);

            // Modale de Clonage & Déploiement Sélectif (Senior Selective Guard)
            const [cloneWizard, setCloneWizard] = React.useState(null);

            // Events & Calendar State
            const [eventsList, setEventsList] = React.useState([]);
            const [evName, setEvName] = React.useState(t("ev.defaultName"));
            const [evDesc, setEvDesc] = React.useState(t("ev.defaultDesc"));
            const [evType, setEvType] = React.useState(2); // 2 = Voice, 3 = External
            const [evChannel, setEvChannel] = React.useState("");
            const [evLocation, setEvLocation] = React.useState("https://twitch.tv/mon_stream");
            const [evStartTime, setEvStartTime] = React.useState(new Date(Date.now() + 3600000 * 24).toISOString().slice(0, 16));
            const [evEndTime, setEvEndTime] = React.useState(new Date(Date.now() + 3600000 * 27).toISOString().slice(0, 16));

            // Palette & Gradients
            const [gradPrefix, setGradPrefix] = React.useState(t("grad.defaultPrefix"));
            const [gradColorA, setGradColorA] = React.useState("#ff007f");
            const [gradColorB, setGradColorB] = React.useState("#00f0ff");
            const [gradCount, setGradCount] = React.useState(10);
            const [gradCountDraft, setGradCountDraft] = React.useState("10");

            // Channel Styler
            const [stylerPrefix, setStylerPrefix] = React.useState("│💬・");
            const [stylerVoicePrefix, setStylerVoicePrefix] = React.useState("│🔊・");
            const [stylerSmallCaps, setStylerSmallCaps] = React.useState(false);

            // Category & Perms Cloner
            const [sourceCatId, setSourceCatId] = React.useState("");
            const [targetCatId, setTargetCatId] = React.useState("");

            // Mass Roles Assigner
            const [massRoleTarget, setMassRoleTarget] = React.useState("");
            const [massRoleFilter, setMassRoleFilter] = React.useState("all");

            // Cloneur Emojis / Soundboard
            const [sourceGuildId, setSourceGuildId] = React.useState("");

            // Canned Staff Responses
            const [cannedList, setCannedList] = React.useState(BdApi.Data.load("BetterAdmin", "canned_responses") || [
                { id: "1", title: t("canned.d1Title"), text: t("canned.d1Text") },
                { id: "2", title: t("canned.d2Title"), text: t("canned.d2Text") }
            ]);
            const [cannedEdit, setCannedEdit] = React.useState(null); // { id, title, text } ; id null = nouvelle réponse
            const saveCanned = list => {
                setCannedList(list);
                BdApi.Data.save("BetterAdmin", "canned_responses", list);
            };

            // Vault & Template State
            const fileInputRef = React.useRef(null);
            const [vaultList, setVaultList] = React.useState(() => {
                const globalVaults = BdApi.Data.load("BetterAdmin", "vault_snapshots") || [];
                const legacyVaults = BdApi.Data.load("BetterAdmin", `vault_${guildId}`) || [];
                const combined = [...globalVaults];
                for (const lv of legacyVaults) {
                    if (!combined.some(c => c.date === lv.date && c.name === lv.name)) {
                        combined.push(lv);
                    }
                }
                return combined;
            });
            const [cloneSourceGuildId, setCloneSourceGuildId] = React.useState("");

            // Multi-Selection State (Salons & Rôles)
            const [selectedChannels, setSelectedChannels] = React.useState(new Set());
            const [channelTypeFilter, setChannelTypeFilter] = React.useState("all");
            const [selectedRoles, setSelectedRoles] = React.useState(new Set());
            const [roleSearchFilter, setRoleSearchFilter] = React.useState("");
            const [bulkSlowmodeVal, setBulkSlowmodeVal] = React.useState(0);
            const [bulkRoleColor, setBulkRoleColor] = React.useState("#5865f2");

            const toggleChannelSelection = (id) => {
                setSelectedChannels(prev => {
                    const next = new Set(prev);
                    if (next.has(id)) next.delete(id);
                    else next.add(id);
                    return next;
                });
            };

            const toggleRoleSelection = (id) => {
                setSelectedRoles(prev => {
                    const next = new Set(prev);
                    if (next.has(id)) next.delete(id);
                    else next.add(id);
                    return next;
                });
            };

            // Media Gallery
            const [mediaChannel, setMediaChannel] = React.useState("");
            const [mediaList, setMediaList] = React.useState([]);
            const [mediaLoading, setMediaLoading] = React.useState(false);
            const [mediaScanned, setMediaScanned] = React.useState(false);

            // Ghostpings
            const [ghostpingsList, setGhostpingsList] = React.useState(BdApi.Data.load("BetterAdmin", `ghostpings_${guildId}`) || []);

            // Embed Studio
            const [embedTitle, setEmbedTitle] = React.useState("");
            const [embedDesc, setEmbedDesc] = React.useState("");
            const [embedColor, setEmbedColor] = React.useState("#5865f2");
            const [embedChannel, setEmbedChannel] = React.useState("");

            const guild = this.Stores.GuildStore?.getGuild?.(guildId);
            const guildName = guild?.name || t("cal.server");

            const fetchEvents = () => {
                this.request("GET", `/guilds/${guildId}/scheduled-events?with_user_count=true`).then(res => {
                    if (Array.isArray(res)) setEventsList(res);
                }).catch(() => {});
            };

            React.useEffect(() => {
                const unsubscribe = this.subscribeTask(t => setTaskState(t ? { ...t } : null));

                this.request("GET", `/guilds/${guildId}/roles`).then(r => {
                    if (Array.isArray(r)) {
                        setRoles(r.sort((a, b) => (b.position ?? 0) - (a.position ?? 0)));
                        if (r[0]) setMassRoleTarget(r[0].id);
                    }
                }).catch(() => {});

                this.request("GET", `/guilds/${guildId}/channels`).then(c => {
                    if (Array.isArray(c)) {
                        setChannels(c.sort((a, b) => (a.position ?? 0) - (b.position ?? 0)));
                        const firstVoice = c.find(ch => ch.type === 2);
                        const firstText = c.find(ch => ch.type === 0);
                        const cats = c.filter(ch => ch.type === 4);
                        if (firstVoice) setEvChannel(firstVoice.id);
                        if (firstText) { setMediaChannel(firstText.id); setEmbedChannel(firstText.id); }
                        if (cats.length > 0) { setSourceCatId(cats[0].id); setTargetCatId((cats[1] || cats[0]).id); }
                    }
                }).catch(() => {});

                const allGuilds = Object.values(this.Stores.GuildStore?.getGuilds?.() || {});
                setGuilds(allGuilds);
                const firstOther = allGuilds.find(g => g.id !== guildId);
                if (firstOther) {
                    setSourceGuildId(firstOther.id);
                    setCloneSourceGuildId(firstOther.id);
                }

                fetchEvents();
                setMembersList(this.getGuildMembers(guildId));
                return unsubscribe;
            }, []);

            const filteredChannels = channels.filter(c => {
                const matches = c.name.toLowerCase().includes(searchFilter.toLowerCase());
                if (!matches) return false;
                if (channelTypeFilter === "text") return c.type === 0;
                if (channelTypeFilter === "voice") return c.type === 2;
                if (channelTypeFilter === "cat") return c.type === 4;
                return true;
            });
            const filteredRoles = roles.filter(r => r.id !== guildId && r.name.toLowerCase().includes(roleSearchFilter.toLowerCase()));
            const suspiciousBioMembers = membersList.filter(m => /(discord\.gg|free-nitro|claim-gift|t\.me|wa\.me)/i.test(m.customStatus));
            const gradientPreview = BetterAdmin.generateHslGradient(gradColorA, gradColorB, gradCount);

            // Discord ne garde en cache local qu'une partie des membres sur les gros serveurs
            const memberTotal = this.getGuildMemberCount(guildId);
            const membersComplete = memberTotal != null && membersList.length >= memberTotal;
            const partialMembersWarning = () => membersComplete ? null : React.createElement("div", {
                className: "ba-notice ba-notice-warning", role: "note"
            }, memberTotal != null
                ? t("members.partial", membersList.length, memberTotal)
                : t("members.unknown", membersList.length));

            // Rôles orphelins (0 membre) — uniquement si la liste des membres est complète,
            // sinon des rôles portés par des membres non chargés seraient supprimés à tort
            const emptyRoles = membersComplete
                ? roles.filter(r => r.id !== guildId && !r.managed && !membersList.some(m => m.roles.includes(r.id)))
                : [];
            // Membres à dé-hoister
            const hoistedMembers = membersList.filter(m => /^[!.\-?_#@*]/.test(m.username || ""));

            const dialogRef = React.useRef(null);
            const downOnBackdrop = React.useRef(false);
            React.useEffect(() => { dialogRef.current?.focus(); }, []);

            // Échap ferme d'abord la modale ouverte, puis le tableau de bord
            React.useEffect(() => {
                const onKey = e => {
                    if (e.key !== "Escape") return;
                    e.preventDefault();
                    e.stopPropagation();
                    if (confirmModal) setConfirmModal(null);
                    else if (cloneWizard) setCloneWizard(null);
                    else this._closeDashboard();
                };
                window.addEventListener("keydown", onKey, true);
                return () => window.removeEventListener("keydown", onKey, true);
            }, [confirmModal, cloneWizard]);

            const requestConfirmation = (title, message, onConfirm) => {
                setConfirmModal({ title, message, onConfirm });
            };

            const handleWizardConfirm = (selectedRoleIds, selectedChannelIds) => {
                const data = cloneWizard;
                setCloneWizard(null);
                if (!data) return;

                if (data.mode === "clone_direct" || data.mode === "import_json" || data.mode === "deploy_snapshot") {
                    this.deployServerTemplate(guildId, data.templateData, {
                        selectedRoleIds,
                        selectedChannelIds,
                        onRoleCreated: newRole => setRoles(prev => [...prev, newRole]),
                        onChannelCreated: newChan => setChannels(prev => [...prev, newChan])
                    });
                } else if (data.mode === "create_snapshot") {
                    const filteredRoles = (data.templateData?.roles || []).filter(r => selectedRoleIds.has(r.id) || r.name === "@everyone");
                    const filteredChannels = (data.templateData?.channels || []).filter(c => selectedChannelIds.has(c.id));
                    const snapshot = {
                        id: Date.now().toString(),
                        guildId,
                        name: guildName,
                        date: new Date().toLocaleString(),
                        roles: filteredRoles,
                        channels: filteredChannels
                    };
                    const updated = [snapshot, ...vaultList.filter(v => v.id !== snapshot.id)].slice(0, 10);
                    setVaultList(updated);
                    BdApi.Data.save("BetterAdmin", "vault_snapshots", updated);
                    BdApi.UI.showToast(t("vault.saved", filteredRoles.length, filteredChannels.length), { type: "success" });
                } else if (data.mode === "export_json") {
                    const filteredRoles = (data.templateData?.roles || []).filter(r => selectedRoleIds.has(r.id) || r.name === "@everyone");
                    const filteredChannels = (data.templateData?.channels || []).filter(c => selectedChannelIds.has(c.id));
                    const exportData = {
                        version: "1.0",
                        guildId,
                        name: guildName,
                        date: new Date().toISOString(),
                        roles: filteredRoles,
                        channels: filteredChannels
                    };
                    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = Object.assign(document.createElement("a"), { href: url, download: `template_${guildName.replace(/[^a-zA-Z0-9_-]/g, "_")}_${Date.now()}.json` });
                    a.click();
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                    BdApi.UI.showToast(t("vault.exported", filteredRoles.length, filteredChannels.length), { type: "success" });
                }
            };

            const iconUrl = guild?.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=64` : null;
            const guildAcronym = guildName.replace(/'s /g, " ").replace(/\w+/g, w => w[0]).replace(/\s/g, "").slice(0, 4);
            const NAV = [
                [t("nav.sEvents"), [["events", t("nav.events")]]],
                [t("nav.sSecurity"), [["security", t("nav.security")], ["ghostpings", t("nav.ghostpings")], ["bios", t("nav.bios")]]],
                [t("nav.sBulk"), [
                    ["channels", t("nav.channels")], ["styler", t("nav.styler")], ["cat_perms", t("nav.catPerms")],
                    ["gradients", t("nav.gradients")], ["clean_roles", t("nav.cleanRoles")], ["mass_roles", t("nav.massRoles")],
                    ["clone_assets", t("nav.assets")], ["vault", t("nav.vault")]
                ]],
                ["Studio", [["media", t("nav.media")], ["embed", t("nav.embed")], ["canned", t("nav.canned")], ["packs", t("nav.packs")]]]
            ];

            return React.createElement("div", {
                className: "ba-ui ba-backdrop ba-command-center",
                // Ne ferme que sur un vrai clic extérieur (pas une sélection de texte relâchée dehors)
                onMouseDown: e => { downOnBackdrop.current = e.target === e.currentTarget; },
                onClick: e => {
                    if (downOnBackdrop.current && e.target === e.currentTarget && !confirmModal && !cloneWizard) this._closeDashboard();
                    downOnBackdrop.current = false;
                }
            },
                React.createElement("div", { className: "ba-dialog", role: "dialog", "aria-modal": "true", "aria-label": `BetterAdmin — ${guildName}`, tabIndex: -1, ref: dialogRef }, [
                    // En-tête
                    React.createElement("div", { key: "h", className: "ba-header" }, [
                        iconUrl
                            ? React.createElement("img", { key: "i", className: "ba-avatar", src: iconUrl, alt: "" })
                            : React.createElement("div", { key: "i", className: "ba-avatar ba-avatar-acronym", "aria-hidden": "true" }, guildAcronym),
                        React.createElement("div", { key: "t", className: "ba-header-text" }, [
                            React.createElement("div", { key: "a", className: "ba-heading" }, "BetterAdmin"),
                            React.createElement("div", { key: "b", className: "ba-muted ba-small" }, `${guildName} · v${this.getVersion()}`)
                        ]),
                        React.createElement("button", { key: "x", type: "button", className: "ba-icon-btn", "aria-label": t("close"), title: t("closeEsc"), onClick: () => this._closeDashboard(), dangerouslySetInnerHTML: { __html: ICON_CLOSE } })
                    ]),

                    // Corps
                    React.createElement("div", { key: "b", className: "ba-body" }, [
                        // Navigation
                        React.createElement("nav", { key: "n", className: "ba-sidebar ba-scroller", "aria-label": "Sections" },
                            NAV.flatMap(([section, items]) => [
                                React.createElement("div", { key: `s-${section}`, className: "ba-nav-title" }, section),
                                ...items.map(([id, label]) => React.createElement("button", {
                                    key: id, type: "button", className: "ba-nav-btn",
                                    "aria-current": tab === id ? "page" : undefined,
                                    onClick: () => setTab(id)
                                }, label))
                            ])
                        ),

                        // Contenu
                        React.createElement("div", { key: "c", className: "ba-content-area ba-scroller" }, React.createElement(TabErrorBoundary, { key: tab }, [
                            // ─── Onglet : Événements & Calendrier ───────────────────
                            tab === "events" && React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "16px" } }, [
                                React.createElement("h2", { className: "ba-title" }, t("nav.events")),
                                React.createElement("div", { className: "ba-card", style: { display: "flex", flexDirection: "column", gap: "12px" } }, [
                                    React.createElement("div", { className: "ba-heading" }, t("ev.createHead")),
                                    React.createElement("div", { style: { display: "grid", gridTemplateColumns: "2fr 1fr", gap: "10px" } }, [
                                        React.createElement("div", null, [
                                            React.createElement("label", { className: "ba-label" }, t("ev.name")),
                                            React.createElement("input", { className: "ba-input", value: evName, onChange: e => setEvName(e.target.value) })
                                        ]),
                                        React.createElement("div", null, [
                                            React.createElement("label", { className: "ba-label" }, t("ev.locType")),
                                            React.createElement("select", { className: "ba-select", value: evType, onChange: e => setEvType(parseInt(e.target.value)) }, [
                                                React.createElement("option", { value: 2 }, t("ev.voice")),
                                                React.createElement("option", { value: 3 }, t("ev.external"))
                                            ])
                                        ])
                                    ]),
                                    evType === 2
                                        ? React.createElement("div", null, [
                                            React.createElement("label", { className: "ba-label" }, t("ev.voice")),
                                            React.createElement("select", { className: "ba-select", value: evChannel, onChange: e => setEvChannel(e.target.value) },
                                                channels.filter(c => c.type === 2).map(c => React.createElement("option", { key: c.id, value: c.id }, `${c.name}`))
                                            )
                                        ])
                                        : React.createElement("div", null, [
                                            React.createElement("label", { className: "ba-label" }, t("ev.linkOrAddress")),
                                            React.createElement("input", { className: "ba-input", value: evLocation, onChange: e => setEvLocation(e.target.value) })
                                        ]),
                                    React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" } }, [
                                        React.createElement("div", null, [
                                            React.createElement("label", { className: "ba-label" }, t("ev.start")),
                                            React.createElement("input", { className: "ba-input", type: "datetime-local", value: evStartTime, onChange: e => setEvStartTime(e.target.value) })
                                        ]),
                                        React.createElement("div", null, [
                                            React.createElement("label", { className: "ba-label" }, t("ev.end")),
                                            React.createElement("input", { className: "ba-input", type: "datetime-local", value: evEndTime, onChange: e => setEvEndTime(e.target.value) })
                                        ])
                                    ]),
                                    React.createElement("div", null, [
                                        React.createElement("label", { key: "l", className: "ba-label", htmlFor: "ba-ev-desc" }, "Description"),
                                        React.createElement("textarea", { key: "i", id: "ba-ev-desc", className: "ba-textarea", rows: 2, placeholder: t("ev.descPh"), value: evDesc, onChange: e => setEvDesc(e.target.value) })
                                    ]),
                                    React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "4px" } }, [
                                        React.createElement("button", {
                                            onClick: async () => {
                                                try {
                                                    const payload = {
                                                        name: evName, description: evDesc,
                                                        scheduled_start_time: new Date(evStartTime).toISOString(),
                                                        scheduled_end_time: evEndTime ? new Date(evEndTime).toISOString() : null,
                                                        entity_type: evType, privacy_level: 2,
                                                        channel_id: evType === 2 ? evChannel : null,
                                                        entity_metadata: evType === 3 ? { location: evLocation } : null
                                                    };
                                                    await this.request("POST", `/guilds/${guildId}/scheduled-events`, payload);
                                                    BdApi.UI.showToast(t("ev.created"), { type: "success" });
                                                    fetchEvents();
                                                } catch(err) { BdApi.UI.showToast(`${err.message}`, { type: "error" }); }
                                            },
                                            className: "ba-btn"
                                        }, t("ev.create")),
                                        React.createElement("button", {
                                            onClick: () => BetterAdmin.exportToAppleCalendarICS({ name: evName, description: evDesc, startTime: evStartTime, endTime: evEndTime, location: evType === 3 ? evLocation : `Discord (${guildName})` }, guildName),
                                            className: "ba-btn ba-btn-success"
                                        }, t("ev.downloadIcs")),
                                        React.createElement("button", {
                                            onClick: () => {
                                                const link = BetterAdmin.getGoogleCalendarLink({ name: evName, description: evDesc, startTime: evStartTime, endTime: evEndTime, location: evType === 3 ? evLocation : `Discord (${guildName})` }, guildName);
                                                navigator.clipboard.writeText(link);
                                                BdApi.UI.showToast(t("ev.gLinkCopied"), { type: "info" });
                                            },
                                            className: "ba-btn ba-btn-secondary"
                                        }, t("ev.copyGLink"))
                                    ])
                                ]),

                                React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "10px" } }, [
                                    React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "space-between", alignItems: "center" } }, [
                                        React.createElement("h3", { className: "ba-heading" }, t("ev.listHead", eventsList.length)),
                                        React.createElement("button", { onClick: fetchEvents, className: "ba-btn ba-btn-secondary ba-btn-sm" }, t("refresh"))
                                    ]),
                                    eventsList.length === 0
                                        ? React.createElement("div", { className: "ba-empty" }, t("ev.none"))
                                        : eventsList.map(ev => React.createElement("div", {
                                            key: ev.id, className: "ba-card", style: { display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "space-between", alignItems: "center", padding: "12px 16px" }
                                        }, [
                                            React.createElement("div", null, [
                                                React.createElement("div", { className: "ba-row-title" }, ev.name),
                                                React.createElement("div", { style: { fontSize: "12px", color: "var(--ba-muted)", marginTop: "2px" } }, `${new Date(ev.scheduled_start_time).toLocaleString()} · ${t("ev.interested", ev.user_count || 0)}`)
                                            ]),
                                            React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: "6px" } }, [
                                                React.createElement("button", { onClick: () => BetterAdmin.exportToAppleCalendarICS(ev, guildName), className: "ba-btn ba-btn-success ba-btn-sm" }, t("ev.icsFile")),
                                                React.createElement("button", {
                                                    onClick: () => {
                                                        const gLink = BetterAdmin.getGoogleCalendarLink(ev, guildName);
                                                        navigator.clipboard.writeText(`📢 **${ev.name}**\n🕒 ${new Date(ev.scheduled_start_time).toLocaleString()}\n\n📅 **${t("ev.addToCal")}**\n🔗 [${t("ev.gCalLink")}](${gLink})`);
                                                        BdApi.UI.showToast(t("ev.msgCopied"), { type: "info" });
                                                    },
                                                    className: "ba-btn ba-btn-secondary ba-btn-sm"
                                                }, t("ev.copyReminder")),
                                                React.createElement("button", {
                                                    onClick: () => {
                                                        requestConfirmation(t("ev.cancelTitle"), t("ev.cancelConfirm", ev.name), async () => {
                                                            await this.request("DELETE", `/guilds/${guildId}/scheduled-events/${ev.id}`);
                                                            setEventsList(prev => prev.filter(x => x.id !== ev.id));
                                                            BdApi.UI.showToast(t("ev.cancelled"), { type: "info" });
                                                        });
                                                    },
                                                    className: "ba-btn ba-btn-danger ba-btn-sm"
                                                }, t("cancel"))
                                            ])
                                        ]))
                                ])
                            ]),

                            // ─── Onglet : Styliseur de Salons ────────────────────────
                            tab === "styler" && React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "16px" } }, [
                                React.createElement("h2", { className: "ba-title" }, t("nav.styler")),
                                React.createElement("div", { className: "ba-card", style: { display: "flex", flexDirection: "column", gap: "12px" } }, [
                                    React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" } }, [
                                        React.createElement("div", { key: "t" }, [
                                            React.createElement("label", { key: "l", className: "ba-label", htmlFor: "ba-styler-text" }, t("styler.textPrefix")),
                                            React.createElement("input", { key: "i", id: "ba-styler-text", className: "ba-input", value: stylerPrefix, onChange: e => setStylerPrefix(e.target.value) })
                                        ]),
                                        React.createElement("div", { key: "v" }, [
                                            React.createElement("label", { key: "l", className: "ba-label", htmlFor: "ba-styler-voice" }, t("styler.voicePrefix")),
                                            React.createElement("input", { key: "i", id: "ba-styler-voice", className: "ba-input", value: stylerVoicePrefix, onChange: e => setStylerVoicePrefix(e.target.value) })
                                        ])
                                    ]),
                                    React.createElement("label", { className: "ba-check", style: { alignItems: "center" } }, [
                                        React.createElement("input", { key: "c", type: "checkbox", checked: stylerSmallCaps, onChange: e => setStylerSmallCaps(e.target.checked) }),
                                        t("styler.smallCaps")
                                    ]),
                                    // Aperçu sur le premier salon textuel et le premier salon vocal
                                    (() => {
                                        const sample = (type, prefix) => {
                                            const ch = channels.find(c => c.type === type);
                                            if (!ch) return null;
                                            const raw = ch.name.replace(/^[^a-zA-Z0-9]+/, "");
                                            return prefix + (stylerSmallCaps ? BetterAdmin.toSmallCaps(raw) : raw);
                                        };
                                        const names = [sample(0, stylerPrefix), sample(2, stylerVoicePrefix)].filter(Boolean);
                                        return names.length > 0 && React.createElement("div", { className: "ba-hint", style: { marginTop: 0 } }, [
                                            t("styler.preview"),
                                            ...names.map((n, i) => React.createElement("span", { key: i, style: { marginRight: "16px", color: "var(--ba-header)", fontWeight: 500 } }, n))
                                        ]);
                                    })(),
                                    React.createElement("button", {
                                        onClick: () => {
                                            requestConfirmation(t("styler.renameTitle"), t("styler.renameConfirm", channels.filter(c => c.type !== 4).length), async () => {
                                                this.startTask(t("styler.task"), channels.length);
                                                try {
                                                    for (let i = 0; i < channels.length; i++) {
                                                        if (this.activeTask?.controller?.signal?.aborted) break;
                                                        const ch = channels[i];
                                                        if (ch.type === 4) continue;
                                                        let rawName = ch.name.replace(/^[^a-zA-Z0-9]+/, "");
                                                        if (stylerSmallCaps) rawName = BetterAdmin.toSmallCaps(rawName);
                                                        const newName = (ch.type === 2 ? stylerVoicePrefix : stylerPrefix) + rawName;
                                                        await this.request("PATCH", `/channels/${ch.id}`, { name: newName });
                                                        this.updateTask(i + 1, `#${newName}`);
                                                        await this.sleep(400);
                                                    }
                                                    if (!this.activeTask?.aborting) BdApi.UI.showToast(t("styler.done"), { type: "success" });
                                                } finally { this.endTask(); }
                                            });
                                        },
                                        className: "ba-btn", style: { alignSelf: "flex-start" }
                                    }, t("styler.apply"))
                                ])
                            ]),

                            // ─── Onglet : Cloneur Permissions Catégories ─────────────
                            tab === "cat_perms" && React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "16px" } }, [
                                React.createElement("h2", { className: "ba-title" }, t("nav.catPerms")),
                                React.createElement("div", { className: "ba-card", style: { display: "flex", flexDirection: "column", gap: "16px" } }, [
                                    React.createElement("div", { key: "s" }, [
                                        React.createElement("label", { key: "l", className: "ba-label", htmlFor: "ba-perm-source" }, t("perms.source")),
                                        React.createElement("select", { key: "i", id: "ba-perm-source", className: "ba-select", value: sourceCatId, onChange: e => setSourceCatId(e.target.value) },
                                            channels.filter(c => c.type === 4).map(c => React.createElement("option", { key: c.id, value: c.id }, `${c.name}`))
                                        )
                                    ]),
                                    React.createElement("div", { key: "t" }, [
                                        React.createElement("label", { key: "l", className: "ba-label", htmlFor: "ba-perm-target" }, t("perms.target")),
                                        React.createElement("select", { key: "i", id: "ba-perm-target", className: "ba-select", value: targetCatId, onChange: e => setTargetCatId(e.target.value) },
                                            channels.filter(c => c.type === 4).map(c => React.createElement("option", { key: c.id, value: c.id }, `${c.name}`))
                                        ),
                                        React.createElement("div", { key: "h", className: "ba-hint" }, sourceCatId && sourceCatId === targetCatId
                                            ? t("perms.pickTwo")
                                            : t("perms.hint"))
                                    ]),
                                    React.createElement("button", {
                                        disabled: !sourceCatId || !targetCatId || sourceCatId === targetCatId,
                                        onClick: async () => {
                                            try {
                                                const src = channels.find(c => c.id === sourceCatId);
                                                if (!src) return;
                                                const overwrites = (src.permission_overwrites || src.permissionOverwrites || []).map(o => ({
                                                    id: o.id, type: o.type, allow: o.allow, deny: o.deny
                                                }));
                                                await this.request("PATCH", `/channels/${targetCatId}`, { permission_overwrites: overwrites });
                                                BdApi.UI.showToast(t("perms.done"), { type: "success" });
                                            } catch(e) { BdApi.UI.showToast(`${e.message}`, { type: "error" }); }
                                        },
                                        className: "ba-btn", style: { alignSelf: "flex-start" }
                                    }, t("perms.sync"))
                                ])
                            ]),

                            // ─── Onglet : Rôles en Masse & Nettoyage ─────────────────
                            tab === "clean_roles" && React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "16px" } }, [
                                React.createElement("h2", { className: "ba-title" }, t("nav.cleanRoles")),
                                partialMembersWarning(),

                                // Outils Rapides
                                React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" } }, [
                                    React.createElement("div", { className: "ba-card", style: { display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "space-between", alignItems: "center" } }, [
                                        React.createElement("div", null, [
                                            React.createElement("div", { className: "ba-heading" }, t("clean.empty", emptyRoles.length)),
                                            React.createElement("div", { style: { color: "var(--ba-muted)", fontSize: "12px" } }, membersComplete ? t("clean.emptyHint") : t("clean.disabled"))
                                        ]),
                                        React.createElement("button", {
                                            onClick: () => {
                                                requestConfirmation(t("clean.deleteEmptyTitle"), t("clean.deleteEmptyConfirm", emptyRoles.length), async () => {
                                                    await this.bulkDeleteRoles(guildId, emptyRoles.map(r => r.id), delId => setRoles(prev => prev.filter(x => x.id !== delId)));
                                                });
                                            },
                                            disabled: emptyRoles.length === 0,
                                            className: "ba-btn ba-btn-danger ba-btn-sm"
                                        }, t("deleteN", emptyRoles.length))
                                    ]),
                                    React.createElement("div", { className: "ba-card", style: { display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "space-between", alignItems: "center" } }, [
                                        React.createElement("div", null, [
                                            React.createElement("div", { className: "ba-heading" }, t("clean.hoisted", hoistedMembers.length)),
                                            React.createElement("div", { style: { color: "var(--ba-muted)", fontSize: "12px" } }, t("clean.hoistedHint"))
                                        ]),
                                        React.createElement("button", {
                                            onClick: () => {
                                                requestConfirmation(t("clean.dehoist"), t("clean.dehoistConfirm", hoistedMembers.length), async () => {
                                                    this.startTask(t("clean.dehoistTask"), hoistedMembers.length);
                                                    try {
                                                        for (let i = 0; i < hoistedMembers.length; i++) {
                                                            if (this.activeTask?.controller?.signal?.aborted) break;
                                                            const m = hoistedMembers[i];
                                                            const cleanNick = m.username.replace(/^[!.\-?_#@*]+/, "").trim() || t("member");
                                                            await this.request("PATCH", `/guilds/${guildId}/members/${m.userId}`, { nick: cleanNick });
                                                            this.updateTask(i + 1, cleanNick);
                                                            await this.sleep(400);
                                                        }
                                                        if (!this.activeTask?.aborting) BdApi.UI.showToast(t("clean.dehoistDone"), { type: "success" });
                                                    } finally { this.endTask(); }
                                                });
                                            },
                                            disabled: hoistedMembers.length === 0,
                                            className: "ba-btn ba-btn-sm"
                                        }, t("clean.dehoistN", hoistedMembers.length))
                                    ])
                                ]),

                                // Section Multi-Sélection Rôles
                                React.createElement("div", { className: "ba-card", style: { display: "flex", flexDirection: "column", gap: "12px" } }, [
                                    React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "space-between", alignItems: "center" } }, [
                                        React.createElement("div", { className: "ba-heading" }, t("roles.all", filteredRoles.length)),
                                        React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: "8px" } }, [
                                            React.createElement("button", {
                                                onClick: () => setSelectedRoles(new Set(filteredRoles.map(r => r.id))),
                                                className: "ba-btn ba-btn-secondary ba-btn-sm"
                                            }, t("selectAllN", filteredRoles.length)),
                                            React.createElement("button", {
                                                onClick: () => setSelectedRoles(new Set()),
                                                className: "ba-btn ba-btn-secondary ba-btn-sm"
                                            }, t("deselectAll"))
                                        ])
                                    ]),

                                    React.createElement("input", {
                                        placeholder: t("roles.filter"),
                                        className: "ba-input",
                                        value: roleSearchFilter,
                                        onChange: e => setRoleSearchFilter(e.target.value)
                                    }),

                                    // Bandeau d'Actions Groupées Rôles
                                    selectedRoles.size > 0 && React.createElement("div", {
                                        style: {
                                            padding: "10px 14px",
                                            background: "color-mix(in srgb, var(--ba-brand) 12%, transparent)",
                                            border: "1px solid var(--ba-brand)",
                                            borderRadius: "8px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            flexWrap: "wrap",
                                            gap: "10px"
                                        }
                                    }, [
                                        React.createElement("span", { style: { fontWeight: 700, color: "var(--ba-header)", fontSize: "14px" } }, t("roles.selected", selectedRoles.size)),
                                        React.createElement("div", { style: { display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" } }, [
                                            React.createElement("button", {
                                                onClick: () => {
                                                    requestConfirmation(t("roles.bulkDeleteTitle"), t("roles.bulkDeleteConfirm", selectedRoles.size), async () => {
                                                        const toDelete = Array.from(selectedRoles);
                                                        await this.bulkDeleteRoles(guildId, toDelete, delId => setRoles(prev => prev.filter(r => r.id !== delId)));
                                                        setSelectedRoles(new Set());
                                                    });
                                                },
                                                className: "ba-btn ba-btn-danger ba-btn-sm"
                                            }, t("deleteN", selectedRoles.size)),

                                            React.createElement("input", {
                                                type: "color",
                                                value: bulkRoleColor,
                                                onChange: e => setBulkRoleColor(e.target.value),
                                                className: "ba-swatch", title: t("roles.color"), "aria-label": t("roles.color")
                                            }),
                                            React.createElement("button", {
                                                onClick: async () => {
                                                    const colorInt = parseInt(bulkRoleColor.replace("#", ""), 16);
                                                    await this.bulkUpdateRoles(guildId, Array.from(selectedRoles), { color: colorInt });
                                                    setRoles(prev => prev.map(r => selectedRoles.has(r.id) ? { ...r, color: colorInt } : r));
                                                },
                                                className: "ba-btn ba-btn-secondary ba-btn-sm"
                                            }, t("roles.applyColor")),

                                            React.createElement("button", {
                                                onClick: async () => {
                                                    await this.bulkUpdateRoles(guildId, Array.from(selectedRoles), { hoist: true });
                                                    setRoles(prev => prev.map(r => selectedRoles.has(r.id) ? { ...r, hoist: true } : r));
                                                },
                                                className: "ba-btn ba-btn-secondary ba-btn-sm"
                                            }, t("roles.hoist")),

                                            React.createElement("button", {
                                                onClick: async () => {
                                                    await this.bulkUpdateRoles(guildId, Array.from(selectedRoles), { mentionable: true });
                                                    setRoles(prev => prev.map(r => selectedRoles.has(r.id) ? { ...r, mentionable: true } : r));
                                                },
                                                className: "ba-btn ba-btn-secondary ba-btn-sm"
                                            }, t("roles.mentionable"))
                                        ])
                                    ]),

                                    // Liste des Rôles
                                    React.createElement("div", { className: "ba-scroller", style: { maxHeight: "360px", display: "flex", flexDirection: "column", gap: "6px" } },
                                        filteredRoles.map(r => {
                                            const isSelected = selectedRoles.has(r.id);
                                            const memberCount = membersList.filter(m => m.roles.includes(r.id)).length;
                                            const roleColorHex = r.color ? "#" + r.color.toString(16).padStart(6, "0") : "#99aab5";
                                            return React.createElement("div", {
                                                key: r.id,
                                                onClick: () => toggleRoleSelection(r.id),
                                                className: "ba-card",
                                                style: {
                                                    padding: "8px 12px",
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center",
                                                    cursor: "pointer",
                                                    background: isSelected ? "color-mix(in srgb, var(--ba-brand) 10%, var(--ba-bg-alt))" : "var(--ba-bg-alt)",
                                                    border: isSelected ? "1px solid var(--ba-brand)" : "1px solid var(--ba-border)"
                                                }
                                            }, [
                                                React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "10px" } }, [
                                                    React.createElement("input", {
                                                        type: "checkbox",
                                                        checked: isSelected,
                                                        onChange: () => {},
                                                        style: { cursor: "pointer" }
                                                    }),
                                                    React.createElement("div", { style: { width: "12px", height: "12px", borderRadius: "50%", backgroundColor: roleColorHex } }),
                                                    React.createElement("span", { style: { fontWeight: 600, color: "var(--ba-header)", fontSize: "14px" } }, r.name),
                                                    r.hoist && React.createElement("span", { className: "ba-pill" }, t("role.hoisted")),
                                                    r.mentionable && React.createElement("span", { className: "ba-pill" }, t("roles.mentionable"))
                                                ]),
                                                React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "10px" } }, [
                                                    React.createElement("span", { style: { fontSize: "12px", color: "var(--ba-muted)" }, title: membersComplete ? undefined : t("roles.countTip") }, t("roles.memberCount", memberCount, membersComplete ? "" : "+")),
                                                    React.createElement("button", {
                                                        onClick: (e) => {
                                                            e.stopPropagation();
                                                            requestConfirmation(t("roles.deleteTitle"), t("roles.deleteConfirm", r.name), async () => {
                                                                await this.request("DELETE", `/guilds/${guildId}/roles/${r.id}`);
                                                                setRoles(prev => prev.filter(x => x.id !== r.id));
                                                                BdApi.UI.showToast(t("roles.deleted", r.name), { type: "info" });
                                                            });
                                                        },
                                                        className: "ba-btn ba-btn-danger ba-btn-xs", title: t("delete"), "aria-label": t("delete")
                                                    }, React.createElement(Icon, { name: "trash", size: 14 }))
                                                ])
                                            ]);
                                        })
                                    )
                                ])
                            ]),

                            // ─── Onglet : Attribution Rôles en Masse ─────────────────
                            tab === "mass_roles" && React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "16px" } }, [
                                React.createElement("h2", { className: "ba-title" }, t("nav.massRoles")),
                                partialMembersWarning(),
                                React.createElement("div", { className: "ba-card", style: { display: "flex", flexDirection: "column", gap: "12px" } }, [
                                    React.createElement("div", { key: "r" }, [
                                        React.createElement("label", { key: "l", className: "ba-label", htmlFor: "ba-mass-role" }, t("mass.role")),
                                        React.createElement("select", { key: "i", id: "ba-mass-role", className: "ba-select", value: massRoleTarget, onChange: e => setMassRoleTarget(e.target.value) },
                                            roles.filter(r => r.id !== guildId).map(r => React.createElement("option", { key: r.id, value: r.id }, r.name))
                                        )
                                    ]),
                                    React.createElement("div", { key: "f" }, [
                                        React.createElement("label", { key: "l", className: "ba-label", htmlFor: "ba-mass-filter" }, t("mass.targets")),
                                        React.createElement("select", { key: "i", id: "ba-mass-filter", className: "ba-select", value: massRoleFilter, onChange: e => setMassRoleFilter(e.target.value) }, [
                                            React.createElement("option", { key: "all", value: "all" }, membersComplete ? t("mass.allServer") : t("mass.allLoaded")),
                                            React.createElement("option", { key: "none", value: "no_role" }, t("mass.noRole"))
                                        ]),
                                        React.createElement("div", { key: "h", className: "ba-hint" }, t("mass.botsExcluded"))
                                    ]),
                                    React.createElement("button", {
                                        onClick: () => {
                                            const targets = membersList.filter(m => !m.isBot && (massRoleFilter === "all" || m.roles.length === 0));
                                            requestConfirmation(t("mass.confirmTitle"), t("mass.confirm", targets.length), async () => {
                                                this.startTask(t("mass.task", targets.length), targets.length);
                                                try {
                                                    for (let i = 0; i < targets.length; i++) {
                                                        if (this.activeTask?.controller?.signal?.aborted) break;
                                                        await this.request("PUT", `/guilds/${guildId}/members/${targets[i].userId}/roles/${massRoleTarget}`);
                                                        this.updateTask(i + 1, targets[i].username);
                                                        await this.sleep(400);
                                                    }
                                                    if (!this.activeTask?.aborting) BdApi.UI.showToast(t("mass.done", targets.length), { type: "success" });
                                                } finally { this.endTask(); }
                                            });
                                        },
                                        className: "ba-btn", style: { alignSelf: "flex-start" }
                                    }, t("mass.start"))
                                ])
                            ]),

                            // ─── Onglet : Cloneur Soundboard & Emojis ────────────────
                            tab === "clone_assets" && React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "16px" } }, [
                                React.createElement("h2", { className: "ba-title" }, t("nav.assets")),
                                React.createElement("div", { className: "ba-card", style: { display: "flex", flexDirection: "column", gap: "12px" } }, [
                                    React.createElement("div", { key: "s" }, [
                                        React.createElement("label", { key: "l", className: "ba-label", htmlFor: "ba-assets-source" }, t("assets.source")),
                                        React.createElement("select", { key: "i", id: "ba-assets-source", className: "ba-select", value: sourceGuildId, onChange: e => setSourceGuildId(e.target.value) },
                                            guilds.filter(g => g.id !== guildId).map(g => React.createElement("option", { key: g.id, value: g.id }, g.name))
                                        )
                                    ]),
                                    React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: "10px" } }, [
                                        React.createElement("button", {
                                            onClick: async () => {
                                                // Avant : si une autre tâche tournait, le "finally" la terminait à sa place
                                                let started = false;
                                                try {
                                                    const emojis = await this.request("GET", `/guilds/${sourceGuildId}/emojis`);
                                                    if (!Array.isArray(emojis) || emojis.length === 0) return BdApi.UI.showToast(t("assets.noEmojis"), { type: "info" });
                                                    this.startTask(t("assets.emojisTask", emojis.length), emojis.length);
                                                    started = true;
                                                    let done = 0, failed = 0;
                                                    for (let i = 0; i < emojis.length; i++) {
                                                        if (this.activeTask?.controller?.signal?.aborted) break;
                                                        const em = emojis[i];
                                                        const ext = em.animated ? "gif" : "png";
                                                        try {
                                                            const image = await this.fetchAsDataURL(`https://cdn.discordapp.com/emojis/${em.id}.${ext}`, `image/${ext}`);
                                                            await this.request("POST", `/guilds/${guildId}/emojis`, { name: em.name, image });
                                                            done++;
                                                        } catch (e) {
                                                            if (e?.name === "AbortError") break;
                                                            failed++;
                                                            console.warn(`[BetterAdmin] Emoji ${em.name} non cloné :`, e);
                                                        }
                                                        this.updateTask(i + 1, em.name);
                                                        await this.sleep(600);
                                                    }
                                                    BdApi.UI.showToast(`${t("assets.emojisDone", done)}${failed ? t("assets.failed", failed) : ""}.`, { type: failed ? "warning" : "success" });
                                                } catch (e) {
                                                    if (e?.name !== "AbortError") BdApi.UI.showToast(t("assets.stopped", e.message), { type: "error" });
                                                } finally { if (started) this.endTask(); }
                                            },
                                            className: "ba-btn"
                                        }, t("assets.cloneEmojis")),
                                        React.createElement("button", {
                                            onClick: async () => {
                                                let started = false;
                                                try {
                                                    const sounds = await this.request("GET", `/guilds/${sourceGuildId}/soundboard-sounds`);
                                                    const soundList = Array.isArray(sounds?.items) ? sounds.items : (Array.isArray(sounds) ? sounds : []);
                                                    if (soundList.length === 0) return BdApi.UI.showToast(t("assets.noSounds"), { type: "info" });
                                                    this.startTask(t("assets.soundsTask", soundList.length), soundList.length);
                                                    started = true;
                                                    let done = 0, failed = 0;
                                                    for (let i = 0; i < soundList.length; i++) {
                                                        if (this.activeTask?.controller?.signal?.aborted) break;
                                                        const s = soundList[i];
                                                        try {
                                                            // Le type réel (mp3 / ogg) est repris de la réponse du CDN
                                                            const sound = await this.fetchAsDataURL(`https://cdn.discordapp.com/soundboard-sounds/${s.sound_id}`, "audio/mpeg");
                                                            await this.request("POST", `/guilds/${guildId}/soundboard-sounds`, { name: s.name, sound, volume: s.volume, emoji_name: s.emoji_name });
                                                            done++;
                                                        } catch (e) {
                                                            if (e?.name === "AbortError") break;
                                                            failed++;
                                                            console.warn(`[BetterAdmin] Son ${s.name} non cloné :`, e);
                                                        }
                                                        this.updateTask(i + 1, s.name);
                                                        await this.sleep(600);
                                                    }
                                                    BdApi.UI.showToast(`${t("assets.soundsDone", done)}${failed ? t("assets.failed", failed) : ""}.`, { type: failed ? "warning" : "success" });
                                                } catch (e) {
                                                    if (e?.name !== "AbortError") BdApi.UI.showToast(t("assets.stopped", e.message), { type: "error" });
                                                } finally { if (started) this.endTask(); }
                                            },
                                            className: "ba-btn ba-btn-secondary"
                                        }, t("assets.cloneSounds"))
                                    ])
                                ])
                            ]),

                            // ─── Onglet : Coffre Sauvegardes Vault ────────────────────
                            tab === "vault" && React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "16px" } }, [
                                React.createElement("h2", { className: "ba-title" }, t("nav.vault")),

                                // File input caché pour l'import JSON
                                React.createElement("input", {
                                    type: "file",
                                    ref: fileInputRef,
                                    accept: ".json",
                                    style: { display: "none" },
                                    onChange: e => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        const reader = new FileReader();
                                        reader.onload = evt => {
                                            try {
                                                const data = JSON.parse(evt.target.result);
                                                if (!Array.isArray(data.roles) || !Array.isArray(data.channels)) {
                                                    return BdApi.UI.showToast(t("vault.badJson"), { type: "error" });
                                                }
                                                setCloneWizard({
                                                    mode: "import_json",
                                                    title: t("vault.importTitle", data.name || t("untitled")),
                                                    subtitle: t("vault.importSub"),
                                                    sourceName: data.name || "Template JSON",
                                                    templateData: data
                                                });
                                            } catch (err) {
                                                BdApi.UI.showToast(t("vault.readError", err.message), { type: "error" });
                                            }
                                        };
                                        reader.readAsText(file);
                                        e.target.value = "";
                                    }
                                }),

                                // Section 1 : Actions Rapides
                                React.createElement("div", { className: "ba-card", style: { display: "flex", flexDirection: "column", gap: "12px" } }, [
                                    React.createElement("div", { className: "ba-heading" }, t("vault.backupHead")),
                                    React.createElement("p", { className: "ba-hint", style: { margin: 0 } }, t("vault.backupHint")),
                                    React.createElement("div", { style: { display: "flex", gap: "10px", flexWrap: "wrap" } }, [
                                        React.createElement("button", {
                                            onClick: async () => {
                                                try {
                                                    BdApi.UI.showToast(t("vault.reading"), { type: "info" });
                                                    const rolesData = await this.request("GET", `/guilds/${guildId}/roles`);
                                                    const channelsData = await this.request("GET", `/guilds/${guildId}/channels`);
                                                    setCloneWizard({
                                                        mode: "create_snapshot",
                                                        title: t("vault.backupTitle", guildName),
                                                        subtitle: t("vault.backupSub"),
                                                        sourceName: guildName,
                                                        templateData: {
                                                            name: guildName,
                                                            guildId,
                                                            roles: rolesData,
                                                            channels: channelsData
                                                        }
                                                    });
                                                } catch (e) {
                                                    BdApi.UI.showToast(t("vault.error", e.message), { type: "error" });
                                                }
                                            },
                                            className: "ba-btn"
                                        }, t("vault.create")),
                                        React.createElement("button", {
                                            onClick: async () => {
                                                try {
                                                    BdApi.UI.showToast(t("vault.reading"), { type: "info" });
                                                    const rolesData = await this.request("GET", `/guilds/${guildId}/roles`);
                                                    const channelsData = await this.request("GET", `/guilds/${guildId}/channels`);
                                                    setCloneWizard({
                                                        mode: "export_json",
                                                        title: t("vault.exportTitle", guildName),
                                                        subtitle: t("vault.exportSub"),
                                                        sourceName: guildName,
                                                        templateData: {
                                                            name: guildName,
                                                            guildId,
                                                            roles: rolesData,
                                                            channels: channelsData
                                                        }
                                                    });
                                                } catch (e) {
                                                    BdApi.UI.showToast(t("vault.exportError", e.message), { type: "error" });
                                                }
                                            },
                                            className: "ba-btn ba-btn-secondary"
                                        }, t("vault.exportJson")),
                                        React.createElement("button", {
                                            onClick: () => {
                                                fileInputRef.current?.click();
                                            },
                                            className: "ba-btn ba-btn-success"
                                        }, t("vault.importJson"))
                                    ])
                                ]),

                                // Section 2 : Clonage Direct Serveur à Serveur
                                React.createElement("div", { className: "ba-card", style: { display: "flex", flexDirection: "column", gap: "12px" } }, [
                                    React.createElement("div", { className: "ba-heading" }, t("vault.cloneHead")),
                                    React.createElement("p", { className: "ba-hint", style: { margin: 0 } }, t("vault.cloneHint")),
                                    React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" } }, [
                                        React.createElement("select", {
                                            className: "ba-select",
                                            style: { maxWidth: "340px" },
                                            value: cloneSourceGuildId || (guilds.find(g => g.id !== guildId)?.id || ""),
                                            onChange: e => setCloneSourceGuildId(e.target.value)
                                        }, guilds.filter(g => g.id !== guildId).map(g => React.createElement("option", { key: g.id, value: g.id }, `${g.name}`))),
                                        React.createElement("button", {
                                            onClick: async () => {
                                                const effectiveId = cloneSourceGuildId || guilds.find(g => g.id !== guildId)?.id;
                                                const sourceG = guilds.find(g => g.id === effectiveId);
                                                if (!sourceG) return BdApi.UI.showToast(t("vault.pickSource"), { type: "error" });
                                                try {
                                                    BdApi.UI.showToast(t("vault.loadingSource"), { type: "info" });
                                                    const rolesData = await this.request("GET", `/guilds/${sourceG.id}/roles`);
                                                    const channelsData = await this.request("GET", `/guilds/${sourceG.id}/channels`);
                                                    setCloneWizard({
                                                        mode: "clone_direct",
                                                        title: t("vault.cloneTitle", sourceG.name, guildName),
                                                        subtitle: t("vault.cloneSub", sourceG.name),
                                                        sourceName: sourceG.name,
                                                        templateData: {
                                                            name: sourceG.name,
                                                            guildId: sourceG.id,
                                                            roles: rolesData,
                                                            channels: channelsData
                                                        }
                                                    });
                                                } catch (e) {
                                                    BdApi.UI.showToast(t("vault.sourceError", e.message), { type: "error" });
                                                }
                                            },
                                            className: "ba-btn"
                                        }, t("vault.cloneHere"))
                                    ])
                                ]),

                                // Section 3 : Snapshots Enregistrés dans le Coffre
                                React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "10px" } }, [
                                    React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "space-between", alignItems: "center" } }, [
                                        React.createElement("h3", { className: "ba-heading" }, t("vault.localHead", vaultList.length)),
                                        vaultList.length > 0 && React.createElement("button", {
                                            onClick: () => {
                                                requestConfirmation(t("vault.emptyTitle"), t("vault.emptyConfirm"), () => {
                                                    setVaultList([]);
                                                    BdApi.Data.save("BetterAdmin", "vault_snapshots", []);
                                                    BdApi.UI.showToast(t("vault.emptied"), { type: "info" });
                                                });
                                            },
                                            className: "ba-btn ba-btn-secondary ba-btn-sm"
                                        }, t("vault.deleteAll"))
                                    ]),
                                    vaultList.length === 0
                                        ? React.createElement("div", { className: "ba-card", style: { color: "var(--ba-muted)", textAlign: "center", padding: "24px" } }, t("vault.none"))
                                        : vaultList.map((snp, idx) => React.createElement("div", {
                                            key: snp.id || idx,
                                            className: "ba-card",
                                            style: { display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "space-between", alignItems: "center", padding: "12px 16px" }
                                        }, [
                                            React.createElement("div", null, [
                                                React.createElement("div", { className: "ba-row-title" }, `${snp.name}`),
                                                React.createElement("div", { style: { fontSize: "12px", color: "var(--ba-muted)", marginTop: "2px" } }, `${snp.date} · ${t("vault.snapMeta", (snp.roles||[]).length, (snp.channels||[]).length)}`)
                                            ]),
                                            React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: "6px" } }, [
                                                React.createElement("button", {
                                                    onClick: () => {
                                                        setCloneWizard({
                                                            mode: "deploy_snapshot",
                                                            title: t("vault.deployTitle", snp.name),
                                                            subtitle: t("vault.deploySub", snp.date),
                                                            sourceName: snp.name,
                                                            templateData: snp
                                                        });
                                                    },
                                                    className: "ba-btn ba-btn-success ba-btn-sm"
                                                }, t("vault.deploy")),
                                                React.createElement("button", {
                                                    onClick: () => {
                                                        const blob = new Blob([JSON.stringify(snp, null, 2)], { type: "application/json" });
                                                        const url = URL.createObjectURL(blob);
                                                        const a = Object.assign(document.createElement("a"), { href: url, download: `snapshot_${snp.name.replace(/[^a-zA-Z0-9_-]/g, "_")}_${snp.id || Date.now()}.json` });
                                                        a.click();
                                                        setTimeout(() => URL.revokeObjectURL(url), 1000);
                                                        BdApi.UI.showToast(t("vault.downloaded"), { type: "info" });
                                                    },
                                                    className: "ba-btn ba-btn-secondary ba-btn-sm"
                                                }, t("vault.export")),
                                                React.createElement("button", {
                                                    onClick: () => {
                                                        const updated = vaultList.filter((_, i) => i !== idx);
                                                        setVaultList(updated);
                                                        BdApi.Data.save("BetterAdmin", "vault_snapshots", updated);
                                                        BdApi.UI.showToast(t("vault.snapDeleted"), { type: "info" });
                                                    },
                                                    className: "ba-btn ba-btn-danger ba-btn-sm", title: t("delete"), "aria-label": t("delete")
                                                }, React.createElement(Icon, { name: "trash", size: 14 }))
                                            ])
                                        ]))
                                ])
                            ]),

                            // ─── Onglet : Réponses types ─────────────────────────────
                            tab === "canned" && (() => {
                                const activeChannel = this.Stores.ChannelStore?.getChannel?.(this.Stores.SelectedChannelStore?.getChannelId?.());
                                const editor = cannedEdit && React.createElement("div", { key: "edit", className: "ba-card", style: { display: "flex", flexDirection: "column", gap: "16px" } }, [
                                    React.createElement("div", { key: "h", className: "ba-heading" }, cannedEdit.id ? t("canned.editHead") : t("canned.new")),
                                    React.createElement("div", { key: "t" }, [
                                        React.createElement("label", { key: "l", className: "ba-label", htmlFor: "ba-canned-title" }, t("canned.name")),
                                        React.createElement("input", { key: "i", id: "ba-canned-title", className: "ba-input", maxLength: 80, autoFocus: true, placeholder: t("canned.namePh"), value: cannedEdit.title, onChange: ev => setCannedEdit({ ...cannedEdit, title: ev.target.value }) })
                                    ]),
                                    React.createElement("div", { key: "x" }, [
                                        React.createElement("label", { key: "l", className: "ba-label", htmlFor: "ba-canned-text" }, "Message"),
                                        React.createElement("textarea", { key: "i", id: "ba-canned-text", className: "ba-textarea", rows: 4, maxLength: 2000, placeholder: t("canned.textPh"), value: cannedEdit.text, onChange: ev => setCannedEdit({ ...cannedEdit, text: ev.target.value }) }),
                                        React.createElement("div", { key: "c", className: "ba-hint" }, `${cannedEdit.text.length} / 2000`)
                                    ]),
                                    React.createElement("div", { key: "b", style: { display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "flex-end" } }, [
                                        React.createElement("button", { key: "c", type: "button", className: "ba-btn ba-btn-secondary", onClick: () => setCannedEdit(null) }, t("cancel")),
                                        React.createElement("button", {
                                            key: "s", type: "button", className: "ba-btn",
                                            disabled: !cannedEdit.title.trim() || !cannedEdit.text.trim(),
                                            onClick: () => {
                                                const item = { id: cannedEdit.id || String(Date.now()), title: cannedEdit.title.trim(), text: cannedEdit.text.trim() };
                                                saveCanned(cannedEdit.id ? cannedList.map(c => c.id === item.id ? item : c) : [...cannedList, item]);
                                                setCannedEdit(null);
                                            }
                                        }, t("save"))
                                    ])
                                ]);

                                return React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "16px" } }, [
                                    React.createElement("div", { key: "head", style: { display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "space-between", alignItems: "center" } }, [
                                        React.createElement("div", { key: "t" }, [
                                            React.createElement("h2", { key: "h", className: "ba-title" }, t("nav.canned")),
                                            React.createElement("div", { key: "s", className: "ba-hint", style: { marginTop: "4px" } }, activeChannel
                                                ? t("canned.sentIn", activeChannel.name)
                                                : t("canned.openChannel"))
                                        ]),
                                        !cannedEdit && React.createElement("button", {
                                            key: "n", type: "button", className: "ba-btn ba-btn-sm",
                                            onClick: () => setCannedEdit({ id: null, title: "", text: "" })
                                        }, [React.createElement(Icon, { key: "i", name: "plus", size: 16 }), t("canned.new")])
                                    ]),
                                    editor,
                                    cannedList.length === 0 && !cannedEdit && React.createElement("div", { key: "empty", className: "ba-empty" }, t("canned.none")),
                                    React.createElement("div", { key: "list", style: { display: "flex", flexDirection: "column", gap: "8px" } },
                                        cannedList.map(c => React.createElement("div", {
                                            key: c.id, className: "ba-card", style: { display: "flex", gap: "12px", alignItems: "center", padding: "12px 16px" }
                                        }, [
                                            React.createElement("div", { key: "t", style: { flex: "1 1 auto", minWidth: 0 } }, [
                                                React.createElement("div", { key: "n", className: "ba-row-title" }, c.title),
                                                React.createElement("div", { key: "x", style: { fontSize: "14px", color: "var(--ba-muted)", marginTop: "2px", whiteSpace: "pre-wrap", wordBreak: "break-word" } }, c.text)
                                            ]),
                                            React.createElement("button", {
                                                key: "e", type: "button", className: "ba-icon-btn", title: t("edit"), "aria-label": t("canned.editLabel", c.title),
                                                onClick: () => setCannedEdit({ ...c })
                                            }, React.createElement(Icon, { name: "edit", size: 16 })),
                                            React.createElement("button", {
                                                key: "d", type: "button", className: "ba-icon-btn ba-icon-btn-danger", title: t("delete"), "aria-label": t("canned.deleteLabel", c.title),
                                                onClick: () => requestConfirmation(t("canned.deleteTitle"), t("canned.deleteConfirm", c.title), () => {
                                                    saveCanned(cannedList.filter(x => x.id !== c.id));
                                                    if (cannedEdit?.id === c.id) setCannedEdit(null);
                                                })
                                            }, React.createElement(Icon, { name: "trash", size: 16 })),
                                            React.createElement("button", {
                                                key: "s", type: "button", className: "ba-btn ba-btn-sm",
                                                disabled: !activeChannel,
                                                onClick: async () => {
                                                    try {
                                                        await this.request("POST", `/channels/${activeChannel.id}/messages`, { content: c.text });
                                                        BdApi.UI.showToast(t("canned.sent", activeChannel.name), { type: "success" });
                                                    } catch (err) {
                                                        BdApi.UI.showToast(t("canned.sendError", err.message), { type: "error" });
                                                    }
                                                }
                                            }, t("send"))
                                        ]))
                                    )
                                ]);
                            })(),

                            // ─── Onglet : Sécurité ───────────────────────────────────
                            tab === "security" && React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "16px" } }, [
                                React.createElement("h2", { className: "ba-title" }, t("nav.security")),
                                React.createElement("div", { className: "ba-card ba-accent-danger", style: { display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px" } }, [
                                    React.createElement("div", null, [
                                        React.createElement("div", { className: "ba-heading", style: { color: "var(--ba-danger)" } }, t("lock.head")),
                                        React.createElement("div", { style: { color: "var(--ba-muted)", fontSize: "14px", marginTop: "4px" } }, t("lock.hint"))
                                    ]),
                                    React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: "8px" } }, [
                                        React.createElement("button", {
                                            onClick: () => {
                                                requestConfirmation(t("lock.title"), t("lock.confirm"), () => this.triggerLockdown(guildId));
                                            },
                                            className: "ba-btn ba-btn-danger"
                                        }, t("lock.btn")),
                                        React.createElement("button", {
                                            onClick: () => {
                                                requestConfirmation(t("unlock.title"), t("unlock.confirm"), () => this.releaseLockdown(guildId));
                                            },
                                            className: "ba-btn ba-btn-success"
                                        }, t("unlock.btn"))
                                    ])
                                ])
                            ]),

                            // ─── Onglet : Palette & Dégradés ─────────────────────────
                            tab === "gradients" && React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "16px" } }, [
                                React.createElement("h2", { className: "ba-title" }, t("nav.gradients")),
                                React.createElement("div", { className: "ba-card", style: { display: "flex", flexDirection: "column", gap: "12px" } }, [
                                    React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px" } }, [
                                        React.createElement("div", { key: "p" }, [
                                            React.createElement("label", { key: "l", className: "ba-label", htmlFor: "ba-grad-prefix" }, t("grad.prefix")),
                                            React.createElement("input", { key: "i", id: "ba-grad-prefix", className: "ba-input", value: gradPrefix, onChange: e => setGradPrefix(e.target.value) })
                                        ]),
                                        React.createElement("div", { key: "n" }, [
                                            React.createElement("label", { key: "l", className: "ba-label", htmlFor: "ba-grad-count" }, t("grad.count")),
                                            React.createElement("input", {
                                                key: "i", id: "ba-grad-count", className: "ba-input", type: "number", min: 2, max: 50, value: gradCountDraft,
                                                onChange: e => {
                                                    setGradCountDraft(e.target.value);
                                                    const n = parseInt(e.target.value, 10);
                                                    if (n >= 2 && n <= 50) setGradCount(n);
                                                },
                                                onBlur: () => setGradCountDraft(String(gradCount))
                                            }),
                                            React.createElement("div", { key: "h", className: "ba-hint" }, t("grad.countHint"))
                                        ]),
                                        React.createElement("div", { key: "a" }, [
                                            React.createElement("div", { key: "l", className: "ba-label" }, t("grad.colorA")),
                                            React.createElement(ColorField, { key: "f", label: t("grad.colorA"), value: gradColorA, onChange: setGradColorA })
                                        ]),
                                        React.createElement("div", { key: "b" }, [
                                            React.createElement("div", { key: "l", className: "ba-label" }, t("grad.colorB")),
                                            React.createElement(ColorField, { key: "f", label: t("grad.colorB"), value: gradColorB, onChange: setGradColorB })
                                        ])
                                    ]),
                                    React.createElement("div", { style: { display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "4px" } }, [
                                        React.createElement("button", { onClick: () => { setGradColorA("#ff007f"); setGradColorB("#00f0ff"); }, className: "ba-btn ba-btn-secondary ba-btn-sm" }, "Cyberpunk Neon"),
                                        React.createElement("button", { onClick: () => { setGradColorA("#8a2387"); setGradColorB("#f27121"); }, className: "ba-btn ba-btn-secondary ba-btn-sm" }, "Sunset Royale"),
                                        React.createElement("button", { onClick: () => { setGradColorA("#0ba360"); setGradColorB("#3cba92"); }, className: "ba-btn ba-btn-secondary ba-btn-sm" }, "Emerald Aurora"),
                                        React.createElement("button", { onClick: () => { setGradColorA("#fa709a"); setGradColorB("#fee140"); }, className: "ba-btn ba-btn-secondary ba-btn-sm" }, "Vaporwave Dream")
                                    ]),
                                    React.createElement("div", { style: { display: "flex", gap: "4px", margin: "10px 0" } },
                                        gradientPreview.map((p, idx) => React.createElement("div", {
                                            key: idx, title: p.hex, style: { flex: 1, height: "28px", backgroundColor: p.hex, borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.8)" }
                                        }, idx + 1))
                                    ),
                                    React.createElement("button", {
                                        onClick: () => {
                                            requestConfirmation(t("grad.title"), t("grad.confirm", gradCount), async () => {
                                                this.startTask(t("grad.task", gradCount), gradCount);
                                                try {
                                                    for (let i = 0; i < gradientPreview.length; i++) {
                                                        if (this.activeTask?.controller?.signal?.aborted) break;
                                                        const p = gradientPreview[i];
                                                        const name = `${gradPrefix} ${String(i + 1).padStart(2, "0")}`;
                                                        await this.request("POST", `/guilds/${guildId}/roles`, { name, color: p.colorInt, hoist: false, mentionable: false, permissions: "0" });
                                                        this.updateTask(i + 1, `${name} (${p.hex})`);
                                                        await this.sleep(400);
                                                    }
                                                    if (!this.activeTask?.aborting) BdApi.UI.showToast(t("grad.done"), { type: "success" });
                                                } finally { this.endTask(); }
                                            });
                                        },
                                        className: "ba-btn", style: { alignSelf: "flex-start" }
                                    }, t("grad.btn", gradCount))
                                ])
                            ]),

                            // ─── Onglet : Galerie Médias ─────────────────────────────
                            tab === "media" && React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "16px" } }, [
                                React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "space-between", alignItems: "center" } }, [
                                    React.createElement("h2", { className: "ba-title" }, t("media.head", mediaList.length)),
                                    React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: "8px" } }, [
                                        React.createElement("select", { className: "ba-select", style: { width: "180px" }, "aria-label": t("media.channel"), value: mediaChannel, onChange: e => setMediaChannel(e.target.value) },
                                            channels.filter(c => c.type === 0).map(c => React.createElement("option", { key: c.id, value: c.id }, `#${c.name}`))
                                        ),
                                        React.createElement("button", {
                                            onClick: async () => {
                                                setMediaLoading(true);
                                                try {
                                                    setMediaList(await this.extractChannelMedia(mediaChannel));
                                                    setMediaScanned(true);
                                                } catch (e) {
                                                    BdApi.UI.showToast(t("media.readError", e.message), { type: "error" });
                                                } finally {
                                                    setMediaLoading(false);
                                                }
                                            },
                                            disabled: !mediaChannel || mediaLoading,
                                            className: "ba-btn"
                                        }, mediaLoading ? t("media.searching") : t("media.search"))
                                    ])
                                ]),
                                mediaList.length === 0 && React.createElement("div", { className: "ba-empty" }, mediaScanned
                                    ? t("media.none")
                                    : t("media.intro")),
                                React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "10px" } },
                                    mediaList.map((m, idx) => React.createElement("div", {
                                        key: idx, className: "ba-card", style: { padding: "6px", position: "relative" }
                                    }, [
                                        m.isVideo
                                            ? React.createElement("video", { src: m.url, muted: true, preload: "metadata", title: m.filename, style: { width: "100%", height: "100px", objectFit: "cover", borderRadius: "4px", background: "var(--ba-bg-deep)" } })
                                            : React.createElement("img", { src: m.url, alt: m.filename || "", loading: "lazy", style: { width: "100%", height: "100px", objectFit: "cover", borderRadius: "4px", background: "var(--ba-bg-deep)" } }),
                                        React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "space-between", alignItems: "center", marginTop: "6px" } }, [
                                            React.createElement("span", { style: { fontSize: "12px", color: "var(--ba-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, m.author),
                                            React.createElement("button", {
                                                onClick: e => {
                                                    const remove = async () => {
                                                    try {
                                                        await this.request("DELETE", `/channels/${m.channelId}/messages/${m.messageId}`);
                                                        setMediaList(prev => prev.filter(x => x.messageId !== m.messageId));
                                                        BdApi.UI.showToast(t("media.deleted"), { type: "success" });
                                                    } catch (e) {
                                                        BdApi.UI.showToast(t("media.deleteError", e.message), { type: "error" });
                                                    }
                                                    };
                                                    // Comme dans Discord : Maj + clic supprime sans confirmation
                                                    if (e.shiftKey) remove();
                                                    else requestConfirmation(t("media.deleteTitle"), t("media.deleteConfirm", m.author), remove);
                                                },
                                                className: "ba-btn ba-btn-danger ba-btn-xs", title: t("media.deleteTip"), "aria-label": t("delete")
                                            }, React.createElement(Icon, { name: "trash", size: 14 }))
                                        ])
                                    ]))
                                )
                            ]),

                            // ─── Onglet : Ghostpings ─────────────────────────────────
                            tab === "ghostpings" && React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "16px" } }, [
                                React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "space-between", alignItems: "center" } }, [
                                    React.createElement("h2", { className: "ba-title" }, t("gp.head", ghostpingsList.length)),
                                    React.createElement("button", {
                                        onClick: () => {
                                            BdApi.Data.save("BetterAdmin", `ghostpings_${guildId}`, []);
                                            setGhostpingsList([]);
                                            BdApi.UI.showToast(t("gp.cleared"), { type: "info" });
                                        },
                                        className: "ba-btn ba-btn-secondary"
                                    }, t("gp.clear"))
                                ]),
                                React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "8px" } },
                                    ghostpingsList.length === 0
                                        ? React.createElement("div", { className: "ba-empty" }, t("gp.none"))
                                        : ghostpingsList.map((gp, i) => React.createElement("div", {
                                            key: i, className: "ba-card ba-accent-warning", style: { padding: "12px 16px" }
                                        }, [
                                            React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "space-between" } }, [
                                                React.createElement("span", { className: "ba-row-title" }, t("gp.mentioned", gp.authorName, gp.targets)),
                                                React.createElement("span", { style: { fontSize: "12px", color: "var(--ba-muted)" } }, gp.date)
                                            ]),
                                            React.createElement("div", { style: { fontSize: "14px", color: "var(--ba-text)", marginTop: "4px", background: "var(--ba-bg-deep)", padding: "6px 10px", borderRadius: "4px" } }, gp.content || React.createElement("span", { className: "ba-muted" }, t("gp.empty")))
                                        ]))
                                )
                            ]),

                            // ─── Onglet : Statuts & Bios ─────────────────────────────
                            tab === "bios" && React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "16px" } }, [
                                React.createElement("h2", { className: "ba-title" }, t("bios.head", suspiciousBioMembers.length)),
                                partialMembersWarning(),
                                React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "8px" } },
                                    suspiciousBioMembers.length === 0
                                        ? React.createElement("div", { className: "ba-notice ba-notice-success" }, t("bios.none"))
                                        : suspiciousBioMembers.map(m => React.createElement("div", {
                                            key: m.userId, className: "ba-card ba-accent-danger", style: { padding: "12px 16px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px" }
                                        }, [
                                            React.createElement("div", null, [
                                                React.createElement("div", { className: "ba-row-title" }, m.username),
                                                React.createElement("div", { style: { fontSize: "12px", color: "var(--ba-danger)", marginTop: "2px" } }, t("bios.status", m.customStatus))
                                            ]),
                                            React.createElement("button", {
                                                onClick: () => {
                                                    requestConfirmation(t("bios.kickTitle"), t("bios.kickConfirm", m.username, m.customStatus), async () => {
                                                        await this.request("DELETE", `/guilds/${guildId}/members/${m.userId}`);
                                                        BdApi.UI.showToast(t("bios.kicking", m.username), { type: "info" });
                                                    });
                                                },
                                                className: "ba-btn ba-btn-danger"
                                            }, t("bios.kick"))
                                        ]))
                                )
                            ]),

                            // ─── Onglet : Salons & Catégories (Gestion en Masse) ─────
                            tab === "channels" && React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "16px" } }, [
                                React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "space-between", alignItems: "center" } }, [
                                    React.createElement("h2", { className: "ba-title" }, t("ch.head", channels.length)),
                                    React.createElement("input", {
                                        placeholder: t("ch.filter"),
                                        className: "ba-input",
                                        style: { width: "240px" },
                                        value: searchFilter,
                                        onChange: e => setSearchFilter(e.target.value)
                                    })
                                ]),

                                // Filtres rapides de type & Boutons Tout sélectionner / Décocher
                                React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" } }, [
                                    React.createElement("div", { className: "ba-tabs", role: "group", "aria-label": t("ch.filterType") }, [
                                        React.createElement("button", {
                                            onClick: () => setChannelTypeFilter("all"),
                                            type: "button", className: `ba-tab${channelTypeFilter === "all" ? " ba-active" : ""}`,
                                            "aria-pressed": channelTypeFilter === "all"
                                        }, t("ch.all", channels.length)),
                                        React.createElement("button", {
                                            onClick: () => setChannelTypeFilter("cat"),
                                            type: "button", className: `ba-tab${channelTypeFilter === "cat" ? " ba-active" : ""}`,
                                            "aria-pressed": channelTypeFilter === "cat"
                                        }, t("ch.cats", channels.filter(c => c.type === 4).length)),
                                        React.createElement("button", {
                                            onClick: () => setChannelTypeFilter("text"),
                                            type: "button", className: `ba-tab${channelTypeFilter === "text" ? " ba-active" : ""}`,
                                            "aria-pressed": channelTypeFilter === "text"
                                        }, t("ch.text", channels.filter(c => c.type === 0).length)),
                                        React.createElement("button", {
                                            onClick: () => setChannelTypeFilter("voice"),
                                            type: "button", className: `ba-tab${channelTypeFilter === "voice" ? " ba-active" : ""}`,
                                            "aria-pressed": channelTypeFilter === "voice"
                                        }, t("ch.voice", channels.filter(c => c.type === 2).length))
                                    ]),
                                    React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: "8px" } }, [
                                        React.createElement("button", {
                                            onClick: () => setSelectedChannels(new Set(filteredChannels.map(c => c.id))),
                                            className: "ba-btn ba-btn-secondary ba-btn-sm"
                                        }, t("selectAllN", filteredChannels.length)),
                                        React.createElement("button", {
                                            onClick: () => setSelectedChannels(new Set()),
                                            className: "ba-btn ba-btn-secondary ba-btn-sm"
                                        }, t("deselectAll"))
                                    ])
                                ]),

                                // Bandeau d'Actions Groupées (Flottant / Actif quand sélection > 0)
                                selectedChannels.size > 0 && React.createElement("div", {
                                    style: {
                                        padding: "12px 16px",
                                        background: "color-mix(in srgb, var(--ba-brand) 12%, transparent)",
                                        border: "1px solid var(--ba-brand)",
                                        borderRadius: "8px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        flexWrap: "wrap",
                                        gap: "10px"
                                    }
                                }, [
                                    React.createElement("span", { style: { fontWeight: 700, color: "var(--ba-header)", fontSize: "14px" } }, t("ch.selected", selectedChannels.size)),
                                    React.createElement("div", { style: { display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" } }, [
                                        // Bouton Supprimer
                                        React.createElement("button", {
                                            onClick: () => {
                                                requestConfirmation(
                                                    t("ch.bulkDeleteTitle"),
                                                    t("ch.bulkDeleteConfirm", selectedChannels.size),
                                                    async () => {
                                                        const toDelete = Array.from(selectedChannels);
                                                        await this.bulkDeleteChannels(toDelete, delId => {
                                                            setChannels(prev => prev.filter(c => c.id !== delId));
                                                        });
                                                        setSelectedChannels(new Set());
                                                    }
                                                );
                                            },
                                            className: "ba-btn ba-btn-danger ba-btn-sm"
                                        }, t("deleteN", selectedChannels.size)),

                                        // Bouton Purger Textuels sélectionnés
                                        React.createElement("button", {
                                            onClick: () => {
                                                const textIds = Array.from(selectedChannels).filter(id => {
                                                    const ch = channels.find(c => c.id === id);
                                                    return ch && (ch.type === 0 || ch.type === 5);
                                                });
                                                if (textIds.length === 0) {
                                                    BdApi.UI.showToast(t("ch.noText"), { type: "warning" });
                                                    return;
                                                }
                                                requestConfirmation(
                                                    t("ch.bulkPurgeTitle"),
                                                    t("ch.bulkPurgeConfirm", textIds.length),
                                                    async () => {
                                                        this.startTask(t("ch.bulkPurgeTask", textIds.length), textIds.length);
                                                        let purged = 0;
                                                        try {
                                                            for (let i = 0; i < textIds.length; i++) {
                                                                if (this.activeTask?.controller?.signal?.aborted) break;
                                                                purged += await this.smartPurge(textIds[i], { limit: 50 });
                                                                this.updateTask(i + 1, `${i + 1}/${textIds.length}`);
                                                                await this.sleep(400);
                                                            }
                                                            if (!this.activeTask?.aborting) BdApi.UI.showToast(t("ch.bulkPurgeDone", purged, textIds.length), { type: "success" });
                                                        } finally {
                                                            this.endTask();
                                                        }
                                                    }
                                                );
                                            },
                                            className: "ba-btn ba-btn-secondary ba-btn-sm"
                                        }, t("ch.purgeMessages")),

                                        // Slowmode groupé
                                        React.createElement("select", {
                                            value: bulkSlowmodeVal,
                                            onChange: e => setBulkSlowmodeVal(parseInt(e.target.value)),
                                            className: "ba-select ba-input-sm", "aria-label": t("slow.label"),
                                            style: { width: "170px" }
                                        }, [
                                            React.createElement("option", { value: 0 }, t("slow.off")),
                                            React.createElement("option", { value: 5 }, t("slow.sec", 5)),
                                            React.createElement("option", { value: 10 }, t("slow.sec", 10)),
                                            React.createElement("option", { value: 15 }, t("slow.sec", 15)),
                                            React.createElement("option", { value: 30 }, t("slow.sec", 30)),
                                            React.createElement("option", { value: 60 }, t("slow.min", 1)),
                                            React.createElement("option", { value: 120 }, t("slow.min", 2)),
                                            React.createElement("option", { value: 300 }, t("slow.min", 5)),
                                            React.createElement("option", { value: 600 }, t("slow.min", 10)),
                                            React.createElement("option", { value: 900 }, t("slow.min", 15)),
                                            React.createElement("option", { value: 1800 }, t("slow.min", 30)),
                                            React.createElement("option", { value: 3600 }, t("slow.hour", 1)),
                                            React.createElement("option", { value: 7200 }, t("slow.hour", 2)),
                                            React.createElement("option", { value: 21600 }, t("slow.hour", 6))
                                        ]),
                                        React.createElement("button", {
                                            onClick: async () => {
                                                const textIds = Array.from(selectedChannels).filter(id => {
                                                    const ch = channels.find(c => c.id === id);
                                                    return ch && (ch.type === 0 || ch.type === 5 || ch.type === 15);
                                                });
                                                if (textIds.length === 0) {
                                                    BdApi.UI.showToast(t("slow.needText"), { type: "warning" });
                                                    return;
                                                }
                                                await this.bulkSetSlowmode(textIds, bulkSlowmodeVal);
                                                setChannels(prev => prev.map(c => selectedChannels.has(c.id) ? { ...c, rate_limit_per_user: bulkSlowmodeVal } : c));
                                            },
                                            className: "ba-btn ba-btn-sm"
                                        }, t("slow.apply"))
                                    ])
                                ]),

                                // Liste Déroulante des Salons Filtrés
                                React.createElement("div", {
                                    className: "ba-scroller",
                                    style: {
                                        maxHeight: "480px",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "6px",
                                        paddingRight: "4px"
                                    }
                                },
                                    filteredChannels.length === 0
                                        ? React.createElement("div", { className: "ba-empty" }, t("ch.none"))
                                        : filteredChannels.map(ch => {
                                            const isSelected = selectedChannels.has(ch.id);
                                            const parentCat = ch.parent_id ? channels.find(c => c.id === ch.parent_id) : null;

                                            return React.createElement("div", {
                                                key: ch.id,
                                                onClick: () => toggleChannelSelection(ch.id),
                                                className: "ba-card",
                                                style: {
                                                    padding: "8px 12px",
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center",
                                                    cursor: "pointer",
                                                    background: isSelected ? "color-mix(in srgb, var(--ba-brand) 10%, var(--ba-bg-alt))" : "var(--ba-bg-alt)",
                                                    border: isSelected ? "1px solid var(--ba-brand)" : "1px solid var(--ba-border)"
                                                }
                                            }, [
                                                React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "10px" } }, [
                                                    React.createElement("input", {
                                                        type: "checkbox",
                                                        checked: isSelected,
                                                        onChange: () => {},
                                                        style: { cursor: "pointer" }
                                                    }),
                                                    React.createElement("span", { className: "ba-ch-name", style: { fontWeight: ch.type === 4 ? 700 : 600, color: ch.type === 4 ? "var(--ba-header)" : "var(--ba-text)", fontSize: "14px" } }, [
                                                        React.createElement(Icon, { key: "i", name: CHANNEL_ICON[ch.type] || "text" }),
                                                        ch.name
                                                    ]),
                                                    ch.type === 4 && React.createElement("span", { className: "ba-pill" }, t("ch.catPill")),
                                                    parentCat && React.createElement("span", { style: { fontSize: "12px", color: "var(--ba-muted)" } }, t("ch.inCat", parentCat.name)),
                                                    ch.rate_limit_per_user > 0 && React.createElement("span", { className: "ba-pill ba-pill-warning" }, t("slow.pill", ch.rate_limit_per_user))
                                                ]),
                                                React.createElement("div", {
                                                    style: { display: "flex", gap: "6px", alignItems: "center" },
                                                    onClick: e => e.stopPropagation()
                                                }, [
                                                    ch.type === 0 && React.createElement("button", {
                                                        onClick: () => this.exportChatTranscript(guildId, ch, "html"),
                                                        className: "ba-btn ba-btn-secondary ba-btn-xs"
                                                    }, "HTML"),
                                                    ch.type !== 4 && React.createElement("button", {
                                                        onClick: () => {
                                                            requestConfirmation(t("ch.purgeTitle"), t("ch.purgeConfirm", ch.name), () => this.smartPurge(ch.id, { limit: 50 }));
                                                        },
                                                        className: "ba-btn ba-btn-secondary ba-btn-xs"
                                                    }, t("ch.purge")),
                                                    ch.type !== 4 && React.createElement("button", {
                                                        onClick: () => {
                                                            requestConfirmation(t("ch.nukeTitle"), t("ch.nukeConfirm", ch.name), () => this.nukeChannel(ch));
                                                        },
                                                        className: "ba-btn ba-btn-danger ba-btn-xs"
                                                    }, "Nuke"),
                                                    React.createElement("button", {
                                                        onClick: () => {
                                                            requestConfirmation(t("ch.deleteTitle"), (ch.type === 4 ? t("ch.deleteCatConfirm", ch.name) : t("ch.deleteChConfirm", ch.name)), async () => {
                                                                await this.request("DELETE", `/channels/${ch.id}`);
                                                                setChannels(prev => prev.filter(x => x.id !== ch.id));
                                                                setSelectedChannels(prev => { const n = new Set(prev); n.delete(ch.id); return n; });
                                                                BdApi.UI.showToast(t("ch.deleted", ch.name), { type: "info" });
                                                            });
                                                        },
                                                        className: "ba-btn ba-btn-danger ba-btn-xs", title: t("delete"), "aria-label": t("delete")
                                                    }, React.createElement(Icon, { name: "trash", size: 14 }))
                                                ])
                                            ]);
                                        })
                                )
                            ]),

                            // ─── Onglet : Embed Studio ───────────────────────────────
                            tab === "embed" && React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "16px" } }, [
                                React.createElement("h2", { className: "ba-title" }, t("nav.embed")),
                                React.createElement("div", { style: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: "24px", alignItems: "start" } }, [
                                    // Formulaire
                                    React.createElement("div", { key: "f", className: "ba-card", style: { display: "flex", flexDirection: "column", gap: "16px" } }, [
                                        React.createElement("div", { key: "c" }, [
                                            React.createElement("label", { key: "l", className: "ba-label", htmlFor: "ba-embed-channel" }, t("embed.channel")),
                                            React.createElement("select", { key: "i", id: "ba-embed-channel", className: "ba-select", value: embedChannel, onChange: e => setEmbedChannel(e.target.value) },
                                                channels.filter(c => c.type === 0).map(c => React.createElement("option", { key: c.id, value: c.id }, `#${c.name}`))
                                            )
                                        ]),
                                        React.createElement("div", { key: "t" }, [
                                            React.createElement("label", { key: "l", className: "ba-label", htmlFor: "ba-embed-title" }, t("embed.title")),
                                            React.createElement("input", { key: "i", id: "ba-embed-title", className: "ba-input", maxLength: 256, placeholder: t("embed.titlePh"), value: embedTitle, onChange: e => setEmbedTitle(e.target.value) })
                                        ]),
                                        React.createElement("div", { key: "d" }, [
                                            React.createElement("label", { key: "l", className: "ba-label", htmlFor: "ba-embed-desc" }, "Description"),
                                            React.createElement("textarea", { key: "i", id: "ba-embed-desc", className: "ba-textarea", rows: 6, maxLength: 4096, placeholder: t("embed.descPh"), value: embedDesc, onChange: e => setEmbedDesc(e.target.value) }),
                                            React.createElement("div", { key: "h", className: "ba-hint" }, t("embed.mdHint"))
                                        ]),
                                        React.createElement("div", { key: "k" }, [
                                            React.createElement("div", { key: "l", className: "ba-label" }, t("embed.color")),
                                            React.createElement(ColorField, { key: "f", label: t("embed.colorLabel"), value: embedColor, onChange: setEmbedColor })
                                        ]),
                                        React.createElement("button", {
                                            key: "s", type: "button",
                                            disabled: !embedChannel || (!embedTitle.trim() && !embedDesc.trim()),
                                            onClick: async () => {
                                                try {
                                                    await this.sendWebhookEmbed(embedChannel, { title: embedTitle, description: embedDesc, color: embedColor });
                                                    BdApi.UI.showToast(t("embed.sent"), { type: "success" });
                                                } catch (e) { BdApi.UI.showToast(`${e.message}`, { type: "error" }); }
                                            },
                                            className: "ba-btn", style: { alignSelf: "flex-start" }
                                        }, t("embed.send"))
                                    ]),

                                    // Aperçu, tel qu'il apparaîtra dans le salon
                                    React.createElement("div", { key: "p" }, [
                                        React.createElement("div", { key: "l", className: "ba-label" }, t("embed.preview")),
                                        React.createElement("div", { key: "m", className: "ba-msg" }, [
                                            React.createElement("img", { key: "a", className: "ba-avatar ba-msg-avatar", src: "https://cdn.discordapp.com/embed/avatars/0.png", alt: "" }),
                                            React.createElement("div", { key: "c", style: { flex: "1 1 auto", minWidth: 0 } }, [
                                                React.createElement("div", { key: "h", className: "ba-msg-head" }, [
                                                    React.createElement("span", { key: "n", className: "ba-msg-name" }, t("webhook.name")),
                                                    React.createElement("span", { key: "t", className: "ba-tag" }, "APP"),
                                                    React.createElement("span", { key: "d", className: "ba-muted ba-small" }, t("embed.today"))
                                                ]),
                                                React.createElement("div", { key: "e", className: "ba-embed", style: { borderLeftColor: embedColor } }, [
                                                    embedTitle.trim() && React.createElement("div", { key: "t", className: "ba-embed-title" }, mdInline(embedTitle)),
                                                    embedDesc.trim() && React.createElement("div", { key: "d", className: "ba-embed-desc" }, renderMarkdown(embedDesc)),
                                                    !embedTitle.trim() && !embedDesc.trim() && React.createElement("div", { key: "v", className: "ba-embed-desc ba-muted" }, t("embed.empty"))
                                                ])
                                            ])
                                        ])
                                    ])
                                ])
                            ]),

                            // ─── Onglet : Packs Express ──────────────────────────────
                            tab === "packs" && React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "16px" } }, [
                                React.createElement("h2", { className: "ba-title" }, t("nav.packs")),
                                React.createElement("div", { className: "ba-card", style: { display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "space-between", alignItems: "center" } }, [
                                    React.createElement("div", { key: "d", style: { flex: "1 1 260px", minWidth: 0 } }, [
                                        React.createElement("div", { key: "h", className: "ba-heading" }, t("staff.head")),
                                        React.createElement("div", { key: "s", style: { color: "var(--ba-muted)", fontSize: "14px", marginBottom: "12px" } }, t("staff.hint")),
                                        React.createElement("div", { key: "r", style: { display: "flex", flexWrap: "wrap", gap: "6px" } },
                                            STAFF_PACK.map(r => React.createElement("span", {
                                                key: r.name, className: "ba-role-chip",
                                                title: (BigInt(r.permissions) & 8n) ? t("staff.adminTip") : undefined
                                            }, [
                                                React.createElement("span", { key: "c", className: "ba-dot-color", style: { backgroundColor: `#${r.color.toString(16).padStart(6, "0")}` } }),
                                                r.name,
                                                (BigInt(r.permissions) & 8n) ? React.createElement("span", { key: "a", className: "ba-pill ba-pill-warning", style: { marginLeft: "2px" } }, "Admin") : null
                                            ]))
                                        )
                                    ]),
                                    React.createElement("button", {
                                        onClick: () => {
                                            const admins = STAFF_PACK.filter(r => BigInt(r.permissions) & 8n).length;
                                            requestConfirmation(t("staff.title"), t("staff.confirm", STAFF_PACK.length, admins), async () => {
                                                let created = 0;
                                                try {
                                                    for (const r of STAFF_PACK) { await this.request("POST", `/guilds/${guildId}/roles`, r); created++; await this.sleep(300); }
                                                    BdApi.UI.showToast(t("staff.done"), { type: "success" });
                                                } catch (e) {
                                                    BdApi.UI.showToast(t("staff.stopped", created, e.message), { type: "error" });
                                                }
                                            });
                                        },
                                        className: "ba-btn"
                                    }, t("staff.generate"))
                                ])
                            ])
                        ]))
                    ]),

                    // Modale de confirmation (actions sensibles)
                    confirmModal && React.createElement("div", { key: "cm", className: "ba-layer", onMouseDown: e => { if (e.target === e.currentTarget) setConfirmModal(null); } },
                        React.createElement("div", { className: "ba-modal", role: "alertdialog", "aria-modal": "true", "aria-labelledby": "ba-confirm-title", "aria-describedby": "ba-confirm-desc" }, [
                            React.createElement("div", { key: "h", className: "ba-modal-header" }, [
                                React.createElement("div", { key: "t" }, React.createElement("div", { id: "ba-confirm-title", className: "ba-title" }, confirmModal.title)),
                                React.createElement("button", { key: "x", type: "button", className: "ba-icon-btn ba-close", "aria-label": t("close"), onClick: () => setConfirmModal(null), dangerouslySetInnerHTML: { __html: ICON_CLOSE } })
                            ]),
                            React.createElement("div", { key: "b", id: "ba-confirm-desc", className: "ba-modal-body", style: { whiteSpace: "pre-line" } }, confirmModal.message),
                            React.createElement("div", { key: "f", className: "ba-modal-footer" }, [
                                // Le bouton le plus sûr a le focus par défaut
                                React.createElement("button", { key: "c", type: "button", className: "ba-btn ba-btn-link", autoFocus: true, onClick: () => setConfirmModal(null) }, t("cancel")),
                                React.createElement("button", {
                                    key: "o", type: "button", className: "ba-btn ba-btn-danger",
                                    onClick: () => {
                                        const fn = confirmModal.onConfirm;
                                        setConfirmModal(null);
                                        // Avant : une erreur dans l'action (403, tâche déjà en cours…) était avalée silencieusement
                                        if (fn) Promise.resolve().then(fn).catch(e => {
                                            if (e?.name === "AbortError") return;
                                            console.error("[BetterAdmin] Action échouée :", e);
                                            BdApi.UI.showToast(`${e?.message || e}`, { type: "error" });
                                        });
                                    }
                                }, t("confirm"))
                            ])
                        ])
                    ),

                    // Modale de clonage et de déploiement sélectif
                    cloneWizard && React.createElement(SelectiveCloneModal, {
                        key: "cw",
                        data: cloneWizard,
                        onClose: () => setCloneWizard(null),
                        onConfirm: handleWizardConfirm
                    }),

                    // Barre d'état
                    React.createElement("div", { key: "d", className: "ba-dock", role: "status" }, [
                        taskState && React.createElement("div", {
                            key: "p", className: "ba-dock-progress",
                            style: { width: `${taskState.total > 0 ? (taskState.progress / taskState.total) * 100 : 0}%` }
                        }),
                        React.createElement("div", { key: "i", className: "ba-dock-info" }, [
                            React.createElement("span", { key: "s", className: "ba-dock-status" }, [
                                React.createElement("span", { key: "d", className: taskState ? "ba-dot ba-dot-busy" : "ba-dot", "aria-hidden": "true" }),
                                taskState ? t("dock.busy") : t("dock.ready")
                            ]),
                            React.createElement("span", { key: "t", className: "ba-dock-text" }, taskState
                                ? `${taskState.text ? `${taskState.name} — ${taskState.text}` : taskState.name}${taskState.total > 0 && taskState.text !== `${taskState.progress}/${taskState.total}` ? ` (${taskState.progress}/${taskState.total})` : ""}`
                                : t("dock.summary", roles.length, channels.length))
                        ]),
                        taskState && React.createElement("button", { key: "a", type: "button", className: "ba-btn ba-btn-sm ba-btn-danger", disabled: !!taskState.aborting, onClick: () => this.abortTask() }, taskState.aborting ? t("task.cancelling") : t("dock.cancelTask"))
                    ])
                ])
            );
        };

        if (typeof BdApi.ReactDOM.createRoot === "function") {
            const root = BdApi.ReactDOM.createRoot(container);
            root.render(React.createElement(DashboardUI));
            container._reactRoot = root;
        } else {
            BdApi.ReactDOM.render(React.createElement(DashboardUI), container);
        }
    }

    _closeDashboard() {
        const el = document.getElementById("ba-command-center-root");
        if (el) {
            if (el._reactRoot) { try { el._reactRoot.unmount(); } catch(_) {} }
            el.remove();
        }
    }
};
