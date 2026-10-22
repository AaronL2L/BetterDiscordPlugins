/**
 * @name MediaVault
 * @author AaronL2L
 * @version 1.0.0
 * @description Find the media, links and files shared in any conversation (DMs, groups, servers): a gallery grouped by month, full-screen preview, search and member filter, in a Discord-style interface. English and French.
 * @invite HdXp7sWRY3
 * @website https://valientebot.xyz
 * @source https://github.com/AaronL2L/BetterDiscordPlugins/tree/main/MediaVault
 * @updateUrl https://raw.githubusercontent.com/AaronL2L/BetterDiscordPlugins/main/MediaVault/MediaVault.plugin.js
 */

'use strict';

const MAX_RETRIES = 5;           // 429 : nombre de nouvelles tentatives max
const MAX_INDEXING_RETRIES = 6;  // 202 (indexation en cours) : idem
const SEARCH_DEBOUNCE_MS = 150;

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

// N'accepte que les URLs http(s) : bloque javascript:, data:, etc.
function safeUrl(url) {
    return typeof url === "string" && /^https?:\/\//i.test(url.trim()) ? url.trim() : "";
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

const STYLE_ID = "MediaVault";

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
        "time.locale": "en-US",
        "size.units": "B KB MB GB",
        "conversation": "Conversation",
        "member": "Member",
        "month.unknown": "Unknown date",
        "month.current": "This month",
        "status.indexing": "Discord is indexing this conversation, please wait…",
        "status.recent": "Loading recent messages…",
        "status.history": "Searching the whole history…",
        "status.olderMedia": "Loading older media and files…",
        "status.olderLinks": "Loading older links…",
        "status.loadingAll": (n, noun) => `Loading the whole history… ${n} ${noun} found`,
        "status.stopped": "Loading stopped.",
        "noun.media": "media item|media items",
        "noun.links": "link|links",
        "noun.files": "file|files",
        "name.embVideo": "Video / GIF",
        "name.embImage": "Embedded image",
        "name.webMedia": "GIF / Web media",
        "name.webVideo": "Web video",
        "toast.openFailed": "Couldn't open the message.",
        "toast.copied": "Link copied to the clipboard.",
        "toast.copyFailed": "Couldn't copy to the clipboard.",
        "toast.linkCopied": "Link copied.",
        "toast.mediaLinkCopied": "Media link copied.",
        "button.label": "Media, links and files",
        "panel.title": "Shared content",
        "tab.media": "Media",
        "tab.links": "Links",
        "tab.files": "Files",
        "refresh": "Refresh",
        "close": "Close",
        "close.tip": "Close (Esc)",
        "search.placeholder": "Search",
        "search.aria": "Search by name, link or member",
        "search.clear": "Clear search",
        "tabs.aria": "Content type",
        "loading": "Loading…",
        "error.title": "Couldn't load the content",
        "error.desc": "Discord didn't respond. Check your connection, then try again.",
        "error.retry": "Retry",
        "filter.aria": "Filter by member",
        "filter.all": (n) => `All members (${n})`,
        "empty.noResults": "No results",
        "empty.noResultsDesc": "Try another keyword or another member.",
        "empty.clearFilters": "Clear filters",
        "empty.media": "No media",
        "empty.mediaDesc": "Images, videos and GIFs shared in this conversation will appear here.",
        "empty.links": "No links",
        "empty.linksDesc": "Links shared in this conversation will appear here.",
        "empty.files": "No files",
        "empty.filesDesc": "Documents, archives and audio files shared in this conversation will appear here.",
        "end.title": "Reached the start of the conversation",
        "end.total": (n, noun) => `${n} ${noun} in total`,
        "progress.loaded": (n, noun) => `${n} ${noun} loaded`,
        "progress.scanned": (loaded, done, total) => `${loaded} · ${done} of ${total} messages scanned`,
        "load.more": "Load more",
        "load.stop": "Stop",
        "load.all": "Load all",
        "load.allTip": "Automatically goes back to the first message",
        "kind.video": "Video",
        "item.label": (kind, name) => `${kind}: ${name}`,
        "item.untitled": "untitled",
        "copyLink": "Copy link",
        "jump": "Jump to message",
        "jump.short": "Jump",
        "download": "Download",
        "file.fallback": "file",
        "media.fallback": "Media",
        "lb.preview": (name) => `Preview of ${name}`,
        "lb.prev": "Previous",
        "lb.next": "Next"
    },
    fr: {
        "time.locale": "fr-FR",
        "size.units": "o Ko Mo Go",
        "conversation": "Discussion",
        "member": "Membre",
        "month.unknown": "Date inconnue",
        "month.current": "Ce mois-ci",
        "status.indexing": "Discord indexe cette discussion, patientez…",
        "status.recent": "Chargement des messages récents…",
        "status.history": "Recherche dans tout l'historique…",
        "status.olderMedia": "Chargement des médias et fichiers plus anciens…",
        "status.olderLinks": "Chargement des liens plus anciens…",
        "status.loadingAll": (n, noun) => `Chargement de tout l'historique… ${n} ${noun} ${plural(n, "trouvé", "trouvés")}`,
        "status.stopped": "Chargement arrêté.",
        "noun.media": "média|médias",
        "noun.links": "lien|liens",
        "noun.files": "fichier|fichiers",
        "name.embVideo": "Vidéo / GIF",
        "name.embImage": "Image intégrée",
        "name.webMedia": "GIF / Média web",
        "name.webVideo": "Vidéo web",
        "toast.openFailed": "Impossible d'ouvrir le message.",
        "toast.copied": "Lien copié dans le presse-papiers.",
        "toast.copyFailed": "Impossible de copier dans le presse-papiers.",
        "toast.linkCopied": "Lien copié.",
        "toast.mediaLinkCopied": "Lien du média copié.",
        "button.label": "Médias, liens et fichiers",
        "panel.title": "Contenu partagé",
        "tab.media": "Médias",
        "tab.links": "Liens",
        "tab.files": "Fichiers",
        "refresh": "Actualiser",
        "close": "Fermer",
        "close.tip": "Fermer (Échap)",
        "search.placeholder": "Rechercher",
        "search.aria": "Rechercher par nom, lien ou membre",
        "search.clear": "Effacer la recherche",
        "tabs.aria": "Type de contenu",
        "loading": "Chargement…",
        "error.title": "Impossible de charger le contenu",
        "error.desc": "Discord n'a pas répondu. Vérifiez votre connexion, puis réessayez.",
        "error.retry": "Réessayer",
        "filter.aria": "Filtrer par membre",
        "filter.all": (n) => `Tous les membres (${n})`,
        "empty.noResults": "Aucun résultat",
        "empty.noResultsDesc": "Essayez un autre mot-clé ou un autre membre.",
        "empty.clearFilters": "Effacer les filtres",
        "empty.media": "Aucun média",
        "empty.mediaDesc": "Les images, vidéos et GIF partagés dans cette discussion apparaîtront ici.",
        "empty.links": "Aucun lien",
        "empty.linksDesc": "Les liens partagés dans cette discussion apparaîtront ici.",
        "empty.files": "Aucun fichier",
        "empty.filesDesc": "Les documents, archives et fichiers audio partagés dans cette discussion apparaîtront ici.",
        "end.title": "Début de la discussion atteint",
        "end.total": (n, noun) => `${n} ${noun} au total`,
        "progress.loaded": (n, noun) => `${n} ${noun} ${plural(n, "chargé", "chargés")}`,
        "progress.scanned": (loaded, done, total) => `${loaded} · ${done} sur ${total} messages analysés`,
        "load.more": "Charger plus",
        "load.stop": "Arrêter",
        "load.all": "Tout charger",
        "load.allTip": "Remonte automatiquement jusqu'au premier message",
        "kind.video": "Vidéo",
        "item.label": (kind, name) => `${kind} : ${name}`,
        "item.untitled": "sans nom",
        "copyLink": "Copier le lien",
        "jump": "Aller au message",
        "jump.short": "Aller",
        "download": "Télécharger",
        "file.fallback": "fichier",
        "media.fallback": "Média",
        "lb.preview": (name) => `Aperçu de ${name}`,
        "lb.prev": "Précédent",
        "lb.next": "Suivant"
    }
});

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

// Icônes (24 px, prennent la couleur du texte)
const STROKE = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
const MEDIA_PATH = "M5 2a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V5a3 3 0 0 0-3-3H5Zm3.5 4a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Zm6.3 5.4a1 1 0 0 0-1.6 0l-3.4 4.53-1.2-1.5a1 1 0 0 0-1.56 0l-2.27 2.84A.75.75 0 0 0 5.36 18.5h13.28a.75.75 0 0 0 .6-1.2l-4.44-5.9Z";
const MV_ICONS = {
    media:    `<path fill="currentColor" fill-rule="evenodd" d="${MEDIA_PATH}"/>`,
    refresh:  `<path ${STROKE} d="M20 12a8 8 0 0 1-14.9 4M4 12a8 8 0 0 1 14.9-4M19 3v5h-5M5 21v-5h5"/>`,
    search:   `<path fill="currentColor" fill-rule="evenodd" d="M15.62 17.03a9 9 0 1 1 1.41-1.41l4.68 4.67a1 1 0 0 1-1.42 1.42l-4.67-4.68ZM17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"/>`,
    jump:     `<path ${STROKE} d="M5 12h14M13 6l6 6-6 6"/>`,
    copy:     `<rect ${STROKE} x="9" y="9" width="12" height="12" rx="2"/><path ${STROKE} d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>`,
    download: `<path ${STROKE} d="M12 3v12M7 10l5 5 5-5M5 21h14"/>`,
    play:     `<path fill="currentColor" d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86A1 1 0 0 0 8 5.14Z"/>`,
    prev:     `<path ${STROKE} d="M15 6l-6 6 6 6"/>`,
    next:     `<path ${STROKE} d="M9 6l6 6-6 6"/>`,
    link:     `<path ${STROKE} d="M10 14a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5M14 10a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5"/>`,
    file:     `<path ${STROKE} d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5ZM14 3v5h5M9 13h6M9 17h4"/>`,
    warning:  `<path ${STROKE} d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/>`
};
const icon = (name, size = 24) => `<svg aria-hidden="true" viewBox="0 0 24 24" width="${size}" height="${size}">${MV_ICONS[name]}</svg>`;

// Du plus récent au plus ancien (les éléments sans date passent à la fin)
const byNewest = (a, b) => (Date.parse(b.timestamp) || 0) - (Date.parse(a.timestamp) || 0);

// Regroupe une liste déjà triée par mois, comme les galeries de WhatsApp ou de Messenger
function groupByMonth(items) {
    const now = new Date();
    const groups = [];
    let current = null;
    items.forEach((item, index) => {
        const d = new Date(item.timestamp);
        const valid = !isNaN(d.getTime());
        const key = valid ? `${d.getFullYear()}-${d.getMonth()}` : "?";
        if (!current || current.key !== key) {
            let label = t("month.unknown");
            if (valid) {
                const sameYear = d.getFullYear() === now.getFullYear();
                label = sameYear && d.getMonth() === now.getMonth()
                    ? t("month.current")
                    : d.toLocaleDateString(t("time.locale"), sameYear ? { month: "long" } : { month: "long", year: "numeric" });
            }
            current = { key, label, entries: [] };
            groups.push(current);
        }
        current.entries.push({ item, index });
    });
    return groups;
}

