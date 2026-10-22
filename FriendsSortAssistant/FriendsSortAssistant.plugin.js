/**
 * @name FriendsSortAssistant
 * @author AaronL2L
 * @version 1.0.1
 * @description Helps you clean up your friends list by suggesting inactive contacts, recent ones, or those with no shared servers. English and French.
 * @invite HdXp7sWRY3
 * @website https://valientebot.xyz
 * @source https://github.com/AaronL2L/BetterDiscordPlugins/tree/main/FriendsSortAssistant
 * @updateUrl https://raw.githubusercontent.com/AaronL2L/BetterDiscordPlugins/main/FriendsSortAssistant/FriendsSortAssistant.plugin.js
 */

const PENDING_DELAY = 5;
const NO_DM_ONLY = 999999;

const STYLE_ID = "FriendsSortAssistant-styles";

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
        "tab.button": "Sort friends",
        "status.online": "Online",
        "status.idle": "Idle",
        "status.dnd": "Do Not Disturb",
        "status.offline": "Offline",
        "reason.noDm": "No direct messages",
        "reason.noDmHint": "No messages found in your DMs with this person. A DM you closed isn't detected.",
        "reason.inactive": (m) => `Inactive for ${m} ${plural(m, "month", "months")}`,
        "toast.noTabBar": "FriendsSortAssistant: TabBar module not found.",
        "toast.dmFailed": "Couldn't open the direct message.",
        "toast.pendingCancelled": (n) => `${n} pending ${plural(n, "removal", "removals")} cancelled.`,
        "toast.noFriendsModule": "Discord's friends module not found.",
        "toast.removed": "Friend removed.",
        "toast.removeError": "Error while removing the friend.",
        "empty.cleanTitle": "Your friends list is clean!",
        "empty.cleanText": "No friends match the current sorting filters.",
        "empty.noResultTitle": "No results",
        "empty.noResultText": (q) => `No suggestions match “${q}”.`,
        "filters.title": "Sorting filters",
        "filters.lastChat": "Last conversation",
        "filters.last30": "More than 30 days",
        "filters.last90": "More than 90 days (3 months)",
        "filters.last180": "More than 180 days (6 months)",
        "filters.last365": "More than 1 year",
        "filters.noDmOnly": "No direct messages only",
        "filters.includeNoDm": "Include if no direct messages",
        "filters.includeNoDmHint": "A DM you closed isn't detected.",
        "filters.zeroMutual": "Only if 0 servers in common",
        "filters.minAge": "Minimum friendship age",
        "filters.age0": "No minimum",
        "filters.age15": "At least 15 days",
        "filters.age30": "At least 30 days (1 month)",
        "filters.age90": "At least 90 days (3 months)",
        "stats.total": "Total friends",
        "stats.suggested": "Suggested",
        "stats.aria": "Share of suggested friends",
        "stats.percent": (p) => `${p}% of your friends list`,
        "main.title": "Friend sorting suggestions",
        "main.subtitle": "Clean up your friends list by removing people you no longer interact with. Closing this window cancels pending removals.",
        "main.close": "Close",
        "search.placeholder": "Search",
        "search.aria": "Search for a friend",
        "search.clear": "Clear search",
        "list.results": "Results",
        "list.suggestions": "Suggestions",
        "card.pendingBefore": "Removing ",
        "card.pendingAfter": (s) => ` in ${s} s…`,
        "card.cancel": "Cancel",
        "card.sharedServers": "Shared servers:",
        "card.noSharedServers": "No known shared servers",
        "card.friendSince": (d) => `Friends for ${d} ${plural(d, "day", "days")}`,
        "card.mutual": (n) => `${n} ${plural(n, "server", "servers")} in common`,
        "card.message": "Send a message",
        "card.remove": "Remove friend"
    },
    fr: {
        "tab.button": "Trier ses amis",
        "status.online": "En ligne",
        "status.idle": "Inactif",
        "status.dnd": "Ne pas déranger",
        "status.offline": "Hors ligne",
        "reason.noDm": "Aucun message privé",
        "reason.noDmHint": "Aucun message trouvé dans vos MP avec cette personne. Un MP que vous avez fermé n'est pas détecté.",
        "reason.inactive": (m) => `Inactif depuis ${m} mois`,
        "toast.noTabBar": "FriendsSortAssistant : module TabBar introuvable.",
        "toast.dmFailed": "Impossible d'ouvrir la conversation privée.",
        "toast.pendingCancelled": (n) => `${n} ${plural(n, "suppression en attente annulée", "suppressions en attente annulées")}.`,
        "toast.noFriendsModule": "Module Discord de gestion des amis introuvable.",
        "toast.removed": "Ami retiré.",
        "toast.removeError": "Erreur lors de la suppression.",
        "empty.cleanTitle": "Votre liste d'amis est propre !",
        "empty.cleanText": "Aucun ami ne correspond aux critères de tri actuels.",
        "empty.noResultTitle": "Aucun résultat",
        "empty.noResultText": (q) => `Aucune suggestion ne correspond à « ${q} ».`,
        "filters.title": "Filtres de tri",
        "filters.lastChat": "Dernière discussion",
        "filters.last30": "Plus de 30 jours",
        "filters.last90": "Plus de 90 jours (3 mois)",
        "filters.last180": "Plus de 180 jours (6 mois)",
        "filters.last365": "Plus de 1 an",
        "filters.noDmOnly": "Sans message privé uniquement",
        "filters.includeNoDm": "Inclure si aucun message privé",
        "filters.includeNoDmHint": "Un MP que vous avez fermé n'est pas détecté.",
        "filters.zeroMutual": "Uniquement si 0 serveur commun",
        "filters.minAge": "Âge minimum de l'amitié",
        "filters.age0": "Pas de minimum",
        "filters.age15": "Au moins 15 jours",
        "filters.age30": "Au moins 30 jours (1 mois)",
        "filters.age90": "Au moins 90 jours (3 mois)",
        "stats.total": "Amis au total",
        "stats.suggested": "Suggérés",
        "stats.aria": "Part des amis suggérés",
        "stats.percent": (p) => `${p} % de votre liste d'amis`,
        "main.title": "Suggestions de tri des amis",
        "main.subtitle": "Nettoyez votre liste d'amis en retirant les personnes avec qui vous n'interagissez plus. Fermer cette fenêtre annule les suppressions en attente.",
        "main.close": "Fermer",
        "search.placeholder": "Rechercher",
        "search.aria": "Rechercher un ami",
        "search.clear": "Effacer la recherche",
        "list.results": "Résultats",
        "list.suggestions": "Suggestions",
        "card.pendingBefore": "Suppression de ",
        "card.pendingAfter": (s) => ` dans ${s} s…`,
        "card.cancel": "Annuler",
        "card.sharedServers": "Serveurs partagés :",
        "card.noSharedServers": "Aucun serveur partagé connu",
        "card.friendSince": (d) => `Ami depuis ${d} ${plural(d, "jour", "jours")}`,
        "card.mutual": (n) => `${n} ${plural(n, "serveur", "serveurs")} en commun`,
        "card.message": "Envoyer un message",
        "card.remove": "Retirer de mes amis"
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

// Icônes au style Discord (prennent la couleur du texte)
const ICON_FILTER = `<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M3 5a1 1 0 0 1 1-1h16a1 1 0 0 1 .78 1.63L15 12.74V19a1 1 0 0 1-.55.9l-4 2A1 1 0 0 1 9 21v-8.26L3.22 5.63A1 1 0 0 1 3 5Z"/></svg>`;
const ICON_SEARCH = `<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg>`;
const ICON_CHAT = `<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M12 22a10 10 0 1 0-8.45-4.64c.13.19.11.44-.04.61l-2.06 2.37A1 1 0 0 0 2.2 22H12Z"/></svg>`;
const ICON_USER_REMOVE = `<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M13.5 7.5a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM1 19.5C1 16.46 4.58 14 9 14s8 2.46 8 5.5V21a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-1.5ZM17 9a1 1 0 1 0 0 2h5a1 1 0 1 0 0-2h-5Z"/></svg>`;
const ICON_CHECK_CIRCLE = `<svg aria-hidden="true" width="36" height="36" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm4.7-12.3a1 1 0 0 0-1.4-1.4L11 12.58l-2.3-2.3a1 1 0 0 0-1.4 1.42l3 3a1 1 0 0 0 1.4 0l5-5Z"/></svg>`;

const PLUGIN_CSS = `
/* Bouton « Trier ses amis » : un onglet de plus dans la barre de la page Amis */
.fsa-tab-wrap { display: inline-flex; align-items: center; }
.fsa-tab-btn {
    display: inline-flex; align-items: center; gap: 6px; flex: 0 0 auto;
    margin: 0 8px; padding: 2px 8px; border: none; border-radius: 6px;
    color: var(--interactive-normal, #b5bac1); background: transparent;
    font-family: var(--font-primary, "gg sans", "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif);
    font-size: 16px; font-weight: 500; line-height: 20px; white-space: nowrap;
    cursor: pointer; transition: background-color .1s ease, color .1s ease;
}
.fsa-tab-btn:hover { color: var(--interactive-hover, #dbdee1); background: var(--background-modifier-hover, rgba(78, 80, 88, .3)); }
.fsa-tab-btn:active { color: var(--interactive-active, #fff); background: var(--background-modifier-active, rgba(78, 80, 88, .48)); }
.fsa-tab-btn:focus-visible { outline: 2px solid var(--focus-primary, #00b0f4); outline-offset: 2px; }
.fsa-tab-btn svg { display: block; }

/* Fenêtre à deux colonnes, comme les paramètres de Discord */
.fsa-modal.fsa-window { flex-direction: row; width: 960px; height: min(680px, 100%); }
.fsa-ico { display: inline-flex; }
.fsa-ico svg { display: block; }

.fsa-sidebar { display: flex; flex-direction: column; gap: 20px; flex: 0 1 272px; min-width: 232px; padding: 20px 16px; background: var(--fsa-bg-alt); }
.fsa-sidebar .fsa-field { margin: 0; }
.fsa-checks { display: flex; flex-direction: column; gap: 12px; }
.fsa-check-hint { margin: 4px 0 0 28px; color: var(--fsa-muted); font-size: 12px; line-height: 16px; }
.fsa-summary { display: flex; flex-direction: column; gap: 10px; margin-top: auto; background: var(--fsa-bg); }
.fsa-summary-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

.fsa-main { display: flex; flex-direction: column; flex: 1 1 auto; min-width: 0; }
.fsa-main .fsa-modal-header { padding: 20px 16px 16px 30px; }
.fsa-toolbar { padding: 0 20px 0 30px; }
.fsa-search { position: relative; }
.fsa-search .fsa-input { padding-right: 36px; }
.fsa-search > .fsa-ico, .fsa-search-clear { position: absolute; top: 50%; transform: translateY(-50%); }
.fsa-search > .fsa-ico { right: 10px; color: var(--fsa-muted); pointer-events: none; }
.fsa-icon-btn.fsa-search-clear { right: 4px; width: 24px; height: 24px; border-radius: 4px; }
.fsa-icon-btn.fsa-search-clear svg { width: 16px; height: 16px; }
.fsa-label.fsa-list-header { margin: 20px 20px 8px 30px; }
.fsa-list { flex: 1 1 auto; min-height: 0; padding: 0 12px 16px 20px; }

/* Lignes d'amis, comme la liste d'amis de Discord */
.fsa-row { position: relative; display: flex; align-items: center; gap: 12px; height: 62px; padding: 0 10px; border-radius: var(--fsa-radius); transition: background-color .1s ease; }
.fsa-row::before { content: ""; position: absolute; top: 0; left: 10px; right: 10px; height: 1px; background: var(--fsa-accent); }
.fsa-row:hover, .fsa-row:focus-within { background: var(--fsa-hover); }
.fsa-row:hover::before, .fsa-row:focus-within::before,
.fsa-row:hover + .fsa-row::before, .fsa-row:focus-within + .fsa-row::before { opacity: 0; }

.fsa-avatar-wrap { position: relative; flex: 0 0 auto; width: 32px; height: 32px; }
.fsa-avatar-wrap .fsa-avatar {
    display: block;
    -webkit-mask: radial-gradient(circle at 27px 27px, transparent 6.5px, #000 7px);
    mask: radial-gradient(circle at 27px 27px, transparent 6.5px, #000 7px);
}
/* Pastilles de statut découpées comme celles de Discord */
.fsa-status { position: absolute; right: 0; bottom: 0; width: 10px; height: 10px; border-radius: 50%; background: #80848e; }
.fsa-status-online { background: var(--status-positive, #23a55a); }
.fsa-status-idle {
    background: var(--status-warning, #f0b232);
    -webkit-mask: radial-gradient(circle at 2.5px 2.5px, transparent 3.75px, #000 4.25px);
    mask: radial-gradient(circle at 2.5px 2.5px, transparent 3.75px, #000 4.25px);
}
.fsa-status-dnd {
    background: var(--status-danger, #f23f43);
    -webkit-mask: linear-gradient(#000 0 0) center / 6px 2px no-repeat, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask: linear-gradient(#000 0 0) center / 6px 2px no-repeat exclude, linear-gradient(#000 0 0);
}
.fsa-status-offline {
    -webkit-mask: radial-gradient(circle, transparent 2px, #000 2.5px);
    mask: radial-gradient(circle, transparent 2px, #000 2.5px);
}

.fsa-row-body { display: flex; flex-direction: column; justify-content: center; gap: 2px; flex: 1 1 auto; min-width: 0; }
.fsa-row-name { display: flex; align-items: baseline; gap: 6px; min-width: 0; }
.fsa-name { overflow: hidden; color: var(--fsa-header); font-size: 16px; font-weight: 600; line-height: 20px; white-space: nowrap; text-overflow: ellipsis; }
.fsa-username { flex: 0 0 auto; color: var(--fsa-muted); font-size: 14px; font-weight: 500; line-height: 18px; white-space: nowrap; opacity: 0; transition: opacity .1s ease; }
.fsa-row:hover .fsa-username, .fsa-row:focus-within .fsa-username { opacity: 1; }
.fsa-row-meta { display: flex; align-items: center; gap: 6px; min-width: 0; overflow: hidden; padding: 2px; margin: -2px; color: var(--fsa-header-alt); font-size: 14px; font-weight: 500; line-height: 18px; white-space: nowrap; }
.fsa-row-meta .fsa-pill { flex: 0 0 auto; padding: 0 6px; }
.fsa-sep { color: var(--fsa-muted); }
.fsa-servers { min-width: 0; overflow: hidden; text-overflow: ellipsis; text-decoration: underline dotted; text-underline-offset: 3px; }
.fsa-servers, .fsa-row-meta .fsa-pill[tabindex] { border-radius: 4px; outline: none; cursor: default; }
.fsa-servers:focus-visible, .fsa-row-meta .fsa-pill[tabindex]:focus-visible { box-shadow: 0 0 0 2px var(--fsa-focus); }

.fsa-row-actions { display: flex; gap: 10px; flex: 0 0 auto; margin-left: 8px; }
.fsa-round-btn {
    display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; margin: 0; padding: 0;
    border: none; border-radius: 50%; color: var(--interactive-normal, #b5bac1); background: var(--fsa-bg-alt);
    cursor: pointer; transition: color .1s ease, background-color .1s ease;
}
.fsa-row:hover .fsa-round-btn, .fsa-row:focus-within .fsa-round-btn { background: var(--fsa-bg-deep); }
.fsa-round-btn:hover { color: var(--interactive-hover, #dbdee1); }
.fsa-round-btn-danger:hover { color: var(--fsa-danger); }
.fsa-round-btn:focus-visible { outline: 2px solid var(--fsa-focus); outline-offset: 2px; }
.fsa-round-btn svg { display: block; }

/* Suppression en attente : la barre se vide pendant le compte à rebours */
.fsa-row.fsa-row-pending, .fsa-row.fsa-row-pending:hover { background: color-mix(in srgb, var(--fsa-danger) 10%, transparent); }
.fsa-row-pending::before, .fsa-row-pending + .fsa-row::before { opacity: 0; }
.fsa-row-pending > .fsa-avatar { filter: grayscale(1); opacity: .6; }
.fsa-pending-text { overflow: hidden; color: var(--fsa-text); font-size: 14px; font-weight: 500; line-height: 18px; white-space: nowrap; text-overflow: ellipsis; }
.fsa-pending-text strong { color: var(--fsa-header); font-weight: 600; }
.fsa-progress.fsa-pending-bar { height: 4px; margin-top: 6px; }
.fsa-pending-bar .fsa-progress-bar { width: 100%; background: var(--fsa-danger); transform-origin: left center; animation: fsa-drain 5s linear forwards; }
@keyframes fsa-drain { from { transform: scaleX(1); } to { transform: scaleX(0); } }

.fsa-empty { height: 100%; min-height: 240px; }
.fsa-empty-art { display: flex; align-items: center; justify-content: center; width: 72px; height: 72px; margin-bottom: 8px; border-radius: 50%; color: var(--fsa-success); background: color-mix(in srgb, var(--fsa-success) 14%, transparent); }
.fsa-empty-art-muted { color: var(--fsa-muted); background: var(--fsa-accent); }
.fsa-empty-art-muted svg { width: 32px; height: 32px; }
`;

const STATUS_CLASSES = ["online", "idle", "dnd"];

const getStatusLabel = (s) => {
    switch (s) {
        case "online": return t("status.online");
        case "idle": return t("status.idle");
        case "dnd": return t("status.dnd");
        default: return t("status.offline");
    }
};

// Ancien système (pseudo#1234) : discriminateur % 5 ; nouveaux pseudos : (id >> 22) % 6
const getDefaultAvatarIndex = (user) => {
    if (user.discriminator && user.discriminator !== "0") return Number(user.discriminator) % 5;
    try { return Number((BigInt(user.id) >> 22n) % 6n); } catch (e) { return 0; }
};

module.exports = class FriendsSortAssistant {
    constructor(meta) {
        this.meta = meta;
        this.patches = [];
        this.closeModal = null;
        this.relationshipActions = null;
        this.FriendCard = null;
    }

    start() {
        this.patches = [];
        BdApi.DOM.addStyle(STYLE_ID, discordKitCSS("fsa") + PLUGIN_CSS);
        this.init();
    }

    stop() {
        this.cleanup();
    }

    init() {
        try {
            const TabBarModules = BdApi.Webpack.getModule(m => {
                if (!m) return false;
                if (m.Item && m.Header && m.Panel) return true;
                for (const key in m) {
                    try {
                        if (m[key] && m[key].Item && m[key].Header && m[key].Panel) return true;
                    } catch (e) {}
                }
                return false;
            }, { first: false }) || [];

            if (TabBarModules.length === 0) {
                console.error("[FriendsSortAssistant] TabBar Webpack module not found.");
                BdApi.UI.showToast(t("toast.noTabBar"), { type: "error" });
                return;
            }

            for (const TabBarModule of TabBarModules) {
                let TabBarObject = null;
                let TabBarKey = null;
                let TabBarComponent = null;

                if (TabBarModule.Item && TabBarModule.Header && TabBarModule.Panel) {
                    TabBarComponent = TabBarModule;
                } else {
                    for (const key in TabBarModule) {
                        try {
                            if (TabBarModule[key] && TabBarModule[key].Item && TabBarModule[key].Header && TabBarModule[key].Panel) {
                                TabBarObject = TabBarModule;
                                TabBarKey = key;
                                TabBarComponent = TabBarModule[key];
                                break;
                            }
                        } catch (e) {}
                    }
                }

                if (TabBarComponent) {
                    if (TabBarComponent.prototype && typeof TabBarComponent.prototype.render === "function") {
                        this.patchTabBar(TabBarComponent.prototype, "render");
                    } else if (TabBarObject && TabBarKey) {
                        this.patchTabBar(TabBarObject, TabBarKey);
                    }
                }
            }
        } catch (e) {
            console.error("[FriendsSortAssistant] Error during start:", e);
        }
    }

    cleanup() {
        for (const unpatch of this.patches) {
            try { unpatch(); } catch (e) {}
        }
        this.patches = [];

        // Fermer la modale annule aussi les suppressions en attente
        this.closeModal?.();

        BdApi.DOM.removeStyle(STYLE_ID);
        const container = document.getElementById("fsa-modal-root");
        if (container) {
            if (container._reactRoot) { try { container._reactRoot.unmount(); } catch(e){} }
            container.remove();
        }
    }

    findChildrenArrayWithId(node, targetId) {
        if (!node) return null;
        const targetLower = targetId.toLowerCase();
        if (node.props && Array.isArray(node.props.children)) {
            const hasTarget = node.props.children.some(c => c && c.props && typeof c.props.id === "string" && c.props.id.toLowerCase() === targetLower);
            if (hasTarget) return node.props.children;
        }
        if (node.props && node.props.children) {
            if (Array.isArray(node.props.children)) {
                for (const child of node.props.children) {
                    const res = this.findChildrenArrayWithId(child, targetId);
                    if (res) return res;
                }
            } else {
                const res = this.findChildrenArrayWithId(node.props.children, targetId);
                if (res) return res;
            }
        }
        return null;
    }

    patchTabBar(module, key) {
        if (!module) return;
        const self = this;

        try {
            const unpatch = BdApi.Patcher.after("FriendsSortAssistant", module, key, (thisObject, args, returnValue) => {
                try {
                    if (!returnValue) return;

                    const targetArray = self.findChildrenArrayWithId(returnValue, "ADD_FRIEND");
                    if (!targetArray) return;

                    const hasOurButton = targetArray.some(c => c && c.props && typeof c.props.id === "string" && c.props.id.toLowerCase() === "friends_cleanup_btn_wrapper");
                    if (hasOurButton) return;

                    const addFriendIndex = targetArray.findIndex(c => c && c.props && typeof c.props.id === "string" && c.props.id.toLowerCase() === "add_friend");
                    if (addFriendIndex !== -1) {
                        const cleanupBtn = BdApi.React.createElement("button", {
                            id: "FRIENDS_CLEANUP_BTN",
                            type: "button",
                            className: "fsa-tab-btn",
                            onClick: (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                self.openSuggestionsModal();
                            }
                        },
                            BdApi.React.createElement("span", { className: "fsa-ico", "aria-hidden": true, dangerouslySetInnerHTML: { __html: ICON_FILTER } }),
                            t("tab.button")
                        );

                        const wrapper = BdApi.React.createElement("div", {
                            id: "FRIENDS_CLEANUP_BTN_WRAPPER",
                            className: "fsa-tab-wrap"
                        }, cleanupBtn);

                        targetArray.splice(addFriendIndex + 1, 0, wrapper);
                    }
                } catch (err) {
                    console.error("[FriendsSortAssistant] Error inside TabBar patch:", err);
                }
            });

            this.patches.push(unpatch);
        } catch (err) {
            console.error(`[FriendsSortAssistant] Failed to patch TabBar on key ${key}:`, err);
        }
    }

    getRelationshipActions() {
        if (this.relationshipActions) return this.relationshipActions;

        // Certains modules exposent une fausse "removeRelationship" (traductions) : on vérifie le contenu
        const isRealAction = (fn) => {
            if (typeof fn !== "function") return false;
            const str = fn.toString();
            return (str.includes("relationships") || str.includes("RELATIONSHIP") || str.includes("dispatch") || str.includes("ajax") || str.includes("HTTP"))
                && !str.includes("locale") && !str.includes("localeString") && !str.includes("Requested message");
        };
        const pick = (m) => {
            if (!m) return null;
            if (isRealAction(m.removeRelationship)) return m;
            for (const key in m) {
                try {
                    if (m[key] && isRealAction(m[key].removeRelationship)) return m[key];
                } catch (e) {}
            }
            return null;
        };

        this.relationshipActions = pick(BdApi.Webpack.getModule(m => pick(m) !== null));
        return this.relationshipActions;
    }

    getFriendIds() {
        try {
            const RelationshipStore = BdApi.Webpack.getStore("RelationshipStore");
            if (!RelationshipStore) return [];

            const relationships = RelationshipStore.getMutableRelationships();
            const friendIds = [];
            if (relationships instanceof Map) {
                relationships.forEach((type, id) => {
                    if (type === 1) friendIds.push(id);
                });
            } else if (relationships && typeof relationships === "object") {
                for (const id in relationships) {
                    if (relationships[id] === 1) friendIds.push(id);
                }
            }
            if (friendIds.length === 0 && typeof RelationshipStore.getFriendIDs === "function") {
                return RelationshipStore.getFriendIDs();
            }
            return friendIds;
        } catch (e) {
            console.error("[FriendsSortAssistant] Error getting friend IDs:", e);
            return [];
        }
    }

    getFriendshipDurationDays(userId) {
        try {
            const RelationshipStore = BdApi.Webpack.getStore("RelationshipStore");
            if (!RelationshipStore) return 0;
            const since = RelationshipStore.getSince(userId);
            if (!since) return 0;
            const sinceTime = new Date(since).getTime();
            if (isNaN(sinceTime)) return 0;
            return (Date.now() - sinceTime) / (1000 * 60 * 60 * 24);
        } catch (e) {
            console.error("[FriendsSortAssistant] Error getting friendship duration:", e);
            return 0;
        }
    }

    // Âge en jours du dernier message privé, Infinity si aucun message connu,
    // ou null si l'information est indisponible (l'ami n'est alors pas suggéré).
    getLastDMMessageAgeDays(userId) {
        try {
            const ChannelStore = BdApi.Webpack.getStore("ChannelStore");
            const MessageStore = BdApi.Webpack.getStore("MessageStore");
            const ReadStateStore = BdApi.Webpack.getStore("ReadStateStore");

            if (!ChannelStore) return null;

            const channelId = ChannelStore.getDMFromUserId(userId);
            if (!channelId) return Infinity;

            const lastMessageId = ChannelStore.getChannel(channelId)?.lastMessageId
                || (ReadStateStore && typeof ReadStateStore.lastMessageId === "function" ? ReadStateStore.lastMessageId(channelId) : null)
                || (MessageStore && typeof MessageStore.getLastMessageId === "function" ? MessageStore.getLastMessageId(channelId) : null);

            if (!lastMessageId || (typeof lastMessageId !== "string" && typeof lastMessageId !== "number")) return Infinity;

            const msgTimestamp = Number((BigInt(lastMessageId) >> 22n) + 1420070400000n);
            return (Date.now() - msgTimestamp) / (1000 * 60 * 60 * 24);
        } catch (e) {
            console.error("[FriendsSortAssistant] Error getting last DM age:", e);
            return null;
        }
    }

    getMutualServers(userId) {
        try {
            const GuildStore = BdApi.Webpack.getStore("GuildStore");
            const GuildMemberStore = BdApi.Webpack.getStore("GuildMemberStore") || BdApi.Webpack.getStore("MemberStore");
            const UserProfileStore = BdApi.Webpack.getStore("UserProfileStore");

            if (!GuildStore) return [];

            const mutual = new Map();

            // Serveurs communs connus du profil (renseignés si le profil a déjà été ouvert)
            const fromProfile = typeof UserProfileStore?.getMutualGuilds === "function" ? UserProfileStore.getMutualGuilds(userId) : null;
            if (Array.isArray(fromProfile)) {
                for (const entry of fromProfile) {
                    const guildId = entry?.guild?.id ?? entry?.id;
                    const guild = guildId && GuildStore.getGuild(guildId);
                    if (guild) mutual.set(guild.id, guild);
                }
            }

            // Membres en cache (incomplet sur les gros serveurs)
            if (GuildMemberStore) {
                for (const g of Object.values(GuildStore.getGuilds())) {
                    if (mutual.has(g.id)) continue;
                    try {
                        if (GuildMemberStore.getMember(g.id, userId) != null) mutual.set(g.id, g);
                    } catch (e) {}
                }
            }

            return [...mutual.values()];
        } catch (e) {
            console.error("[FriendsSortAssistant] Error getting mutual servers:", e);
            return [];
        }
    }

    getSuggestions(filters) {
        try {
            const UserStore = BdApi.Webpack.getStore("UserStore");
            const RelationshipStore = BdApi.Webpack.getStore("RelationshipStore");
            const PresenceStore = BdApi.Webpack.getStore("PresenceStore");

            if (!UserStore || !RelationshipStore) return [];

            const currentUserId = UserStore.getCurrentUser()?.id;
            const friendIds = this.getFriendIds();
            const suggestions = [];

            for (const friendId of friendIds) {
                const user = UserStore.getUser(friendId);
                if (!user || user.id === currentUserId) continue;

                const friendshipAge = this.getFriendshipDurationDays(friendId);
                if (friendshipAge < filters.minFriendshipDuration) continue;

                const lastDMTime = this.getLastDMMessageAgeDays(friendId);
                // Donnée indisponible : on ne suggère jamais de retirer quelqu'un "par défaut"
                if (lastDMTime === null) continue;

                const mutualServers = this.getMutualServers(friendId);
                if (filters.onlyZeroSharedServers && mutualServers.length > 0) continue;

                const reasons = [];
                if (lastDMTime === Infinity) {
                    if (filters.includeNeverSpoken) {
                        reasons.push({ label: t("reason.noDm"), hint: t("reason.noDmHint") });
                    }
                } else if (lastDMTime > filters.maxLastChatAge) {
                    const months = Math.round(lastDMTime / 30);
                    reasons.push({ label: t("reason.inactive", months > 0 ? months : 1) });
                }

                if (reasons.length > 0) {
                    suggestions.push({
                        user,
                        friendshipAge,
                        lastDMTime,
                        mutualServers,
                        status: PresenceStore ? PresenceStore.getStatus(friendId) : "offline",
                        reasons
                    });
                }
            }

            return suggestions.sort((a, b) => {
                if (a.lastDMTime === Infinity && b.lastDMTime !== Infinity) return -1;
                if (a.lastDMTime !== Infinity && b.lastDMTime === Infinity) return 1;
                if (a.lastDMTime !== Infinity && b.lastDMTime !== Infinity) {
                    return b.lastDMTime - a.lastDMTime;
                }
                return b.friendshipAge - a.friendshipAge;
            });
        } catch (e) {
            console.error("[FriendsSortAssistant] Error building suggestions list:", e);
            return [];
        }
    }

    findDMChannel(userId) {
        const ChannelStore = BdApi.Webpack.getStore("ChannelStore");
        if (!ChannelStore) return null;

        const id = ChannelStore.getDMFromUserId(userId);
        if (id) return id;

        if (typeof ChannelStore.getSortedPrivateChannels === "function") {
            for (const channel of ChannelStore.getSortedPrivateChannels()) {
                if (channel.type !== 1) continue; // 1 = Message privé
                const hasRecipient = (channel.recipients && channel.recipients.some(r => r === userId || r?.id === userId))
                    || (channel.recipientIds && channel.recipientIds.includes(userId));
                if (hasRecipient) return channel.id;
            }
        }
        return null;
    }

    navigateToChannel(channelId) {
        const transitionTo = BdApi.Webpack.getModule(BdApi.Webpack.Filters.byStrings("transitionTo - Transitioning to"), { searchExports: true });
        if (typeof transitionTo === "function") {
            transitionTo(`/channels/@me/${channelId}`);
            return true;
        }
        const Dispatcher = BdApi.Webpack.getByKeys("dispatch", "subscribe");
        if (Dispatcher) {
            Dispatcher.dispatch({ type: "CHANNEL_SELECT", guildId: null, channelId });
            return true;
        }
        return false;
    }

    async openDM(userId) {
        // MP déjà existant : on y va directement, sans rien créer
        try {
            const channelId = this.findDMChannel(userId);
            if (channelId && this.navigateToChannel(channelId)) return;
        } catch (e) {
            console.error("[FriendsSortAssistant] Error in openDM:", e);
        }

        const PrivateChannelActions = BdApi.Webpack.getByKeys("openPrivateChannel");
        if (typeof PrivateChannelActions?.openPrivateChannel === "function") {
            try {
                // Méthode native de Discord : crée le MP puis l'ouvre (aucun jeton manipulé).
                // Elle attend { recipientIds } : un identifiant seul donnait une liste vide,
                // et Discord créait un groupe avec soi-même comme seul membre.
                await PrivateChannelActions.openPrivateChannel({ recipientIds: [userId] });
                return;
            } catch (e) {
                console.error("[FriendsSortAssistant] openPrivateChannel failed:", e);
            }
        }
        BdApi.UI.showToast(t("toast.dmFailed"), { type: "error" });
    }

    openSuggestionsModal() {
        this.closeModal?.();

        const containerId = "fsa-modal-root";
        document.getElementById(containerId)?.remove();

        const container = document.createElement("div");
        container.id = containerId;
        const targetNode = document.querySelector(".app-mount") || document.body;
        targetNode.appendChild(container);

        // Le focus revient là où il était à la fermeture
        const previouslyFocused = document.activeElement;
        const handleEsc = (e) => {
            if (e.key === "Escape") closeRoot();
        };

        // Point de fermeture unique : démonte React, retire l'écouteur clavier et rend le focus
        const closeRoot = () => {
            document.removeEventListener("keydown", handleEsc);
            if (container._reactRoot) {
                try { container._reactRoot.unmount(); } catch(e){}
            } else if (typeof BdApi.ReactDOM.unmountComponentAtNode === "function") {
                try { BdApi.ReactDOM.unmountComponentAtNode(container); } catch(e){}
            }
            container.remove();
            if (this.closeModal === closeRoot) this.closeModal = null;
            if (previouslyFocused?.isConnected) previouslyFocused.focus?.();
        };
        this.closeModal = closeRoot;
        document.addEventListener("keydown", handleEsc);

        const SuggestionsModal = this.getSuggestionsModalComponent();

        if (typeof BdApi.ReactDOM.createRoot === "function") {
            const root = BdApi.ReactDOM.createRoot(container);
            container._reactRoot = root;
            root.render(BdApi.React.createElement(SuggestionsModal, { onClose: closeRoot }));
        } else if (typeof BdApi.ReactDOM.render === "function") {
            BdApi.ReactDOM.render(BdApi.React.createElement(SuggestionsModal, { onClose: closeRoot }), container);
        }
    }

    getSuggestionsModalComponent() {
        const React = BdApi.React;
        const h = React.createElement;
        const self = this;
        // Composant créé une seule fois : les cartes ne sont plus remontées à chaque seconde du compte à rebours
        const FriendCard = this.getFriendCardComponent();

        const SelectField = ({ id, label, value, onChange, options }) => h("div", { className: "fsa-field" },
            h("label", { className: "fsa-label", htmlFor: id }, label),
            h("select", { id, className: "fsa-select fsa-input-sm", value, onChange: (e) => onChange(Number(e.target.value)) },
                options.map(([v, text]) => h("option", { key: v, value: v }, text))
            )
        );

        const CheckField = ({ id, label, checked, onChange, hint }) => h("div", null,
            h("label", { className: "fsa-check", htmlFor: id },
                h("input", { type: "checkbox", id, checked, onChange: (e) => onChange(e.target.checked) }),
                h("span", null, label)
            ),
            hint && h("div", { className: "fsa-check-hint" }, hint)
        );

        return function SuggestionsModal({ onClose }) {
            const [maxLastChatAge, setMaxLastChatAge] = React.useState(90);
            const [onlyZeroSharedServers, setOnlyZeroSharedServers] = React.useState(false);
            const [minFriendshipDuration, setMinFriendshipDuration] = React.useState(30);
            const [includeNeverSpoken, setIncludeNeverSpoken] = React.useState(true);

            const [suggestions, setSuggestions] = React.useState([]);
            const [pendingDeletes, setPendingDeletes] = React.useState({});
            const [query, setQuery] = React.useState("");
            const [tip, setTip] = React.useState(null);

            const intervalsRef = React.useRef({});
            const mountedRef = React.useRef(true);
            const searchRef = React.useRef(null);
            const pressedOnBackdrop = React.useRef(false);
            const tipRef = React.useRef(null);

            React.useEffect(() => {
                setSuggestions(self.getSuggestions({
                    maxLastChatAge,
                    onlyZeroSharedServers,
                    minFriendshipDuration,
                    // Le mode « sans message privé uniquement » inclut forcément ces amis
                    includeNeverSpoken: includeNeverSpoken || maxLastChatAge >= NO_DM_ONLY
                }));
            }, [maxLastChatAge, onlyZeroSharedServers, minFriendshipDuration, includeNeverSpoken]);

            React.useEffect(() => { searchRef.current?.focus(); }, []);

            // Fermer la modale annule les suppressions en attente : rien n'est retiré sans compte à rebours complet
            React.useEffect(() => () => {
                mountedRef.current = false;
                const pendingIds = Object.keys(intervalsRef.current);
                for (const userId of pendingIds) clearInterval(intervalsRef.current[userId]);
                intervalsRef.current = {};
                if (pendingIds.length > 0) {
                    BdApi.UI.showToast(t("toast.pendingCancelled", pendingIds.length), { type: "info" });
                }
            }, []);

            const clearPending = React.useCallback((userId) => {
                setPendingDeletes(prev => {
                    const next = { ...prev };
                    delete next[userId];
                    return next;
                });
            }, []);

            const executeDelete = React.useCallback(async (userId) => {
                const RelationshipActions = self.getRelationshipActions();
                if (!RelationshipActions) {
                    BdApi.UI.showToast(t("toast.noFriendsModule"), { type: "error" });
                    if (mountedRef.current) clearPending(userId);
                    return;
                }

                try {
                    let result;
                    try {
                        result = RelationshipActions.removeRelationship(userId, { location: "Friends" });
                    } catch (err) {
                        result = RelationshipActions.removeRelationship(userId);
                    }
                    // Discord met lui-même sa liste à jour une fois la requête validée
                    await result;

                    BdApi.UI.showToast(t("toast.removed"), { type: "success" });
                    if (mountedRef.current) {
                        setSuggestions(prev => prev.filter(s => s.user.id !== userId));
                        clearPending(userId);
                    }
                } catch (e) {
                    console.error("[FriendsSortAssistant] Failed to remove relationship:", e);
                    BdApi.UI.showToast(t("toast.removeError"), { type: "error" });
                    if (mountedRef.current) clearPending(userId);
                }
            }, []);

            const startPendingDelete = React.useCallback((userId) => {
                if (intervalsRef.current[userId]) return;

                setTip(null);
                setPendingDeletes(prev => ({ ...prev, [userId]: PENDING_DELAY }));

                let timeLeft = PENDING_DELAY;
                intervalsRef.current[userId] = setInterval(() => {
                    timeLeft -= 1;
                    if (timeLeft <= 0) {
                        clearInterval(intervalsRef.current[userId]);
                        delete intervalsRef.current[userId];
                        executeDelete(userId);
                    } else {
                        setPendingDeletes(prev => {
                            if (prev[userId] === undefined) return prev;
                            return { ...prev, [userId]: timeLeft };
                        });
                    }
                }, 1000);
            }, []);

            const cancelPendingDelete = React.useCallback((userId) => {
                if (intervalsRef.current[userId]) {
                    clearInterval(intervalsRef.current[userId]);
                    delete intervalsRef.current[userId];
                }
                clearPending(userId);
            }, []);

            const handleOpenDM = React.useCallback((userId) => {
                self.openDM(userId);
                onClose();
            }, [onClose]);

            // Une seule infobulle, posée au-dessus (ou en dessous, près du haut) de l'élément visé
            const showTip = React.useCallback((el, label) => {
                const r = el.getBoundingClientRect();
                const below = r.top < 72;
                setTip({ label, x: r.left + r.width / 2, y: below ? r.bottom + 8 : r.top - 8, below });
            }, []);
            const hideTip = React.useCallback(() => setTip(null), []);

            // Décale l'infobulle si elle sort de l'écran ; la flèche reste pointée sur l'élément
            React.useLayoutEffect(() => {
                const el = tipRef.current;
                if (!el) return;
                el.style.marginLeft = "0px";
                const r = el.getBoundingClientRect();
                const shift = r.left < 8 ? 8 - r.left : r.right > window.innerWidth - 8 ? window.innerWidth - 8 - r.right : 0;
                el.style.marginLeft = `${shift}px`;
                el.style.setProperty("--fsa-tip-shift", `${shift}px`);
            }, [tip]);

            const totalFriends = React.useMemo(() => self.getFriendIds().length, [suggestions]);
            const suggestedCount = suggestions.length;
            const suggestedPercentage = totalFriends > 0 ? Math.round((suggestedCount / totalFriends) * 100) : 0;

            const search = query.trim().toLowerCase();
            const visible = React.useMemo(() => {
                if (!search) return suggestions;
                // Une suppression en attente reste toujours visible, donc annulable
                return suggestions.filter(s => pendingDeletes[s.user.id] !== undefined
                    || [s.user.globalName, s.user.username].some(n => n && n.toLowerCase().includes(search)));
            }, [suggestions, search, pendingDeletes]);

            const emptyState = suggestions.length === 0
                ? h("div", { className: "fsa-empty" },
                    h("div", { className: "fsa-empty-art", dangerouslySetInnerHTML: { __html: ICON_CHECK_CIRCLE } }),
                    h("div", { className: "fsa-empty-title" }, t("empty.cleanTitle")),
                    h("div", null, t("empty.cleanText"))
                )
                : h("div", { className: "fsa-empty" },
                    h("div", { className: "fsa-empty-art fsa-empty-art-muted", dangerouslySetInnerHTML: { __html: ICON_SEARCH } }),
                    h("div", { className: "fsa-empty-title" }, t("empty.noResultTitle")),
                    h("div", null, t("empty.noResultText", query.trim()))
                );

            return h("div", {
                className: "fsa-ui fsa-backdrop",
                onMouseDown: (e) => { pressedOnBackdrop.current = e.target === e.currentTarget; },
                // Ne ferme que si le clic a commencé ET fini sur le fond (pas en relâchant une sélection de texte)
                onClick: (e) => {
                    if (pressedOnBackdrop.current && e.target === e.currentTarget) onClose();
                    pressedOnBackdrop.current = false;
                }
            },
                h("div", { className: "fsa-modal fsa-window", role: "dialog", "aria-modal": true, "aria-labelledby": "fsa-title" },
                    h("aside", { className: "fsa-sidebar fsa-scroller" },
                        h("h2", { className: "fsa-heading" }, t("filters.title")),
                        h(SelectField, {
                            id: "fsa-last-chat", label: t("filters.lastChat"),
                            value: maxLastChatAge, onChange: setMaxLastChatAge,
                            options: [
                                [30, t("filters.last30")],
                                [90, t("filters.last90")],
                                [180, t("filters.last180")],
                                [365, t("filters.last365")],
                                [NO_DM_ONLY, t("filters.noDmOnly")]
                            ]
                        }),
                        h("div", { className: "fsa-checks" },
                            maxLastChatAge < NO_DM_ONLY && h(CheckField, {
                                id: "fsa-include-never-spoken", label: t("filters.includeNoDm"),
                                checked: includeNeverSpoken, onChange: setIncludeNeverSpoken,
                                hint: t("filters.includeNoDmHint")
                            }),
                            h(CheckField, {
                                id: "fsa-only-zero-mutual", label: t("filters.zeroMutual"),
                                checked: onlyZeroSharedServers, onChange: setOnlyZeroSharedServers
                            })
                        ),
                        h(SelectField, {
                            id: "fsa-min-age", label: t("filters.minAge"),
                            value: minFriendshipDuration, onChange: setMinFriendshipDuration,
                            options: [
                                [0, t("filters.age0")],
                                [15, t("filters.age15")],
                                [30, t("filters.age30")],
                                [90, t("filters.age90")]
                            ]
                        }),
                        h("div", { className: "fsa-card fsa-summary" },
                            h("div", { className: "fsa-summary-stats" },
                                h("div", null,
                                    h("div", { className: "fsa-stat-value" }, totalFriends),
                                    h("div", { className: "fsa-stat-label" }, t("stats.total"))
                                ),
                                h("div", null,
                                    h("div", { className: "fsa-stat-value" }, suggestedCount),
                                    h("div", { className: "fsa-stat-label" }, t("stats.suggested"))
                                )
                            ),
                            h("div", {
                                className: "fsa-progress", role: "progressbar", "aria-label": t("stats.aria"),
                                "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": suggestedPercentage
                            }, h("div", { className: "fsa-progress-bar", style: { width: `${suggestedPercentage}%` } })),
                            h("div", { className: "fsa-small fsa-muted" }, t("stats.percent", suggestedPercentage))
                        )
                    ),

                    h("section", { className: "fsa-main" },
                        h("div", { className: "fsa-modal-header" },
                            h("div", null,
                                h("h1", { id: "fsa-title", className: "fsa-title" }, t("main.title")),
                                h("p", { className: "fsa-subtitle" }, t("main.subtitle"))
                            ),
                            h("button", {
                                type: "button", className: "fsa-icon-btn fsa-close", "aria-label": t("main.close"),
                                onClick: onClose, dangerouslySetInnerHTML: { __html: ICON_CLOSE }
                            })
                        ),
                        h("div", { className: "fsa-toolbar" },
                            h("div", { className: "fsa-search" },
                                h("input", {
                                    ref: searchRef, type: "text", className: "fsa-input fsa-input-sm",
                                    placeholder: t("search.placeholder"), "aria-label": t("search.aria"), spellCheck: false,
                                    value: query, onChange: (e) => setQuery(e.target.value),
                                    // Échap vide d'abord la recherche, puis ferme la fenêtre
                                    onKeyDown: (e) => {
                                        if (e.key === "Escape" && query) { e.stopPropagation(); setQuery(""); }
                                    }
                                }),
                                query
                                    ? h("button", {
                                        type: "button", className: "fsa-icon-btn fsa-search-clear", "aria-label": t("search.clear"),
                                        onClick: () => { setQuery(""); searchRef.current?.focus(); },
                                        dangerouslySetInnerHTML: { __html: ICON_CLOSE }
                                    })
                                    : h("span", { className: "fsa-ico", "aria-hidden": true, dangerouslySetInnerHTML: { __html: ICON_SEARCH } })
                            )
                        ),
                        h("div", { className: "fsa-label fsa-list-header" }, `${search ? t("list.results") : t("list.suggestions")} — ${visible.length}`),
                        h("div", { className: "fsa-list fsa-scroller", onScroll: hideTip },
                            visible.length === 0
                                ? emptyState
                                : visible.map((s) => h(FriendCard, {
                                    key: s.user.id,
                                    suggestion: s,
                                    timeLeft: pendingDeletes[s.user.id],
                                    onRemove: startPendingDelete,
                                    onCancel: cancelPendingDelete,
                                    onOpenDM: handleOpenDM,
                                    showTip,
                                    hideTip
                                }))
                        )
                    )
                ),
                tip && h("div", {
                    ref: tipRef,
                    className: `fsa-tooltip${tip.below ? " fsa-tooltip-bottom" : ""}`,
                    role: "tooltip",
                    style: { left: tip.x, top: tip.y }
                }, tip.label)
            );
        };
    }

    getFriendCardComponent() {
        if (this.FriendCard) return this.FriendCard;
        const React = BdApi.React;
        const h = React.createElement;

        function FriendCard({ suggestion, timeLeft, onRemove, onCancel, onOpenDM, showTip, hideTip }) {
            const { user, friendshipAge, mutualServers, status, reasons } = suggestion;
            const displayName = user.globalName || user.username;
            const withTip = (label) => ({
                onMouseEnter: (e) => showTip(e.currentTarget, label),
                onMouseLeave: hideTip,
                onFocus: (e) => showTip(e.currentTarget, label),
                onBlur: hideTip
            });

            const avatarUrl = typeof user.getAvatarURL === "function"
                ? user.getAvatarURL()
                : user.avatar
                    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
                    : `https://cdn.discordapp.com/embed/avatars/${getDefaultAvatarIndex(user)}.png`;

            if (timeLeft !== undefined) {
                return h("div", { className: "fsa-row fsa-row-pending" },
                    h("img", { className: "fsa-avatar", src: avatarUrl, alt: "" }),
                    h("div", { className: "fsa-row-body" },
                        h("div", { className: "fsa-pending-text" }, t("card.pendingBefore"), h("strong", null, displayName), t("card.pendingAfter", timeLeft)),
                        h("div", { className: "fsa-progress fsa-pending-bar" },
                            h("div", { className: "fsa-progress-bar", style: { animationDuration: `${PENDING_DELAY}s` } })
                        )
                    ),
                    h("button", {
                        type: "button", className: "fsa-btn fsa-btn-sm fsa-btn-secondary",
                        onClick: () => onCancel(user.id)
                    }, t("card.cancel"))
                );
            }

            const mutualServersText = mutualServers.length > 0
                ? t("card.sharedServers") + "\n" + mutualServers.map(g => `• ${g.name}`).join("\n")
                : t("card.noSharedServers");
            const days = Math.round(friendshipAge);
            const statusLabel = getStatusLabel(status);

            return h("div", { className: "fsa-row" },
                h("div", { className: "fsa-avatar-wrap" },
                    h("img", { className: "fsa-avatar", src: avatarUrl, alt: "" }),
                    h("span", {
                        className: `fsa-status fsa-status-${STATUS_CLASSES.includes(status) ? status : "offline"}`,
                        role: "img", "aria-label": statusLabel, ...withTip(statusLabel)
                    })
                ),
                h("div", { className: "fsa-row-body" },
                    h("div", { className: "fsa-row-name" },
                        h("span", { className: "fsa-name" }, displayName),
                        user.globalName && h("span", { className: "fsa-username" }, `@${user.username}`)
                    ),
                    h("div", { className: "fsa-row-meta" },
                        reasons.map((r, i) => h("span", {
                            key: i,
                            className: r.hint ? "fsa-pill" : "fsa-pill fsa-pill-warning",
                            ...(r.hint ? { tabIndex: 0, ...withTip(r.hint) } : {})
                        }, r.label)),
                        h("span", { className: "fsa-sep", "aria-hidden": true }, "•"),
                        h("span", null, t("card.friendSince", days)),
                        h("span", { className: "fsa-sep", "aria-hidden": true }, "•"),
                        h("span", { className: "fsa-servers", tabIndex: 0, ...withTip(mutualServersText) },
                            t("card.mutual", mutualServers.length))
                    )
                ),
                h("div", { className: "fsa-row-actions" },
                    h("button", {
                        type: "button", className: "fsa-round-btn", "aria-label": t("card.message"),
                        ...withTip(t("card.message")), onClick: () => onOpenDM(user.id),
                        dangerouslySetInnerHTML: { __html: ICON_CHAT }
                    }),
                    h("button", {
                        type: "button", className: "fsa-round-btn fsa-round-btn-danger", "aria-label": t("card.remove"),
                        ...withTip(t("card.remove")),
 onClick: () => onRemove(user.id),
                        dangerouslySetInnerHTML: { __html: ICON_USER_REMOVE }
                    })
                )
            );
        }

        // memo : seules les cartes dont les props changent sont re-rendues pendant le compte à rebours
        this.FriendCard = React.memo(FriendCard);
        return this.FriendCard;
    }
};
