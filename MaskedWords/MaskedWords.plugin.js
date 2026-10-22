/**
 * @name MaskedWords
 * @author AaronL2L
 * @version 1.0.0
 * @description Hides messages that contain words you choose, like a Discord spoiler: click to reveal. Named lists with optional durations, and right-click a text selection to hide it. English and French.
 * @invite HdXp7sWRY3
 * @website https://valientebot.xyz
 * @source https://github.com/AaronL2L/BetterDiscordPlugins/tree/main/MaskedWords
 * @updateUrl https://raw.githubusercontent.com/AaronL2L/BetterDiscordPlugins/main/MaskedWords/MaskedWords.plugin.js
 */

const DATA_KEY = "MaskedWords";
const STYLE_ID = "MaskedWords-styles";
const HIGHLIGHT_NAME = "mw-hidden";
const SELECTIONS_ID = "selections";
const MIN_SELECTION = 3;    // lettres ou chiffres, pour qu'un « a » ne masque pas tout
const MIN_WORD = 2;
const MAX_TEXT = 300;
const MAX_NAME = 40;
const HOUR = 3600000;
const DAY = 24 * HOUR;
const DURATIONS = [
    { key: "forever", ms: null },
    { key: "24h", ms: DAY },
    { key: "7d", ms: 7 * DAY },
    { key: "30d", ms: 30 * DAY }
];
// Repères stables de Discord : texte, pièces jointes et aperçu de réponse d'un message
const CONTENT_PREFIX = "message-content-";
const ACC_PREFIX = "message-accessories-";
const HOST_SEL = `[id^="${CONTENT_PREFIX}"], [id^="${ACC_PREFIX}"]`;
const REPLY_SEL = '[id^="message-reply-context-"]';
const REACTIONS_SEL = '[class*="reactions"]';
const SKIP_TEXT_SEL = `time, [class*="edited"], ${REACTIONS_SEL}`;
const MARK_ATTRS = ["data-mw-id", "data-mw-mask", "data-mw-label", "data-mw-media", "data-mw-preview"];

