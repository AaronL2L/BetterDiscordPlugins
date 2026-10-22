/**
 * @name BetterSidebar
 * @author AaronL2L
 * @version 1.0.0
 * @description Sort and pin your servers, or leave several at once, from a button built into the server list, in a Discord-style interface. English and French.
 * @invite HdXp7sWRY3
 * @website https://valientebot.xyz
 * @source https://github.com/AaronL2L/BetterDiscordPlugins/tree/main/BetterSidebar
 * @updateUrl https://raw.githubusercontent.com/AaronL2L/BetterDiscordPlugins/main/BetterSidebar/BetterSidebar.plugin.js
 */

'use strict';

const STYLE_ID = "BetterSidebar";

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
        "group.alpha": "Name",
        "group.members": "Members",
        "group.boosts": "Boosts and status",
        "group.dates": "Dates",
        "group.structure": "Features",
        "group.other": "Other",
        "crit.alpha_az": "A to Z",
        "crit.alpha_za": "Z to A",
        "crit.name_short": "Shortest names first",
        "crit.name_long": "Longest names first",
        "crit.members_desc": "Largest first",
        "crit.members_asc": "Smallest first",
        "crit.boost_lvl": "Highest boost level",
        "crit.boost_count": "Most boosts",
        "crit.verified_first": "Verified servers first",
        "crit.partnered": "Partnered servers first",
        "crit.created_new": "Most recently created",
        "crit.created_old": "Created longest ago",
        "crit.joined_new": "Most recently joined",
        "crit.joined_old": "Joined longest ago",
        "crit.icon_first": "With an icon first",
        "crit.locale_az": "By server language",
        "crit.nsfw_first": "Sensitive content (NSFW) first",
        "crit.random": "Random order",
        "crit.randomDesc": "Shuffles your servers at random",
        "folder.unnamed": "📁 Unnamed folder",
        "pinned.count": (n) => `${n} pinned`,
        "side.aria": "Sort servers (BetterSidebar)",
        "sort.title": "Sort servers",
        "sort.desc": "The new order applies right away in the list on the left. Pinned servers stay at the top, and folder contents are sorted too.",
        "sort.discord": "Discord's order",
        "sort.discordDesc": "The order you set by dragging your servers.",
        "sort.reshuffle": "Reshuffle",
        "toast.apiError": "API error: Discord module not found.",
        "toast.left": (n) => `${n} ${plural(n, "server left", "servers left")}`,
        "toast.leftFailed": (summary, n) => `${summary}, ${n} ${plural(n, "failure", "failures")}.`,
        "toast.leftStopped": (summary) => `Stopped: ${summary}.`,
        "toast.reset": "Discord's order restored: sort and pins removed.",
        "nav.aria": "BetterSidebar sections",
        "nav.serverList": "Server list",
        "nav.sort": "Sort",
        "nav.pinned": "Pinned",
        "nav.leave": "Leave servers",
        "nav.current": "Current order",
        "nav.reset": "Reset all",
        "close": "Close",
        "close.key": "ESC",
        "search.ph": "Search for a server",
        "search.clear": "Clear search",
        "list.results": (n) => `Results — ${n}`,
        "list.all": (n) => `All servers — ${n}`,
        "empty.unavailable": "Server list unavailable",
        "empty.unavailableHint": "Discord hasn't loaded your servers yet.",
        "empty.noMatch": "No servers found",
        "empty.noMatchHint": (q) => `No name contains “${q}”.`,
        "empty.none": "No servers",
        "empty.noneHint": "You haven't joined any servers yet.",
        "pins.title": "Pinned servers",
        "pins.desc": "Pinned servers stay at the very top of the list, whatever sort you choose. A line separates them from the others.",
        "pins.list": (n) => `Pinned — ${n}`,
        "pins.unpin": (name) => `Unpin ${name}`,
        "pins.pin": (name) => `Pin ${name}`,
        "leave.count": (n) => `${n} ${plural(n, "server", "servers")}`,
        "leave.stopping": "Stopping after this server…",
        "leave.progress": (done, total) => `Leaving… ${done} of ${total}`,
        "leave.stop": "Stop",
        "leave.confirmAria": "Confirm leaving",
        "leave.confirmTitle": (count) => `Permanently leave ${count}?`,
        "leave.confirmSub": "You'll need a new invite to come back.",
        "leave.cancel": "Cancel",
        "leave.confirm": "Leave permanently",
        "leave.selected": (count) => `${count} selected`,
        "leave.selectedSub": "Nothing is left until you confirm.",
        "leave.deselectAll": "Deselect all",
        "leave.named": (x) => `Leave ${x}`,
        "leave.desc": "Check the servers to leave, then confirm at the bottom. To rejoin a server you left, you'll need a new invite. You can't leave a server you own.",
        "leave.selectResults": "Select results",
        "leave.selectAll": "Select all",
        "leave.owner": "Owner"
    },
    fr: {
        "group.alpha": "Nom",
        "group.members": "Membres",
        "group.boosts": "Boosts et statut",
        "group.dates": "Dates",
        "group.structure": "Caractéristiques",
        "group.other": "Autres",
        "crit.alpha_az": "De A à Z",
        "crit.alpha_za": "De Z à A",
        "crit.name_short": "Noms courts d'abord",
        "crit.name_long": "Noms longs d'abord",
        "crit.members_desc": "Les plus grands d'abord",
        "crit.members_asc": "Les plus petits d'abord",
        "crit.boost_lvl": "Niveau de boost le plus élevé",
        "crit.boost_count": "Plus grand nombre de boosts",
        "crit.verified_first": "Serveurs vérifiés d'abord",
        "crit.partnered": "Serveurs partenaires d'abord",
        "crit.created_new": "Créés le plus récemment",
        "crit.created_old": "Créés il y a le plus longtemps",
        "crit.joined_new": "Rejoints le plus récemment",
        "crit.joined_old": "Rejoints il y a le plus longtemps",
        "crit.icon_first": "Avec une icône d'abord",
        "crit.locale_az": "Par langue du serveur",
        "crit.nsfw_first": "Contenu sensible (NSFW) d'abord",
        "crit.random": "Ordre aléatoire",
        "crit.randomDesc": "Mélange vos serveurs au hasard",
        "folder.unnamed": "📁 Dossier sans nom",
        "pinned.count": (n) => `${n} ${plural(n, "épinglé", "épinglés")}`,
        "side.aria": "Trier les serveurs (BetterSidebar)",
        "sort.title": "Trier les serveurs",
        "sort.desc": "Le nouvel ordre s'applique tout de suite dans la liste de gauche. Les serveurs épinglés restent en haut, et le contenu des dossiers est trié aussi.",
        "sort.discord": "Ordre de Discord",
        "sort.discordDesc": "L'ordre que vous avez choisi en déplaçant vos serveurs.",
        "sort.reshuffle": "Remélanger",
        "toast.apiError": "Erreur API : module de Discord introuvable.",
        "toast.left": (n) => `${n} ${plural(n, "serveur quitté", "serveurs quittés")}`,
        "toast.leftFailed": (summary, n) => `${summary}, ${n} ${plural(n, "échec", "échecs")}.`,
        "toast.leftStopped": (summary) => `Arrêté : ${summary}.`,
        "toast.reset": "Ordre de Discord rétabli : tri et épingles retirés.",
        "nav.aria": "Sections de BetterSidebar",
        "nav.serverList": "Liste des serveurs",
        "nav.sort": "Trier",
        "nav.pinned": "Épinglés",
        "nav.leave": "Quitter des serveurs",
        "nav.current": "Ordre actuel",
        "nav.reset": "Tout réinitialiser",
        "close": "Fermer",
        "close.key": "ÉCHAP",
        "search.ph": "Rechercher un serveur",
        "search.clear": "Effacer la recherche",
        "list.results": (n) => `Résultats — ${n}`,
        "list.all": (n) => `Tous les serveurs — ${n}`,
        "empty.unavailable": "Liste des serveurs indisponible",
        "empty.unavailableHint": "Discord n'a pas encore chargé vos serveurs.",
        "empty.noMatch": "Aucun serveur trouvé",
        "empty.noMatchHint": (q) => `Aucun nom ne contient « ${q} ».`,
        "empty.none": "Aucun serveur",
        "empty.noneHint": "Vous n'avez rejoint aucun serveur pour l'instant.",
        "pins.title": "Serveurs épinglés",
        "pins.desc": "Les serveurs épinglés restent tout en haut de la liste, quel que soit le tri choisi. Une ligne les sépare des autres.",
        "pins.list": (n) => `Épinglés — ${n}`,
        "pins.unpin": (name) => `Désépingler ${name}`,
        "pins.pin": (name) => `Épingler ${name}`,
        "leave.count": (n) => `${n} ${plural(n, "serveur", "serveurs")}`,
        "leave.stopping": "Arrêt après ce serveur…",
        "leave.progress": (done, total) => `Départ en cours… ${done} sur ${total}`,
        "leave.stop": "Arrêter",
        "leave.confirmAria": "Confirmer le départ",
        "leave.confirmTitle": (count) => `Quitter définitivement ${count} ?`,
        "leave.confirmSub": "Il faudra une nouvelle invitation pour y revenir.",
        "leave.cancel": "Annuler",
        "leave.confirm": "Quitter définitivement",
        "leave.selected": (count, n) => `${count} ${plural(n, "sélectionné", "sélectionnés")}`,
        "leave.selectedSub": "Rien n'est quitté avant votre confirmation.",
        "leave.deselectAll": "Tout désélectionner",
        "leave.named": (x) => `Quitter ${x}`,
        "leave.desc": "Cochez les serveurs à quitter, puis confirmez en bas. Pour revenir dans un serveur quitté, il vous faudra une nouvelle invitation. Vous ne pouvez pas quitter un serveur dont vous êtes propriétaire.",
        "leave.selectResults": "Sélectionner les résultats",
        "leave.selectAll": "Tout sélectionner",
        "leave.owner": "Propriétaire"
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

// Icônes (24 px) qui prennent la couleur du texte
const SS_ICONS = {
    sidebar:  "M3 18h6v-2H3v2zm0-5h12v-2H3v2zm0-7v2h18V6H3z",
    close:    "M17.3 18.7a1 1 0 0 0 1.4-1.4L13.42 12l5.3-5.3a1 1 0 0 0-1.42-1.4L12 10.58l-5.3-5.3a1 1 0 0 0-1.4 1.42L10.58 12l-5.3 5.3a1 1 0 1 0 1.42 1.4L12 13.42l5.3 5.3Z",
    search:   "M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z",
    undo:     "M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z",
    shuffle:  "M10.59 9.17 5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z",
    alpha:    "M14.94 4.66h-4.72l2.36-2.36 2.36 2.36zm-4.69 14.71h4.66l-2.33 2.33-2.33-2.33zM6.1 6.27 1.6 17.73h1.84l.92-2.45h5.11l.92 2.45h1.84L7.74 6.27H6.1zm-1.13 7.37 1.94-5.18 1.94 5.18H4.97zm10.76 2.5h6.12v1.59h-8.53v-1.29l5.92-8.56h-5.88v-1.6h8.3v1.26l-5.93 8.6z",
    members:  "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z",
    boost:    "M19 3H5L2 9l10 12L22 9l-3-6zM9.62 8l1.5-3h1.76l1.5 3H9.62zM11 10v6.68L5.44 10H11zm2 0h5.56L13 16.68V10zm6.26-2h-2.65l-1.5-3h2.65l1.5 3zM6.24 5h2.65l-1.5 3H4.74l1.5-3z",
    calendar: "M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z",
    tune:     "M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z",
};

// Familles de tris, dans l'ordre du panneau (libellés lus à l'affichage, pour suivre la langue de Discord)
const SORT_GROUPS = [
    { id: "alpha",     get label() { return t("group.alpha"); },     icon: SS_ICONS.alpha },
    { id: "members",   get label() { return t("group.members"); },   icon: SS_ICONS.members },
    { id: "boosts",    get label() { return t("group.boosts"); },    icon: SS_ICONS.boost },
    { id: "dates",     get label() { return t("group.dates"); },     icon: SS_ICONS.calendar },
    { id: "structure", get label() { return t("group.structure"); }, icon: SS_ICONS.tune },
    { id: "other",     get label() { return t("group.other"); },     icon: SS_ICONS.shuffle },
];

// Recherche insensible à la casse et aux accents (« general » trouve « Général »)
const fold = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Initiales d'un serveur sans icône, comme dans la liste de Discord
const guildAcronym = (name) => {
    const letters = String(name || "").trim().split(/\s+/).filter(Boolean).map(w => Array.from(w)[0]).join("");
    return Array.from(letters || "?").slice(0, 4).join("");
};

// Infobulle à droite du bouton, comme celles de la liste des serveurs
const SideTip = {
    el: null,
    target: null,
    watch: null,
    onScroll: () => SideTip.hide(),
    show(target, title, sub) {
        if (!target?.isConnected) return;
        if (!this.el) {
            this.el = document.createElement("div");
            this.el.className = "ss-ui ss-tooltip ss-tooltip-right ss-side-tip";
            this.el.setAttribute("role", "tooltip");
        }
        const titleEl = document.createElement("div");
        titleEl.className = "ss-side-tip-title";
        titleEl.textContent = title;
        this.el.replaceChildren(titleEl);
        if (sub) {
            const subEl = document.createElement("div");
            subEl.className = "ss-side-tip-sub";
            subEl.textContent = sub;
            this.el.appendChild(subEl);
        }
        const r = target.getBoundingClientRect();
        this.el.style.left = `${r.right + 12}px`;
        this.el.style.top  = `${r.top + r.height / 2}px`;
        this.target = target;
        document.body.appendChild(this.el);
        // Disparaît si la liste défile ou si Discord retire le bouton
        clearInterval(this.watch);
        this.watch = setInterval(() => { if (!this.target?.isConnected) this.hide(); }, 500);
        window.addEventListener("scroll", this.onScroll, true);
    },
    hide() {
        clearInterval(this.watch);
        this.watch = null;
        window.removeEventListener("scroll", this.onScroll, true);
        this.target = null;
        this.el?.remove();
    }
};

const PLUGIN_CSS = `
/* Bouton dans la liste des serveurs */
#ss-sidebar-btn {
    /* Le bouton vit hors de .ss-ui : il reçoit ici les deux couleurs du kit qu'il utilise */
    --ss-brand: var(--brand-500, var(--brand-experiment, #5865f2)); --ss-focus: var(--focus-primary, #00b0f4);
    position: relative; display: flex; align-items: center; justify-content: center; height: 48px; margin: 0 0 8px; cursor: pointer; outline: none;
}
.ss-side-pill {
    position: absolute; top: 50%; left: 0; width: 4px; height: 0; opacity: 0;
    border-radius: 0 4px 4px 0; background: var(--header-primary, #f2f3f5);
    transform: translateY(-50%); transition: height .15s ease-out, opacity .15s ease-out;
}
#ss-sidebar-btn[data-active] .ss-side-pill { height: 8px; opacity: 1; }
#ss-sidebar-btn:hover .ss-side-pill, #ss-sidebar-btn:focus-visible .ss-side-pill { height: 20px; opacity: 1; }
#ss-sidebar-btn.ss-side-open .ss-side-pill { height: 40px; opacity: 1; }
.ss-side-icon {
    display: flex; align-items: center; justify-content: center; width: 48px; height: 48px;
    border-radius: 50%; background: var(--background-primary, #313338); color: var(--interactive-normal, #b5bac1);
    transition: border-radius .15s ease-out, background-color .15s ease-out, color .15s ease-out;
}
#ss-sidebar-btn[data-active] .ss-side-icon { color: var(--ss-brand); }
#ss-sidebar-btn:hover .ss-side-icon, #ss-sidebar-btn:focus-visible .ss-side-icon, #ss-sidebar-btn.ss-side-open .ss-side-icon {
    border-radius: 16px; background: var(--ss-brand); color: #fff;
}
#ss-sidebar-btn:focus-visible .ss-side-icon { box-shadow: 0 0 0 2px var(--ss-focus); }

/* Infobulle à droite (liste des serveurs) */
.ss-tooltip-right { transform: translate(0, -50%); }
.ss-tooltip-right::after { top: 50%; right: 100%; left: auto; margin: -5px 0 0; border-top-color: transparent; border-right-color: var(--ss-bg-float); }
.ss-side-tip { z-index: 1002; max-width: 220px; }
.ss-side-tip-title { color: var(--ss-header); font-size: 16px; font-weight: 600; line-height: 20px; }
.ss-side-tip-sub { margin-top: 2px; color: var(--ss-muted); font-size: 12px; font-weight: 500; line-height: 16px; }

/* Séparateur sous les serveurs épinglés */
.ss-pinned-last { margin-bottom: 22px !important; position: relative !important; }
.ss-pin-separator {
    position: absolute; bottom: -12px; left: 50%; transform: translateX(-50%);
    width: 32px; height: 2px; border-radius: 1px;
    background: var(--background-modifier-accent, rgba(78, 80, 88, 0.48));
    z-index: 100; pointer-events: none;
}

/* Fenêtre : le fond s'arrête après la colonne des serveurs pour voir le tri en direct */
.ss-panel-backdrop { padding: 32px; }
.ss-window {
    position: relative; display: flex; width: 1040px; max-width: 100%; height: 760px; max-height: 100%;
    overflow: hidden; border-radius: 12px; background: var(--ss-bg); outline: none;
    box-shadow: 0 0 0 1px var(--ss-border), var(--elevation-high, 0 8px 16px rgba(0, 0, 0, .24));
    animation: ss-pop .2s cubic-bezier(.2, .9, .3, 1.1);
}

/* Navigation (comme la colonne des paramètres de Discord) */
.ss-nav { display: flex; flex: 0 0 232px; flex-direction: column; padding: 20px 8px 16px 16px; background: var(--ss-bg-alt); }
.ss-brand { display: flex; align-items: center; gap: 10px; padding: 0 10px 16px; }
.ss-brand-icon { display: flex; flex: 0 0 auto; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 12px; background: var(--ss-brand); color: #fff; }
.ss-brand-name { color: var(--ss-header); font-size: 16px; font-weight: 600; line-height: 20px; }
.ss-nav-label { padding: 6px 10px; color: var(--channels-default, var(--ss-muted)); font-size: 12px; font-weight: 700; line-height: 16px; letter-spacing: .02em; text-transform: uppercase; }
.ss-nav-item {
    display: flex; align-items: center; gap: 8px; width: 100%; margin: 0 0 2px; padding: 6px 10px;
    border: none; border-radius: 6px; background: transparent; color: var(--interactive-normal, #b5bac1);
    font: inherit; font-size: 16px; font-weight: 500; line-height: 20px; text-align: left;
    cursor: pointer; transition: background-color .1s ease, color .1s ease;
}
.ss-nav-item:hover { background: var(--ss-hover); color: var(--interactive-hover, #dbdee1); }
.ss-nav-item[aria-current="page"] { background: var(--ss-selected); color: var(--interactive-active, #fff); cursor: default; }
.ss-nav-item:focus-visible { outline: 2px solid var(--ss-focus); outline-offset: -2px; }
.ss-nav-item-danger, .ss-nav-item-danger:hover, .ss-nav-item-danger[aria-current="page"] { color: var(--text-danger, var(--ss-danger)); }
.ss-nav-text { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ss-nav-count {
    flex: 0 0 auto; min-width: 16px; height: 16px; padding: 0 5px; border-radius: 8px;
    background: var(--ss-accent); color: var(--ss-header-alt);
    font-size: 12px; font-weight: 700; line-height: 16px; text-align: center;
}
.ss-nav-count-danger { background: var(--ss-danger); color: #fff; }
.ss-nav-sep { height: 1px; margin: 8px 10px; background: var(--ss-accent); }
.ss-nav-footer { margin-top: auto; padding: 16px 10px 0; }
.ss-nav-status-label { padding: 0; }
.ss-nav-status { margin: 4px 0 12px; color: var(--ss-text); font-size: 14px; line-height: 18px; overflow-wrap: anywhere; }
.ss-nav-footer .ss-btn svg { flex: 0 0 auto; }
.ss-nav-version { margin-top: 12px; color: var(--ss-muted); font-size: 12px; line-height: 16px; }

/* Contenu */
.ss-content { flex: 1 1 auto; min-width: 0; padding: 32px 76px 24px 40px; background: var(--ss-bg); }
.ss-page { max-width: 740px; }
.ss-page-title { margin: 0 0 8px; color: var(--ss-header); font-size: 20px; font-weight: 600; line-height: 24px; }
.ss-page-desc { margin: 0 0 24px; color: var(--ss-muted); font-size: 14px; line-height: 20px; }

/* Bouton fermer + « ÉCHAP » (comme les paramètres de Discord) */
.ss-close-wrap { position: absolute; top: 24px; right: 20px; display: flex; flex-direction: column; align-items: center; gap: 6px; }
.ss-close-circle {
    display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; padding: 0;
    border: 2px solid var(--interactive-normal, #b5bac1); border-radius: 50%; background: transparent;
    color: var(--interactive-normal, #b5bac1); cursor: pointer;
    transition: background-color .17s ease, color .17s ease, border-color .17s ease;
}
.ss-close-circle:hover { border-color: var(--interactive-hover, #dbdee1); background: var(--ss-hover); color: var(--interactive-hover, #dbdee1); }
.ss-close-circle:active { transform: translateY(1px); }
.ss-close-circle:focus-visible { outline: 2px solid var(--ss-focus); outline-offset: 2px; }
.ss-close-key { color: var(--interactive-normal, #b5bac1); font-size: 13px; font-weight: 600; line-height: 16px; user-select: none; }

/* Choix du tri (boutons radio de Discord) */
.ss-sort-default { margin-bottom: 24px; }
.ss-sort-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); align-items: start; gap: 24px 16px; }
.ss-group-label { display: flex; align-items: center; gap: 6px; }
.ss-group-label svg { flex: 0 0 auto; color: var(--ss-muted); }
.ss-option {
    display: flex; align-items: center; margin-bottom: 8px; border-radius: var(--ss-radius);
    background: var(--ss-bg-alt); color: var(--interactive-normal, #b5bac1);
    transition: background-color .1s ease, color .1s ease;
}
.ss-option:last-child { margin-bottom: 0; }
.ss-option:hover { background: var(--ss-hover); color: var(--interactive-hover, #dbdee1); }
.ss-option-checked, .ss-option-checked:hover { background: var(--ss-selected); color: var(--interactive-active, #fff); }
.ss-option-main {
    display: flex; flex: 1 1 auto; align-items: center; gap: 10px; min-width: 0; margin: 0; padding: 10px;
    border: none; border-radius: inherit; background: transparent; color: inherit;
    font: inherit; font-size: 16px; font-weight: 500; line-height: 20px; text-align: left; cursor: pointer;
}
.ss-option-checked .ss-option-main { cursor: default; }
.ss-option-main:focus-visible { outline: 2px solid var(--ss-focus); outline-offset: -2px; }
.ss-option-text { display: flex; flex-direction: column; min-width: 0; }
.ss-option-desc { margin-top: 2px; color: var(--ss-muted); font-size: 14px; font-weight: 400; line-height: 18px; }
.ss-option-action { margin-right: 10px; }
.ss-radio { position: relative; flex: 0 0 auto; width: 20px; height: 20px; border: 2px solid currentColor; border-radius: 50%; }
.ss-option-checked .ss-radio { border-color: var(--ss-brand); background: var(--ss-brand); }
.ss-option-checked .ss-radio::after { content: ""; position: absolute; inset: 4px; border-radius: 50%; background: #fff; }

/* Épinglés */
.ss-pinned { margin-bottom: 20px; }
.ss-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.ss-chip {
    display: inline-flex; align-items: center; gap: 6px; max-width: 240px; height: 28px; padding: 0 4px;
    border-radius: 14px; background: var(--ss-bg-deep); color: var(--ss-text); font-size: 14px; font-weight: 500;
}
.ss-chip-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ss-chip .ss-guild-acronym { background: var(--ss-accent); }
.ss-chip-remove {
    display: flex; flex: 0 0 auto; align-items: center; justify-content: center; width: 20px; height: 20px; padding: 0;
    border: none; border-radius: 50%; background: transparent; color: var(--interactive-normal, #b5bac1); cursor: pointer;
}
.ss-chip-remove:hover { background: var(--ss-hover); color: var(--interactive-hover, #dbdee1); }
.ss-chip-remove:focus-visible { outline: 2px solid var(--ss-focus); outline-offset: 1px; }

/* Recherche */
.ss-search .ss-input { min-height: 36px; padding: 8px 10px; font-size: 14px; line-height: 18px; }
.ss-search-icon { display: flex; padding: 0 10px 0 4px; color: var(--ss-muted); }
.ss-search-clear { width: 28px; height: 28px; margin-right: 4px; }
.ss-search-clear svg { width: 16px; height: 16px; }

/* Liste des serveurs */
.ss-list-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 24px; margin: 20px 0 8px; }
.ss-list-head .ss-label { margin: 0; }
.ss-list-head .ss-btn-link { color: var(--ss-link); font-weight: 500; }
.ss-guild-list { display: flex; flex-direction: column; gap: 2px; }
.ss-guild-row { min-height: 48px; cursor: pointer; }
.ss-guild-row-on, .ss-guild-row-on:hover { background: var(--ss-hover); }
.ss-guild-row-danger, .ss-guild-row-danger:hover { background: color-mix(in srgb, var(--ss-danger) 12%, transparent); }
.ss-guild-row-disabled { cursor: not-allowed; }
.ss-guild-row-disabled .ss-guild-name { color: var(--ss-muted); }
.ss-guild-name { flex: 1 1 auto; min-width: 0; overflow: hidden; color: var(--ss-text); font-size: 16px; font-weight: 500; line-height: 20px; text-overflow: ellipsis; white-space: nowrap; }
.ss-guild-icon { flex: 0 0 auto; width: 32px; height: 32px; border-radius: 50%; object-fit: cover; }
.ss-guild-icon-sm { width: 20px; height: 20px; }
.ss-guild-acronym {
    display: flex; align-items: center; justify-content: center; overflow: hidden;
    background: var(--ss-bg-deep); color: var(--ss-header);
    font-size: 12px; font-weight: 600; line-height: 1; white-space: nowrap; user-select: none;
}
.ss-guild-acronym[data-len="3"] { font-size: 11px; }
.ss-guild-acronym[data-len="4"] { font-size: 10px; }
.ss-guild-icon-sm.ss-guild-acronym { font-size: 8px; }
.ss-check input:disabled { opacity: .4; cursor: not-allowed; }
.ss-check-danger input:checked { border-color: var(--ss-danger); background-color: var(--ss-danger); }
.ss-empty-icon { color: var(--ss-muted); opacity: .6; }

/* Barre flottante de sélection (comme « modifications non enregistrées ») */
.ss-bar {
    position: sticky; bottom: 16px; z-index: 1; display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px;
    margin-top: 20px; padding: 10px 10px 10px 16px; border-radius: var(--ss-radius);
    background: var(--ss-bg-float); box-shadow: var(--elevation-high, 0 8px 16px rgba(0, 0, 0, .24));
    animation: ss-bar-in .2s ease-out;
}
.ss-bar-text { flex: 1 1 220px; min-width: 0; color: var(--ss-text); font-size: 14px; font-weight: 500; line-height: 20px; }
.ss-bar-title { color: var(--text-danger, var(--ss-danger)); font-weight: 600; }
.ss-bar-sub { color: var(--ss-muted); font-size: 12px; font-weight: 400; line-height: 16px; }
.ss-bar-actions { display: flex; flex: 0 0 auto; align-items: center; gap: 8px; margin-left: auto; }
.ss-bar-progress { margin-top: 6px; }
.ss-progress-danger { background: var(--ss-danger); }
@keyframes ss-bar-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

@media (max-width: 860px) {
    .ss-nav { flex-basis: 196px; }
    .ss-content { padding: 24px 68px 20px 24px; }
}
@media (max-width: 640px) {
    .ss-panel-backdrop { padding: 16px; }
    .ss-window { flex-direction: column; }
    .ss-nav { flex: 0 0 auto; flex-direction: row; flex-wrap: wrap; gap: 4px; padding: 12px 64px 12px 12px; }
    .ss-brand, .ss-nav-label, .ss-nav-sep, .ss-nav-footer, .ss-close-key { display: none; }
    .ss-nav-item { width: auto; margin: 0; }
    .ss-close-wrap { top: 12px; right: 12px; }
}
@media (max-height: 600px) { .ss-panel-backdrop { padding-top: 16px; padding-bottom: 16px; } }
`;

module.exports = class BetterSidebar {

    constructor(meta) { this.meta = meta; }

    // ─── CYCLE DE VIE ──────────────────────────────────────────────────────────

    start() {
        this._running       = true;
        this._currentSort   = BdApi.Data.load("BetterSidebar", "currentSort") || null;
        this._pinnedServers = BdApi.Data.load("BetterSidebar", "pinnedServers") || [];
        this._panelEl       = null;
        this._btnEl         = null;
        this._observer      = null;
        this._refreshQueued = false;
        this._lastPinnedId  = null;
        this._randomRanks   = new Map();
        this._startTimer    = null;

        BdApi.DOM.addStyle(STYLE_ID, discordKitCSS("ss") + PLUGIN_CSS);
        this._injectBtn();
        this._startSidebarObserver();

        if (this._currentSort || this._pinnedServers.length > 0) {
            this._startTimer = setTimeout(() => {
                this._startTimer = null;
                this._applySort(this._currentSort, this._pinnedServers);
            }, 1500);
        }
    }

    stop() {
        this._running = false;
        if (this._startTimer) { clearTimeout(this._startTimer); this._startTimer = null; }
        this._stopSidebarObserver();
        BdApi.Patcher.unpatchAll("BetterSidebar");
        this._btnEl?.remove();
        this._btnEl = null;
        this._hidePanel();
        this._lastPinnedId = null;
        this._clearSeparator();
        document.getElementById("ss-separator-style")?.remove(); // reliquat des versions < 5.1
        BdApi.DOM.removeStyle(STYLE_ID);
        SideTip.hide();
        this._safeEmitChange();
    }

    // ─── INJECTION DU BOUTON ───────────────────────────────────────────────────

    // Si la sidebar n'est pas encore là, l'observer réessaiera au prochain changement du DOM
    _injectBtn() {
        document.getElementById("ss-sidebar-btn")?.remove();

        const sidebar = document.querySelector('[class*="guilds_"]')
                     || document.querySelector('[class*="guildList_"]');
        if (!sidebar) return;

        const btn = document.createElement("div");
        btn.id = "ss-sidebar-btn";
        btn.setAttribute("role", "button");
        btn.setAttribute("tabindex", "0");
        btn.setAttribute("aria-label", t("side.aria"));
        btn.innerHTML = `<div class="ss-side-pill"></div><div class="ss-side-icon"><svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="${SS_ICONS.sidebar}"/></svg></div>`;
        if (this._isSortActive()) btn.setAttribute("data-active", "true");
        if (this._panelEl) btn.classList.add("ss-side-open");

        const toggle = () => {
            SideTip.hide();
            this._panelEl ? this._hidePanel() : this._showMegaModal();
        };
        btn.addEventListener("click", (e) => { e.stopPropagation(); toggle(); });
        btn.addEventListener("keydown", (e) => {
            if (e.key !== "Enter" && e.key !== " ") return;
            e.preventDefault();
            toggle();
        });
        // Infobulle à droite, comme celles des serveurs, avec l'ordre en cours
        const showTip = () => { if (!this._panelEl) SideTip.show(btn, t("sort.title"), this._sortSummary()); };
        btn.addEventListener("mouseenter", showTip);
        btn.addEventListener("mouseleave", () => SideTip.hide());
        btn.addEventListener("focus", () => { if (btn.matches(":focus-visible")) showTip(); });
        btn.addEventListener("blur", () => SideTip.hide());

        // Insertion robuste avec plusieurs stratégies
        const tries = [
            () => { const s = sidebar.querySelector('[class*="scroller_"]'); if (s) { s.prepend(btn); return true; } },
            () => { const f = sidebar.querySelector('[class*="listItem_"]'); if (f?.parentElement) { f.parentElement.prepend(btn); return true; } },
            () => { sidebar.prepend(btn); return true; },
        ];
        for (const t of tries) {
            try { if (t()) { this._btnEl = btn; return; } } catch(e) {}
        }
    }

    // Un seul observer, regroupé sur une frame : réinjecte le bouton et le séparateur si Discord les a retirés
    _startSidebarObserver() {
        this._stopSidebarObserver();
        this._observer = new MutationObserver(() => this._scheduleDomRefresh());
        this._observer.observe(document.getElementById("app-mount") || document.body, { childList: true, subtree: true });
    }

    _stopSidebarObserver() {
        this._observer?.disconnect();
        this._observer = null;
    }

    _scheduleDomRefresh() {
        if (this._refreshQueued) return;
        this._refreshQueued = true;
        requestAnimationFrame(() => {
            this._refreshQueued = false;
            if (!this._running) return;
            if (!document.getElementById("ss-sidebar-btn")) this._injectBtn();
            this._refreshSeparator();
        });
    }

    _sortSummary() {
        const crit = this._criteria().find(c => c.id === this._currentSort);
        const pins = this._pinnedServers?.length ?? 0;
        const parts = [];
        if (crit) parts.push(crit.label);
        if (pins) parts.push(t("pinned.count", pins));
        return parts.join(" · ");
    }

    _isSortActive() {
        return !!this._currentSort || (this._pinnedServers?.length ?? 0) > 0;
    }

    // ─── SÉPARATEUR SOUS LES ÉPINGLÉS ──────────────────────────────────────────

    _setLastPinned(id) {
        if (this._lastPinnedId === id) return;
        this._lastPinnedId = id;
        this._scheduleDomRefresh();
    }

    _clearSeparator() {
        document.querySelectorAll(".ss-pinned-last").forEach(e => {
            e.classList.remove("ss-pinned-last");
            e.querySelectorAll(":scope > .ss-pin-separator").forEach(s => s.remove());
        });
    }

    _refreshSeparator() {
        const id = this._lastPinnedId;
        if (!id) {
            if (document.querySelector(".ss-pinned-last")) this._clearSeparator();
            return;
        }

        const innerNode = document.querySelector(`[data-list-item-id$="${id}"]`);
        if (!innerNode) return;

        let guildNode = innerNode.closest('[class*="listItem"]');
        if (!guildNode) return;

        const topNode = guildNode.parentElement;
        if (topNode?.tagName === "DIV" && topNode.parentElement?.tagName === "UL") guildNode = topNode;

        if (guildNode.classList.contains("ss-pinned-last") && guildNode.querySelector(":scope > .ss-pin-separator")) return;

        this._clearSeparator();
        guildNode.classList.add("ss-pinned-last");
        // Séparateur dessiné par notre CSS : ne dépend d'aucune classe Discord hachée
        const sep = document.createElement("div");
        sep.className = "ss-pin-separator";
        guildNode.appendChild(sep);
    }

    // ─── STORES ────────────────────────────────────────────────────────────────

    _getSortedGuildStore() { return BdApi.Webpack.getStore("SortedGuildStore"); }
    _getGuildStore()       { return BdApi.Webpack.getStore("GuildStore"); }

    // ─── PATCH STORE + RE-RENDER ───────────────────────────────────────────────

    _applySort(sortId, pinnedServers) {
        if (sortId !== undefined) {
            this._currentSort = sortId;
            BdApi.Data.save("BetterSidebar", "currentSort", sortId);
        }
        if (pinnedServers !== undefined) {
            this._pinnedServers = pinnedServers;
            BdApi.Data.save("BetterSidebar", "pinnedServers", pinnedServers);
        }

        this._patchStore();
        this._safeEmitChange();

        if (this._isSortActive()) this._btnEl?.setAttribute("data-active", "true");
        else this._btnEl?.removeAttribute("data-active");
    }

    _patchStore() {
        BdApi.Patcher.unpatchAll("BetterSidebar");

        const store = this._getSortedGuildStore();
        if (!store) { console.warn("[BetterSidebar] SortedGuildStore introuvable"); return; }

        const crit = this._criteria().find(c => c.id === this._currentSort);
        if (!crit && (!this._pinnedServers || this._pinnedServers.length === 0)) {
            this._setLastPinned(null);
            return;
        }

        const proto = Object.getPrototypeOf(store);
        const self = this;
        const guildStore = this._getGuildStore();
        const isPinned = (id) => self._pinnedServers.includes(id);

        // Clone un nœud en préservant tout (getters, setters, prototype, non-énumérables)
        const cloneNode = (node) => {
            if (!node) return node;
            const clone = Object.create(Object.getPrototypeOf(node) ?? Object.prototype);
            Object.defineProperties(clone, Object.getOwnPropertyDescriptors(node));
            return clone;
        };

        const sortNodes = (nodes) => {
            const dataMap = new Map();
            const origIndexMap = new Map();
            nodes.forEach((n, i) => {
                dataMap.set(n, this._getNodeData(n, guildStore));
                origIndexMap.set(n, i);
            });

            return [...nodes].sort((a, b) => {
                const aPinned = isPinned(a.id);
                const bPinned = isPinned(b.id);
                if (aPinned && !bPinned) return -1;
                if (!aPinned && bPinned) return 1;

                if (!crit) return origIndexMap.get(a) - origIndexMap.get(b);
                return crit.fn(dataMap.get(a), dataMap.get(b));
            });
        };

        let lastOrigTree = null;
        let cachedSortedTree = null;

        // ── getGuildsTree : trie l'arbre entier, dossiers inclus ──────────────
        if (typeof proto.getGuildsTree === "function") {
            BdApi.Patcher.instead("BetterSidebar", proto, "getGuildsTree", (thisArg, args, origFn) => {
                const tree = origFn.call(thisArg, ...args);
                if (!tree?.root?.children) return tree;

                // === SYSTÈME DE CACHE ===
                if (lastOrigTree === tree && cachedSortedTree) return cachedSortedTree;
                lastOrigTree = tree;

                try {
                    const newRoot = cloneNode(tree.root);

                    const extractedPinned = [];
                    const processChildren = (nodes) => {
                        const remaining = [];
                        for (const node of nodes) {
                            if (node.children) {
                                const folderRemaining = [];
                                for (const child of node.children) {
                                    // Cloner l'enfant sans détruire son prototype ; parentId/folderId restent natifs
                                    if (isPinned(child.id)) extractedPinned.push(cloneNode(child));
                                    else folderRemaining.push(child);
                                }
                                node.children = folderRemaining;
                                // Un dossier dont tous les serveurs sont épinglés ne reste pas affiché vide
                                if (folderRemaining.length) remaining.push(node);
                            } else if (isPinned(node.id)) {
                                extractedPinned.push(node);
                            } else {
                                remaining.push(node);
                            }
                        }
                        return remaining;
                    };

                    // On clone les dossiers pour ne pas muter l'arbre original de Discord
                    const clonedRootChildren = tree.root.children.map(n => {
                        if (!n.children) return n;
                        const cloned = cloneNode(n);
                        cloned.children = [...n.children];
                        return cloned;
                    });

                    const rootRemaining = processChildren(clonedRootChildren);

                    // Trie la racine puis le contenu de chaque dossier
                    newRoot.children = sortNodes([...extractedPinned, ...rootRemaining]);
                    newRoot.children.forEach(node => {
                        if (node.children) node.children = sortNodes(node.children);
                    });

                    // Dernier serveur épinglé → séparation visuelle
                    let lastPinnedId = null;
                    for (let i = newRoot.children.length - 1; i >= 0; i--) {
                        if (isPinned(newRoot.children[i].id)) { lastPinnedId = newRoot.children[i].id; break; }
                    }
                    self._setLastPinned(lastPinnedId);

                    const newTree = cloneNode(tree);
                    newTree.root = newRoot;

                    cachedSortedTree = newTree;
                    return newTree;
                } catch(e) { console.warn("[BetterSidebar] getGuildsTree err:", e); return tree; }
            });
        }

        // Le patch de getFlattenedGuildIds a été retiré. Discord utilise sa version native qui marche mieux.
    }

    // Informe React que le store a changé de manière native
    _safeEmitChange() {
        const store = this._getSortedGuildStore();
        if (!store) return;

        // Méthode 1: emitChange officiel
        if (typeof store.emitChange === "function") {
            try { store.emitChange(); return; } catch(e) {}
        }

        // Méthode 2: appeler les listeners manuellement
        const listenerSets = [
            store._changeListeners, store._reactChangeListeners,
            store.__changeListeners, store._listeners,
        ].filter(Boolean);

        for (const col of listenerSets) {
            const ls = col.values ? [...col.values()] : [...col];
            for (const fn of ls) { try { fn(); } catch(e) {} }
        }
    }

    // ─── DONNÉES ───────────────────────────────────────────────────────────────

    // Rang aléatoire tiré une fois par serveur : ordre uniforme et stable tant qu'on ne relance pas le tri
    _randomRank(id) {
        let r = this._randomRanks.get(id);
        if (r === undefined) { r = Math.random(); this._randomRanks.set(id, r); }
        return r;
    }

    _getNodeData(node, guildStore) {
        // 1 = Serveur, 2 = Dossier
        if (node.type === 1 || !node.children) {
            const g = guildStore?.getGuild(node.id);
            if (!g) return { name: "", memberCount: 0, boostLevel: 0, boostCount: 0, isVerified: 0, isPartnered: 0, iconExists: 0, region: "", nsfwLevel: 0, createdAt: 0, joinedAt: 0, randomRank: this._randomRank(node.id) };
            return {
                id:          g.id,
                name:        g.name || "",
                memberCount: g.memberCount || 0,
                boostLevel:  g.premiumTier || 0,
                boostCount:  g.premiumSubscriptionCount || 0,
                isVerified:  g.verified ? 1 : 0,
                isPartnered: g.partnered ? 1 : 0,
                iconExists:  g.icon ? 1 : 0,
                region:      g.preferredLocale || "",
                nsfwLevel:   g.nsfwLevel || 0,
                createdAt:   Number((BigInt(g.id) >> 22n) + 1420070400000n),
                joinedAt:    g.joinedAt ? new Date(g.joinedAt).getTime() : 0,
                randomRank:  this._randomRank(g.id),
            };
        }

        // Dossier (virtuel) : on agrège les stats de ses enfants
        const children = node.children.map(c => guildStore?.getGuild(c.id)).filter(Boolean);
        const createdTimes = children.map(g => Number((BigInt(g.id) >> 22n) + 1420070400000n));
        const joinedTimes  = children.filter(g => g.joinedAt).map(g => new Date(g.joinedAt).getTime());
        return {
            id:          node.id,
            name:        node.name || t("folder.unnamed"),
            memberCount: children.reduce((sum, g) => sum + (g.memberCount || 0), 0),
            boostLevel:  Math.max(0, ...children.map(g => g.premiumTier || 0)),
            boostCount:  children.reduce((sum, g) => sum + (g.premiumSubscriptionCount || 0), 0),
            isVerified:  children.some(g => g.verified) ? 1 : 0,
            isPartnered: children.some(g => g.partnered) ? 1 : 0,
            iconExists:  1, // Toujours vrai pour un dossier visuellement
            region:      children[0]?.preferredLocale || "",
            nsfwLevel:   Math.max(0, ...children.map(g => g.nsfwLevel || 0)),
            // 0 plutôt qu'Infinity pour un dossier vide : Infinity - Infinity = NaN casserait le tri
            createdAt:   createdTimes.length ? Math.min(...createdTimes) : 0,
            joinedAt:    joinedTimes.length  ? Math.min(...joinedTimes)  : 0,
            randomRank:  this._randomRank(node.id),
        };
    }

    // ─── CRITÈRES ──────────────────────────────────────────────────────────────

    _criteria() {
        return [
            { id:"alpha_az",       label:t("crit.alpha_az"),       group:"alpha",     fn:(a,b)=>a.name.localeCompare(b.name,"fr",{sensitivity:"base"}) },
            { id:"alpha_za",       label:t("crit.alpha_za"),       group:"alpha",     fn:(a,b)=>b.name.localeCompare(a.name,"fr",{sensitivity:"base"}) },
            { id:"name_short",     label:t("crit.name_short"),     group:"alpha",     fn:(a,b)=>a.name.length-b.name.length },
            { id:"name_long",      label:t("crit.name_long"),      group:"alpha",     fn:(a,b)=>b.name.length-a.name.length },
            { id:"members_desc",   label:t("crit.members_desc"),   group:"members",   fn:(a,b)=>b.memberCount-a.memberCount },
            { id:"members_asc",    label:t("crit.members_asc"),    group:"members",   fn:(a,b)=>a.memberCount-b.memberCount },
            { id:"boost_lvl",      label:t("crit.boost_lvl"),      group:"boosts",    fn:(a,b)=>b.boostLevel-a.boostLevel },
            { id:"boost_count",    label:t("crit.boost_count"),    group:"boosts",    fn:(a,b)=>b.boostCount-a.boostCount },
            { id:"verified_first", label:t("crit.verified_first"), group:"boosts",    fn:(a,b)=>b.isVerified-a.isVerified },
            { id:"partnered",      label:t("crit.partnered"),      group:"boosts",    fn:(a,b)=>b.isPartnered-a.isPartnered },
            { id:"created_new",    label:t("crit.created_new"),    group:"dates",     fn:(a,b)=>b.createdAt-a.createdAt },
            { id:"created_old",    label:t("crit.created_old"),    group:"dates",     fn:(a,b)=>a.createdAt-b.createdAt },
            { id:"joined_new",     label:t("crit.joined_new"),     group:"dates",     fn:(a,b)=>b.joinedAt-a.joinedAt },
            { id:"joined_old",     label:t("crit.joined_old"),     group:"dates",     fn:(a,b)=>a.joinedAt-b.joinedAt },
            { id:"icon_first",     label:t("crit.icon_first"),     group:"structure", fn:(a,b)=>b.iconExists-a.iconExists },
            { id:"locale_az",      label:t("crit.locale_az"),      group:"structure", fn:(a,b)=>a.region.localeCompare(b.region) },
            { id:"nsfw_first",     label:t("crit.nsfw_first"),     group:"structure", fn:(a,b)=>(b.nsfwLevel>0?1:0)-(a.nsfwLevel>0?1:0) },
            { id:"random",         label:t("crit.random"), desc:t("crit.randomDesc"), group:"other", fn:(a,b)=>a.randomRank-b.randomRank },
        ];
    }

    // ─── PANNEAU REACT ─────────────────────────────────────────────────────────

    _showMegaModal() {
        if (this._panelEl) return;
        this._hidePanel(); // Par précaution
        SideTip.hide();

        const React = BdApi.React;
        const { useState, useEffect, useMemo, useRef } = React;
        const h = React.createElement;
        const self = this;

        const modalContainer = document.createElement("div");
        modalContainer.id = "ss-panel-root";
        document.body.appendChild(modalContainer);
        this._panelEl = modalContainer;

        const criteria = this._criteria();
        const groups = SORT_GROUPS
            .map(g => ({ ...g, items: criteria.filter(c => c.group === g.id) }))
            .filter(g => g.items.length);
        const meId = BdApi.Webpack.getStore("UserStore")?.getCurrentUser?.()?.id;
        const version = this.meta?.version;

        const Icon = ({ d, size = 24 }) => h("svg", { "aria-hidden": true, width: size, height: size, viewBox: "0 0 24 24" },
            h("path", { fill: "currentColor", d })
        );

        // Icône du serveur, ou ses initiales si elle manque ou ne charge pas
        function GuildIcon({ guild, small }) {
            const [broken, setBroken] = useState(false);
            const cls = "ss-guild-icon" + (small ? " ss-guild-icon-sm" : "");
            if (guild.icon && !broken) {
                return h("img", { className: cls, src: guild.icon, alt: "", loading: "lazy", onError: () => setBroken(true) });
            }
            const acronym = guildAcronym(guild.name);
            return h("div", { className: cls + " ss-guild-acronym", "data-len": Array.from(acronym).length, "aria-hidden": true }, acronym);
        }

        // Bord droit de la colonne des serveurs : le fond ne la recouvre pas, le tri se voit en direct
        const sidebarEdge = () => {
            const side = self._btnEl?.closest('[class*="guilds_"]') || document.querySelector('[class*="guilds_"]');
            const r = side?.getBoundingClientRect();
            return r && r.width > 0 && r.right < window.innerWidth / 2 ? Math.round(r.right) : 0;
        };

        function MegaModal() {
            const [page, setPage] = useState("sort");
            const [activeSort, setActiveSort] = useState(self._currentSort || null);
            const [pinned, setPinned] = useState(self._pinnedServers || []);
            const [search, setSearch] = useState("");
            const [selected, setSelected] = useState(() => new Set());
            const [confirming, setConfirming] = useState(false);
            const [progress, setProgress] = useState(null); // { done, total, stopping } pendant les départs
            const [edge, setEdge] = useState(sidebarEdge);
            const mountedRef = useRef(true);
            const stopRef = useRef(false);
            const pressRef = useRef(false);
            const confirmAtRef = useRef(0);
            const confirmRef = useRef(false);
            const windowRef = useRef(null);
            const searchRef = useRef(null);
            confirmRef.current = confirming;
            useEffect(() => () => { mountedRef.current = false; }, []);

            // Liste des serveurs, rafraîchie quand Discord la modifie (serveur quitté, rejoint, renommé…)
            const guildStore = useMemo(() => self._getGuildStore(), []);
            const [guildsVersion, setGuildsVersion] = useState(0);
            useEffect(() => {
                if (typeof guildStore?.addChangeListener !== "function") return;
                const onChange = () => setGuildsVersion(v => v + 1);
                guildStore.addChangeListener(onChange);
                return () => guildStore.removeChangeListener(onChange);
            }, [guildStore]);

            const allGuilds = useMemo(() => {
                if (!guildStore) return [];
                return Object.values(guildStore.getGuilds() || {}).map(g => ({
                    id: g.id,
                    name: g.name || "",
                    icon: g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=64` : null,
                    owned: !!meId && g.ownerId === meId,
                    key: fold(g.name)
                })).sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));
            }, [guildStore, guildsVersion]);

            const byId = useMemo(() => new Map(allGuilds.map(g => [g.id, g])), [allGuilds]);
            const pinnedGuilds = pinned.map(id => byId.get(id)).filter(Boolean);
            const pinnedCount = guildStore ? pinnedGuilds.length : pinned.length;
            const selectedIds = [...selected].filter(id => byId.has(id));
            const query = fold(search.trim());
            const filtered = query ? allGuilds.filter(g => g.key.includes(query)) : allGuilds;
            const selectable = filtered.filter(g => !g.owned);
            const allFilteredSelected = selectable.length > 0 && selectable.every(g => selected.has(g.id));
            const leaving = !!progress;
            const isActive = !!activeSort || pinned.length > 0;
            const crit = criteria.find(c => c.id === activeSort);

            // Le fond suit la largeur de la colonne des serveurs
            useEffect(() => {
                const onResize = () => setEdge(sidebarEdge());
                window.addEventListener("resize", onResize);
                return () => window.removeEventListener("resize", onResize);
            }, []);

            useEffect(() => { windowRef.current?.focus({ preventScroll: true }); }, []);

            // Échap annule la confirmation en cours, sinon ferme la fenêtre
            useEffect(() => {
                const onKey = (e) => {
                    if (e.key !== "Escape") return;
                    e.stopPropagation();
                    if (confirmRef.current) setConfirming(false);
                    else self._hidePanel();
                };
                window.addEventListener("keydown", onKey, true);
                return () => window.removeEventListener("keydown", onKey, true);
            }, []);

            const goTo = (id) => { setPage(id); setConfirming(false); };

            const applySort = (id) => {
                if (id === "random") self._randomRanks.clear(); // nouveau tirage à chaque fois
                setActiveSort(id);
                self._applySort(id, pinned);
            };

            const togglePin = (guildId) => {
                const next = pinned.includes(guildId) ? pinned.filter(id => id !== guildId) : [...pinned, guildId];
                setPinned(next);
                self._applySort(activeSort, next);
            };

            const resetAll = () => {
                setActiveSort(null);
                setPinned([]);
                self._resetSort();
            };

            const toggleSelected = (guildId) => {
                if (leaving) return;
                setSelected(prev => {
                    const next = new Set(prev);
                    if (next.has(guildId)) next.delete(guildId); else next.add(guildId);
                    return next;
                });
                setConfirming(false);
            };

            const toggleAllFiltered = () => {
                setSelected(prev => {
                    const next = new Set(prev);
                    selectable.forEach(g => { if (allFilteredSelected) next.delete(g.id); else next.add(g.id); });
                    return next;
                });
                setConfirming(false);
            };

            const askConfirm = () => { confirmAtRef.current = Date.now(); setConfirming(true); };

            // Confirmation intégrée au panneau : une modale BdApi s'ouvrirait derrière lui
            const leaveSelected = async (e) => {
                // Un double-clic sur « Quitter » ne doit pas valider la confirmation qui apparaît à sa place
                if (e?.detail > 1 || Date.now() - confirmAtRef.current < 500) return;
                setConfirming(false);
                const ids = selectedIds;
                if (ids.length === 0) return;

                const GuildLeaveAPI = BdApi.Webpack.getModule(m => m?.leaveGuild && !m?.joinGuild, { searchExports: true });
                if (!GuildLeaveAPI) { BdApi.UI.showToast(t("toast.apiError"), { type: "error" }); return; }

                stopRef.current = false;
                setProgress({ done: 0, total: ids.length, stopping: false });
                const left = [];
                let failCount = 0;
                for (const gid of ids) {
                    if (stopRef.current) break;
                    let ok = false;
                    try {
                        await GuildLeaveAPI.leaveGuild(gid);
                        left.push(gid);
                        ok = true;
                    } catch(err) {
                        failCount++;
                        console.warn("[BetterSidebar] Leave error", err);
                    }
                    const done = left.length + failCount;
                    if (mountedRef.current) setProgress(p => p && { ...p, done });
                    if (ok) await new Promise(r => setTimeout(r, 800)); // anti-ratelimit
                }
                const stopped = left.length + failCount < ids.length;

                // Un serveur quitté ne reste pas épinglé
                if (left.some(id => self._pinnedServers.includes(id))) {
                    const nextPinned = self._pinnedServers.filter(id => !left.includes(id));
                    self._applySort(undefined, nextPinned);
                    if (mountedRef.current) setPinned(nextPinned);
                }
                // Les échecs et les serveurs non traités restent cochés pour réessayer
                if (mountedRef.current) {
                    setProgress(null);
                    setSelected(prev => { const next = new Set(prev); left.forEach(id => next.delete(id)); return next; });
                }

                const summary = t("toast.left", left.length);
                if (failCount) BdApi.UI.showToast(t("toast.leftFailed", summary, failCount), { type: "warning" });
                else if (stopped) BdApi.UI.showToast(t("toast.leftStopped", summary), { type: "info" });
                else BdApi.UI.showToast(`${summary}.`, { type: "success" });
            };

            const stopLeaving = () => {
                stopRef.current = true;
                setProgress(p => p && { ...p, stopping: true });
            };

            // ── Navigation ──
            const navItem = (id, label, extra, danger) => h("button", {
                type: "button",
                className: "ss-nav-item" + (danger ? " ss-nav-item-danger" : ""),
                "aria-current": page === id ? "page" : undefined,
                onClick: () => goTo(id)
            }, h("span", { className: "ss-nav-text" }, label), extra || null);

            const statusText = (crit ? crit.label : t("sort.discord"))
                + (pinnedCount ? ` · ${t("pinned.count", pinnedCount)}` : "");

            const nav = h("nav", { className: "ss-nav ss-scroller", "aria-label": t("nav.aria") },
                h("div", { className: "ss-brand" },
                    h("div", { className: "ss-brand-icon" }, h(Icon, { d: SS_ICONS.sidebar, size: 20 })),
                    h("div", { className: "ss-brand-name", id: "ss-panel-title" }, "BetterSidebar")
                ),
                h("div", { className: "ss-nav-label" }, t("nav.serverList")),
                navItem("sort", t("nav.sort")),
                navItem("pins", t("nav.pinned"), pinnedCount > 0 && h("span", { className: "ss-nav-count" }, pinnedCount)),
                h("div", { className: "ss-nav-sep", role: "separator" }),
                navItem("leave", t("nav.leave"), selectedIds.length > 0 && h("span", { className: "ss-nav-count ss-nav-count-danger" }, selectedIds.length), true),
                h("div", { className: "ss-nav-footer" },
                    h("div", { className: "ss-nav-label ss-nav-status-label" }, t("nav.current")),
                    h("div", { className: "ss-nav-status" }, statusText),
                    h("button", { type: "button", className: "ss-btn ss-btn-sm ss-btn-block ss-btn-outline-danger", disabled: !isActive, onClick: resetAll },
                        h(Icon, { d: SS_ICONS.undo, size: 16 }), t("nav.reset")
                    ),
                    version && h("div", { className: "ss-nav-version" }, `Version ${version}`)
                )
            );

            const close = h("div", { className: "ss-close-wrap" },
                h("button", { type: "button", className: "ss-close-circle", "aria-label": t("close"), onClick: () => self._hidePanel() },
                    h(Icon, { d: SS_ICONS.close, size: 18 })
                ),
                h("div", { className: "ss-close-key", "aria-hidden": true }, t("close.key"))
            );

            // ── Trier ──
            const option = ({ key, label, desc, checked, onSelect, action }) =>
                h("div", { key, className: "ss-option" + (checked ? " ss-option-checked" : "") },
                    h("button", { type: "button", className: "ss-option-main", "aria-pressed": checked, onClick: checked ? undefined : onSelect },
                        h("span", { className: "ss-radio", "aria-hidden": true }),
                        h("span", { className: "ss-option-text" },
                            h("span", null, label),
                            desc && h("span", { className: "ss-option-desc" }, desc)
                        )
                    ),
                    action || null
                );

            const sortPage = () => h("div", { className: "ss-page" },
                h("h2", { className: "ss-page-title" }, t("sort.title")),
                h("p", { className: "ss-page-desc" }, t("sort.desc")),
                h("div", { className: "ss-sort-default" },
                    option({ label: t("sort.discord"), desc: t("sort.discordDesc"), checked: !activeSort, onSelect: () => applySort(null) })
                ),
                h("div", { className: "ss-sort-grid" },
                    groups.map(g => h("section", { key: g.id, "aria-label": g.label },
                        h("h3", { className: "ss-label ss-group-label" }, h(Icon, { d: g.icon, size: 16 }), g.label),
                        g.items.map(c => option({
                            key: c.id,
                            label: c.label,
                            desc: c.desc,
                            checked: activeSort === c.id,
                            onSelect: () => applySort(c.id),
                            action: c.id === "random" && activeSort === "random"
                                && h("button", { type: "button", className: "ss-btn ss-btn-xs ss-btn-secondary ss-option-action", onClick: () => applySort("random") }, t("sort.reshuffle"))
                        }))
                    ))
                )
            );

            // ── Recherche et liste communes ──
            const searchBox = h("div", { className: "ss-input-group ss-search" },
                h("input", {
                    ref: searchRef, className: "ss-input", type: "text", value: search, spellCheck: false,
                    placeholder: t("search.ph"), "aria-label": t("search.ph"),
                    onChange: (e) => setSearch(e.target.value)
                }),
                search
                    ? h("button", { type: "button", className: "ss-icon-btn ss-search-clear", "aria-label": t("search.clear"), onClick: () => { setSearch(""); searchRef.current?.focus(); } },
                        h(Icon, { d: SS_ICONS.close })
                    )
                    : h("span", { className: "ss-search-icon", "aria-hidden": true }, h(Icon, { d: SS_ICONS.search, size: 18 }))
            );

            const listTitle = query ? t("list.results", filtered.length) : t("list.all", allGuilds.length);

            const emptyState = () => h("div", { className: "ss-empty" },
                h("span", { className: "ss-empty-icon" }, h(Icon, { d: SS_ICONS.search, size: 40 })),
                !guildStore
                    ? [h("div", { key: "t", className: "ss-empty-title" }, t("empty.unavailable")),
                       h("div", { key: "d" }, t("empty.unavailableHint"))]
                    : allGuilds.length
                        ? [h("div", { key: "t", className: "ss-empty-title" }, t("empty.noMatch")),
                           h("div", { key: "d" }, t("empty.noMatchHint", search.trim()))]
                        : [h("div", { key: "t", className: "ss-empty-title" }, t("empty.none")),
                           h("div", { key: "d" }, t("empty.noneHint"))]
            );

            // ── Épinglés ──
            const pinsPage = () => h("div", { className: "ss-page" },
                h("h2", { className: "ss-page-title" }, t("pins.title")),
                h("p", { className: "ss-page-desc" }, t("pins.desc")),
                pinnedGuilds.length > 0 && h("div", { className: "ss-pinned" },
                    h("div", { className: "ss-label" }, t("pins.list", pinnedGuilds.length)),
                    h("div", { className: "ss-chips" },
                        pinnedGuilds.map(g => h("span", { key: g.id, className: "ss-chip" },
                            h(GuildIcon, { guild: g, small: true }),
                            h("span", { className: "ss-chip-name" }, g.name),
                            h("button", { type: "button", className: "ss-chip-remove", "aria-label": t("pins.unpin", g.name), onClick: () => togglePin(g.id) },
                                h(Icon, { d: SS_ICONS.close, size: 14 })
                            )
                        ))
                    )
                ),
                searchBox,
                h("div", { className: "ss-list-head" }, h("div", { className: "ss-label" }, listTitle)),
                filtered.length
                    ? h("div", { className: "ss-guild-list" },
                        filtered.map(g => {
                            const on = pinned.includes(g.id);
                            return h("label", { key: g.id, className: "ss-list-item ss-guild-row" + (on ? " ss-guild-row-on" : "") },
                                h(GuildIcon, { guild: g }),
                                h("span", { className: "ss-guild-name" }, g.name),
                                h("input", { type: "checkbox", className: "ss-switch", checked: on, onChange: () => togglePin(g.id), "aria-label": t("pins.pin", g.name) })
                            );
                        })
                    )
                    : emptyState()
            );

            // ── Quitter ──
            const count = selectedIds.length;
            const countText = t("leave.count", count);

            const selectionBar = () => {
                if (leaving) {
                    const pct = Math.round(progress.done / progress.total * 100);
                    return h("div", { className: "ss-bar", role: "status" },
                        h("div", { className: "ss-bar-text" },
                            h("div", null, progress.stopping ? t("leave.stopping") : t("leave.progress", progress.done, progress.total)),
                            h("div", { className: "ss-progress ss-bar-progress" },
                                h("div", { className: "ss-progress-bar ss-progress-danger", style: { width: `${pct}%` } })
                            )
                        ),
                        h("div", { className: "ss-bar-actions" },
                            h("button", { type: "button", className: "ss-btn ss-btn-sm ss-btn-secondary", disabled: progress.stopping, onClick: stopLeaving }, t("leave.stop"))
                        )
                    );
                }
                if (count === 0) return null;
                if (confirming) {
                    return h("div", { className: "ss-bar", role: "alertdialog", "aria-label": t("leave.confirmAria") },
                        h("div", { className: "ss-bar-text" },
                            h("div", { className: "ss-bar-title" }, t("leave.confirmTitle", countText)),
                            h("div", { className: "ss-bar-sub" }, t("leave.confirmSub"))
                        ),
                        h("div", { className: "ss-bar-actions" },
                            h("button", { key: "cancel", type: "button", className: "ss-btn ss-btn-sm ss-btn-link", onClick: () => setConfirming(false) }, t("leave.cancel")),
                            h("button", { key: "confirm", type: "button", className: "ss-btn ss-btn-sm ss-btn-danger", onClick: leaveSelected }, t("leave.confirm"))
                        )
                    );
                }
                return h("div", { className: "ss-bar" },
                    h("div", { className: "ss-bar-text" },
                        h("div", null, t("leave.selected", countText, count)),
                        h("div", { className: "ss-bar-sub" }, t("leave.selectedSub"))
                    ),
                    h("div", { className: "ss-bar-actions" },
                        h("button", { key: "clear", type: "button", className: "ss-btn ss-btn-sm ss-btn-link", onClick: () => setSelected(new Set()) }, t("leave.deselectAll")),
                        h("button", { key: "ask", type: "button", className: "ss-btn ss-btn-sm ss-btn-danger", onClick: askConfirm }, t("leave.named", countText))
                    )
                );
            };

            const leavePage = () => h("div", { className: "ss-page" },
                h("h2", { className: "ss-page-title" }, t("nav.leave")),
                h("p", { className: "ss-page-desc" }, t("leave.desc")),
                searchBox,
                h("div", { className: "ss-list-head" },
                    h("div", { className: "ss-label" }, listTitle),
                    selectable.length > 0 && h("button", { type: "button", className: "ss-btn ss-btn-link ss-btn-xs", disabled: leaving, onClick: toggleAllFiltered },
                        allFilteredSelected ? t("leave.deselectAll") : (query ? t("leave.selectResults") : t("leave.selectAll"))
                    )
                ),
                filtered.length
                    ? h("div", { className: "ss-guild-list" },
                        filtered.map(g => {
                            const on = selected.has(g.id);
                            return h("label", { key: g.id, className: "ss-list-item ss-guild-row" + (on ? " ss-guild-row-danger" : "") + (g.owned ? " ss-guild-row-disabled" : "") },
                                h("span", { className: "ss-check ss-check-danger" },
                                    h("input", { type: "checkbox", checked: on, disabled: g.owned || leaving, onChange: () => toggleSelected(g.id), "aria-label": t("leave.named", g.name) })
                                ),
                                h(GuildIcon, { guild: g }),
                                h("span", { className: "ss-guild-name" }, g.name),
                                g.owned && h("span", { className: "ss-pill" }, t("leave.owner"))
                            );
                        })
                    )
                    : emptyState(),
                selectionBar()
            );

            return h("div", {
                className: "ss-ui ss-backdrop ss-panel-backdrop",
                style: edge ? { left: `${edge}px` } : undefined,
                // Ne ferme que si le clic commence et finit sur le fond (pas en fin de sélection de texte)
                onMouseDown: (e) => { pressRef.current = e.target === e.currentTarget; },
                onClick: (e) => { if (pressRef.current && e.target === e.currentTarget) self._hidePanel(); pressRef.current = false; }
            },
                h("div", { ref: windowRef, className: "ss-window", role: "dialog", "aria-labelledby": "ss-panel-title", tabIndex: -1 },
                    nav,
                    h("div", { key: page, className: "ss-content ss-scroller" },
                        page === "sort" ? sortPage() : page === "pins" ? pinsPage() : leavePage()
                    ),
                    close
                )
            );
        }

        if (BdApi.ReactDOM && BdApi.ReactDOM.createRoot) {
            this._reactRoot = BdApi.ReactDOM.createRoot(modalContainer);
            this._reactRoot.render(React.createElement(MegaModal));
        } else if (BdApi.ReactDOM && typeof BdApi.ReactDOM.render === "function") {
            BdApi.ReactDOM.render(React.createElement(MegaModal), modalContainer);
        }
        this._btnEl?.classList.add("ss-side-open");
    }

    _hidePanel() {
        if (this._panelEl) {
            const hadFocus = this._panelEl.contains(document.activeElement);
            try {
                if (this._reactRoot) {
                    this._reactRoot.unmount();
                    this._reactRoot = null;
                } else if (BdApi.ReactDOM && typeof BdApi.ReactDOM.unmountComponentAtNode === "function") {
                    BdApi.ReactDOM.unmountComponentAtNode(this._panelEl);
                }
            } catch(e) {
                console.error("[BetterSidebar] Erreur lors du démontage React:", e);
            }
            this._panelEl.remove();
            this._panelEl = null;
            // Le focus revient au bouton de la liste (navigation au clavier)
            if (hadFocus && this._btnEl?.isConnected) this._btnEl.focus({ preventScroll: true });
        }
        this._btnEl?.classList.remove("ss-side-open");
    }

    _resetSort() {
        BdApi.Data.delete("BetterSidebar", "currentSort");
        BdApi.Data.delete("BetterSidebar", "pinnedServers");
        this._currentSort = null;
        this._pinnedServers = [];
        this._randomRanks.clear();
        BdApi.Patcher.unpatchAll("BetterSidebar");
        this._setLastPinned(null);
        this._safeEmitChange();
        this._btnEl?.removeAttribute("data-active");
        BdApi.UI.showToast(t("toast.reset"),
 { type: "info" });
    }
};