// Infobulle de Discord pour tout élément [data-mv-tip] (une seule à la fois, posée sur <body>)
const Tip = {
    el: null,
    target: null,
    watch: null,
    show(target) {
        const text = target?.getAttribute("data-mv-tip");
        if (!text || !target.isConnected) { this.hide(); return; }
        if (!this.el) {
            this.el = document.createElement("div");
            this.el.className = "mv-ui mv-tooltip mv-tooltip-layer";
            this.el.setAttribute("role", "tooltip");
        }
        const el = this.el;
        this.target = target;
        el.textContent = text;
        const r     = target.getBoundingClientRect();
        const below = r.top < 56;
        el.classList.toggle("mv-tooltip-bottom", below);
        el.style.left = `${r.left + r.width / 2}px`;
        el.style.top  = `${below ? r.bottom + 8 : r.top - 8}px`;
        el.style.marginLeft = "0px";
        el.style.setProperty("--mv-tip-shift", "0px");
        document.body.appendChild(el);
        // Reste à 8 px des bords de la fenêtre, la flèche garde l'ancre
        const t     = el.getBoundingClientRect();
        const shift = Math.max(8 - t.left, 0) - Math.max(t.right - (window.innerWidth - 8), 0);
        if (shift) { el.style.marginLeft = `${shift}px`; el.style.setProperty("--mv-tip-shift", `${shift}px`); }
        // Disparaît avec son élément (liste redessinée, panneau fermé…)
        clearInterval(this.watch);
        this.watch = setInterval(() => { if (!this.target?.isConnected) this.hide(); }, 250);
    },
    hide() {
        clearInterval(this.watch);
        this.watch  = null;
        this.target = null;
        this.el?.remove();
    },
    hideWithin(root) {
        if (this.target && root?.contains(this.target)) this.hide();
    },
    bind(root) {
        const find = node => node?.closest?.("[data-mv-tip]");
        root.addEventListener("mouseover", e => { const t = find(e.target); if (t && t !== this.target) this.show(t); });
        root.addEventListener("mouseout",  e => { const t = find(e.target); if (t && !t.contains(e.relatedTarget)) this.hide(); });
        root.addEventListener("focusin",   e => { const t = find(e.target); if (t?.matches(":focus-visible")) this.show(t); });
        root.addEventListener("focusout",  () => this.hide());
        root.addEventListener("click",     () => this.hide());
    }
};

const BROKEN_MASK = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill-rule='evenodd' d='${MEDIA_PATH}'/%3E%3C/svg%3E") center / contain no-repeat`;

const PLUGIN_CSS = `
/* Bouton de l'en-tête du salon, au gabarit des icônes voisines (fils, épingles, membres).
   Il est hors de .mv-ui : il lit directement les variables de Discord. */
#mv-toolbar-btn {
    position: relative; display: flex; align-items: center; justify-content: center; flex: 0 0 auto;
    width: 24px; height: 24px; margin: 0 8px; padding: 0; border-radius: 4px;
    color: var(--interactive-normal, #b5bac1); cursor: pointer; transition: color .15s ease;
}
#mv-toolbar-btn:hover { color: var(--interactive-hover, #dbdee1); }
#mv-toolbar-btn[aria-expanded="true"] { color: var(--interactive-active, #fff); }
#mv-toolbar-btn:focus-visible { outline: 2px solid var(--focus-primary, #00b0f4); outline-offset: 2px; }
#mv-toolbar-btn svg { display: block; width: 24px; height: 24px; }

.mv-tooltip.mv-tooltip-layer { z-index: 1003; }

/* Panneau latéral, sous l'en-tête du salon comme les panneaux natifs (fils, résultats de recherche) */
.mv-panel {
    position: fixed; top: 0; right: 0; bottom: 0; z-index: 1000;
    display: flex; flex-direction: column; width: 420px; max-width: calc(100vw - 80px);
    border-left: 1px solid var(--mv-border); background: var(--mv-bg-alt);
    box-shadow: -4px 0 16px rgba(0, 0, 0, .24);
    animation: mv-slide .2s cubic-bezier(.2, .9, .3, 1);
}
.theme-light .mv-panel { box-shadow: -4px 0 16px rgba(0, 0, 0, .08); }
@keyframes mv-slide { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: none; } }

.mv-panel-header {
    position: relative; z-index: 3; display: flex; align-items: center; gap: 8px; flex: 0 0 auto;
    height: 48px; padding: 0 8px 0 16px;
    box-shadow: var(--elevation-low, 0 1px 0 rgba(4, 4, 5, .2), 0 1.5px 0 rgba(6, 6, 7, .05), 0 2px 0 rgba(4, 4, 5, .05));
}
.mv-panel-icon { display: flex; flex: 0 0 auto; color: var(--mv-muted); }
.mv-header-info { display: flex; align-items: center; gap: 8px; flex: 1 1 auto; min-width: 0; }
.mv-header-title { flex: 0 0 auto; margin: 0; color: var(--mv-header); font-size: 16px; font-weight: 600; line-height: 20px; }
.mv-header-divider { flex: 0 0 auto; width: 1px; height: 24px; background: var(--mv-accent); }
.mv-header-subtitle { min-width: 0; overflow: hidden; color: var(--mv-muted); font-size: 14px; font-weight: 500; line-height: 18px; white-space: nowrap; text-overflow: ellipsis; }

/* Recherche, filtre par membre et onglets */
.mv-toolbar { display: flex; flex-direction: column; gap: 12px; flex: 0 0 auto; padding: 16px 16px 12px; border-bottom: 1px solid var(--mv-border); }
.mv-filters { display: flex; gap: 8px; }
.mv-search { position: relative; flex: 1 1 auto; min-width: 0; }
.mv-search .mv-search-input { padding-right: 34px; }
.mv-search-icon { position: absolute; top: 50%; right: 10px; display: flex; color: var(--mv-muted); transform: translateY(-50%); pointer-events: none; }
.mv-search .mv-search-clear { position: absolute; top: 50%; right: 4px; width: 24px; height: 24px; border-radius: 4px; transform: translateY(-50%); }
.mv-search .mv-search-clear svg { width: 16px; height: 16px; }
.mv-author-filter { flex: 0 1 184px; min-width: 0; }
.mv-author-filter:empty { display: none; }
.mv-tabs-nav { flex-wrap: nowrap; gap: 4px; }
.mv-tabs-nav .mv-tab { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; font-size: 14px; line-height: 20px; }
.mv-tab-count { color: var(--mv-muted); font-size: 12px; font-weight: 600; line-height: 16px; }
.mv-tab[aria-selected="true"] .mv-tab-count { color: var(--mv-header-alt); }

/* Ligne d'état (chargement de l'historique, indexation…) */
.mv-status {
    display: flex; align-items: center; gap: 8px; flex: 0 0 auto; padding: 8px 16px;
    border-bottom: 1px solid var(--mv-border); color: var(--mv-muted); font-size: 12px; font-weight: 500; line-height: 16px;
}
.mv-status:not(.mv-busy) .mv-spinner { display: none; }
.mv-spinner { flex: 0 0 auto; width: 32px; height: 32px; border: 3px solid var(--mv-accent); border-top-color: var(--mv-brand); border-radius: 50%; animation: mv-spin .8s linear infinite; }
.mv-spinner-sm { width: 14px; height: 14px; border-width: 2px; }
@keyframes mv-spin { to { transform: rotate(360deg); } }

/* Contenu défilant, groupé par mois avec des titres collants */
.mv-panel-content { position: relative; flex: 1 1 auto; min-height: 0; padding: 0 16px 16px; }
.mv-group-title {
    position: sticky; top: 0; z-index: 2; margin: 0 -16px; padding: 16px 16px 8px;
    background: var(--mv-bg-alt); color: var(--mv-muted);
    font-size: 12px; font-weight: 600; line-height: 16px; letter-spacing: .02em; text-transform: uppercase;
}

/* Galerie */
.mv-media-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 4px; }
.mv-media-item {
    position: relative; display: block; width: 100%; aspect-ratio: 1; margin: 0; padding: 0; overflow: hidden;
    border: none; border-radius: 4px; background: var(--mv-bg-deep); color: inherit; font: inherit; text-align: left;
    cursor: pointer; appearance: none;
}
.mv-media-item::before { content: ""; position: absolute; inset: 0; z-index: 1; background: rgba(0, 0, 0, 0); transition: background-color .15s ease; pointer-events: none; }
.mv-media-item:hover::before { background: rgba(0, 0, 0, .15); }
.mv-media-item:focus-visible { z-index: 1; outline: 2px solid var(--mv-focus); outline-offset: 2px; }
.mv-thumb-img, .mv-thumb-video { display: block; width: 100%; height: 100%; object-fit: cover; }
.mv-media-video-wrapper { display: block; width: 100%; height: 100%; background: #000; }
.mv-play {
    position: absolute; top: 50%; left: 50%; z-index: 1; display: flex; align-items: center; justify-content: center;
    width: 40px; height: 40px; border-radius: 50%; background: rgba(0, 0, 0, .6); color: #fff;
    transform: translate(-50%, -50%); transition: opacity .15s ease; pointer-events: none;
}
.mv-play svg { margin-left: 2px; }
.mv-item-video:hover .mv-play { opacity: 0; }
.mv-media-badge {
    position: absolute; top: 4px; left: 4px; z-index: 1; height: 16px; padding: 0 4px; border-radius: 4px;
    background: rgba(0, 0, 0, .6); color: #fff; font-size: 10px; font-weight: 700; line-height: 16px; letter-spacing: .02em; pointer-events: none;
}
.mv-media-overlay {
    position: absolute; right: 0; bottom: 0; left: 0; z-index: 1; padding: 16px 8px 6px;
    background: linear-gradient(to top, rgba(0, 0, 0, .75), transparent); color: #fff;
    opacity: 0; transition: opacity .15s ease; pointer-events: none;
}
.mv-media-item:hover .mv-media-overlay, .mv-media-item:focus-visible .mv-media-overlay { opacity: 1; }
.mv-media-author, .mv-media-date { display: block; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.mv-media-author { font-size: 12px; font-weight: 600; line-height: 16px; }
.mv-media-date { font-size: 11px; line-height: 14px; opacity: .8; }
.mv-broken::after {
    content: ""; position: absolute; inset: 0; margin: auto; width: 32px; height: 32px;
    background: var(--mv-muted); opacity: .5; -webkit-mask: ${BROKEN_MASK}; mask: ${BROKEN_MASK};
}
.mv-broken .mv-play, .mv-broken .mv-media-video-wrapper { display: none; }

/* Liens et fichiers : cartes comme les résultats de recherche de Discord */
.mv-results { display: flex; flex-direction: column; gap: 8px; }
.mv-result {
    position: relative; padding: 12px; border: 1px solid var(--mv-border); border-radius: var(--mv-radius);
    background: var(--mv-bg); transition: border-color .1s ease;
}
.mv-result:hover { border-color: var(--mv-accent); }
.mv-hover-actions {
    position: absolute; top: 8px; right: 8px; display: flex; align-items: center; gap: 2px; padding: 2px 4px 2px 2px;
    border-radius: var(--mv-radius); background: var(--mv-bg); box-shadow: 0 0 0 1px var(--mv-accent), 0 4px 8px rgba(0, 0, 0, .12);
    opacity: 0; transition: opacity .1s ease;
}
.mv-result:hover .mv-hover-actions, .mv-result:focus-within .mv-hover-actions { opacity: 1; }
.mv-hover-actions .mv-icon-btn { width: 28px; height: 28px; }
.mv-hover-actions .mv-icon-btn svg { width: 18px; height: 18px; }
.mv-link-head { display: flex; align-items: center; gap: 8px; min-width: 0; margin-bottom: 6px; }
.mv-link-letter {
    display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto;
    width: 20px; height: 20px; border-radius: 6px; color: #fff; font-size: 11px; font-weight: 700; line-height: 1;
}
.mv-link-domain { min-width: 0; overflow: hidden; color: var(--mv-header-alt); font-size: 12px; font-weight: 600; line-height: 16px; white-space: nowrap; text-overflow: ellipsis; }
.mv-link-title, .mv-link-desc { display: -webkit-box; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow-wrap: anywhere; }
.mv-link-title { color: var(--mv-link); font-size: 14px; font-weight: 600; line-height: 18px; text-decoration: none; }
.mv-link-title:hover { text-decoration: underline; }
.mv-link-desc { margin: 4px 0 0; color: var(--mv-text); font-size: 13px; line-height: 18px; }
.mv-result-meta { display: flex; align-items: center; gap: 6px; min-width: 0; margin-top: 8px; color: var(--mv-muted); font-size: 12px; line-height: 16px; }
.mv-result-meta > span { flex: 0 0 auto; white-space: nowrap; }
.mv-result-meta > .mv-meta-author { flex: 0 1 auto; min-width: 0; overflow: hidden; color: var(--mv-header-alt); font-weight: 500; text-overflow: ellipsis; }
.mv-mini-avatar { flex: 0 0 auto; width: 16px; height: 16px; border-radius: 50%; object-fit: cover; }
.mv-file-row { display: flex; align-items: center; gap: 12px; }
.mv-file-icon {
    --mv-kind: var(--mv-muted);
    display: flex; align-items: center; justify-content: center; flex: 0 0 auto; width: 40px; height: 40px;
    border-radius: var(--mv-radius); background: color-mix(in srgb, var(--mv-kind) 16%, transparent); color: var(--mv-kind);
    font-size: 10px; font-weight: 700; letter-spacing: .02em;
}
.mv-file-icon[data-kind="pdf"] { --mv-kind: var(--mv-danger); }
.mv-file-icon[data-kind="archive"] { --mv-kind: var(--mv-warning); }
.mv-file-icon[data-kind="audio"] { --mv-kind: var(--mv-success); }
.mv-file-icon[data-kind="doc"] { --mv-kind: var(--mv-link); }
.mv-file-icon[data-kind="code"] { --mv-kind: var(--mv-brand); }
.theme-light .mv-file-icon[data-kind="archive"] { color: color-mix(in srgb, var(--mv-warning) 55%, #000); }
.theme-light .mv-file-icon[data-kind="audio"] { color: color-mix(in srgb, var(--mv-success) 70%, #000); }
.mv-file-main { flex: 1 1 auto; min-width: 0; }
.mv-file-name { display: block; overflow: hidden; color: var(--mv-link); font-size: 14px; font-weight: 500; line-height: 18px; white-space: nowrap; text-overflow: ellipsis; text-decoration: none; }
a.mv-file-name:hover { text-decoration: underline; }
.mv-file-row .mv-result-meta { margin-top: 2px; }
.mv-file-actions { display: flex; flex: 0 0 auto; gap: 4px; }

/* Bas de liste */
.mv-load-more { display: flex; flex-direction: column; align-items: center; gap: 8px; margin-top: 16px; }
.mv-load-progress { color: var(--mv-muted); font-size: 12px; line-height: 16px; text-align: center; }
.mv-load-buttons { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
.mv-end { margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--mv-border); color: var(--mv-muted); font-size: 12px; line-height: 16px; text-align: center; }
.mv-end-title { margin-bottom: 2px; color: var(--mv-header-alt); font-size: 14px; font-weight: 600; line-height: 18px; }

/* États vides et chargement */
.mv-empty-icon { display: flex; align-items: center; justify-content: center; width: 64px; height: 64px; margin-bottom: 4px; border-radius: 50%; background: var(--mv-bg-deep); color: var(--mv-muted); }
.mv-empty-desc { max-width: 280px; font-size: 14px; line-height: 20px; }
.mv-empty .mv-btn { margin-top: 8px; }
.mv-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 64px 16px; color: var(--mv-muted); font-size: 14px; line-height: 20px; text-align: center; }

/* Visionneuse plein écran (toujours sombre, comme celle de Discord) */
.mv-lightbox {
    position: fixed; inset: 0; z-index: 1001; display: flex; flex-direction: column;
    background: rgba(0, 0, 0, .85); color: #fff; animation: mv-fade .15s ease-out;
}
.mv-lb-topbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex: 0 0 auto; padding: 12px 16px; }
.mv-lb-author { display: flex; align-items: center; gap: 12px; min-width: 0; }
.mv-lb-avatar { flex: 0 0 auto; width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
.mv-lb-author-text { min-width: 0; }
.mv-lb-author-name { overflow: hidden; font-size: 16px; font-weight: 600; line-height: 20px; white-space: nowrap; text-overflow: ellipsis; }
.mv-lb-timestamp { color: rgba(255, 255, 255, .7); font-size: 12px; line-height: 16px; }
.mv-lb-actions { display: flex; align-items: center; gap: 4px; flex: 0 0 auto; }
.mv-lb-btn {
    display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; margin: 0; padding: 0;
    border: none; border-radius: 50%; background: transparent; color: rgba(255, 255, 255, .75);
    cursor: pointer; text-decoration: none; transition: background-color .15s ease, color .15s ease;
}
.mv-lb-btn:hover { color: #fff; background: rgba(255, 255, 255, .12); }
.mv-lb-btn svg { width: 24px; height: 24px; }
.mv-lb-sep { width: 1px; height: 24px; margin: 0 4px; background: rgba(255, 255, 255, .2); }
.mv-lb-center { display: flex; align-items: center; gap: 16px; flex: 1 1 auto; min-height: 0; padding: 0 16px; }
.mv-lb-arrow {
    display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; width: 48px; height: 48px; margin: 0; padding: 0;
    border: none; border-radius: 50%; background: rgba(255, 255, 255, .08); color: #fff; cursor: pointer; transition: background-color .15s ease;
}
.mv-lb-arrow:hover { background: rgba(255, 255, 255, .18); }
.mv-lb-arrow-placeholder { flex: 0 0 48px; }
.mv-lb-btn:focus-visible, .mv-lb-arrow:focus-visible { outline: 2px solid var(--mv-focus); outline-offset: 2px; }
.mv-lb-media-stage { position: relative; display: flex; align-items: center; justify-content: center; flex: 1 1 auto; min-width: 0; height: 100%; }
.mv-lb-media-img, .mv-lb-media-video {
    display: block; max-width: 100%; max-height: calc(100vh - 160px); border-radius: 8px; object-fit: contain;
    box-shadow: 0 8px 32px rgba(0, 0, 0, .5); animation: mv-pop .2s cubic-bezier(.2, .9, .3, 1.1);
}
.mv-lb-media-stage.mv-broken::after { width: 64px; height: 64px; background: #fff; opacity: .4; }
.mv-lb-bottombar { display: flex; align-items: center; justify-content: center; gap: 8px; flex: 0 0 auto; min-width: 0; padding: 12px 16px 16px; color: rgba(255, 255, 255, .7); font-size: 14px; line-height: 18px; }
.mv-lb-filename { min-width: 0; overflow: hidden; color: #fff; font-weight: 600; white-space: nowrap; text-overflow: ellipsis; }
.mv-lb-meta { flex: 0 0 auto; }

@media (max-width: 640px) {
    .mv-panel { width: 100vw; max-width: 100vw; }
    .mv-lb-center { gap: 8px; padding: 0 8px; }
}
`;