const escapeHtml = (str) => String(str ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

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
        "label": (name) => `Hidden · ${name}`,
        "list.selections": "Selections",
        "list.new": "New list",
        "dur.forever": "Always",
        "dur.24h": "24 hours",
        "dur.7d": "7 days",
        "dur.30d": "30 days",
        "dur.custom": "Custom",
        "span.hours": (n) => `${n} ${plural(n, "hour", "hours")}`,
        "span.days": (n) => `${n} ${plural(n, "day", "days")}`,
        "unit.hours": "hours",
        "unit.days": "days",
        "left.days": (n) => `${n}d`,
        "left.hours": (n) => `${n}h`,
        "left.soon": "<1h",
        "menu.hide": "Hide selection",
        "menu.into": (name) => `Into “${name}”`,
        "menu.custom": "Customize…",
        "menu.tooShort": (n) => `Select at least ${n} letters`,
        "menu.tooLong": (n) => `Too long (${n} characters max)`,
        "menu.remask": "Hide again",
        "toast.added": (name, span) => span ? `Hidden in “${name}” for ${span}.` : `Hidden in “${name}” for good.`,
        "toast.updated": (name, span) => span ? `Already in “${name}”: now hidden for ${span}.` : `Already in “${name}”: now hidden for good.`,
        "toast.tooShort": (n) => `Too short: at least ${n} letters or digits.`,
        "toast.duplicate": "Already in this list.",
        "toast.expired": (name) => `The list “${name}” has expired and is now off.`,
        "modal.title": "Hide selection",
        "modal.subtitle": "Messages containing this text will be hidden like a spoiler.",
        "modal.close": "Close",
        "modal.text": "Text",
        "modal.textHint": "Case and accents are ignored. End a word with * to include its variants.",
        "modal.list": "List",
        "modal.newList": "New list…",
        "modal.newListName": "Name of the new list",
        "modal.duration": "Duration",
        "modal.customAria": "Custom duration",
        "modal.unitAria": "Unit",
        "modal.cancel": "Cancel",
        "modal.confirm": "Hide",
        "settings.howTitle": "How it works",
        "settings.how": "Messages containing a word from your lists are hidden like a Discord spoiler: click one to show it. Only you see the difference, nothing is sent to Discord.",
        "settings.howSelect": "Select text in any message, then right-click it and choose <strong>Hide selection</strong>.",
        "settings.howWildcard": "Case and accents are ignored. End a word with <strong>*</strong> to include its variants: <strong>cat*</strong> also hides cats and catalog.",
        "settings.optionsTitle": "Options",
        "settings.media": "Blur images and videos",
        "settings.mediaDesc": "In hidden messages, attachments and embeds are blurred too.",
        "settings.notif": "Hide in notifications",
        "settings.notifDesc": "Desktop notifications show the list name instead of the message.",
        "settings.selList": "List for selections",
        "settings.selListDesc": "Where <strong>Hide selection</strong> adds text by default.",
        "settings.listsTitle": "Lists",
        "settings.newList": "New list",
        "settings.listName": "List name",
        "settings.enabled": "Enabled",
        "settings.delete": "Delete list",
        "settings.deleteTitle": "Delete this list?",
        "settings.deleteBody": (name, n) => `“${name}” and its ${n} ${plural(n, "entry", "entries")} will be deleted.`,
        "settings.deleteConfirm": "Delete",
        "settings.cancel": "Cancel",
        "settings.mode": "Hide",
        "mode.message": "Whole message",
        "mode.word": "Only the word",
        "settings.duration": "Duration",
        "settings.until": (date) => `Active until ${date}.`,
        "settings.expiredOn": (date) => `Expired on ${date}.`,
        "settings.noEnd": "No end date.",
        "status.on": "Active",
        "status.off": "Off",
        "status.expired": "Expired",
        "settings.words": (n) => `Words (${n})`,
        "settings.hoverHint": "Hover to show them",
        "settings.wordsEmpty": "No words yet.",
        "settings.addPlaceholder": "Add words separated by commas, then press Enter",
        "settings.removeWord": "Remove"
    },
    fr: {
        "label": (name) => `Masqué · ${name}`,
        "list.selections": "Sélections",
        "list.new": "Nouvelle liste",
        "dur.forever": "Toujours",
        "dur.24h": "24 h",
        "dur.7d": "7 jours",
        "dur.30d": "30 jours",
        "dur.custom": "Personnalisée",
        "span.hours": (n) => `${n} ${plural(n, "heure", "heures")}`,
        "span.days": (n) => `${n} ${plural(n, "jour", "jours")}`,
        "unit.hours": "heures",
        "unit.days": "jours",
        "left.days": (n) => `${n} j`,
        "left.hours": (n) => `${n} h`,
        "left.soon": "< 1 h",
        "menu.hide": "Masquer la sélection",
        "menu.into": (name) => `Dans « ${name} »`,
        "menu.custom": "Personnaliser…",
        "menu.tooShort": (n) => `Sélectionne au moins ${n} lettres`,
        "menu.tooLong": (n) => `Trop long (${n} caractères max)`,
        "menu.remask": "Masquer à nouveau",
        "toast.added": (name, span) => span ? `Masqué dans « ${name} » pendant ${span}.` : `Masqué dans « ${name} » pour toujours.`,
        "toast.updated": (name, span) => span ? `Déjà dans « ${name} » : masqué maintenant pendant ${span}.` : `Déjà dans « ${name} » : masqué maintenant pour toujours.`,
        "toast.tooShort": (n) => `Trop court : ${n} lettres ou chiffres minimum.`,
        "toast.duplicate": "Déjà dans cette liste.",
        "toast.expired": (name) => `La liste « ${name} » a expiré, elle est désactivée.`,
        "modal.title": "Masquer la sélection",
        "modal.subtitle": "Les messages qui contiennent ce texte seront cachés comme un spoiler.",
        "modal.close": "Fermer",
        "modal.text": "Texte",
        "modal.textHint": "Majuscules et accents ignorés. Termine un mot par * pour inclure ses variantes.",
        "modal.list": "Liste",
        "modal.newList": "Nouvelle liste…",
        "modal.newListName": "Nom de la nouvelle liste",
        "modal.duration": "Durée",
        "modal.customAria": "Durée personnalisée",
        "modal.unitAria": "Unité",
        "modal.cancel": "Annuler",
        "modal.confirm": "Masquer",
        "settings.howTitle": "Fonctionnement",
        "settings.how": "Les messages qui contiennent un mot de tes listes sont cachés comme un spoiler Discord : clique dessus pour les afficher. Le changement ne se voit que chez toi, rien n'est envoyé à Discord.",
        "settings.howSelect": "Sélectionne du texte dans n'importe quel message, puis fais un clic droit et choisis <strong>Masquer la sélection</strong>.",
        "settings.howWildcard": "Majuscules et accents ignorés. Termine un mot par <strong>*</strong> pour inclure ses variantes : <strong>chat*</strong> masque aussi chats et chaton.",
        "settings.optionsTitle": "Options",
        "settings.media": "Flouter les images et vidéos",
        "settings.mediaDesc": "Dans les messages masqués, les pièces jointes et les intégrations sont floutées aussi.",
        "settings.notif": "Masquer dans les notifications",
        "settings.notifDesc": "Les notifications du bureau affichent le nom de la liste à la place du message.",
        "settings.selList": "Liste des sélections",
        "settings.selListDesc": "Là où <strong>Masquer la sélection</strong> ajoute le texte par défaut.",
        "settings.listsTitle": "Listes",
        "settings.newList": "Nouvelle liste",
        "settings.listName": "Nom de la liste",
        "settings.enabled": "Activée",
        "settings.delete": "Supprimer la liste",
        "settings.deleteTitle": "Supprimer cette liste ?",
        "settings.deleteBody": (name, n) => `« ${name} » et ${plural(n, "son", "ses")} ${n} ${plural(n, "élément", "éléments")} seront supprimés.`,
        "settings.deleteConfirm": "Supprimer",
        "settings.cancel": "Annuler",
        "settings.mode": "Masquer",
        "mode.message": "Tout le message",
        "mode.word": "Seulement le mot",
        "settings.duration": "Durée",
        "settings.until": (date) => `Active jusqu'au ${date}.`,
        "settings.expiredOn": (date) => `Expirée le ${date}.`,
        "settings.noEnd": "Pas de date de fin.",
        "status.on": "Active",
        "status.off": "Désactivée",
        "status.expired": "Expirée",
        "settings.words": (n) => `Mots (${n})`,
        "settings.hoverHint": "Survole pour les voir",
        "settings.wordsEmpty": "Aucun mot pour l'instant.",
        "settings.addPlaceholder": "Ajoute des mots séparés par des virgules, puis Entrée",
        "settings.removeWord": "Retirer"
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


// Icône « corbeille » de Discord
const ICON_TRASH = `<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M14.25 1c.41 0 .75.34.75.75V3h5.25c.41 0 .75.34.75.75v.5c0 .41-.34.75-.75.75H3.75A.75.75 0 0 1 3 4.25v-.5c0-.41.34-.75.75-.75H9V1.75c0-.41.34-.75.75-.75h4.5Z"/><path fill="currentColor" fill-rule="evenodd" d="M5.06 7a1 1 0 0 0-1 1.06l.76 12.13a3 3 0 0 0 3 2.81h8.36a3 3 0 0 0 3-2.81l.75-12.13a1 1 0 0 0-1-1.06H5.07ZM11 12a1 1 0 1 0-2 0v6a1 1 0 1 0 2 0v-6Zm3-1a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1Z" clip-rule="evenodd"/></svg>`;

// Œil barré pour les entrées du menu contextuel
const EyeOffIcon = (props) => BdApi.React.createElement("svg",
    { className: props?.className, width: 18, height: 18, viewBox: "0 0 24 24", "aria-hidden": true },
    BdApi.React.createElement("path", {
        fill: "currentColor",
        d: "M12 7a5 5 0 0 1 5 5c0 .65-.13 1.26-.36 1.83l2.92 2.92A11.8 11.8 0 0 0 23 12c-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16A4.85 4.85 0 0 1 12 7ZM2 4.27l2.28 2.28.46.46A11.8 11.8 0 0 0 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27Zm5.53 5.53 1.55 1.55A3 3 0 0 0 12.65 14.92l1.55 1.55A5 5 0 0 1 7.53 9.8Zm4.31-.78 3.15 3.15.02-.16a3 3 0 0 0-3-3l-.17.01Z"
    })
);

// ─── Comparaison sans majuscules ni accents ──────────────────────────────────
// Le texte est réduit (minuscules, accents retirés, ligatures dépliées) en
// gardant pour chaque caractère sa position d'origine : une correspondance
// trouvée dans le texte réduit se replace exactement dans le message affiché.
const LIGATURES = { "œ": "oe", "æ": "ae", "ß": "ss", "’": "'", "‘": "'", "ʼ": "'", "“": "\"", "”": "\"", "«": "\"", "»": "\"" };
const normalizeText = (text) => {
    let norm = "";
    const starts = [];
    const ends = [];
    let i = 0;
    for (const ch of String(text)) {
        const lower = ch.toLowerCase();
        const out = LIGATURES[lower] ?? lower.normalize("NFD").replace(/\p{M}/gu, "");
        for (let k = 0; k < out.length; k++) {
            starts.push(i);
            ends.push(i + ch.length);
        }
        norm += out;
        i += ch.length;
    }
    return { norm, starts, ends };
};

const WORD = "[\\p{L}\\p{N}]";
const isAlnum = (ch) => !!ch && /[\p{L}\p{N}]/u.test(ch);
const letterCount = (text) => (String(text).match(/[\p{L}\p{N}]/gu) ?? []).length;
// « - » n'est pas échappé : hors crochets il est déjà littéral, et « \- » est refusé avec le drapeau u
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
const entryKey = (text) => normalizeText(text).norm.replace(/\s+/g, " ").trim();

// « chat » ne trouve pas « achat » ; « chat* » trouve aussi « chats » et « chaton ».
// Les limites de mot ne s'appliquent que si le bord est une lettre, un chiffre ou *.
const entryPattern = (text) => {
    const key = entryKey(text);
    if (!key) return null;
    const body = key.split(" ")
        .map(part => part.split("*").map(escapeRegex).join(`${WORD}*`))
        .join("\\s+");
    const chars = [...key];
    const edge = (ch) => ch === "*" || isAlnum(ch);
    return (edge(chars[0]) ? `(?<!${WORD})` : "") + body + (edge(chars.at(-1)) ? `(?!${WORD})` : "");
};

const isExpired = (item, now) => !!item.expiresAt && item.expiresAt <= now;

// Une expression par liste active, motifs les plus longs d'abord
const compileRules = (lists, now = Date.now()) => {
    const rules = [];
    lists.forEach((list, index) => {
        if (!list.enabled || isExpired(list, now)) return;
        const patterns = [...new Set(list.entries
            .filter(e => !isExpired(e, now))
            .map(e => entryPattern(e.text))
            .filter(Boolean))]
            .sort((a, b) => b.length - a.length);
        if (!patterns.length) return;
        try {
            rules.push({ index, name: list.name, mode: list.mode, regex: new RegExp(`(?:${patterns.join("|")})`, "gu") });
        } catch (e) {
            console.error("[MaskedWords] list pattern:", list.name, e);
        }
    });
    return rules;
};

const findMatches = (text, rules) => {
    if (!text || !rules.length) return [];
    const { norm, starts, ends } = normalizeText(text);
    const found = [];
    for (const rule of rules) {
        rule.regex.lastIndex = 0;
        let m;
        while ((m = rule.regex.exec(norm))) {
            if (!m[0].length) { rule.regex.lastIndex++; continue; }
            found.push({ start: starts[m.index], end: ends[m.index + m[0].length - 1], rule });
        }
    }
    return found;
};

// « Tout le message » l'emporte sur « Seulement le mot » ; l'étiquette prend
// la première liste concernée, dans l'ordre des paramètres.
const verdict = (matches) => {
    if (!matches.length) return null;
    const first = (list) => list.reduce((a, b) => (a.rule.index <= b.rule.index ? a : b));
    const whole = matches.filter(m => m.rule.mode === "message");
    if (whole.length) return { mode: "message", name: first(whole).rule.name, matches };
    return { mode: "word", name: first(matches).rule.name, matches };
};

// Une sélection qui coupe un mot est étendue au mot entier, puis débarrassée
// de la ponctuation et des espaces en trop sur les bords.
const expandToWords = (full, start, end) => {
    if (isAlnum(full[start]) && isAlnum(full[start - 1])) {
        while (start > 0 && isAlnum(full[start - 1])) start--;
    }
    if (isAlnum(full[end - 1]) && isAlnum(full[end])) {
        while (end < full.length && isAlnum(full[end])) end++;
    }
    return full.slice(start, end).replace(/\s+/g, " ").replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
};

const formatSpan = (ms) => {
    const days = Math.round(ms / DAY);
    if (ms >= DAY - HOUR && Math.abs(ms - days * DAY) < HOUR) return t("span.days", days);
    return t("span.hours", Math.max(1, Math.round(ms / HOUR)));
};
const formatLeft = (ms) => {
    if (ms >= DAY) return t("left.days", Math.round(ms / DAY));
    if (ms >= HOUR) return t("left.hours", Math.round(ms / HOUR));
    return t("left.soon");
};
const formatDate = (ts) => new Intl.DateTimeFormat(getLang() === "fr" ? "fr-FR" : "en-US", {
    weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
}).format(new Date(ts));

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// ─── Données ─────────────────────────────────────────────────────────────────
const sanitizeEntry = (e, now) => {
    const text = typeof e?.text === "string" ? e.text.replace(/\s+/g, " ").trim().slice(0, MAX_TEXT) : "";
    if (letterCount(text) < MIN_WORD) return null;
    return {
        text,
        addedAt: Number.isFinite(e.addedAt) ? e.addedAt : now,
        expiresAt: Number.isFinite(e.expiresAt) ? e.expiresAt : null
    };
};
const sanitizeList = (l, now, ids) => {
    if (!l || typeof l !== "object") return null;
    let id = typeof l.id === "string" && l.id ? l.id : newId();
    while (ids.has(id)) id = newId();
    ids.add(id);
    const seen = new Set();
    const entries = (Array.isArray(l.entries) ? l.entries : [])
        .map(e => sanitizeEntry(e, now))
        .filter(e => e && !seen.has(entryKey(e.text)) && seen.add(entryKey(e.text)));
    return {
        id,
        name: String(l.name ?? "").trim().slice(0, MAX_NAME) || t("list.new"),
        enabled: l.enabled !== false,
        mode: l.mode === "word" ? "word" : "message",
        durationMs: Number.isFinite(l.durationMs) && l.durationMs > 0 ? l.durationMs : null,
        expiresAt: Number.isFinite(l.expiresAt) ? l.expiresAt : null,
        entries
    };
};

// ─── Texte affiché d'un message ──────────────────────────────────────────────
// Concatène les nœuds texte visibles (sans l'heure, « (modifié) » ni les
// réactions) et garde la position de chacun pour recréer des plages (Range).
const collectText = (roots) => {
    let text = "";
    const nodes = [];
    const parts = [];
    for (const root of roots) {
        if (!root) continue;
        if (text) text += "\u0000";
        const start = text.length;
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode: (n) => {
                const skip = n.parentElement?.closest(SKIP_TEXT_SEL);
                return skip && skip !== root && root.contains(skip) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
            }
        });
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
            nodes.push({ node: n, start: text.length });
            text += n.data;
        }
        parts.push({ root, start, end: text.length });
    }
    return { text, nodes, parts };
};

