/**
 * @name BetterDMs
 * @author AaronL2L
 * @version 1.1.0
 * @description Shows the last message of each conversation in your DM list, like on mobile: who wrote it, when, and who is typing. English and French.
 * @invite HdXp7sWRY3
 * @website https://valientebot.xyz
 * @source https://github.com/AaronL2L/BetterDiscordPlugins/tree/main/BetterDMs
 * @updateUrl https://raw.githubusercontent.com/AaronL2L/BetterDiscordPlugins/main/BetterDMs/BetterDMs.plugin.js
 */
'use strict';

const DATA_KEY = "BetterDMs";
const STYLE_ID = "BetterDMs-styles";
const DEFAULTS = { showLastMessage: true, preferActivity: false, showTime: true, showTyping: true };

// Aperçus des MP : la même route que l'overlay de Discord, par lots de 30 au plus
const PREVIEWS_URL = "/channels/preload-messages";
const BATCH_SIZE = 30;
const FETCH_DELAY = 100;
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000;
const DISCORD_EPOCH = 1420070400000n;
const VOICE_MESSAGE_FLAG = 1 << 13;
const MessageTypes = { RECIPIENT_ADD: 1, RECIPIENT_REMOVE: 2, CALL: 3, CHANNEL_NAME_CHANGE: 4, CHANNEL_ICON_CHANGE: 5, CHANNEL_PINNED_MESSAGE: 6 };

const React = BdApi.React;
const h = React.createElement;