module.exports = class MediaVault {

    constructor(meta) {
        this.meta = meta;
        this.isOpen = false;
        this.activeTab = "media"; // 'media' | 'links' | 'files'
        this.currentChannelId = null;
        this.currentGuildId = null;
        this.currentChannelName = "";

        // Données
        this.mediaList = [];
        this.linkList = [];
        this.fileList = [];
        this.authors = new Map(); // id -> { id, name, username, avatar }

        // Déduplication absolue
        this._seenMediaKeys = new Set();
        this._seenLinkKeys = new Set();
        this._seenFileKeys = new Set();

        // Pagination & états
        this.isLoading = false;
        this.isAutoFetching = false;
        this.statusText = "";
        this.loadError = false;
        this.searchRaw = "";
        this.searchQuery = "";
        this.selectedAuthorId = "all";
        this.offsetMedia = 0;
        this.offsetLinks = 0;
        this.hasMoreMedia = false;
        this.hasMoreLinks = false;
        this.totalMedia = 0;
        this.totalLinks = 0;
        // Un curseur d'historique par onglet (avant : un seul partagé, chaque onglet sautait des messages de l'autre)
        this.oldestMediaMessageId = null;
        this.oldestLinkMessageId = null;
        // Incrémenté à chaque changement de salon / fermeture : les chargements périmés s'arrêtent
        this._loadToken = 0;

        // Lightbox
        this.lightboxIndex = -1;
        this._currentGalleryItems = null;
        this._lbReturnFocus = null;

        // Éléments DOM & timers
        this.panelEl = null;
        this.btnEl = null;
        this.lightboxEl = null;
        this.observer = null;
        this._observerFrame = null;
        this._searchTimer = null;
        this.restAPI = null;

        // Bindings
        this._onChannelSelect = this._onChannelSelect.bind(this);
        this._handleKeyDown = this._handleKeyDown.bind(this);
        this._placePanel = this._placePanel.bind(this);
    }

    // ─── CYCLE DE VIE ──────────────────────────────────────────────────────────

    start() {
        BdApi.DOM.addStyle(STYLE_ID, discordKitCSS("mv") + PLUGIN_CSS);
        this._injectToolbarButton();
        this._startObserver();

        const SelectedChannelStore = BdApi.Webpack.getStore("SelectedChannelStore");
        SelectedChannelStore?.addChangeListener?.(this._onChannelSelect);

        window.addEventListener("keydown", this._handleKeyDown, true);
    }

    stop() {
        const SelectedChannelStore = BdApi.Webpack.getStore("SelectedChannelStore");
        SelectedChannelStore?.removeChangeListener?.(this._onChannelSelect);

        window.removeEventListener("keydown", this._handleKeyDown, true);

        this.isAutoFetching = false;
        this._stopObserver();
        this._closeLightbox();
        this._closePanel();

        this.btnEl?.remove();
        this.btnEl = null;

        BdApi.DOM.removeStyle(STYLE_ID);
        Tip.hide();
    }

    // ─── API DISCORD (module HTTP interne : aucun token à manipuler) ──────────

    getRestAPI() {
        if (!this.restAPI) {
            this.restAPI = BdApi.Webpack.getModule(
                m => typeof m === "object" && typeof m?.get === "function" && typeof m?.put === "function" && typeof m?.del === "function",
                { searchExports: true }
            );
        }
        return this.restAPI;
    }

    getCurrentChannelId() {
        const match = location.pathname.match(/\/channels\/[^/]+\/(\d+)/);
        if (match) return match[1];
        return BdApi.Webpack.getStore("SelectedChannelStore")?.getChannelId?.() || null;
    }

    getChannelContext(targetChannelId = null) {
        const channelId = targetChannelId || this.getCurrentChannelId();
        if (!channelId) return { channelId: null, guildId: null, isDM: true, name: t("conversation") };

        const ChannelStore = BdApi.Webpack.getStore("ChannelStore");
        const channel = ChannelStore?.getChannel?.(channelId);

        // Détection 100% fiable du serveur vs DM : regarder channel.guild_id
        const isDM = !channel?.guild_id || (typeof channel.isDM === "function" && channel.isDM()) || (typeof channel.isGroupDM === "function" && channel.isGroupDM());
        const guildId = isDM ? null : channel.guild_id;

        let name = t("conversation");
        if (channel) {
            if (channel.name) {
                name = `#${channel.name}`;
            } else if (channel.rawRecipients && channel.rawRecipients.length > 0) {
                name = "@" + channel.rawRecipients.map(u => u.globalName || u.username).join(", ");
            }
        }

        return { channelId, guildId, isDM, name, channel };
    }

    _isCurrentLoad(token) {
        return token === this._loadToken;
    }

    /**
     * GET via le module HTTP de Discord.
     * 429 et 202 (indexation) sont retentés un nombre limité de fois — avant, la récursion était infinie.
     * Renvoie null si le chargement est devenu périmé pendant une attente.
     */
    async discordApiRequest(url, query, token) {
        const RestAPI = this.getRestAPI();
        if (!RestAPI) throw new Error("Module HTTP interne de Discord introuvable");

        let rateRetries = 0;
        let indexRetries = 0;
        while (true) {
            let res;
            try {
                res = await RestAPI.get(query ? { url, query } : { url });
                if (res?.ok === false) throw res;
            } catch (err) {
                if (err?.status === 429 && rateRetries < MAX_RETRIES) {
                    rateRetries++;
                    await sleep((Number(err.body?.retry_after) || 1.5) * 1000 + 250);
                    if (!this._isCurrentLoad(token)) return null;
                    continue;
                }
                throw err;
            }

            if (res?.status === 202) {
                // Indexation Discord en cours (notamment sur DMs ou salons non cherchés récemment)
                if (indexRetries >= MAX_INDEXING_RETRIES) {
                    throw new Error("Indexation Discord trop longue, réessaie dans quelques instants");
                }
                indexRetries++;
                if (this._isCurrentLoad(token)) {
                    this.statusText = t("status.indexing");
                    this._updateStatus();
                }
                await sleep(Math.min((Number(res.body?.retry_after) || 2) * 1000, 4000));
                if (!this._isCurrentLoad(token)) return null;
                continue;
            }

            return res?.body ?? null;
        }
    }

    fetchRecentChannelMessages(channelId, token, limit = 100, beforeId = null) {
        const query = { limit };
        if (beforeId) query.before = beforeId;
        return this.discordApiRequest(`/channels/${channelId}/messages`, query, token);
    }

    fetchDiscordSearch(channelId, guildId, hasType, offset, token) {
        // Le paramètre "query" est sérialisé par Discord : plus de "?" manquant sur la recherche en DM
        const query = { has: hasType, offset };
        if (guildId) query.channel_id = channelId;
        const url = guildId ? `/guilds/${guildId}/messages/search` : `/channels/${channelId}/messages/search`;
        return this.discordApiRequest(url, query, token);
    }

    _searchMessages(data) {
        return (data?.messages || []).map(g => Array.isArray(g) ? (g.find(m => m.id) || g[0]) : g).filter(Boolean);
    }

    // ─── CHARGEMENT MULTI-NIVEAUX ULTRA RAPIDE & COMPLET ──────────────────────

    async loadChannelData(reset = true) {
        const ctx = this.getChannelContext();
        const channelId = ctx.channelId;
        const guildId = ctx.guildId;
        if (!channelId) return;

        const token = ++this._loadToken;
        this.isAutoFetching = false;
        this.currentChannelId = channelId;
        this.currentGuildId = guildId;
        this.currentChannelName = ctx.name;

        if (reset) {
            this.mediaList = [];
            this.linkList = [];
            this.fileList = [];
            this.authors.clear();
            this._seenMediaKeys = new Set();
            this._seenLinkKeys = new Set();
            this._seenFileKeys = new Set();
            this.offsetMedia = 0;
            this.offsetLinks = 0;
            this.totalMedia = 0;
            this.totalLinks = 0;
            this.hasMoreMedia = false;
            this.hasMoreLinks = false;
            this.oldestMediaMessageId = null;
            this.oldestLinkMessageId = null;
            this.selectedAuthorId = "all";
        }

        this.isLoading = true;
        this.statusText = t("status.recent");
        this.loadError = false;
        let failures = 0;
        this._renderPanelContent();

        // ══════════════════════════════════════════════════════════════════════
        // ÉTAPE 1 : AFFICHAGE IMMÉDIAT (CACHE LOCAL DISCORD EN 0 MS)
        // ══════════════════════════════════════════════════════════════════════
        this._parseLocalCachedMessages(channelId, guildId);
        if (this.mediaList.length > 0 || this.linkList.length > 0 || this.fileList.length > 0) {
            this._renderPanelContent();
        }

        // ══════════════════════════════════════════════════════════════════════
        // ÉTAPE 2 : RÉCUPÉRATION DIRECTE DES 100 DERNIERS MESSAGES DU SALON
        // (Garantit que TOUT ce qui a été partagé récemment apparaît en 100ms,
        //  sans attendre l'indexation de recherche Discord !)
        // ══════════════════════════════════════════════════════════════════════
        try {
            const recentMessages = await this.fetchRecentChannelMessages(channelId, token, 100);
            if (!this._isCurrentLoad(token)) return;
            if (Array.isArray(recentMessages) && recentMessages.length > 0) {
                this._parseFileMessages(recentMessages, channelId, guildId);
                this._parseLinkMessages(recentMessages, channelId, guildId);

                // Point de départ de la pagination de secours (seulement s'il reste des messages plus anciens)
                const lastId = recentMessages.length === 100 ? recentMessages[recentMessages.length - 1]?.id || null : null;
                this.oldestMediaMessageId = lastId;
                this.oldestLinkMessageId = lastId;

                this._renderPanelContent();
            }
        } catch (e) {
            if (!this._isCurrentLoad(token)) return;
            console.warn("[MediaVault] Récupération des messages récents :", e);
            failures++;
        }

        // ══════════════════════════════════════════════════════════════════════
        // ÉTAPE 3 : RECHERCHE GLOBALE COMPLÈTE (INDEX SERVEUR DEPUIS LE DÉBUT)
        // ══════════════════════════════════════════════════════════════════════
        this.statusText = t("status.history");
        this._updateStatus();

        const [fileRes, linkRes] = await Promise.allSettled([
            this.fetchDiscordSearch(channelId, guildId, "file", this.offsetMedia, token),
            this.fetchDiscordSearch(channelId, guildId, "link", this.offsetLinks, token)
        ]);
        if (!this._isCurrentLoad(token)) return;

        if (fileRes.status === "fulfilled" && fileRes.value) {
            const data = fileRes.value;
            const messages = this._searchMessages(data);
            this.totalMedia = data.total_results || 0;
            this._parseFileMessages(messages, channelId, guildId);
            this.offsetMedia += messages.length;
            this.hasMoreMedia = messages.length > 0 && this.offsetMedia < this.totalMedia;
        } else if (fileRes.status === "rejected") {
            console.warn("[MediaVault] Recherche des fichiers :", fileRes.reason);
            failures++;
        }

        if (linkRes.status === "fulfilled" && linkRes.value) {
            const data = linkRes.value;
            const messages = this._searchMessages(data);
            this.totalLinks = data.total_results || 0;
            this._parseLinkMessages(messages, channelId, guildId);
            this.offsetLinks += messages.length;
            this.hasMoreLinks = messages.length > 0 && this.offsetLinks < this.totalLinks;
        } else if (linkRes.status === "rejected") {
            console.warn("[MediaVault] Recherche des liens :", linkRes.reason);
            failures++;
        }

        this.loadError = failures === 3;
        this.isLoading = false;
        this.statusText = "";
        this._renderPanelContent();
    }

    /**
     * Charge une page plus ancienne pour un onglet ("media" ou "links").
     * D'abord via la recherche Discord, puis via l'historique brut du salon en secours.
     */
    async _loadMore(kind) {
        if (this.isLoading || !this.currentChannelId) return;
        const isMedia = kind === "media";
        const token = this._loadToken;
        const channelId = this.currentChannelId;
        const guildId = this.currentGuildId;
        const hasMoreKey = isMedia ? "hasMoreMedia" : "hasMoreLinks";
        const offsetKey = isMedia ? "offsetMedia" : "offsetLinks";
        const totalKey = isMedia ? "totalMedia" : "totalLinks";
        const cursorKey = isMedia ? "oldestMediaMessageId" : "oldestLinkMessageId";
        const parse = msgs => isMedia
            ? this._parseFileMessages(msgs, channelId, guildId)
            : this._parseLinkMessages(msgs, channelId, guildId);

        this.isLoading = true;
        if (!this.isAutoFetching) this.statusText = isMedia ? t("status.olderMedia") : t("status.olderLinks");
        this._updateStatus();

        const usedSearch = this[hasMoreKey];
        try {
            if (usedSearch) {
                const data = await this.fetchDiscordSearch(channelId, guildId, isMedia ? "file" : "link", this[offsetKey], token);
                if (!this._isCurrentLoad(token)) return;
                const messages = this._searchMessages(data);
                if (messages.length > 0) {
                    parse(messages);
                    this[offsetKey] += messages.length;
                    this[hasMoreKey] = this[offsetKey] < (data.total_results || this[totalKey]);
                } else {
                    this[hasMoreKey] = false;
                }
            } else if (this[cursorKey]) {
                // Pagination directe par historique de salon
                const olderMsgs = await this.fetchRecentChannelMessages(channelId, token, 100, this[cursorKey]);
                if (!this._isCurrentLoad(token)) return;
                if (Array.isArray(olderMsgs) && olderMsgs.length > 0) {
                    parse(olderMsgs);
                    this[cursorKey] = olderMsgs.length < 100 ? null : olderMsgs[olderMsgs.length - 1]?.id || null;
                } else {
                    this[cursorKey] = null;
                }
            }
        } catch (e) {
            if (!this._isCurrentLoad(token)) return;
            console.warn(`[MediaVault] Chargement (${kind}) :`, e);
            // Recherche en échec → on bascule sur l'historique ; historique en échec → on arrête
            if (usedSearch) this[hasMoreKey] = false;
            else this[cursorKey] = null;
        }

        if (!this._isCurrentLoad(token)) return;
        this.isLoading = false;
        if (!this.isAutoFetching) this.statusText = "";
        this._renderPanelContent();
    }

    loadMoreMedia() {
        return this._loadMore("media");
    }

    loadMoreLinks() {
        return this._loadMore("links");
    }

    async _loadAll(kind, target = kind) {
        const isMedia = kind === "media";
        // Les fichiers arrivent avec les médias : la progression compte les deux
        const progress = () => isMedia ? this.mediaList.length + this.fileList.length : this.linkList.length;
        const found = () => target === "files" ? this.fileList.length : target === "links" ? this.linkList.length : this.mediaList.length;
        const nouns = { files: t("noun.files"), links: t("noun.links"), media: t("noun.media") }[target].split("|");
        const label = () => {
            const n = found();
            return t("status.loadingAll", n, plural(n, nouns[0], nouns[1]));
        };

        if (this.isAutoFetching) {
            this.isAutoFetching = false;
            this.statusText = t("status.stopped");
            this._renderPanelContent();
            return;
        }

        const token = this._loadToken;
        this.isAutoFetching = true;
        this.statusText = label();
        this._renderPanelContent();

        let unchangedCount = 0;
        while (this._hasMore(kind) && this.isAutoFetching && this.isOpen && this._isCurrentLoad(token)) {
            if (this.isLoading) {
                await sleep(200);
                continue;
            }
            const countBefore = progress();
            await this._loadMore(kind);
            if (!this._isCurrentLoad(token)) return;

            if (progress() === countBefore) {
                unchangedCount++;
                // Deux pages vides : la recherche ne donne plus rien, on bascule sur la pagination directe
                if (unchangedCount >= 2) {
                    if (isMedia) this.hasMoreMedia = false;
                    else this.hasMoreLinks = false;
                }
                if (unchangedCount >= 4) break;
            } else {
                unchangedCount = 0;
            }

            if (!this.isAutoFetching) break;
            this.statusText = label();
            this._updateStatus();
            await sleep(350);
        }

        if (!this._isCurrentLoad(token)) return;
        this.isAutoFetching = false;
        this.statusText = "";
        this._renderPanelContent();
    }

    loadAllMedia() {
        return this._loadAll("media");
    }

    loadAllLinks() {
        return this._loadAll("links");
    }

    // ─── DÉDUPLICATION & PARSING AVANCÉ DES FORMATS ───────────────────────────

    _addMediaItem(item) {
        if (!item || !item.url) return;
        const key = item.id ? `id-${item.id}` : `url-${item.url}`;
        if (this._seenMediaKeys.has(key)) return;
        this._seenMediaKeys.add(key);
        this.mediaList.push(item);
    }

    _addLinkItem(item) {
        if (!item || !item.url) return;
        const key = `${item.url}-${item.messageId || ""}`;
        if (this._seenLinkKeys.has(key)) return;
        this._seenLinkKeys.add(key);
        this.linkList.push(item);
    }

    _addFileItem(item) {
        if (!item || !item.url) return;
        const key = item.id ? `id-${item.id}` : `url-${item.url}`;
        if (this._seenFileKeys.has(key)) return;
        this._seenFileKeys.add(key);
        this.fileList.push(item);
    }

    // Avatar par défaut : nouveaux pseudos (discriminator "0") → (id >> 22) % 6, anciens → discriminator % 5
    _defaultAvatarIndex(author) {
        const disc = Number(author.discriminator);
        if (disc > 0) return disc % 5;
        try { return Number((BigInt(author.id) >> 22n) % 6n); } catch (_) { return 0; }
    }

    _registerAuthor(author) {
        if (!author || !author.id) return;
        if (!this.authors.has(author.id)) {
            this.authors.set(author.id, {
                id: author.id,
                name: this._authorName(author, t("member")),
                username: author.username,
                avatar: author.avatar
                    ? `https://cdn.discordapp.com/avatars/${author.id}/${author.avatar}.png?size=64`
                    : `https://cdn.discordapp.com/embed/avatars/${this._defaultAvatarIndex(author)}.png`
            });
        }
    }

    _authorName(author, fallback) {
        return author?.global_name || author?.globalName || author?.username || fallback;
    }

    _parseFileMessages(messages, channelId, guildId) {
        // Formats exhaustifs : photos, vidéos, animations, sons, formats iPhone
        const imageExts = /\.(png|jpe?g|jpe|jfif|webp|gif|svg|avif|bmp|ico|heic|heif|tiff?|raw|cr2|nef|dng)$/i;
        const videoExts = /\.(mp4|webm|mov|qt|mkv|avi|m4v|wmv|flv|3gp|3g2|ogv|ts|mts)$/i;
        const audioExts = /\.(mp3|ogg|wav|m4a|flac|aac|opus|wma)$/i;

        for (const msg of messages) {
            this._registerAuthor(msg.author);
            const base = {
                messageId: msg.id,
                channelId: msg.channel_id || channelId,
                guildId: guildId,
                author: msg.author,
                timestamp: msg.timestamp
            };

            // 1. Pièces jointes (Attachments)
            if (Array.isArray(msg.attachments)) {
                for (const att of msg.attachments) {
                    const filename = att.filename || "fichier";
                    const cleanFilename = filename.split("?")[0].trim();
                    const ct = (att.content_type || "").toLowerCase();

                    const isImg = imageExts.test(cleanFilename) || ct.startsWith("image/") || (att.width && att.height && !ct.startsWith("video/"));
                    const isVid = videoExts.test(cleanFilename) || ct.startsWith("video/");
                    const isAud = audioExts.test(cleanFilename) || ct.startsWith("audio/") || Boolean(att.waveform);

                    // Traitement spécial pour HEIC / HEIF (photos d'iPhone)
                    let proxyUrl = att.proxy_url || att.url;
                    const isHeic = /\.(heic|heif)$/i.test(cleanFilename) || ct.includes("heic") || ct.includes("heif");
                    if (isHeic && proxyUrl) {
                        proxyUrl = proxyUrl.includes("?") ? `${proxyUrl}&format=webp` : `${proxyUrl}?format=webp`;
                    }

                    if (isImg) {
                        this._addMediaItem({
                            ...base,
                            id: att.id,
                            type: "image",
                            isHeic: isHeic,
                            name: filename,
                            url: att.url,
                            proxyUrl: proxyUrl,
                            size: att.size,
                            width: att.width,
                            height: att.height
                        });
                    } else if (isVid) {
                        this._addMediaItem({
                            ...base,
                            id: att.id,
                            type: "video",
                            name: filename,
                            url: att.url,
                            proxyUrl: att.proxy_url || att.url,
                            size: att.size,
                            width: att.width,
                            height: att.height
                        });
                    } else {
                        this._addFileItem({
                            ...base,
                            id: att.id,
                            type: isAud ? "audio" : "file",
                            name: filename,
                            url: att.url,
                            size: att.size
                        });
                    }
                }
            }

            // 2. Embeds d'images / vidéos directes (GIFs Discord Tenor, vidéos intégrées, etc.)
            // (proxy_url = format API, proxyURL = format des messages du cache local)
            if (Array.isArray(msg.embeds)) {
                for (let idx = 0; idx < msg.embeds.length; idx++) {
                    const emb = msg.embeds[idx];
                    const imgUrl = emb.image?.url || emb.thumbnail?.url;
                    const vidUrl = emb.video?.url;

                    if (vidUrl) {
                        this._addMediaItem({
                            ...base,
                            id: `emb-vid-${msg.id}-${idx}`,
                            type: "video",
                            name: emb.title || emb.rawTitle || t("name.embVideo"),
                            url: vidUrl,
                            proxyUrl: emb.video?.proxy_url || emb.video?.proxyURL || vidUrl,
                            size: 0
                        });
                    } else if (imgUrl) {
                        this._addMediaItem({
                            ...base,
                            id: `emb-img-${msg.id}-${idx}`,
                            type: "image",
                            name: emb.title || emb.rawTitle || t("name.embImage"),
                            url: imgUrl,
                            proxyUrl: emb.image?.proxy_url || emb.image?.proxyURL || emb.thumbnail?.proxy_url || emb.thumbnail?.proxyURL || imgUrl,
                            size: 0
                        });
                    }
                }
            }
        }
    }

    _parseLinkMessages(messages, channelId, guildId) {
        const urlRegex = /https?:\/\/[^\s<>"'`]+/gi;
        // Ponctuation finale et parenthèse fermante orpheline restent hors du lien, comme dans Discord
        // (avant : toute parenthèse coupait l'adresse, ex. les pages Wikipédia « Nom_(sens) »)
        const trimUrl = (u) => {
            while (/[.,;:!?)]$/.test(u)) {
                if (u.endsWith(")") && (u.match(/\(/g) || []).length >= (u.match(/\)/g) || []).length) break;
                u = u.slice(0, -1);
            }
            return u;
        };
        const imageExts = /\.(png|jpe?g|jpe|jfif|webp|gif|svg|avif|bmp|ico|heic|heif|tiff?)$/i;
        const videoExts = /\.(mp4|webm|mov|qt|mkv|avi|m4v)$/i;

        for (const msg of messages) {
            this._registerAuthor(msg.author);
            const content = msg.content || "";
            const foundUrls = (content.match(urlRegex) || []).map(trimUrl);
            const base = {
                messageId: msg.id,
                channelId: msg.channel_id || channelId,
                guildId: guildId,
                author: msg.author,
                timestamp: msg.timestamp
            };

            for (let idx = 0; idx < foundUrls.length; idx++) {
                const rawUrl = foundUrls[idx];
                try {
                    const parsedUrl = new URL(rawUrl);
                    const domain = parsedUrl.hostname.replace(/^www\./, "");
                    const pathname = parsedUrl.pathname;

                    // Si c'est un GIF Tenor/Giphy ou un lien image/vidéo direct
                    if (imageExts.test(pathname) || domain.includes("tenor.com") || domain.includes("giphy.com") || domain.includes("imgur.com")) {
                        // Seul l'embed de CETTE URL compte (avant : le premier embed avec une image, même d'un autre lien)
                        const matchingEmb = (msg.embeds || []).find(e => e.url === rawUrl);
                        const mediaUrl = matchingEmb?.image?.url || matchingEmb?.thumbnail?.url || rawUrl;
                        this._addMediaItem({
                            ...base,
                            id: `url-img-${msg.id}-${idx}`,
                            type: "image",
                            name: pathname.split("/").pop() || t("name.webMedia"),
                            url: mediaUrl,
                            proxyUrl: matchingEmb?.image?.proxy_url || matchingEmb?.image?.proxyURL || mediaUrl,
                            size: 0
                        });
                    } else if (videoExts.test(pathname)) {
                        this._addMediaItem({
                            ...base,
                            id: `url-vid-${msg.id}-${idx}`,
                            type: "video",
                            name: pathname.split("/").pop() || t("name.webVideo"),
                            url: rawUrl,
                            proxyUrl: rawUrl,
                            size: 0
                        });
                    }

                    // Enregistrer également dans l'onglet Liens (sauf si c'est un GIF pur)
                    if (!domain.includes("tenor.com") && !domain.includes("giphy.com")) {
                        const matchingEmbed = (msg.embeds || []).find(e => e.url === rawUrl || (e.url && parsedUrl.href.includes(e.url)));
                        this._addLinkItem({
                            ...base,
                            id: `link-${msg.id}-${idx}`,
                            type: "link",
                            url: rawUrl,
                            domain: domain,
                            title: matchingEmbed?.title || matchingEmbed?.rawTitle || domain,
                            description: matchingEmbed?.description || matchingEmbed?.rawDescription || "",
                            thumbnail: matchingEmbed?.thumbnail?.url || matchingEmbed?.image?.url || ""
                        });
                    }
                } catch(_) {}
            }
        }
    }

    _parseLocalCachedMessages(channelId, guildId) {
        try {
            const MessageStore = BdApi.Webpack.getStore("MessageStore");
            const cached = MessageStore?.getMessages?.(channelId)?.toArray?.() || [];
            if (cached.length > 0) {
                this._parseFileMessages(cached, channelId, guildId);
                this._parseLinkMessages(cached, channelId, guildId);
            }
        } catch(e) {
            console.warn("[MediaVault] Cache local inaccessible :", e);
        }
    }

    // ─── ACTIONS UTILISATEUR ──────────────────────────────────────────────────

    jumpToMessage(channelId, messageId, guildId) {
        try {
            const MessageActions = BdApi.Webpack.getByKeys("jumpToMessage");
            if (MessageActions?.jumpToMessage) {
                MessageActions.jumpToMessage({ channelId, messageId, flash: true });
                return;
            }
        } catch (_) {}

        try {
            const transitionTo = BdApi.Webpack.getModule(BdApi.Webpack.Filters.byStrings("transitionTo - Transitioning to"), { searchExports: true });
            if (typeof transitionTo === "function") {
                transitionTo(`/channels/${guildId || "@me"}/${channelId}/${messageId}`);
                return;
            }
        } catch (_) {}

        BdApi.UI.showToast(t("toast.openFailed"), { type: "error" });
    }

    copyToClipboard(text, successMsg = t("toast.copied")) {
        const done = () => BdApi.UI.showToast(successMsg, { type: "success" });
        const fail = () => BdApi.UI.showToast(t("toast.copyFailed"), { type: "error" });
        // Presse-papiers natif de Discord d'abord : il marche même si la page n'a pas le focus
        if (typeof window.DiscordNative?.clipboard?.copy === "function") {
            try {
                window.DiscordNative.clipboard.copy(text);
                return done();
            } catch {}
        }
        if (!navigator.clipboard) return fail();
        navigator.clipboard.writeText(text).then(done).catch(fail);
    }

    formatFileSize(bytes) {
        if (!bytes || bytes === 0) return "";
        const units = t("size.units").split(" ");
        let i = 0;
        while (bytes >= 1024 && i < units.length - 1) {
            bytes /= 1024;
            i++;
        }
        return `${bytes.toLocaleString(t("time.locale"), { maximumFractionDigits: i ? 1 : 0 })} ${units[i]}`;
    }

    formatDate(timestamp) {
        if (!timestamp) return "";
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return "";
        return date.toLocaleDateString(t("time.locale"), { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    }

    // ─── BOUTON DE L'EN-TÊTE DU SALON ─────────────────────────────────────────

    _injectToolbarButton() {
        document.getElementById("mv-toolbar-btn")?.remove();

        const toolbar = document.querySelector('section[class*="title_"] [class*="toolbar_"], [class*="chat_"] [class*="toolbar_"], [class*="toolbar_"]');
        if (!toolbar) return;

        const btn = document.createElement("div");
        btn.id = "mv-toolbar-btn";
        btn.setAttribute("role", "button");
        btn.setAttribute("tabindex", "0");
        btn.setAttribute("aria-label", t("button.label"));
        btn.setAttribute("aria-controls", "mv-slide-panel");
        btn.setAttribute("aria-expanded", String(this.isOpen));
        btn.setAttribute("data-mv-tip", t("button.label"));
        btn.innerHTML = icon("media");

        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            this.togglePanel();
        });
        btn.addEventListener("keydown", (e) => {
            if (e.key !== "Enter" && e.key !== " ") return;
            e.preventDefault();
            this.togglePanel();
            // Au clavier, on entre directement dans le panneau
            if (this.isOpen) this.panelEl?.querySelector("#mv-search-input")?.focus();
        });
        Tip.bind(btn);

        // Juste avant la recherche du salon, comme les icônes natives (fils, épingles, membres)
        const searchBar = [...toolbar.children].find(c => c.matches('[class*="search_"]') || c.querySelector('[class*="search_"]'));
        if (searchBar) toolbar.insertBefore(btn, searchBar);
        else toolbar.appendChild(btn);

        this.btnEl = btn;
        if (this.panelEl) this._placePanel();
    }

    // Le panneau commence sous l'en-tête du salon, comme les panneaux natifs (fils, épingles)
    _placePanel() {
        if (!this.panelEl) return;
        let top = 0;
        const btn = this.btnEl;
        if (btn?.isConnected) {
            const header = btn.closest('section, [class*="title_"]')?.getBoundingClientRect();
            top = header && header.height > 0 && header.height <= 120
                ? header.bottom
                : btn.getBoundingClientRect().bottom + 12;
            if (top > window.innerHeight - 200) top = 0;
        }
        this.panelEl.style.top = `${Math.max(0, Math.round(top))}px`;
    }

    _startObserver() {
        this._stopObserver();
        // Regroupe les mutations d'une même frame : un seul contrôle au lieu d'un par mutation
        this.observer = new MutationObserver(() => {
            if (this._observerFrame) return;
            this._observerFrame = requestAnimationFrame(() => {
                this._observerFrame = null;
                if (!document.getElementById("mv-toolbar-btn")) {
                    this._injectToolbarButton();
                }
            });
        });
        this.observer.observe(document.getElementById("app-mount") || document.body, { childList: true, subtree: true });
    }

    _stopObserver() {
        this.observer?.disconnect();
        this.observer = null;
        if (this._observerFrame) cancelAnimationFrame(this._observerFrame);
        this._observerFrame = null;
    }

    _onChannelSelect() {
        this._injectToolbarButton();
        if (!this.isOpen) return;
        const newChannelId = this.getCurrentChannelId();
        if (newChannelId && newChannelId !== this.currentChannelId) {
            this.loadChannelData(true);
        }
        this._placePanel();
    }

    // Écouté en phase de capture : la visionneuse passe avant les raccourcis de Discord
    _handleKeyDown(e) {
        if (this.lightboxIndex !== -1 && this.lightboxEl) {
            if (e.key === "Tab") {
                this._trapFocus(e);
                e.stopPropagation();
                return;
            }
            if (e.key === "Escape") this._closeLightbox();
            else if (e.key === "ArrowLeft") this._navigateLightbox(-1);
            else if (e.key === "ArrowRight") this._navigateLightbox(1);
            else return;
            e.preventDefault();
            e.stopPropagation();
            return;
        }

        if (e.key !== "Escape" || !this.isOpen || !this.panelEl) return;
        // Échap vide d'abord la recherche, puis ferme le panneau
        const search = this.panelEl.querySelector("#mv-search-input");
        if (search && document.activeElement === search && search.value) {
            this._setSearch("", true);
        } else {
            this._closePanel();
        }
    }

    // ─── PANNEAU LATÉRAL ──────────────────────────────────────────────────────

    togglePanel() {
        if (this.isOpen) {
            this._closePanel();
        } else {
            this._openPanel();
        }
    }

    _openPanel() {
        this.isOpen = true;
        this.btnEl?.setAttribute("aria-expanded", "true");
        Tip.hide();
        this._renderPanelSkeleton();
        window.addEventListener("resize", this._placePanel);
        this.loadChannelData(true);
    }

    _closePanel() {
        const hadFocus = Boolean(this.panelEl?.contains(document.activeElement));
        this.isOpen = false;
        this.isAutoFetching = false;
        this._loadToken++; // invalide les chargements en cours
        this.isLoading = false;
        clearTimeout(this._searchTimer);
        this._searchTimer = null;
        window.removeEventListener("resize", this._placePanel);
        this.btnEl?.setAttribute("aria-expanded", "false");
        Tip.hideWithin(this.panelEl);
        this.panelEl?.remove();
        this.panelEl = null;
        if (hadFocus && this.btnEl?.isConnected) this.btnEl.focus();
    }

    _hasMore(kind) {
        return kind === "media"
            ? Boolean(this.hasMoreMedia || this.oldestMediaMessageId)
            : Boolean(this.hasMoreLinks || this.oldestLinkMessageId);
    }

    _renderPanelSkeleton() {
        document.getElementById("mv-slide-panel")?.remove();

        const panel = document.createElement("aside");
        panel.id = "mv-slide-panel";
        panel.className = "mv-ui mv-panel";
        panel.setAttribute("aria-label", t("panel.title"));

        const tabs = [
            { id: "media", label: t("tab.media") },
            { id: "links", label: t("tab.links") },
            { id: "files", label: t("tab.files") }
        ];

        panel.innerHTML = `
            <header class="mv-panel-header">
                <span class="mv-panel-icon">${icon("media")}</span>
                <div class="mv-header-info">
                    <h2 class="mv-header-title">${t("panel.title")}</h2>
                    <span class="mv-header-divider" aria-hidden="true"></span>
                    <span class="mv-header-subtitle" id="mv-header-sub"></span>
                </div>
                <button type="button" class="mv-icon-btn" id="mv-refresh-btn" aria-label="${t("refresh")}" data-mv-tip="${t("refresh")}">${icon("refresh")}</button>
                <button type="button" class="mv-icon-btn" id="mv-close-btn" aria-label="${t("close")}" data-mv-tip="${t("close.tip")}">${ICON_CLOSE}</button>
            </header>

            <div class="mv-toolbar">
                <div class="mv-filters">
                    <div class="mv-search">
                        <input type="text" id="mv-search-input" class="mv-input mv-input-sm mv-search-input" placeholder="${t("search.placeholder")}" aria-label="${t("search.aria")}" autocomplete="off" spellcheck="false">
                        <span class="mv-search-icon">${icon("search", 16)}</span>
                        <button type="button" class="mv-icon-btn mv-search-clear" aria-label="${t("search.clear")}" hidden>${ICON_CLOSE}</button>
                    </div>
                    <div class="mv-author-filter" id="mv-author-container"></div>
                </div>
                <div class="mv-tabs mv-tabs-nav" role="tablist" aria-label="${t("tabs.aria")}">
                    ${tabs.map(tab => `
                        <button type="button" class="mv-tab" id="mv-tab-${tab.id}" data-tab="${tab.id}" role="tab" aria-controls="mv-content-container"
                            aria-selected="${tab.id === this.activeTab}" tabindex="${tab.id === this.activeTab ? 0 : -1}">
                            <span>${tab.label}</span><span class="mv-tab-count" id="mv-badge-${tab.id}" hidden></span>
                        </button>`).join("")}
                </div>
            </div>

            <div class="mv-status" id="mv-status-banner" role="status" hidden>
                <span class="mv-spinner mv-spinner-sm" aria-hidden="true"></span>
                <span class="mv-status-text"></span>
            </div>

            <div class="mv-panel-content mv-scroller" id="mv-content-container" role="tabpanel" aria-labelledby="mv-tab-${this.activeTab}"></div>
        `;

        document.body.appendChild(panel);
        this.panelEl = panel;
        this._placePanel();
        Tip.bind(panel);

        panel.querySelector("#mv-close-btn").addEventListener("click", () => this._closePanel());
        panel.querySelector("#mv-refresh-btn").addEventListener("click", () => this.loadChannelData(true));

        const searchInp = panel.querySelector("#mv-search-input");
        searchInp.value = this.searchRaw;
        // Debounce : un seul re-rendu quand on arrête de taper, pas un par touche
        searchInp.addEventListener("input", (e) => {
            this.searchRaw = e.target.value;
            this._syncSearchClear();
            clearTimeout(this._searchTimer);
            this._searchTimer = setTimeout(() => {
                this._searchTimer = null;
                this.searchQuery = this.searchRaw.toLowerCase().trim();
                this._renderPanelContent();
            }, SEARCH_DEBOUNCE_MS);
        });
        panel.querySelector(".mv-search-clear").addEventListener("click", () => this._setSearch("", true));
        this._syncSearchClear();

        const content = panel.querySelector("#mv-content-container");
        const tabButtons = [...panel.querySelectorAll(".mv-tab")];
        const selectTab = (btn, focus) => {
            if (focus) btn.focus();
            const target = btn.dataset.tab;
            if (target === this.activeTab) return;
            this.activeTab = target;
            tabButtons.forEach(b => {
                const on = b === btn;
                b.setAttribute("aria-selected", String(on));
                b.tabIndex = on ? 0 : -1;
            });
            content.setAttribute("aria-labelledby", btn.id);
            content.scrollTop = 0;
            this._renderPanelContent();
        };
        tabButtons.forEach((btn, i) => {
            btn.addEventListener("click", () => selectTab(btn, false));
            // Flèches, Début et Fin passent d'un onglet à l'autre (focus mobile, comme dans Discord)
            btn.addEventListener("keydown", (e) => {
                const last = tabButtons.length - 1;
                const next = { ArrowRight: i === last ? 0 : i + 1, ArrowLeft: i === 0 ? last : i - 1, Home: 0, End: last }[e.key];
                if (next === undefined) return;
                e.preventDefault();
                selectTab(tabButtons[next], true);
            });
        });

        // Défilement infini : la page suivante arrive avant d'atteindre le bas
        content.addEventListener("scroll", () => {
            if (this.isLoading || this.isAutoFetching) return;
            const kind = this.activeTab === "links" ? "links" : "media";
            if (!this._hasMore(kind)) return;
            const scrollBottom = content.scrollHeight - content.scrollTop - content.clientHeight;
            if (scrollBottom < 220) this._loadMore(kind);
        }, { passive: true });
    }

    // ─── RECHERCHE ET FILTRES ─────────────────────────────────────────────────

    _setSearch(value, focus = false) {
        clearTimeout(this._searchTimer);
        this._searchTimer = null;
        this.searchRaw = value;
        this.searchQuery = value.toLowerCase().trim();
        const input = this.panelEl?.querySelector("#mv-search-input");
        if (input) {
            input.value = value;
            if (focus) input.focus();
        }
        this._syncSearchClear();
        this._renderPanelContent();
    }

    // La loupe laisse place à une croix dès qu'il y a du texte, comme la recherche de Discord
    _syncSearchClear() {
        const clear = this.panelEl?.querySelector(".mv-search-clear");
        const searchIcon = this.panelEl?.querySelector(".mv-search-icon");
        if (!clear || !searchIcon) return;
        const filled = this.searchRaw.length > 0;
        clear.hidden = !filled;
        searchIcon.hidden = filled;
    }

    _hasFilters() {
        return Boolean(this.searchQuery) || this.selectedAuthorId !== "all";
    }

    _clearFilters() {
        this.selectedAuthorId = "all";
        this._setSearch("");
    }

    // ─── RENDU DU PANNEAU ─────────────────────────────────────────────────────

    _isInitialLoading() {
        return this.isLoading && this.mediaList.length === 0 && this.linkList.length === 0 && this.fileList.length === 0;
    }

    _updateStatus() {
        if (!this.panelEl) return;
        const busy = this.isLoading || this.isAutoFetching;
        const banner = this.panelEl.querySelector("#mv-status-banner");
        if (banner) {
            const show = Boolean(this.statusText) && !this._isInitialLoading();
            banner.hidden = !show;
            banner.classList.toggle("mv-busy", busy);
            if (show) banner.querySelector(".mv-status-text").textContent = this.statusText;
        }
        const loadingText = this.panelEl.querySelector(".mv-loading-text");
        if (loadingText) loadingText.textContent = this.statusText || t("loading");
        // aria-disabled plutôt que disabled : le bouton garde le focus clavier pendant le chargement
        this.panelEl.querySelectorAll('[data-load="more"]').forEach(b => b.setAttribute("aria-disabled", String(busy)));
        if (!this.isAutoFetching) {
            this.panelEl.querySelectorAll('[data-load="all"]').forEach(b => b.setAttribute("aria-disabled", String(this.isLoading)));
        }
    }

    // Images : repli sur l'URL d'origine si le proxy échoue, sinon icône d'image cassée (remplace les onerror inline)
    _bindImageFallbacks(root) {
        root.querySelectorAll("img").forEach(img => {
            img.addEventListener("error", function onError() {
                const fallback = img.dataset.fallback;
                if (fallback && img.src !== fallback) {
                    delete img.dataset.fallback;
                    img.src = fallback;
                } else {
                    img.removeEventListener("error", onError);
                    img.style.display = "none";
                    img.closest(".mv-media-item, .mv-lb-media-stage")?.classList.add("mv-broken");
                }
            });
        });
        root.querySelectorAll("video.mv-thumb-video").forEach(video => {
            video.addEventListener("error", () => video.closest(".mv-media-item")?.classList.add("mv-broken"), { once: true });
        });
    }

    _itemKey(item) {
        return String(item.id || item.url || "");
    }

    // Retrouve l'élément qui avait le focus après un nouveau rendu de la liste
    _focusSelector(el) {
        if (!el) return null;
        if (el.dataset.load) return `[data-load="${el.dataset.load}"]`;
        if (el.classList.contains("mv-empty-action")) return ".mv-empty-action";
        const host = el.closest("[data-key]");
        if (!host) return null;
        const hostSel = `[data-key="${CSS.escape(host.dataset.key)}"]`;
        if (host === el) return hostSel;
        const cls = ["mv-action-copy", "mv-action-jump", "mv-link-title", "mv-file-name", "mv-file-download", "mv-file-jump"].find(c => el.classList.contains(c));
        return cls ? `${hostSel} .${cls}` : hostSel;
    }

    _renderPanelContent() {
        if (!this.panelEl) return;

        const sub = this.panelEl.querySelector("#mv-header-sub");
        if (sub) sub.textContent = this.currentChannelName || t("conversation");

        // Pas de compteur tant que le nombre est inconnu (premier chargement ou échec)
        const unknown = this.loadError || this._isInitialLoading();
        const counts = { media: this.mediaList.length, links: this.linkList.length, files: this.fileList.length };
        for (const [id, n] of Object.entries(counts)) {
            const badge = this.panelEl.querySelector(`#mv-badge-${id}`);
            if (!badge) continue;
            badge.textContent = n;
            badge.hidden = unknown;
        }

        this._renderAuthorFilter();

        const container = this.panelEl.querySelector("#mv-content-container");
        if (container) {
            Tip.hideWithin(container);
            const focused = container.contains(document.activeElement) ? this._focusSelector(document.activeElement) : null;
            this._renderBody(container, counts);
            if (focused) container.querySelector(focused)?.focus({ preventScroll: true });
        }
        this._updateStatus();
    }

    _renderBody(container, counts) {
        if (this._isInitialLoading()) {
            container.innerHTML = `
                <div class="mv-loading">
                    <span class="mv-spinner" aria-hidden="true"></span>
                    <span class="mv-loading-text">${escapeHtml(this.statusText || t("loading"))}</span>
                </div>`;
            return;
        }

        if (this.loadError && !counts.media && !counts.links && !counts.files) {
            container.innerHTML = this._emptyState("warning", t("error.title"), t("error.desc"), t("error.retry"));
            container.querySelector(".mv-empty-action").addEventListener("click", () => this.loadChannelData(true));
            return;
        }

        const tab = this.activeTab;
        const q = this.searchQuery;
        const has = value => String(value || "").toLowerCase().includes(q);
        const authorMatch = item => this.selectedAuthorId === "all" || item.author?.id === this.selectedAuthorId;
        const source = tab === "links" ? this.linkList : tab === "files" ? this.fileList : this.mediaList;

        const filtered = source.filter(item => {
            if (!authorMatch(item)) return false;
            if (!q) return true;
            const author = this._authorName(item.author, "");
            return tab === "links"
                ? has(item.url) || has(item.title) || has(item.description) || has(author)
                : has(item.name) || has(author);
        }).sort(byNewest);

        if (tab === "links") this._renderLinksTab(container, filtered);
        else if (tab === "files") this._renderFilesTab(container, filtered);
        else this._renderMediaTab(container, filtered);

        this._bindImageFallbacks(container);
    }

    _renderAuthorFilter() {
        const container = this.panelEl.querySelector("#mv-author-container");
        if (!container) return;

        // Liste inchangée : on ne recrée pas le menu (il resterait sinon fermé net pendant le chargement)
        const sig = [...this.authors.keys()].join(",");
        const existing = container.querySelector("select");
        const value = this.authors.has(this.selectedAuthorId) ? this.selectedAuthorId : "all";
        if (existing && existing.dataset.sig === sig) {
            existing.value = value;
            return;
        }

        const hadFocus = Boolean(existing) && document.activeElement === existing;
        container.textContent = "";
        if (this.authors.size <= 1) return;

        // Construit en DOM : les pseudos ne passent jamais par innerHTML
        const select = document.createElement("select");
        select.className = "mv-select mv-input-sm";
        select.id = "mv-author-dropdown";
        select.dataset.sig = sig;
        select.setAttribute("aria-label", t("filter.aria"));

        const all = document.createElement("option");
        all.value = "all";
        all.textContent = t("filter.all", this.authors.size);
        select.appendChild(all);

        const sorted = [...this.authors.values()].sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));
        for (const a of sorted) {
            const opt = document.createElement("option");
            opt.value = a.id;
            opt.textContent = a.name;
            select.appendChild(opt);
        }

        select.value = value;
        select.addEventListener("change", (e) => {
            this.selectedAuthorId = e.target.value;
            this._renderPanelContent();
        });
        container.appendChild(select);
        if (hadFocus) select.focus();
    }

    _emptyState(iconName, title, desc, actionLabel = "") {
        return `
            <div class="mv-empty">
                <div class="mv-empty-icon">${icon(iconName, 32)}</div>
                <div class="mv-empty-title">${escapeHtml(title)}</div>
                ${desc ? `<div class="mv-empty-desc">${escapeHtml(desc)}</div>` : ""}
                ${actionLabel ? `<button type="button" class="mv-btn mv-btn-secondary mv-btn-sm mv-empty-action">${escapeHtml(actionLabel)}</button>` : ""}
            </div>`;
    }

    _emptyBody(tab) {
        if (this._hasFilters()) {
            return this._emptyState("search", t("empty.noResults"), t("empty.noResultsDesc"), t("empty.clearFilters"));
        }
        // Rien de chargé mais l'historique continue : le bas de liste propose « Charger plus »
        if (this._hasMore(tab === "links" ? "links" : "media")) return "";
        const [iconName, title, desc] = {
            media: ["media", t("empty.media"), t("empty.mediaDesc")],
            links: ["link", t("empty.links"), t("empty.linksDesc")],
            files: ["file", t("empty.files"), t("empty.filesDesc")]
        }[tab];
        return this._emptyState(iconName, title, desc);
    }

    // Bas de liste : progression et chargement de l'historique (les fichiers suivent la recherche des médias)
    _renderFooter(tab) {
        const kind = tab === "links" ? "links" : "media";
        const count = { media: this.mediaList.length, links: this.linkList.length, files: this.fileList.length }[tab];
        const [one, many] = { media: t("noun.media"), links: t("noun.links"), files: t("noun.files") }[tab].split("|");

        if (!this._hasMore(kind)) {
            if (!count) return "";
            return `
                <div class="mv-end">
                    <div class="mv-end-title">${t("end.title")}</div>
                    <div>${t("end.total", count, plural(count, one, many))}</div>
                </div>`;
        }

        const isMedia = kind === "media";
        const total = isMedia ? this.totalMedia : this.totalLinks;
        const offset = isMedia ? this.offsetMedia : this.offsetLinks;
        const searching = isMedia ? this.hasMoreMedia : this.hasMoreLinks;
        const loaded = t("progress.loaded", count, plural(count, one, many));
        const progress = total && searching ? t("progress.scanned", loaded, Math.min(offset, total), total) : loaded;
        const busy = this.isLoading || this.isAutoFetching;

        return `
            <div class="mv-load-more">
                <div class="mv-load-progress">${progress}</div>
                <div class="mv-load-buttons">
                    <button type="button" class="mv-btn mv-btn-secondary mv-btn-sm" data-load="more" aria-disabled="${busy}">${t("load.more")}</button>
                    ${this.isAutoFetching
                        ? `<button type="button" class="mv-btn mv-btn-outline-danger mv-btn-sm" data-load="all">${t("load.stop")}</button>`
                        : `<button type="button" class="mv-btn mv-btn-outline mv-btn-sm" data-load="all" aria-disabled="${this.isLoading}" data-mv-tip="${t("load.allTip")}">${t("load.all")}</button>`}
                </div>
            </div>`;
    }

    _bindListCommon(container, tab) {
        const kind = tab === "links" ? "links" : "media";
        container.querySelector('[data-load="more"]')?.addEventListener("click", () => {
            if (!this.isLoading && !this.isAutoFetching) this._loadMore(kind);
        });
        container.querySelector('[data-load="all"]')?.addEventListener("click", () => {
            if (this.isAutoFetching || !this.isLoading) this._loadAll(kind, tab);
        });
        container.querySelector(".mv-empty-action")?.addEventListener("click", () => this._clearFilters());
    }

    // Une section par mois, du plus récent au plus ancien
    _groupedHtml(items, listClass, renderItem) {
        return groupByMonth(items).map(group => `
            <section class="mv-group">
                <h3 class="mv-group-title">${escapeHtml(group.label)} — ${group.entries.length}</h3>
                <div class="${listClass}">${group.entries.map(({ item, index }) => renderItem(item, index)).join("")}</div>
            </section>`).join("");
    }

    _shortDate(timestamp) {
        const d = new Date(timestamp);
        if (!timestamp || isNaN(d.getTime())) return "";
        const sameYear = d.getFullYear() === new Date().getFullYear();
        return d.toLocaleDateString(t("time.locale"), sameYear ? { day: "numeric", month: "short" } : { day: "numeric", month: "short", year: "numeric" });
    }

    // ─── ONGLET MÉDIAS ────────────────────────────────────────────────────────

    _renderMediaTab(container, items) {
        const body = items.length
            ? this._groupedHtml(items, "mv-media-grid", (item, index) => this._mediaTile(item, index))
            : this._emptyBody("media");
        container.innerHTML = body + this._renderFooter("media");

        container.querySelectorAll(".mv-media-item").forEach(el => {
            const idx = Number(el.dataset.index);
            el.addEventListener("click", () => this._openLightbox(items, idx));
            if (!el.classList.contains("mv-item-video")) return;
            // Aperçu vidéo au survol (joue le début et revient à la vignette)
            const vid = el.querySelector("video");
            el.addEventListener("mouseenter", () => {
                vid?.play()?.catch?.(() => {});
            });
            el.addEventListener("mouseleave", () => {
                try {
                    vid?.pause();
                    if (vid) vid.currentTime = 0.5;
                } catch (_) {}
            });
        });

        this._bindListCommon(container, "media");
    }

    _mediaTile(item, index) {
        const isVid = item.type === "video";
        const url = safeUrl(item.url);
        const thumb = safeUrl(item.proxyUrl) || url;
        const author = this._authorName(item.author, t("member"));
        const isGif = /\.gif(?=$|[?#])/i.test(item.name || "") || /\.gif(?=$|[?#])/i.test(url) || /^https?:\/\/([^/]+\.)?(tenor|giphy)\.com\//i.test(url);
        const badge = item.isHeic ? "HEIC" : isGif ? "GIF" : "";
        const kindLabel = isGif ? "GIF" : isVid ? t("kind.video") : "Image";
        const label = [t("item.label", kindLabel, item.name || t("item.untitled")), author, this.formatDate(item.timestamp)].filter(Boolean).join(", ");

        return `
            <button type="button" class="mv-media-item${isVid ? " mv-item-video" : ""}" data-index="${index}" data-key="${escapeHtml(this._itemKey(item))}" aria-label="${escapeHtml(label)}">
                ${isVid ? `
                    <span class="mv-media-video-wrapper">
                        <video src="${escapeHtml(thumb ? `${thumb}#t=0.5` : "")}" preload="metadata" muted playsinline loop class="mv-thumb-video"></video>
                    </span>
                    ${isGif ? "" : `<span class="mv-play">${icon("play", 20)}</span>`}
                ` : `<img src="${escapeHtml(thumb)}" data-fallback="${escapeHtml(url)}" loading="lazy" class="mv-thumb-img" alt="">`}
                ${badge ? `<span class="mv-media-badge">${badge}</span>` : ""}
                <span class="mv-media-overlay" aria-hidden="true">
                    <span class="mv-media-author">${escapeHtml(author)}</span>
                    <span class="mv-media-date">${escapeHtml(this._shortDate(item.timestamp))}</span>
                </span>
            </button>`;
    }

    // ─── ONGLET LIENS ─────────────────────────────────────────────────────────

    // Icône locale (première lettre du domaine) : plus de requête vers Google pour chaque lien affiché
    _domainIcon(domain) {
        const clean = String(domain || "?");
        let hash = 0;
        for (let i = 0; i < clean.length; i++) hash = (hash * 31 + clean.charCodeAt(i)) >>> 0;
        const hue = hash % 360;
        return `<span class="mv-link-letter" aria-hidden="true" style="background-color: hsl(${hue}, 45%, 42%);">${escapeHtml(clean.charAt(0).toUpperCase())}</span>`;
    }

    _renderLinksTab(container, items) {
        const body = items.length
            ? this._groupedHtml(items, "mv-results", (item, index) => this._linkCard(item, index))
            : this._emptyBody("links");
        container.innerHTML = body + this._renderFooter("links");

        container.querySelectorAll(".mv-link-card").forEach(card => {
            const item = items[Number(card.dataset.index)];
            card.querySelector(".mv-action-jump")?.addEventListener("click", (e) => {
                e.stopPropagation();
                this.jumpToMessage(item.channelId, item.messageId, item.guildId);
            });
            card.querySelector(".mv-action-copy")?.addEventListener("click", (e) => {
                e.stopPropagation();
                this.copyToClipboard(item.url, t("toast.linkCopied"));
            });
        });

        this._bindListCommon(container, "links");
    }

    _linkCard(item, index) {
        const author = this.authors.get(item.author?.id) || { name: this._authorName(item.author, t("member")), avatar: "" };
        const href = safeUrl(item.url);
        const avatar = safeUrl(author.avatar);
        // Sans aperçu, le titre vaut le domaine : on affiche alors l'adresse complète, comme Discord
        const title = item.title && item.title !== item.domain ? item.title : item.url;
        const tipUrl = item.url.length > 200 ? `${item.url.slice(0, 200)}…` : item.url;
        const tip = title !== item.url ? ` data-mv-tip="${escapeHtml(tipUrl)}"` : "";

        return `
            <article class="mv-result mv-link-card" data-index="${index}" data-key="${escapeHtml(this._itemKey(item))}">
                <div class="mv-link-head">
                    ${this._domainIcon(item.domain)}
                    <span class="mv-link-domain">${escapeHtml(item.domain)}</span>
                </div>
                <a class="mv-link-title" ${href ? `href="${escapeHtml(href)}"` : ""} target="_blank" rel="noreferrer noopener"${tip}>${escapeHtml(title)}</a>
                ${item.description ? `<p class="mv-link-desc">${escapeHtml(item.description)}</p>` : ""}
                <div class="mv-result-meta">
                    ${avatar ? `<img src="${escapeHtml(avatar)}" class="mv-mini-avatar" alt="">` : ""}
                    <span class="mv-meta-author">${escapeHtml(author.name)}</span>
                    <span aria-hidden="true">·</span>
                    <span>${escapeHtml(this.formatDate(item.timestamp))}</span>
                </div>
                <div class="mv-hover-actions">
                    <button type="button" class="mv-icon-btn mv-action-copy" aria-label="${t("copyLink")}" data-mv-tip="${t("copyLink")}">${icon("copy")}</button>
                    <button type="button" class="mv-btn mv-btn-xs mv-btn-secondary mv-action-jump" aria-label="${t("jump")}" data-mv-tip="${t("jump")}">${t("jump.short")}</button>
                </div>
            </article>`;
    }

    // ─── ONGLET FICHIERS ──────────────────────────────────────────────────────

    _fileKind(name, type) {
        const ext = (String(name).split("?")[0].match(/\.([a-z0-9]+)$/i)?.[1] || "").toLowerCase();
        if (type === "audio" || /^(mp3|ogg|wav|m4a|flac|aac|opus|wma)$/.test(ext)) return "audio";
        if (ext === "pdf") return "pdf";
        if (/^(zip|rar|7z|tar|gz|tgz|bz2|xz)$/.test(ext)) return "archive";
        if (/^(docx?|odt|txt|rtf|xlsx?|ods|pptx?|odp|csv|md)$/.test(ext)) return "doc";
        if (/^(js|ts|jsx|tsx|py|json|html?|css|java|c|cpp|h|cs|go|rs|rb|php|sh|bat|ps1|xml|ya?ml|lua)$/.test(ext)) return "code";
        return "other";
    }

    _renderFilesTab(container, items) {
        const body = items.length
            ? this._groupedHtml(items, "mv-results", (item, index) => this._fileRow(item, index))
            : this._emptyBody("files");
        container.innerHTML = body + this._renderFooter("files");

        container.querySelectorAll(".mv-file-jump").forEach(btn => {
            const item = items[Number(btn.closest("[data-index]").dataset.index)];
            btn.addEventListener("click", () => this.jumpToMessage(item.channelId, item.messageId, item.guildId));
        });

        this._bindListCommon(container, "files");
    }

    _fileRow(item, index) {
        const author = this.authors.get(item.author?.id) || { name: this._authorName(item.author, t("member")) };
        const name = item.name || t("file.fallback");
        const ext = (name.split("?")[0].match(/\.([a-z0-9]+)$/i)?.[1] || "").toUpperCase();
        const href = safeUrl(item.url);
        const size = this.formatFileSize(item.size);
        const nameTip = name.length > 32 ? ` data-mv-tip="${escapeHtml(name)}"` : "";

        return `
            <article class="mv-result" data-index="${index}" data-key="${escapeHtml(this._itemKey(item))}">
                <div class="mv-file-row">
                    <span class="mv-file-icon" data-kind="${this._fileKind(name, item.type)}" aria-hidden="true">${ext && ext.length <= 4 ? escapeHtml(ext) : icon("file", 20)}</span>
                    <div class="mv-file-main">
                        ${href
                            ? `<a class="mv-file-name" href="${escapeHtml(href)}" target="_blank" rel="noreferrer noopener"${nameTip}>${escapeHtml(name)}</a>`
                            : `<span class="mv-file-name"${nameTip}>${escapeHtml(name)}</span>`}
                        <div class="mv-result-meta">
                            ${size ? `<span>${escapeHtml(size)}</span><span aria-hidden="true">·</span>` : ""}
                            <span class="mv-meta-author">${escapeHtml(author.name)}</span>
                            <span aria-hidden="true">·</span>
                            <span>${escapeHtml(this.formatDate(item.timestamp))}</span>
                        </div>
                    </div>
                    <div class="mv-file-actions">
                        ${href ? `<a class="mv-icon-btn mv-file-download" href="${escapeHtml(href)}" target="_blank" rel="noreferrer noopener" download="${escapeHtml(name)}" aria-label="${t("download")}" data-mv-tip="${t("download")}">${icon("download")}</a>` : ""}
                        <button type="button" class="mv-icon-btn mv-file-jump" aria-label="${t("jump")}" data-mv-tip="${t("jump")}">${icon("jump")}</button>
                    </div>
                </div>
            </article>`;
    }

    // ─── VISIONNEUSE PLEIN ÉCRAN ──────────────────────────────────────────────

    _openLightbox(items, initialIndex) {
        if (!items?.[initialIndex]) return;
        if (!this.lightboxEl) this._lbReturnFocus = document.activeElement;
        this._currentGalleryItems = items;
        this.lightboxIndex = initialIndex;
        Tip.hide();
        this._renderLightbox();
    }

    _closeLightbox() {
        const wasOpen = Boolean(this.lightboxEl);
        const current = this._currentGalleryItems?.[this.lightboxIndex];
        this.lightboxIndex = -1;
        this.lightboxEl?.remove();
        this.lightboxEl = null;
        this._currentGalleryItems = null;
        Tip.hide();
        if (!wasOpen) return;

        // Le focus revient sur la vignette du dernier média affiché
        const back = this._lbReturnFocus;
        this._lbReturnFocus = null;
        const key = current ? this._itemKey(current) : "";
        const tile = key ? this.panelEl?.querySelector(`.mv-media-item[data-key="${CSS.escape(key)}"]`) : null;
        const target = tile || (back?.isConnected ? back : null);
        target?.focus({ preventScroll: !tile });
    }

    _navigateLightbox(direction) {
        if (!this._currentGalleryItems || this._currentGalleryItems.length === 0) return;
        const newIndex = this.lightboxIndex + direction;
        if (newIndex >= 0 && newIndex < this._currentGalleryItems.length) {
            this.lightboxIndex = newIndex;
            this._renderLightbox();
        }
    }

    _renderLightbox() {
        const item = this._currentGalleryItems?.[this.lightboxIndex];
        if (!item) return;

        // Le bouton actif reste actif d'un média à l'autre (navigation au clavier)
        const prevFocusId = this.lightboxEl?.contains(document.activeElement) ? document.activeElement.id : "";
        document.getElementById("mv-lightbox-overlay")?.remove();

        const total = this._currentGalleryItems.length;
        const isVid = item.type === "video";
        const author = this.authors.get(item.author?.id) || { name: this._authorName(item.author, t("member")), avatar: "" };
        const avatar = safeUrl(author.avatar);
        const url = safeUrl(item.url);
        const display = safeUrl(item.proxyUrl) || url;
        const hasPrev = this.lightboxIndex > 0;
        const hasNext = this.lightboxIndex < total - 1;
        const name = item.name || t("media.fallback");
        const meta = [this.formatFileSize(item.size), `${this.lightboxIndex + 1} / ${total}`].filter(Boolean).join(" · ");

        const overlay = document.createElement("div");
        overlay.id = "mv-lightbox-overlay";
        overlay.className = "mv-ui mv-lightbox";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.setAttribute("aria-label", t("lb.preview", name));

        const action = (id, iconHtml, label) => `<button type="button" class="mv-lb-btn" id="${id}" aria-label="${label}" data-mv-tip="${label}">${iconHtml}</button>`;

        overlay.innerHTML = `
            <div class="mv-lb-topbar">
                <div class="mv-lb-author">
                    ${avatar ? `<img src="${escapeHtml(avatar)}" class="mv-lb-avatar" alt="">` : ""}
                    <div class="mv-lb-author-text">
                        <div class="mv-lb-author-name">${escapeHtml(author.name)}</div>
                        <div class="mv-lb-timestamp">${escapeHtml(this.formatDate(item.timestamp))}</div>
                    </div>
                </div>
                <div class="mv-lb-actions">
                    ${action("mv-lb-jump", icon("jump"), t("jump"))}
                    ${url ? `<a class="mv-lb-btn" id="mv-lb-download" href="${escapeHtml(url)}" target="_blank" rel="noreferrer noopener" download="${escapeHtml(name)}" aria-label="${t("download")}" data-mv-tip="${t("download")}">${icon("download")}</a>` : ""}
                    ${action("mv-lb-copy", icon("copy"), t("copyLink"))}
                    <span class="mv-lb-sep" aria-hidden="true"></span>
                    ${action("mv-lb-close", ICON_CLOSE, t("close.tip"))}
                </div>
            </div>

            <div class="mv-lb-center">
                ${hasPrev
                    ? `<button type="button" class="mv-lb-arrow" id="mv-lb-prev" aria-label="${t("lb.prev")}">${icon("prev", 28)}</button>`
                    : `<span class="mv-lb-arrow-placeholder"></span>`}
                <div class="mv-lb-media-stage">
                    ${isVid
                        ? `<video src="${escapeHtml(url)}" controls autoplay playsinline class="mv-lb-media-video"></video>`
                        : `<img src="${escapeHtml(display)}" data-fallback="${escapeHtml(url)}" alt="${escapeHtml(name)}" class="mv-lb-media-img">`}
                </div>
                ${hasNext
                    ? `<button type="button" class="mv-lb-arrow" id="mv-lb-next" aria-label="${t("lb.next")}">${icon("next", 28)}</button>`
                    : `<span class="mv-lb-arrow-placeholder"></span>`}
            </div>

            <div class="mv-lb-bottombar">
                <span class="mv-lb-filename">${escapeHtml(name)}</span>
                <span class="mv-lb-meta">${escapeHtml(meta)}</span>
            </div>
        `;

        document.body.appendChild(overlay);
        this.lightboxEl = overlay;
        Tip.bind(overlay);
        this._bindImageFallbacks(overlay);

        overlay.querySelector("#mv-lb-close").addEventListener("click", () => this._closeLightbox());
        overlay.querySelector("#mv-lb-jump").addEventListener("click", () => {
            this.jumpToMessage(item.channelId, item.messageId, item.guildId);
            this._closeLightbox();
        });
        overlay.querySelector("#mv-lb-copy").addEventListener("click", () => {
            this.copyToClipboard(item.url, t("toast.mediaLinkCopied"));

        });
        overlay.querySelector("#mv-lb-prev")?.addEventListener("click", () => this._navigateLightbox(-1));
        overlay.querySelector("#mv-lb-next")?.addEventListener("click", () => this._navigateLightbox(1));

        // Un clic autour du média ferme la visionneuse, comme sur Discord
        const backdrop = new Set([overlay, ...overlay.querySelectorAll(".mv-lb-center, .mv-lb-media-stage, .mv-lb-topbar, .mv-lb-bottombar, .mv-lb-author")]);
        overlay.addEventListener("click", (e) => {
            if (backdrop.has(e.target)) this._closeLightbox();
        });

        const focusTarget = (prevFocusId && overlay.querySelector(`#${prevFocusId}`))
            || (/^mv-lb-(prev|next)$/.test(prevFocusId) && overlay.querySelector(".mv-lb-arrow"))
            || overlay.querySelector("#mv-lb-close");
        focusTarget?.focus({ preventScroll: true });
        Tip.hide(); // pas d'infobulle sur un focus posé par le code
    }

    // Tab et Maj+Tab restent dans la visionneuse
    _trapFocus(e) {
        const nodes = [...this.lightboxEl.querySelectorAll("button, a[href], video[controls]")].filter(n => !n.disabled);
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        const inside = this.lightboxEl.contains(document.activeElement);
        if (e.shiftKey && (!inside || document.activeElement === first)) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && (!inside || document.activeElement === last)) {
            e.preventDefault();
            first.focus();
        }
    }
};