const nodeAt = (nodes, offset) => {
    for (let i = nodes.length - 1; i >= 0; i--) {
        if (nodes[i].start <= offset) return offset < nodes[i].start + nodes[i].node.data.length ? nodes[i] : null;
    }
    return null;
};
const makeRange = (nodes, start, end) => {
    const a = nodeAt(nodes, start);
    const b = nodeAt(nodes, end - 1);
    if (!a || !b) return null;
    const range = document.createRange();
    range.setStart(a.node, start - a.start);
    range.setEnd(b.node, end - b.start);
    return range;
};
// Position d'une borne de sélection dans le texte rassemblé par collectText
const offsetAt = (nodes, container, offset, isEnd) => {
    const hit = nodes.find(n => n.node === container);
    if (hit) return hit.start + Math.min(offset, hit.node.data.length);
    const point = document.createRange();
    point.setStart(container, offset);
    if (!isEnd) {
        const next = nodes.find(n => point.comparePoint(n.node, 0) >= 0);
        return next ? next.start : Infinity;
    }
    let prev = null;
    for (const n of nodes) if (point.comparePoint(n.node, 0) < 0) prev = n;
    return prev ? prev.start + prev.node.data.length : -Infinity;
};

const hasMedia = (acc) => [...acc.children].some(c =>
    !c.matches(REACTIONS_SEL) && (c.querySelector("img, video, canvas, iframe, svg") || c.textContent.trim()));

const setMarks = (el, marks) => {
    for (const name of MARK_ATTRS) {
        const value = marks[name];
        if (value == null) {
            if (el.hasAttribute(name)) el.removeAttribute(name);
        } else if (el.getAttribute(name) !== value) {
            el.setAttribute(name, value);
        }
    }
};
const clearMarks = (el) => setMarks(el, {});

// ─── Choix d'une durée (fenêtre et paramètres) ───────────────────────────────
const msToPicker = (ms) => {
    if (ms == null) return { key: "forever", n: 2, unit: "d" };
    const preset = DURATIONS.find(d => d.ms === ms);
    if (preset) return { key: preset.key, n: 2, unit: "d" };
    if (ms % DAY === 0) return { key: "custom", n: ms / DAY, unit: "d" };
    return { key: "custom", n: Math.max(1, Math.round(ms / HOUR)), unit: "h" };
};
const durationPickerHTML = () => `
    <div class="mw-durations">
        ${[...DURATIONS.map(d => d.key), "custom"].map(k =>
            `<button type="button" class="mw-btn mw-btn-sm mw-btn-outline mw-dur" data-dur="${k}">${t(`dur.${k}`)}</button>`).join("")}
    </div>
    <div class="mw-custom" hidden>
        <input class="mw-input mw-input-sm mw-custom-n" type="number" min="1" max="999" step="1" inputmode="numeric" aria-label="${escapeHtml(t("modal.customAria"))}">
        <select class="mw-select mw-input-sm mw-custom-unit" aria-label="${escapeHtml(t("modal.unitAria"))}">
            <option value="h">${t("unit.hours")}</option>
            <option value="d">${t("unit.days")}</option>
        </select>
    </div>`;
const bindDurationPicker = (root, initialMs, onChange) => {
    const state = msToPicker(initialMs);
    const buttons = [...root.querySelectorAll(".mw-dur")];
    const custom = root.querySelector(".mw-custom");
    const num = root.querySelector(".mw-custom-n");
    const unit = root.querySelector(".mw-custom-unit");
    const count = () => Math.min(999, Math.max(1, Math.round(Number(num.value)) || state.n));
    const value = () => (state.key === "custom"
        ? count() * (unit.value === "d" ? DAY : HOUR)
        : DURATIONS.find(d => d.key === state.key).ms);
    const render = () => {
        for (const b of buttons) b.classList.toggle("mw-active", b.dataset.dur === state.key);
        custom.hidden = state.key !== "custom";
        num.value = String(state.n);
        unit.value = state.unit;
    };
    for (const b of buttons) {
        b.addEventListener("click", () => {
            state.key = b.dataset.dur;
            render();
            if (state.key === "custom") num.focus();
            onChange?.(value());
        });
    }
    num.addEventListener("change", () => { state.n = count(); num.value = String(state.n); onChange?.(value()); });
    unit.addEventListener("change", () => { state.unit = unit.value; onChange?.(value()); });
    render();
    return { value };
};