// Stores et modules de Discord : cherchés une seule fois, puis gardés en mémoire
const found = {};
const cached = (key, find) => found[key] || (found[key] = find());
const store = (name) => cached(name, () => BdApi.Webpack.getStore(name));

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
        "you": "You",
        "typing": "Typing…",
        "typingName": (name) => `${name} is typing…`,
        "blocked": "Blocked message",
        "ignored": "Ignored message",
        "image": (n) => plural(n, "Image", `${n} images`),
        "video": (n) => plural(n, "Video", `${n} videos`),
        "voice": "Voice message",
        "file": (name, n) => plural(n, `File: ${name}`, `${n} files`),
        "sticker": (name) => `Sticker: ${name}`,
        "poll": (question) => `Poll: ${question}`,
        "embed": "Embed",
        "forwarded": "Forwarded message",
        "message": "Message",
        "call": "Call",
        "missedCall": "Missed call",
        "added": (a, b) => `${a} added ${b} to the group`,
        "left": (a) => `${a} left the group`,
        "removed": (a, b) => `${a} removed ${b} from the group`,
        "renamed": (a, name) => `${a} renamed the group: ${name}`,
        "icon": (a) => `${a} changed the group icon`,
        "pinned": (a) => `${a} pinned a message`,
        "someone": "Someone",
        "time.now": "now",
        "time.min": (n) => `${n} min`,
        "time.yesterday": "Yesterday",
        "toast.missing": "BetterDMs: part of Discord changed, the DM list can't be updated. Wait for a plugin update.",
        "settings.title": "DM list",
        "settings.lastMessage": "Show the last message",
        "settings.lastMessageDesc": "Under each name, like on mobile. In a group, the author's name comes first.",
        "settings.activity": "Activity first",
        "settings.activityDesc": "When a friend is playing or listening to something, show that instead of the last message.",
        "settings.time": "Show the time",
        "settings.timeDesc": "When the last message was sent: \"5 min\", \"14:32\", \"Yesterday\"…",
        "settings.typing": "Show who is typing",
        "settings.typingDesc": "Replaces the last message while someone is writing.",
        "settings.maskedWords": "MaskedWords is on: the words you hide are hidden in the previews too."
    },
    fr: {
        "you": "Toi",
        "typing": "Écrit…",
        "typingName": (name) => `${name} écrit…`,
        "blocked": "Message bloqué",
        "ignored": "Message ignoré",
        "image": (n) => plural(n, "Image", `${n} images`),
        "video": (n) => plural(n, "Vidéo", `${n} vidéos`),
        "voice": "Message vocal",
        "file": (name, n) => plural(n, `Fichier : ${name}`, `${n} fichiers`),
        "sticker": (name) => `Autocollant : ${name}`,
        "poll": (question) => `Sondage : ${question}`,
        "embed": "Intégration",
        "forwarded": "Message transféré",
        "message": "Message",
        "call": "Appel",
        "missedCall": "Appel manqué",
        "added": (a, b) => `${a} a ajouté ${b} au groupe`,
        "left": (a) => `${a} a quitté le groupe`,
        "removed": (a, b) => `${a} a retiré ${b} du groupe`,
        "renamed": (a, name) => `${a} a renommé le groupe : ${name}`,
        "icon": (a) => `${a} a changé l'icône du groupe`,
        "pinned": (a) => `${a} a épinglé un message`,
        "someone": "Quelqu'un",
        "time.now": "à l'instant",
        "time.min": (n) => `${n} min`,
        "time.yesterday": "Hier",
        "toast.missing": "BetterDMs : une partie de Discord a changé, la liste des MP ne peut pas être modifiée. Attends une mise à jour du plugin.",
        "settings.title": "Liste des MP",
        "settings.lastMessage": "Afficher le dernier message",
        "settings.lastMessageDesc": "Sous chaque nom, comme sur mobile. Dans un groupe, le nom de l'auteur vient en premier.",
        "settings.activity": "Activité d'abord",
        "settings.activityDesc": "Quand un ami joue ou écoute quelque chose, l'afficher à la place du dernier message.",
        "settings.time": "Afficher l'heure",
        "settings.timeDesc": "Quand le dernier message a été envoyé : « 5 min », « 14:32 », « Hier »…",
        "settings.typing": "Afficher qui écrit",
        "settings.typingDesc": "Remplace le dernier message pendant que quelqu'un écrit.",
        "settings.maskedWords": "MaskedWords est activé : les mots que tu caches sont aussi cachés dans les aperçus."
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

const PLUGIN_CSS = `
.bdm-preview { display: flex; align-items: center; gap: 6px; box-sizing: border-box; width: 100%; min-width: 0; padding-right: 4px; font-size: 12px; font-weight: 500; line-height: 16px; }
.bdm-text { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bdm-text .emoji { width: 1.25em; height: 1.25em; vertical-align: -.3em; }
.bdm-author { font-weight: 600; }
.bdm-system { font-style: italic; }
.bdm-unread .bdm-text { color: var(--text-default, var(--text-normal, #dbdee1)); font-weight: 600; }
.bdm-time { flex: 0 0 auto; white-space: nowrap; font-size: 11px; opacity: .8; }
.bdm-unread .bdm-time { color: var(--text-default, var(--text-normal, #dbdee1)); opacity: 1; }
li:hover .bdm-time, li:focus-within .bdm-time { visibility: hidden; }
.bdm-settings { display: flex; flex-direction: column; gap: 16px; }
label.bdm-row { cursor: pointer; }
`;

// ─── Discord ─────────────────────────────────────────────────────────────────
// Recherches par chaînes ou par clés, jamais par les lettres minifiées, qui
// changent à chaque version de Discord.
const getRowModule = () => cached("row", () => {
    const mod = BdApi.Webpack.getModule(BdApi.Webpack.Filters.bySource("PrivateChannel.renderAvatar"));
    // La ligne « complète » (statut, activité, frappe) ; elle affiche la ligne de base
    const key = mod && Object.keys(mod).find(k => typeof mod[k] === "function" && String(mod[k]).includes("getAnyStreamForUser"));
    return key ? { mod, key } : null;
});
const getPreviewStore = () => cached("previews", () => BdApi.Webpack.getModule(
    m => typeof m?.isLocalFetchNeeded === "function" && typeof m?.isLatest === "function" && typeof m?.message === "function",
    { searchExports: true }
));
const getRestAPI = () => cached("rest", () => BdApi.Webpack.getModule(
    m => typeof m === "object" && typeof m?.get === "function" && typeof m?.post === "function" && typeof m?.del === "function",
    { searchExports: true }
));
// Le répartiteur d'actions de Discord : chaque magasin en garde une référence
const getDispatcher = () => cached("dispatcher", () => {
    const dispatcher = store("UserStore")?._dispatcher ?? BdApi.Webpack.getByKeys("dispatch", "subscribe");
    return typeof dispatcher?.dispatch === "function" && typeof dispatcher.subscribe === "function" ? dispatcher : null;
});
const getUseStateFromStores = () => cached("useStateFromStores", () => BdApi.Hooks?.useStateFromStores
    ?? BdApi.Webpack.getModule(BdApi.Webpack.Filters.byStrings("useStateFromStores"), { searchExports: true }));
// Moteur de mise en forme des messages (celui des réponses : emojis, mentions, spoilers…)
const getMarkup = () => cached("markup", () => {
    const mod = BdApi.Webpack.getModule(BdApi.Webpack.Filters.bySource("hideSimpleEmbedContent"));
    return mod && Object.values(mod).find(f => typeof f === "function" && String(f).includes("parseInlineReply"));
});

// Discord attend d'être connecté pour demander ses aperçus ; inconnu = connecté
const isConnected = () => store("GatewayConnectionStore")?.isConnected?.() !== false;
const getLocale = () => store("LocaleStore")?.locale || document.documentElement.lang || undefined;
const messageTime = (id) => Number((BigInt(id) >> 22n) + DISCORD_EPOCH);

// Surnom d'ami d'abord, puis nom d'affichage, puis nom d'utilisateur
const userName = (user) => {
    if (!user) return t("someone");
    return store("RelationshipStore")?.getNickname?.(user.id)
        || user.globalName || user.global_name || user.username || t("someone");
};

// "à l'instant", "5 min", "14:32", "Hier", "lun.", "3 mars", "3 mars 2025"
const formatTime = (ms) => {
    const diff = Date.now() - ms;
    if (diff < 60e3) return t("time.now");
    if (diff < 3600e3) return t("time.min", Math.floor(diff / 60e3));
    const date = new Date(ms);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const locale = getLocale();
    if (date >= today) return date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
    const dayMs = 24 * 3600e3;
    if (date >= today - dayMs) return t("time.yesterday");
    if (date >= today - 6 * dayMs) return date.toLocaleDateString(locale, { weekday: "short" });
    if (date.getFullYear() === today.getFullYear()) return date.toLocaleDateString(locale, { day: "numeric", month: "short" });
    return date.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
};

// Une seule horloge partagée par toutes les lignes, pour « 5 min » → « 6 min »
const clock = {
    listeners: new Set(),
    timer: null,
    subscribe(fn) {
        this.listeners.add(fn);
        this.timer ??= setInterval(() => this.listeners.forEach(l => l()), 30e3);
        return () => {
            this.listeners.delete(fn);
            if (this.listeners.size === 0) {
                clearInterval(this.timer);
                this.timer = null;
            }
        };
    }
};
const useClock = () => {
    const [, setTick] = React.useState(0);
    React.useEffect(() => clock.subscribe(() => setTick(n => n + 1)), []);
};

// Ce que montre un message sans texte, ou un message système de groupe
const describeMessage = (message, channel) => {
    const author = userName(message.author);
    const mentioned = () => {
        const id = message.mentions?.[0];
        const user = typeof id === "string" ? store("UserStore")?.getUser?.(id) : id;
        return userName(user);
    };
    switch (message.type) {
        case MessageTypes.RECIPIENT_ADD: return t("added", author, mentioned());
        case MessageTypes.RECIPIENT_REMOVE: {
            const id = message.mentions?.[0];
            const removedId = typeof id === "string" ? id : id?.id;
            return removedId == null || removedId === message.author?.id ? t("left", author) : t("removed", author, mentioned());
        }
        case MessageTypes.CALL: {
            const me = store("UserStore")?.getCurrentUser?.()?.id;
            const joined = message.call?.participants?.includes?.(me);
            return message.author?.id !== me && !joined ? t("missedCall") : t("call");
        }
        case MessageTypes.CHANNEL_NAME_CHANGE: return t("renamed", author, message.content);
        case MessageTypes.CHANNEL_ICON_CHANGE: return t("icon", author);
        case MessageTypes.CHANNEL_PINNED_MESSAGE: return t("pinned", author);
    }
    if ((message.flags & VOICE_MESSAGE_FLAG) !== 0) return t("voice");
    if (message.messageSnapshots?.length) return t("forwarded");
    const files = message.attachments ?? [];
    if (files.length) {
        const kind = (a) => String(a.content_type ?? a.contentType ?? "").split("/")[0];
        if (files.every(a => kind(a) === "image")) return t("image", files.length);
        if (files.every(a => kind(a) === "video")) return t("video", files.length);
        return t("file", files[0].filename, files.length);
    }
    if (message.stickerItems?.length || message.sticker_items?.length) {
        return t("sticker", (message.stickerItems ?? message.sticker_items)[0].name);
    }
    if (message.poll) return t("poll", message.poll.question?.text ?? "");
    if (message.embeds?.length) return t("embed");
    return t("message");
};
const SYSTEM_TYPES = new Set(Object.values(MessageTypes));

// Quand la liste est plus étroite que ses lignes, la fin de la ligne passe sous le bord :
// on rentre l'aperçu d'autant pour que l'heure reste entière.
function fitLine(el) {
    if (!el?.isConnected) return;
    const { right, width } = el.getBoundingClientRect();
    if (!width) return;
    let edge = Infinity;
    for (let node = el.parentElement; node && node !== document.body; node = node.parentElement) {
        const style = getComputedStyle(node);
        if (style.overflowX === "visible") continue;
        edge = Math.min(edge, node.getBoundingClientRect().left + node.clientLeft + node.clientWidth);
        if (style.overflowY === "auto" || style.overflowY === "scroll") break;
    }
    el.style.paddingRight = right > edge ? `${Math.ceil(right - edge) + 4}px` : "";
}

// ─── Ligne sous le nom ───────────────────────────────────────────────────────
function PreviewLine({ plugin, channel, fallback, isTyping }) {
    const useStateFromStores = getUseStateFromStores();
    const PreviewStore = getPreviewStore();
    const ReadStateStore = store("ReadStateStore");
    const RelationshipStore = store("RelationshipStore");
    const TypingStore = store("TypingStore");
    const UserStore = store("UserStore");
    const settings = plugin.settings;
    const isGroup = channel.isMultiUserDM();

    const message = useStateFromStores([PreviewStore], () => PreviewStore.message(null, channel.id), [channel.id]);
    const lastId = useStateFromStores([ReadStateStore], () => ReadStateStore?.lastMessageId?.(channel.id) ?? null, [channel.id]);
    const unread = useStateFromStores([ReadStateStore], () => !!ReadStateStore?.hasUnread?.(channel.id), [channel.id]);
    const authorId = message?.author?.id ?? null;
    const relation = useStateFromStores([RelationshipStore], () => {
        if (authorId == null || !RelationshipStore) return null;
        if (RelationshipStore.isBlocked?.(authorId)) return "blocked";
        if (RelationshipStore.isIgnored?.(authorId)) return "ignored";
        return null;
    }, [authorId]);
    // Dans un groupe : le premier qui écrit (hors toi)
    const typerId = useStateFromStores([TypingStore], () => {
        if (!isGroup || !isTyping || !TypingStore) return null;
        const me = UserStore?.getCurrentUser?.()?.id;
        return Object.keys(TypingStore.getTypingUsers?.(channel.id) ?? {}).find(id => id !== me) ?? null;
    }, [channel.id, isGroup, isTyping]);
    useClock();
    const ref = React.useRef(null);
    React.useLayoutEffect(() => fitLine(ref.current));

    React.useEffect(() => plugin.track(channel.id), [channel.id]);
    React.useEffect(() => {
        if (settings.showLastMessage) plugin.want(channel.id);
    }, [channel.id, lastId, message?.id, settings.showLastMessage]);

    const line = (className, children, time) => h("div", { ref, className: `bdm-preview${unread ? " bdm-unread" : ""}` },
        h("span", { className: `bdm-text${className ? ` ${className}` : ""}` }, children),
        time != null && settings.showTime
            ? h("span", { className: "bdm-time", title: new Date(time).toLocaleString(getLocale()) }, formatTime(time))
            : null
    );

    if (settings.showTyping && isTyping) {
        const typer = typerId ? userName(UserStore?.getUser?.(typerId)) : null;
        return line("bdm-system", typer ? t("typingName", typer) : t("typing"), null);
    }
    if (!settings.showLastMessage || !message) return fallback ?? null;
    if (settings.preferActivity && !isGroup && fallback != null) return fallback;

    const time = messageTime(message.id);
    if (relation) return line("bdm-system", t(relation), time);

    const isMine = authorId != null && authorId === UserStore?.getCurrentUser?.()?.id;
    const isSystem = SYSTEM_TYPES.has(message.type);
    const prefix = isSystem ? null
        : isMine ? t("you")
        : isGroup ? userName(message.author)
        : null;
    const withPrefix = (body) => prefix ? [h("span", { key: "a", className: "bdm-author" }, `${prefix}${getLang() === "fr" ? " : " : ": "}`), body] : body;

    const text = isSystem ? "" : String(message.content ?? "");
    if (text.trim()) {
        // MaskedWords : le texte masqué remplace l'aperçu mis en forme
        const masked = plugin.maskText(text);
        if (masked != null) return line(null, withPrefix(h("span", { key: "b" }, masked.replace(/\s+/g, " "))), time);
        let rendered = null;
        try {
            rendered = getMarkup()?.(message, { formatInline: true, noStyleAndInteraction: true })?.content ?? null;
        } catch (e) {
            rendered = null;
        }
        return line(null, withPrefix(h("span", { key: "b" }, rendered ?? text.replace(/\s+/g, " "))), time);
    }
    return line("bdm-system", withPrefix(h("span", { key: "b" }, describeMessage(message, channel))), time);
}

module.exports = class BetterDMs {

    constructor(meta) {
        this.meta = meta;
        this.running = false;
        this.wrappers = new WeakMap();
        this.pending = new Set();
        this.shown = new Set(); // salons des lignes affichées
        this.requested = new Map(); // salon → dernier message déjà demandé
        this.flushTimer = null;
        this.fetching = false;
        this.onConnectionOpen = this.onConnectionOpen.bind(this);
        this.onMessageDelete = this.onMessageDelete.bind(this);
    }

    start() {
        this.running = true;
        this.loadSettings();
        BdApi.DOM.addStyle(STYLE_ID, discordKitCSS("bdm") + PLUGIN_CSS);

        const row = getRowModule();
        const stores = ["ReadStateStore", "RelationshipStore", "TypingStore", "UserStore"];
        if (!row || !getPreviewStore() || !getRestAPI() || !getDispatcher() || !getUseStateFromStores() || !stores.every(store)) {
            BdApi.UI.showToast(t("toast.missing"), { type: "error" });
            return;
        }

        this.Dispatcher = getDispatcher();
        this.Dispatcher.subscribe("CONNECTION_OPEN", this.onConnectionOpen);
        this.Dispatcher.subscribe("MESSAGE_DELETE", this.onMessageDelete);

        // La ligne complète renvoie la ligne de base : on remplace celle-ci par
        // une version qui ajoute l'aperçu sous le nom.
        BdApi.Patcher.after(DATA_KEY, row.mod, row.key, (_, [props], ret) => {
            if (!this.running || typeof ret?.type !== "function") return;
            ret.type = this.getRowWrapper(ret.type);
        });
        this.refreshList();
    }

    stop() {
        this.running = false;
        BdApi.Patcher.unpatchAll(DATA_KEY);
        this.Dispatcher?.unsubscribe("CONNECTION_OPEN", this.onConnectionOpen);
        this.Dispatcher?.unsubscribe("MESSAGE_DELETE", this.onMessageDelete);
        this.Dispatcher = null;
        clearTimeout(this.flushTimer);
        this.flushTimer = null;
        this.pending.clear();
        this.shown.clear();
        this.requested.clear();
        this.refreshList();
        BdApi.DOM.removeStyle(STYLE_ID);
    }

    // ─── Réglages ────────────────────────────────────────────────────────────
    loadSettings() {
        this.settings = {};
        for (const [key, value] of Object.entries(DEFAULTS)) {
            const saved = BdApi.Data.load(DATA_KEY, key);
            this.settings[key] = typeof saved === "boolean" ? saved : value;
        }
    }

    save(...keys) {
        for (const key of keys) BdApi.Data.save(DATA_KEY, key, this.settings[key]);
    }

    // ─── Ligne de MP ─────────────────────────────────────────────────────────
    getRowWrapper(Original) {
        let Wrapped = this.wrappers.get(Original);
        if (!Wrapped) {
            const plugin = this;
            Wrapped = function BetterDMsRow(props) {
                const ret = Original(props);
                if (!plugin.running) return ret;
                try {
                    return plugin.addPreview(ret, props);
                } catch (e) {
                    console.error("[BetterDMs] row:", e);
                    return ret;
                }
            };
            this.wrappers.set(Original, Wrapped);
        }
        return Wrapped;
    }

    // La ligne de base rend une fonction ; dans ce qu'elle renvoie, le bloc
    // avatar + nom a une prop « subText » (l'activité, ou « N membres »).
    addPreview(ret, props) {
        const render = ret?.props?.children;
        if (typeof render !== "function" || !props?.channel) return ret;
        return React.cloneElement(ret, {
            children: (...args) => {
                const tree = render(...args);
                try {
                    const block = BdApi.Utils.findInTree(tree,
                        n => n?.props != null && typeof n.props === "object" && "subText" in n.props && "avatar" in n.props,
                        { walkable: ["props", "children"] });
                    if (block) {
                        block.props.subText = h(PreviewLine, {
                            plugin: this,
                            channel: props.channel,
                            fallback: block.props.subText,
                            isTyping: !!props.isTyping
                        });
                    }
                } catch (e) {
                    console.error("[BetterDMs] preview:", e);
                }
                return tree;
            }
        });
    }

    // Redessine la liste des MP pour appliquer (ou retirer) les aperçus tout de suite
    refreshList() {
        try {
            const link = document.querySelector('a[href^="/channels/@me/"]');
            for (let fiber = link && BdApi.ReactUtils.getInternalInstance(link); fiber; fiber = fiber.return) {
                if (typeof fiber.stateNode?.renderDM === "function") {
                    fiber.stateNode.forceUpdate();
                    return;
                }
            }
        } catch (e) {
            console.error("[BetterDMs] refresh:", e);
        }
    }

    // ─── Aperçus ─────────────────────────────────────────────────────────────
    // Discord garde déjà le dernier message de chaque MP qu'il a vu passer. Pour
    // les autres, on lui demande les aperçus comme le fait son overlay, et on
    // les range dans son propre magasin.
    want(channelId) {
        if (!this.running || !this.settings.showLastMessage) return;
        if (getPreviewStore()?.isLatest(null, channelId)) return;
        const lastId = store("ReadStateStore")?.lastMessageId?.(channelId) ?? null;
        if (lastId == null || this.requested.get(channelId) === lastId) return;
        this.requested.set(channelId, lastId);
        this.pending.add(channelId);
        clearTimeout(this.flushTimer);
        this.flushTimer = setTimeout(() => this.flush(), FETCH_DELAY);
    }

    // Lignes affichées : à chaque connexion, on redemande leurs aperçus
    track(channelId) {
        this.shown.add(channelId);
        return () => this.shown.delete(channelId);
    }

    async flush() {
        if (this.fetching) return;
        this.fetching = true;
        let failures = 0;
        try {
            // Hors connexion, la file attend la connexion
            while (this.running && this.pending.size > 0 && isConnected()) {
                const ids = [...this.pending].slice(0, BATCH_SIZE);
                ids.forEach(id => this.pending.delete(id));
                let messages;
                try {
                    const res = await getRestAPI().post({ url: PREVIEWS_URL, body: { channel_ids: ids }, rejectWithError: false });
                    if (res?.ok === false) throw res;
                    messages = Array.isArray(res?.body) ? res.body : [];
                } catch (err) {
                    if (!this.running) break;
                    const limited = err?.status === 429;
                    if (limited || ++failures <= MAX_RETRIES) {
                        ids.forEach(id => this.pending.add(id));
                        await new Promise(r => setTimeout(r, limited ? (err.body?.retry_after ?? 2) * 1000 + 500 : RETRY_DELAY * failures));
                        continue;
                    }
                    // Échec : ces salons seront redemandés à la prochaine connexion
                    ids.forEach(id => this.requested.delete(id));
                    console.error("[BetterDMs] previews:", err);
                    break;
                }
                failures = 0;
                if (!this.running) break;
                this.Dispatcher?.dispatch({ type: "MESSAGE_PREVIEWS_LOADED", guildId: null, messages });
            }
        } finally {
            this.fetching = false;
        }
        // Une reprise de connexion n'envoie pas toujours CONNECTION_OPEN
        if (this.running && this.pending.size > 0) {
            clearTimeout(this.flushTimer);
            this.flushTimer = setTimeout(() => this.flush(), RETRY_DELAY);
        }
    }

    onConnectionOpen() {
        // Nouvelle connexion : Discord considère les aperçus comme périmés. On
        // redemande ceux des lignes affichées une fois que ses magasins l'ont
        // traitée, y compris ceux demandés avant la connexion.
        this.requested.clear();
        this.pending.clear();
        setTimeout(() => this.shown.forEach(id => this.want(id)), 0);
    }

    onMessageDelete({ channelId }) {
        // Si c'était le dernier message, il faudra redemander le précédent
        if (channelId) this.requested.delete(channelId);
    }

    // ─── MaskedWords ─────────────────────────────────────────────────────────
    maskText(text) {
        try {
            if (!BdApi.Plugins.isEnabled("MaskedWords")) return null;
            const masked = BdApi.Plugins.get("MaskedWords")?.instance?.maskText?.(text);
            return typeof masked === "string" ? masked : null;
        } catch (e) {
            return null;
        }
    }

    // ─── Panneau de réglages ─────────────────────────────────────────────────
    getSettingsPanel() {
        if (!this.settings) this.loadSettings();
        const row = (key, title, desc) => `
            <label class="bdm-row">
                <div>
                    <div class="bdm-row-title">${t(title)}</div>
                    <div class="bdm-row-desc">${t(desc)}</div>
                </div>
                <input type="checkbox" class="bdm-switch" data-key="${key}"${this.settings[key] ? " checked" : ""}>
            </label>`;

        const panel = document.createElement("div");
        panel.className = "bdm-ui bdm-settings";
        panel.innerHTML = `
            <div class="bdm-card">
                <div class="bdm-heading">${t("settings.title")}</div>
                ${row("showLastMessage", "settings.lastMessage", "settings.lastMessageDesc")}
                ${row("showTime", "settings.time", "settings.timeDesc")}
                ${row("showTyping", "settings.typing", "settings.typingDesc")}
                ${row("preferActivity", "settings.activity", "settings.activityDesc")}
            </div>
            ${BdApi.Plugins.isEnabled("MaskedWords") ? `<div class="bdm-notice">${t("settings.maskedWords")}</div>` : ""}
        `;

        const sync = () => {
            for (const key of ["showTime", "preferActivity"]) {
                panel.querySelector(`[data-key="${key}"]`).disabled = !this.settings.showLastMessage;
            }
        };
        panel.addEventListener("change", (e) => {
            const key = e.target?.dataset?.key;
            if (!key) return;
            this.settings[key] = e.target.checked;
            this.save(key);
            sync();
            this.refreshList();
        });
        sync();

        return panel;
    }
};