const PLUGIN_CSS = `
/* Message entier : le texte laisse la place à une pastille façon spoiler Discord.
   Elle reste dans le flux du texte, donc commence là où le texte commençait
   (le cadre de l'élément, lui, déborde sous l'avatar). */
[data-mw-mask="message"] { font-size: 0 !important; cursor: pointer; user-select: none; }
[data-mw-mask="message"] > * { display: none !important; }
[data-mw-mask="message"]::before,
[data-mw-mask="word"]::after,
[data-mw-media]::after,
[data-mw-preview="message"]::before {
    content: attr(data-mw-label); display: inline-flex; align-items: center; padding: 0 8px;
    border-radius: 4px; color: var(--text-muted, #949ba4);
    font-size: 12px; font-weight: 600; line-height: 1; letter-spacing: normal; white-space: nowrap;
    pointer-events: none; visibility: visible;
}
[data-mw-mask="message"]::before {
    height: 22px; vertical-align: top; transition: background-color .1s ease;
    background-color: var(--spoiler-hidden-background, var(--background-tertiary, #1e1f22));
}
[data-mw-mask="message"]:hover::before { background-color: var(--spoiler-hidden-background-hover, var(--background-modifier-accent, #2e3035)); }
/* Seulement le mot : petite étiquette après le texte */
[data-mw-mask="word"]::after {
    height: 18px; margin-left: 6px; vertical-align: 1px;
    background-color: var(--spoiler-hidden-background, var(--background-tertiary, #1e1f22));
}
::highlight(mw-hidden) { color: transparent; background-color: #202225; }
.theme-light ::highlight(mw-hidden) { color: transparent; background-color: #e3e5e8; }
/* Images, vidéos et intégrations floutées, sauf les réactions */
[data-mw-media] { position: relative; cursor: pointer; }
[data-mw-media] > :not([class*="reactions"]) { filter: blur(44px); clip-path: inset(0 round 8px); pointer-events: none; }
[data-mw-media]::after {
    position: absolute; top: 8px; left: 8px; z-index: 1; height: 22px;
    background-color: rgba(0, 0, 0, .6); color: #fff;
}
/* Aperçu de réponse : l'étiquette remplace le texte */
[data-mw-preview="message"] { font-size: 0 !important; }
[data-mw-preview="message"] > * { display: none !important; }
[data-mw-preview="message"]::before {
    height: 18px; padding: 0 6px;
    background-color: var(--spoiler-hidden-background, var(--background-tertiary, #1e1f22));
}

.mw-settings { display: flex; flex-direction: column; gap: 16px; }
.mw-settings .mw-hint:first-of-type { margin-top: 8px; }
label.mw-row { cursor: pointer; }
.mw-row .mw-select { flex: 0 0 auto; width: 200px; max-width: 45%; }
.mw-lists-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 8px; }
.mw-list-head { display: flex; align-items: center; gap: 12px; }
.mw-list-name { flex: 1 1 auto; min-width: 0; font-weight: 600; }
.mw-list-grid { display: grid; grid-template-columns: max-content 1fr; gap: 12px 16px; align-items: start; margin-top: 16px; }
.mw-list-grid > .mw-label { margin: 0; line-height: 32px; }
.mw-list-grid .mw-hint { margin-top: 6px; font-size: 13px; line-height: 18px; }
.mw-segment, .mw-durations { display: flex; flex-wrap: wrap; gap: 8px; }
.mw-opt.mw-active, .mw-dur.mw-active {
    color: var(--mw-header); background: color-mix(in srgb, var(--mw-brand) 16%, transparent);
    box-shadow: inset 0 0 0 1px var(--mw-brand);
}
.mw-custom { display: flex; gap: 8px; margin-top: 8px; }
.mw-custom .mw-custom-n { width: 80px; }
.mw-custom .mw-custom-unit { width: auto; }
.mw-custom-n::-webkit-inner-spin-button, .mw-custom-n::-webkit-outer-spin-button { margin: 0; -webkit-appearance: none; }
.mw-words-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-top: 16px; }
.mw-words-head .mw-label { margin: 0; }
.mw-chips { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0; }
.mw-chip {
    display: inline-flex; align-items: center; gap: 6px; max-width: 100%; height: 28px; padding: 0 4px 0 10px;
    border-radius: 14px; background: var(--mw-bg-deep); color: var(--mw-header); font-size: 14px;
}
.mw-chip-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; transition: filter .15s ease; }
.mw-chips:not(:hover):not(:focus-within) .mw-chip-text { filter: blur(5px); }
.mw-chip-time { flex: 0 0 auto; color: var(--mw-muted); font-size: 12px; font-weight: 500; }
.mw-chip-x {
    display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; width: 20px; height: 20px;
    padding: 0; border: none; border-radius: 50%; background: transparent; color: var(--mw-muted); cursor: pointer;
}
.mw-chip-x:hover { color: var(--mw-header); background: var(--mw-hover); }
.mw-chip-x:focus-visible { outline: 2px solid var(--mw-focus); }
.mw-chip-x svg { width: 14px; height: 14px; }
.mw-error { margin: 8px 0 0; color: var(--mw-danger); font-size: 14px; line-height: 20px; }
.mw-new-name { margin-top: 8px; }
.mw-hint.mw-words-empty { margin-bottom: 8px; }
`;

module.exports = class MaskedWords {

    constructor(meta) {
        this.meta = meta;
        this.version = 0;
        this.rules = null;
        this.rulesVersion = -1;
        this.revealed = new Set();       // messages affichés d'un clic, pour cette session
        this.ranges = new Map();         // élément → plages masquées (mode « seulement le mot »)
        this.cache = new WeakMap();      // élément → empreinte du dernier traitement
        this.snapshot = null;            // sélection au moment du clic droit
        this.closeModal = null;
        this.refreshPanel = null;
        this.onMutations = this.onMutations.bind(this);
        this.mouseDown = null;           // position du dernier appui, pour reconnaître un glissé
        this.revealClickAt = 0;
        this.onClick = this.onClick.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onDblClick = this.onDblClick.bind(this);
        this.onContextMenu = this.onContextMenu.bind(this);
    }

    start() {
        this.loadSettings();
        BdApi.DOM.addStyle(STYLE_ID, discordKitCSS("mw") + PLUGIN_CSS);

        // Sans l'API Highlight, « seulement le mot » se replie sur le message entier
        if (typeof Highlight === "function" && globalThis.CSS?.highlights) {
            this.highlight = new Highlight();
            CSS.highlights.set(HIGHLIGHT_NAME, this.highlight);
        }

        // Traité dans le rappel même de l'observateur : le message est masqué avant
        // d'être peint, sans apparaître une fraction de seconde.
        this.observer = new MutationObserver(this.onMutations);
        this.observer.observe(document.body, { childList: true, subtree: true, characterData: true });
        document.addEventListener("mousedown", this.onMouseDown, true);
        document.addEventListener("click", this.onClick, true);
        window.addEventListener("dblclick", this.onDblClick, true);
        document.addEventListener("contextmenu", this.onContextMenu, true);

        this.patchMenu();
        this.patchNotifications();
        this.checkExpiry();
        this.expiryTimer = setInterval(() => this.checkExpiry(), 60000);
        this.scanAll();
    }

    stop() {
        this.observer?.disconnect();
        this.observer = null;
        document.removeEventListener("mousedown", this.onMouseDown, true);
        document.removeEventListener("click", this.onClick, true);
        window.removeEventListener("dblclick", this.onDblClick, true);
        document.removeEventListener("contextmenu", this.onContextMenu, true);
        clearInterval(this.expiryTimer);
        this.unpatchMenu?.();
        this.unpatchMenu = null;
        BdApi.Patcher.unpatchAll(DATA_KEY);

        for (const el of document.querySelectorAll(MARK_ATTRS.map(a => `[${a}]`).join(", "))) clearMarks(el);
        this.highlight?.clear();
        if (this.highlight) CSS.highlights.delete(HIGHLIGHT_NAME);
        this.highlight = null;
        this.ranges.clear();
        this.cache = new WeakMap();
        this.revealed.clear();
        this.snapshot = null;

        BdApi.DOM.removeStyle(STYLE_ID);
        this.closeModal?.();
        this.refreshPanel = null;
    }

    // ─── Réglages ────────────────────────────────────────────────────────────
    loadSettings() {
        const load = (key) => BdApi.Data.load(DATA_KEY, key);
        const now = Date.now();
        const ids = new Set();
        const lists = load("lists");
        const selectionListId = load("selectionListId");
        this.settings = {
            lists: Array.isArray(lists) ? lists.map(l => sanitizeList(l, now, ids)).filter(Boolean) : [],
            selectionListId: typeof selectionListId === "string" ? selectionListId : SELECTIONS_ID,
            maskMedia: load("maskMedia") !== false,
            maskNotifications: load("maskNotifications") !== false
        };
        if (!this.settings.lists.length) this.getSelectionList();
        // Depuis la 1.1.0, la liste « Sélections » cache seulement le texte choisi,
        // comme un spoiler, au lieu du message entier : réglage changé une seule fois.
        if (load("schema") !== 2) {
            const sel = this.settings.lists.find(l => l.id === SELECTIONS_ID);
            if (sel) {
                sel.mode = "word";
                this.save("lists");
            }
            BdApi.Data.save(DATA_KEY, "schema", 2);
        }
    }

    save(...keys) {
        for (const key of keys) BdApi.Data.save(DATA_KEY, key, this.settings[key]);
    }

    // Liste qui reçoit les sélections ; recréée si elle a disparu
    getSelectionList() {
        const { lists } = this.settings;
        let list = lists.find(l => l.id === this.settings.selectionListId)
            ?? lists.find(l => l.id === SELECTIONS_ID);
        if (!list) {
            list = this.createList(t("list.selections"), lists.some(l => l.id === SELECTIONS_ID) ? newId() : SELECTIONS_ID, "word");
        }
        if (this.settings.selectionListId !== list.id) {
            this.settings.selectionListId = list.id;
            this.save("selectionListId");
        }
        return list;
    }

    createList(name, id = newId(), mode = "message") {
        const list = { id, name: String(name).trim().slice(0, MAX_NAME) || t("list.new"), enabled: true, mode, durationMs: null, expiresAt: null, entries: [] };
        this.settings.lists.push(list);
        this.save("lists");
        return list;
    }

    // Ajoute (ou met à jour) un texte dans une liste, sans enregistrer.
    // Renvoie "added", "updated" ou "short".
    putEntry(list, text, expiresAt, min) {
        text = String(text).replace(/\s+/g, " ").trim().slice(0, MAX_TEXT);
        if (letterCount(text) < min) return "short";
        const key = entryKey(text);
        const existing = list.entries.find(e => entryKey(e.text) === key);
        if (existing) {
            existing.expiresAt = expiresAt;
            return "updated";
        }
        list.entries.push({ text, addedAt: Date.now(), expiresAt });
        return "added";
    }

    // Masquer la sélection : depuis le menu ou la fenêtre « Personnaliser »
    addSelection(list, text, ms, sourceId) {
        const now = Date.now();
        const result = this.putEntry(list, text, ms == null ? null : now + ms, MIN_SELECTION);
        if (result === "short") {
            BdApi.UI.showToast(t("toast.tooShort", MIN_SELECTION), { type: "error" });
            return false;
        }
        // Une liste éteinte ou expirée se rallume, sinon le texte ajouté ne masquerait rien
        if (isExpired(list, now)) {
            list.expiresAt = null;
            list.durationMs = null;
        }
        list.enabled = true;
        this.save("lists");
        if (sourceId) {
            this.revealed.delete(sourceId);
            // La sélection restée en place ne doit plus gêner (ni dévoiler le texte en surbrillance)
            globalThis.getSelection?.()?.removeAllRanges();
        }
        this.bump();
        const span = ms == null ? null : formatSpan(ms);
        BdApi.UI.showToast(t(result === "added" ? "toast.added" : "toast.updated", list.name, span), { type: "success" });
        return true;
    }

    // Retire les mots expirés et éteint les listes arrivées à échéance
    checkExpiry() {
        const now = Date.now();
        let changed = false;
        for (const list of this.settings.lists) {
            const before = list.entries.length;
            list.entries = list.entries.filter(e => !isExpired(e, now));
            if (list.entries.length !== before) changed = true;
            if (list.enabled && isExpired(list, now)) {
                list.enabled = false;
                changed = true;
                BdApi.UI.showToast(t("toast.expired", list.name), { type: "info" });
            }
        }
        if (!changed) return;
        this.save("lists");
        this.bump();
        this.refreshPanel?.();
    }

    getRules() {
        if (this.rulesVersion !== this.version) {
            this.rules = compileRules(this.settings.lists);
            this.rulesVersion = this.version;
        }
        return this.rules;
    }

    // Les listes ont changé : tout est réévalué
    bump() {
        this.version++;
        if (this.observer) this.scanAll();
    }

    // ─── Masquage dans la page ───────────────────────────────────────────────
    idOf(el) {
        return /^message-(?:content|accessories)-(\d+)$/.exec(el.id)?.[1] ?? null;
    }

    isPreview(el) {
        return !!el.closest(REPLY_SEL) || el.matches('[class*="repliedTextContent"]');
    }

    onMutations(records) {
        const targets = new Set();
        let removed = false;
        try {
            for (const r of records) {
                if (r.removedNodes.length) removed = true;
                const base = r.target.nodeType === 1 ? r.target : r.target.parentElement;
                const host = base?.closest?.(HOST_SEL);
                if (host) targets.add(host);
                for (const n of r.addedNodes) {
                    if (n.nodeType !== 1) continue;
                    if (n.matches(HOST_SEL)) targets.add(n);
                    for (const el of n.querySelectorAll(HOST_SEL)) targets.add(el);
                }
            }
            if (removed) this.pruneRanges();
        } catch (e) {
            console.error("[MaskedWords] observer:", e);
        }
        // Un message qui pose problème n'empêche pas de traiter les suivants
        const done = new Set();
        for (const el of targets) {
            if (!el.isConnected) continue;
            try {
                this.route(el, done);
            } catch (e) {
                console.error("[MaskedWords] message:", e);
            }
        }
    }

    scanAll() {
        const done = new Set();
        for (const el of document.querySelectorAll(HOST_SEL)) this.route(el, done);
    }

    rerouteId(id) {
        const done = new Set();
        for (const el of document.querySelectorAll(`[id="${CONTENT_PREFIX}${id}"], [id="${ACC_PREFIX}${id}"]`)) this.route(el, done);
    }

    // Texte et pièces jointes d'un même message sont évalués ensemble
    route(el, done) {
        const id = this.idOf(el);
        if (!id) return;
        if (this.isPreview(el)) {
            if (!done.has(el)) {
                done.add(el);
                this.processPreview(el, id);
            }
            return;
        }
        const scope = el.closest('[role="article"], li');
        const content = el.id.startsWith(CONTENT_PREFIX) ? el : scope?.querySelector(`[id="${CONTENT_PREFIX}${id}"]`) ?? null;
        const acc = el.id.startsWith(ACC_PREFIX) ? el : scope?.querySelector(`[id="${ACC_PREFIX}${id}"]`) ?? null;
        const anchor = content ?? acc;
        if (done.has(anchor)) return;
        done.add(anchor);
        this.processMain(content, acc, id);
    }

    processMain(content, acc, id) {
        const anchor = content ?? acc;
        const { text, nodes, parts } = collectText([content, acc]);
        const revealed = this.revealed.has(id);
        const media = !!acc && hasMedia(acc);
        const key = `${this.version}|${revealed}|${this.settings.maskMedia}|${media}|${getLang()}|${text}`;
        const cached = this.cache.get(anchor);
        if (cached?.key === key && cached.content === content && cached.acc === acc && this.rangesAlive(anchor)) {
            // Rien n'a changé, mais Discord a pu redessiner l'élément : les marques sont reposées
            this.applyMarks(cached.marks);
            return;
        }

        let contentMarks = {};
        let accMarks = {};
        let ranges = [];
        const v = revealed ? null : verdict(findMatches(text, this.getRules()));
        if (v) {
            const label = t("label", v.name);
            const contentPart = content ? parts.find(p => p.root === content) : null;
            const contentHasText = !!contentPart && /\S/.test(text.slice(contentPart.start, contentPart.end));
            const inAcc = (m) => !contentPart || m.start >= contentPart.end;
            const matchInAcc = v.matches.some(inAcc);
            const blur = { "data-mw-id": id, "data-mw-media": "", "data-mw-label": label };

            if (v.mode === "message" || !this.highlight) {
                if (contentHasText) contentMarks = { "data-mw-id": id, "data-mw-mask": "message", "data-mw-label": label };
                if (media && (this.settings.maskMedia || !contentHasText || matchInAcc)) accMarks = blur;
            } else {
                if (v.matches.some(m => !inAcc(m))) contentMarks = { "data-mw-id": id, "data-mw-mask": "word", "data-mw-label": label };
                if (media && this.settings.maskMedia) accMarks = blur;
                else if (matchInAcc) accMarks = { "data-mw-id": id };
                ranges = v.matches.map(m => makeRange(nodes, m.start, m.end)).filter(Boolean);
            }
        }

        const marks = [];
        if (content) marks.push([content, contentMarks]);
        if (acc) marks.push([acc, accMarks]);
        this.cache.set(anchor, { key, content, acc, marks });
        this.applyMarks(marks);
        this.applyRanges(anchor, ranges);
    }

    processPreview(el, id) {
        const { text, nodes } = collectText([el]);
        const revealed = this.revealed.has(id);
        const key = `${this.version}|${revealed}|${getLang()}|${text}`;
        const cached = this.cache.get(el);
        if (cached?.key === key && this.rangesAlive(el)) {
            this.applyMarks(cached.marks);
            return;
        }

        let marks = {};
        let ranges = [];
        const v = revealed ? null : verdict(findMatches(text, this.getRules()));
        if (v && (v.mode === "message" || !this.highlight)) {
            marks = { "data-mw-preview": "message", "data-mw-label": t("label", v.name) };
        } else if (v) {
            marks = { "data-mw-preview": "word" };
            ranges = v.matches.map(m => makeRange(nodes, m.start, m.end)).filter(Boolean);
        }
        this.cache.set(el, { key, marks: [[el, marks]] });
        this.applyMarks([[el, marks]]);
        this.applyRanges(el, ranges);
    }

    applyMarks(marks) {
        for (const [el, m] of marks) setMarks(el, m);
    }

    applyRanges(anchor, ranges) {
        for (const r of this.ranges.get(anchor) ?? []) this.highlight?.delete(r);
        if (ranges.length) {
            this.ranges.set(anchor, ranges);
            for (const r of ranges) this.highlight?.add(r);
        } else {
            this.ranges.delete(anchor);
        }
    }

    rangesAlive(anchor) {
        const ranges = this.ranges.get(anchor);
        return !ranges || ranges.every(r => r.startContainer.isConnected && r.endContainer.isConnected);
    }

    pruneRanges() {
        for (const [anchor, ranges] of this.ranges) {
            if (anchor.isConnected) continue;
            for (const r of ranges) this.highlight?.delete(r);
            this.ranges.delete(anchor);
        }
    }

    reveal(id) {
        if (!/^\d+$/.test(id)) return;
        this.revealed.add(id);
        this.rerouteId(id);
    }

    remask(id) {
        if (!/^\d+$/.test(id)) return;
        this.revealed.delete(id);
        this.rerouteId(id);
    }

    onMouseDown(e) {
        this.mouseDown = { x: e.clientX, y: e.clientY };
    }

    // Clic sur un message masqué : il s'affiche (pour cette session)
    onClick(e) {
        if (e.button !== 0) return;
        const host = e.target.closest?.("[data-mw-id]");
        if (!host || e.target.closest(REACTIONS_SEL)) return;
        // Un glissé sert à sélectionner du texte, pas à afficher le message
        const down = this.mouseDown;
        if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 4) return;
        // En mode « seulement le mot », seul un clic sur un mot caché l'affiche :
        // les liens et mentions du reste du message restent cliquables.
        const wholeBlock = host.getAttribute("data-mw-mask") === "message" || host.hasAttribute("data-mw-media");
        if (!wholeBlock && !this.hitsRange(host, e.clientX, e.clientY)) return;
        e.preventDefault();
        e.stopPropagation();
        this.revealClickAt = Date.now();
        this.reveal(host.getAttribute("data-mw-id"));
    }

    // Un double-clic pour afficher ne doit pas, en plus, ouvrir l'édition ou la
    // réponse (double-clic de Discord ou d'un autre plugin)
    onDblClick(e) {
        if (Date.now() - this.revealClickAt > 600) return;
        e.preventDefault();
        e.stopPropagation();
    }

    hitsRange(host, x, y) {
        for (const ranges of this.ranges.values()) {
            for (const r of ranges) {
                if (!host.contains(r.startContainer)) continue;
                for (const rect of r.getClientRects()) {
                    if (x >= rect.left - 2 && x <= rect.right + 2 && y >= rect.top - 2 && y <= rect.bottom + 2) return true;
                }
            }
        }
        return false;
    }

    // ─── Masquer la sélection ────────────────────────────────────────────────
    // Le menu de Discord ne connaît pas la sélection : on la note au clic droit.
    onContextMenu() {
        this.snapshot = null;
        try {
            const sel = window.getSelection();
            if (!sel || sel.isCollapsed || !sel.rangeCount) return;
            const range = sel.getRangeAt(0);
            const hostOf = (n) => (n.nodeType === 1 ? n : n.parentElement)?.closest?.(HOST_SEL) ?? null;
            const host = hostOf(range.startContainer);
            if (!host || host !== hostOf(range.endContainer) || this.isPreview(host)) return;
            const id = this.idOf(host);
            if (!id) return;
            const { text, nodes } = collectText([host]);
            const start = Math.max(0, offsetAt(nodes, range.startContainer, range.startOffset, false));
            const end = Math.min(text.length, offsetAt(nodes, range.endContainer, range.endOffset, true));
            if (end <= start) return;
            this.snapshot = { id, text: expandToWords(text, start, end), at: Date.now() };
        } catch (e) {
            console.error("[MaskedWords] selection:", e);
        }
    }

    menuItems(id) {
        const items = [];
        const snap = this.snapshot;
        if (snap && snap.id === id && Date.now() - snap.at < 60000) {
            const base = { id: "masked-words-hide", label: t("menu.hide"), icon: EyeOffIcon };
            if (letterCount(snap.text) < MIN_SELECTION) {
                items.push(BdApi.ContextMenu.buildItem({ ...base, type: "button", subtext: t("menu.tooShort", MIN_SELECTION), disabled: true }));
            } else if (snap.text.length > MAX_TEXT) {
                items.push(BdApi.ContextMenu.buildItem({ ...base, type: "button", subtext: t("menu.tooLong", MAX_TEXT), disabled: true }));
            } else {
                const list = this.getSelectionList();
                items.push(BdApi.ContextMenu.buildItem({
                    ...base,
                    type: "submenu",
                    subtext: t("menu.into", list.name),
                    items: [
                        ...DURATIONS.map(d => ({
                            type: "button",
                            id: `masked-words-${d.key}`,
                            label: t(`dur.${d.key}`),
                            action: () => this.addSelection(this.getSelectionList(), snap.text, d.ms, snap.id)
                        })),
                        { type: "separator" },
                        { type: "button", id: "masked-words-custom", label: t("menu.custom"), action: () => this.openModal(snap) }
                    ]
                }));
            }
        }
        if (this.revealed.has(id)) {
            items.push(BdApi.ContextMenu.buildItem({
                type: "button", id: "masked-words-remask", label: t("menu.remask"), icon: EyeOffIcon,
                action: () => this.remask(id)
            }));
        }
        return items;
    }

    patchMenu() {
        this.unpatchMenu = BdApi.ContextMenu.patch("message", (tree, props) => {
            try {
                const id = props?.message?.id;
                if (!id) return;
                const items = this.menuItems(String(id));
                if (!items.length) return;
                // Juste sous « Copier le texte » si on le trouve, sinon en bas du menu
                const group = BdApi.Utils.findInTree(tree,
                    x => Array.isArray(x) && x.some(c => c?.props?.id === "copy-text"),
                    { walkable: ["props", "children"] });
                if (group) {
                    group.splice(group.findIndex(c => c?.props?.id === "copy-text") + 1, 0, ...items);
                    return;
                }
                const children = tree?.props?.children;
                const extra = [BdApi.ContextMenu.buildItem({ type: "separator" }), ...items];
                if (Array.isArray(children)) children.push(...extra);
                else if (tree?.props) tree.props.children = [children, ...extra];
            } catch (e) {
                console.error("[MaskedWords] menu:", e);
            }
        });
    }

    // ─── Notifications du bureau ─────────────────────────────────────────────
    maskText(text) {
        const v = verdict(findMatches(text, this.getRules()));
        if (!v) return null;
        if (v.mode === "message") return t("label", v.name);
        const merged = [];
        for (const m of [...v.matches].sort((a, b) => a.start - b.start)) {
            const last = merged.at(-1);
            if (last && m.start <= last.end) last.end = Math.max(last.end, m.end);
            else merged.push({ start: m.start, end: m.end });
        }
        let out = "";
        let pos = 0;
        for (const m of merged) {
            out += text.slice(pos, m.start) + "•••••";
            pos = m.end;
        }
        return out + text.slice(pos);
    }

    patchNotifications() {
        const mod = BdApi.Webpack.getByKeys("showNotification", "requestPermission");
        if (!mod) return;
        // showNotification(icône, titre, texte, …) : seul le texte est remplacé
        BdApi.Patcher.before(DATA_KEY, mod, "showNotification", (_, args) => {
            try {
                if (!this.settings.maskNotifications || typeof args[2] !== "string") return;
                const masked = this.maskText(args[2]);
                if (masked !== null) args[2] = masked;
            } catch (e) {
                console.error("[MaskedWords] notification:", e);
            }
        });
    }

    // ─── Fenêtre « Personnaliser… » ──────────────────────────────────────────
    openModal(snap) {
        this.closeModal?.();
        const selList = this.getSelectionList();
        const options = this.settings.lists.map(l =>
            `<option value="${escapeHtml(l.id)}"${l.id === selList.id ? " selected" : ""}>${escapeHtml(l.name)}</option>`).join("");

        const backdrop = document.createElement("div");
        backdrop.className = "mw-ui mw-backdrop";
        backdrop.innerHTML = `
            <div class="mw-modal" role="dialog" aria-modal="true" aria-labelledby="mw-title">
                <div class="mw-modal-header">
                    <div>
                        <h2 class="mw-title" id="mw-title">${t("modal.title")}</h2>
                        <p class="mw-subtitle">${t("modal.subtitle")}</p>
                    </div>
                    <button type="button" class="mw-icon-btn mw-close" data-action="close" aria-label="${escapeHtml(t("modal.close"))}">${ICON_CLOSE}</button>
                </div>
                <div class="mw-modal-body">
                    <div class="mw-field">
                        <label class="mw-label" for="mw-text">${t("modal.text")}</label>
                        <input class="mw-input" id="mw-text" type="text" maxlength="${MAX_TEXT}" autocomplete="off" spellcheck="false">
                        <p class="mw-hint">${t("modal.textHint")}</p>
                        <p class="mw-error" role="alert" hidden></p>
                    </div>
                    <div class="mw-field">
                        <label class="mw-label" for="mw-list">${t("modal.list")}</label>
                        <select class="mw-select" id="mw-list">
                            ${options}
                            <option value="__new">${t("modal.newList")}</option>
                        </select>
                        <input class="mw-input mw-new-name" type="text" maxlength="${MAX_NAME}" placeholder="${escapeHtml(t("modal.newListName"))}" aria-label="${escapeHtml(t("modal.newListName"))}" hidden>
                    </div>
                    <div class="mw-field mw-picker">
                        <div class="mw-label">${t("modal.duration")}</div>
                        ${durationPickerHTML()}
                    </div>
                </div>
                <div class="mw-modal-footer">
                    <button type="button" class="mw-btn mw-btn-link" data-action="close">${t("modal.cancel")}</button>
                    <button type="button" class="mw-btn" data-action="confirm">${t("modal.confirm")}</button>
                </div>
            </div>
        `;

        // Un seul point de fermeture : retire la modale ET l'écouteur clavier
        const onKeyDown = (e) => {
            if (e.key === "Escape") close();
        };
        const close = () => {
            backdrop.remove();
            document.removeEventListener("keydown", onKeyDown, true);
            if (this.closeModal === close) this.closeModal = null;
        };
        this.closeModal = close;
        document.addEventListener("keydown", onKeyDown, true);

        // Ferme seulement si le clic a COMMENCÉ sur le fond
        let pressedOnBackdrop = false;
        backdrop.addEventListener("mousedown", (e) => { pressedOnBackdrop = e.target === backdrop; });
        backdrop.addEventListener("click", (e) => {
            if (pressedOnBackdrop && e.target === backdrop) close();
        });

        document.body.appendChild(backdrop);

        const textInput = backdrop.querySelector("#mw-text");
        const error = backdrop.querySelector(".mw-error");
        const select = backdrop.querySelector("#mw-list");
        const newName = backdrop.querySelector(".mw-new-name");
        const picker = bindDurationPicker(backdrop.querySelector(".mw-picker"), 2 * DAY);
        textInput.value = snap.text;

        const confirm = () => {
            const text = textInput.value.replace(/\s+/g, " ").trim();
            if (letterCount(text) < MIN_SELECTION) {
                error.textContent = t("toast.tooShort", MIN_SELECTION);
                error.hidden = false;
                textInput.focus();
                return;
            }
            const list = select.value === "__new"
                ? this.createList(newName.value || t("list.new"))
                : this.settings.lists.find(l => l.id === select.value) ?? this.getSelectionList();
            if (this.addSelection(list, text, picker.value(), snap.id)) close();
        };

        textInput.addEventListener("input", () => { error.hidden = true; });
        select.addEventListener("change", () => {
            newName.hidden = select.value !== "__new";
            if (!newName.hidden) newName.focus();
        });
        backdrop.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && e.target.matches("input")) {
                e.preventDefault();
                confirm();
            }
        });
        for (const btn of backdrop.querySelectorAll('[data-action="close"]')) btn.addEventListener("click", close);
        backdrop.querySelector('[data-action="confirm"]').addEventListener("click", confirm);

        textInput.focus();
        textInput.select();
    }

    // ─── Paramètres ──────────────────────────────────────────────────────────
    getSettingsPanel() {
        if (!this.settings) this.loadSettings();
        const panel = document.createElement("div");
        panel.className = "mw-ui mw-settings";
        const findList = (el) => this.settings.lists.find(l => l.id === el.closest("[data-list]")?.dataset.list);
        const changed = (...keys) => {
            this.save(...(keys.length ? keys : ["lists"]));
            this.bump();
        };

        const listCard = (list, now) => {
            const expired = isExpired(list, now);
            const status = !list.enabled ? (expired ? "expired" : "off") : "on";
            const pill = { on: "mw-pill mw-pill-success", off: "mw-pill", expired: "mw-pill mw-pill-warning" }[status];
            const until = !list.expiresAt ? t("settings.noEnd")
                : expired ? t("settings.expiredOn", formatDate(list.expiresAt)) : t("settings.until", formatDate(list.expiresAt));
            const chips = list.entries.map((e, i) => `
                <span class="mw-chip">
                    <span class="mw-chip-text" title="${escapeHtml(e.text)}">${escapeHtml(e.text)}</span>
                    ${e.expiresAt ? `<span class="mw-chip-time">${formatLeft(e.expiresAt - now)}</span>` : ""}
                    <button type="button" class="mw-chip-x" data-action="remove-word" data-index="${i}" aria-label="${escapeHtml(t("settings.removeWord"))}">${ICON_CLOSE}</button>
                </span>`).join("");
            return `
                <div class="mw-card" data-list="${escapeHtml(list.id)}">
                    <div class="mw-list-head">
                        <input class="mw-input mw-input-sm mw-list-name" data-field="name" type="text" maxlength="${MAX_NAME}" value="${escapeHtml(list.name)}" aria-label="${escapeHtml(t("settings.listName"))}">
                        <span class="${pill}">${t(`status.${status}`)}</span>
                        <input type="checkbox" class="mw-switch" data-field="enabled" aria-label="${escapeHtml(t("settings.enabled"))}"${list.enabled ? " checked" : ""}>
                        <button type="button" class="mw-icon-btn mw-icon-btn-danger" data-action="delete" aria-label="${escapeHtml(t("settings.delete"))}">${ICON_TRASH}</button>
                    </div>
                    <div class="mw-list-grid">
                        <div class="mw-label">${t("settings.mode")}</div>
                        <div class="mw-segment">
                            ${["message", "word"].map(m => `<button type="button" class="mw-btn mw-btn-sm mw-btn-outline mw-opt${list.mode === m ? " mw-active" : ""}" data-mode="${m}">${t(`mode.${m}`)}</button>`).join("")}
                        </div>
                        <div class="mw-label">${t("settings.duration")}</div>
                        <div class="mw-picker">
                            ${durationPickerHTML()}
                            <p class="mw-hint">${until}</p>
                        </div>
                    </div>
                    <div class="mw-words-head">
                        <div class="mw-label">${t("settings.words", list.entries.length)}</div>
                        ${list.entries.length ? `<span class="mw-hint mw-small">${t("settings.hoverHint")}</span>` : ""}
                    </div>
                    ${list.entries.length ? `<div class="mw-chips">${chips}</div>` : `<p class="mw-hint mw-words-empty">${t("settings.wordsEmpty")}</p>`}
                    <input class="mw-input mw-input-sm" data-field="add" type="text" autocomplete="off" spellcheck="false" placeholder="${escapeHtml(t("settings.addPlaceholder"))}" aria-label="${escapeHtml(t("settings.addPlaceholder"))}">
                </div>`;
        };

        // focus : { list, selector } pour retrouver le champ actif après le rendu
        const render = (focus) => {
            const now = Date.now();
            const selId = this.getSelectionList().id;
            panel.innerHTML = `
                <div class="mw-card">
                    <div class="mw-heading">${t("settings.howTitle")}</div>
                    <p class="mw-hint">${t("settings.how")}</p>
                    <p class="mw-hint">${t("settings.howSelect")}</p>
                    <p class="mw-hint">${t("settings.howWildcard")}</p>
                </div>
                <div class="mw-card">
                    <div class="mw-heading">${t("settings.optionsTitle")}</div>
                    <label class="mw-row" style="padding-top: 16px">
                        <div>
                            <div class="mw-row-title">${t("settings.media")}</div>
                            <div class="mw-row-desc">${t("settings.mediaDesc")}</div>
                        </div>
                        <input type="checkbox" class="mw-switch" data-opt="maskMedia"${this.settings.maskMedia ? " checked" : ""}>
                    </label>
                    <label class="mw-row">
                        <div>
                            <div class="mw-row-title">${t("settings.notif")}</div>
                            <div class="mw-row-desc">${t("settings.notifDesc")}</div>
                        </div>
                        <input type="checkbox" class="mw-switch" data-opt="maskNotifications"${this.settings.maskNotifications ? " checked" : ""}>
                    </label>
                    <div class="mw-row">
                        <div>
                            <div class="mw-row-title">${t("settings.selList")}</div>
                            <div class="mw-row-desc">${t("settings.selListDesc")}</div>
                        </div>
                        <select class="mw-select mw-input-sm" data-field="selection-list" aria-label="${escapeHtml(t("settings.selList"))}">
                            ${this.settings.lists.map(l => `<option value="${escapeHtml(l.id)}"${l.id === selId ? " selected" : ""}>${escapeHtml(l.name)}</option>`).join("")}
                        </select>
                    </div>
                </div>
                <div class="mw-lists-head">
                    <div class="mw-heading">${t("settings.listsTitle")}</div>
                    <button type="button" class="mw-btn mw-btn-sm" data-action="new-list">${t("settings.newList")}</button>
                </div>
                ${this.settings.lists.map(l => listCard(l, now)).join("")}
            `;

            for (const card of panel.querySelectorAll("[data-list]")) {
                const list = findList(card);
                bindDurationPicker(card.querySelector(".mw-picker"), list.durationMs, (ms) => {
                    list.durationMs = ms;
                    list.expiresAt = ms == null ? null : Date.now() + ms;
                    list.enabled = true;
                    changed();
                    const custom = ms != null && msToPicker(ms).key === "custom";
                    render({ list: list.id, selector: custom ? ".mw-custom-n" : ".mw-dur.mw-active" });
                });
            }

            if (focus) {
                const el = panel.querySelector(`[data-list="${CSS.escape(focus.list)}"] ${focus.selector}`);
                el?.focus();
                if (focus.select) el?.select?.();
            }
        };

        panel.addEventListener("change", (e) => {
            const el = e.target;
            if (el.dataset.opt) {
                this.settings[el.dataset.opt] = el.checked;
                changed(el.dataset.opt);
                return;
            }
            const field = el.dataset.field;
            if (field === "selection-list") {
                this.settings.selectionListId = el.value;
                this.save("selectionListId");
                return;
            }
            const list = findList(el);
            if (!list) return;
            if (field === "name") {
                // Pas de nouveau rendu ici : un clic ailleurs serait perdu
                const name = el.value.trim().slice(0, MAX_NAME);
                if (!name) { el.value = list.name; return; }
                list.name = name;
                for (const o of panel.querySelectorAll(`option[value="${CSS.escape(list.id)}"]`)) o.textContent = name;
                changed();
            } else if (field === "enabled") {
                list.enabled = el.checked;
                // Rallumer une liste expirée relance sa durée
                if (list.enabled && isExpired(list, Date.now())) {
                    list.expiresAt = list.durationMs ? Date.now() + list.durationMs : null;
                }
                changed();
                render({ list: list.id, selector: '[data-field="enabled"]' });
            }
        });

        panel.addEventListener("click", (e) => {
            const btn = e.target.closest("button");
            if (!btn) return;
            if (btn.dataset.action === "new-list") {
                const list = this.createList(t("list.new"));
                this.bump();
                render({ list: list.id, selector: '[data-field="name"]', select: true });
                return;
            }
            const list = findList(btn);
            if (!list) return;
            if (btn.dataset.mode) {
                list.mode = btn.dataset.mode;
                changed();
                render({ list: list.id, selector: `[data-mode="${list.mode}"]` });
            } else if (btn.dataset.action === "remove-word") {
                list.entries.splice(Number(btn.dataset.index), 1);
                changed();
                render({ list: list.id, selector: '[data-field="add"]' });
            } else if (btn.dataset.action === "delete") {
                BdApi.UI.showConfirmationModal(t("settings.deleteTitle"), t("settings.deleteBody", list.name, list.entries.length), {
                    danger: true,
                    confirmText: t("settings.deleteConfirm"),
                    cancelText: t("settings.cancel"),
                    onConfirm: () => {
                        this.settings.lists = this.settings.lists.filter(l => l !== list);
                        if (this.settings.selectionListId === list.id && this.settings.lists.length) {
                            this.settings.selectionListId = this.settings.lists[0].id;
                            this.save("selectionListId");
                        }
                        changed();
                        render();
                    }
                });
            }
        });

        panel.addEventListener("keydown", (e) => {
            if (e.key !== "Enter" || e.target.dataset.field !== "add") return;
            e.preventDefault();
            const list = findList(e.target);
            if (!list) return;
            let added = 0;
            let short = 0;
            for (const word of e.target.value.split(/[,\n]/)) {
                if (!word.trim()) continue;
                const result = this.putEntry(list, word, null, MIN_WORD);
                if (result === "short") short++;
                else added++;
            }
            if (short) BdApi.UI.showToast(t("toast.tooShort", MIN_WORD), { type: "error" });
            if (!added) return;
            changed();
            render({ list: list.id, selector: '[data-field="add"]' });
        });

        render();
        this.refreshPanel = () => {
            if (panel.isConnected && !panel.contains(document.activeElement)) render();
        };
        return panel;
    }
};
