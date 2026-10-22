/**
 * @name DeleteAllMessages
 * @author AaronL2L
 * @version 1.0.0
 * @description Delete your messages in batches from an “only you can see this” message, styled like Discord, with optional filters and local backup. English and French.
 * @invite HdXp7sWRY3
 * @website https://valientebot.xyz
 * @source https://github.com/AaronL2L/BetterDiscordPlugins/tree/main/DeleteAllMessages
 * @updateUrl https://raw.githubusercontent.com/AaronL2L/BetterDiscordPlugins/main/DeleteAllMessages/DeleteAllMessages.plugin.js
 */

const MAX_RETRIES = 5;
const STYLE_ID = "DeleteAllMessages-styles";

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
        "menu.deleteAll": "Delete all my messages",
        "time.locale": "en-US",
        "embed.aria": "Deletion manager, only visible to you",
        "embed.today": (time) => `Today at ${time}`,
        "embed.title": "Deletion manager",
        "embed.intro": "Click <strong>Count</strong> to scan this conversation.",
        "stats.mine": "My messages",
        "stats.deleted": "Deleted",
        "stats.remaining": "Remaining",
        "stats.progress": "Progress",
        "opts.title": "Filters and backup",
        "opts.count": (n) => `${n} ${plural(n, "filter", "filters")}`,
        "opts.backup": "<strong>Save a local copy</strong> of each message before deleting it",
        "opts.backupHint": "Text file <strong>DeleteAllMessages_Backup.txt</strong> in the plugins folder.",
        "opts.files": "Only messages with attachments",
        "opts.keyword": "Required keyword",
        "opts.keywordPh": "Leave empty for all messages",
        "opts.from": "From",
        "opts.to": "Until (included)",
        "note.onlyYou": "Only you can see this •",
        "note.dismiss": "Dismiss message",
        "amount.aria": "Number of messages to delete",
        "amount.suffix": "messages",
        "btn.count": "Count",
        "btn.recount": "Recount",
        "btn.delete": "Delete",
        "btn.deleteN": (n) => `Delete ${n} ${plural(n, "message", "messages")}`,
        "btn.stop": "Stop",
        "btn.check": "Check",
        "status.waiting": "Waiting…",
        "status.noRest": "Discord's internal HTTP module was not found — the plugin needs an update.",
        "status.filtersChanged": "Filters changed — click Recount to update the total.",
        "status.counting": "Counting…",
        "status.found": (n) => `${n} ${plural(n, "message", "messages")} found…`,
        "status.foundDone": (n) => `${n} ${plural(n, "message", "messages")} found.`,
        "status.none": "No messages to delete.",
        "status.deleting": (n) => `Deleting ${n} ${plural(n, "message", "messages")}…`,
        "status.stopping": "Stopping…",
        "status.stopped": (n) => `Stopped — ${n} deleted in this batch.`,
        "status.batchDone": (n) => `Batch done — ${n} deleted. Recounting…`,
        "status.allDone": "All your messages have been deleted.",
        "status.left": (n) => `${n} ${plural(n, "message", "messages")} left.`,
        "status.tooManyErrors": "Stopped: too many API errors (heavy rate limiting).",
        "status.pause": "Short anti-bot pause (5 to 9 seconds)…",
        "status.resume": "Resuming deletion…",
        "sub.scanning": "Scanning the conversation…",
        "sub.none": "This conversation has none of your messages.",
        "sub.total": (n) => `You have <strong>${n} ${plural(n, "message", "messages")}</strong> in this conversation.`,
        "sub.leftAbout": (n) => `About <strong>${n} ${plural(n, "message", "messages")}</strong> left to delete.`,
        "sub.left": (n) => `<strong>${n} ${plural(n, "message", "messages")}</strong> left to delete.`,
        "sub.allDone": "This conversation no longer has any of your messages.",
        "backup.files": (n) => `[+${n} ${plural(n, "file", "files")}] `,
        "backup.channel": (id) => `[Channel: ${id}]`,
        "backup.noText": "<No text>",
        "settings.usageTitle": "How to use",
        "settings.usage": "Right-click a conversation, a channel or a member → <strong>Delete all my messages</strong>. A message only you can see appears in the channel: count your messages, choose how many to delete, then start the batch.",
        "settings.whatTitle": "What gets deleted",
        "settings.what1": "Only your text messages and replies; pinned messages are skipped.",
        "settings.what2": "Optional filters: keyword, attachments, date range.",
        "settings.what3": "Optional backup to <strong>DeleteAllMessages_Backup.txt</strong> (plugins folder).",
        "settings.warning": "Random delays, reads in blocks of 50 and natural pauses to protect your account. Deletion is permanent."
    },
    fr: {
        "menu.deleteAll": "Supprimer tous mes messages",
        "time.locale": "fr-FR",
        "embed.aria": "Gestionnaire de suppression, visible par toi seul",
        "embed.today": (time) => `Aujourd'hui à ${time}`,
        "embed.title": "Gestionnaire de suppression",
        "embed.intro": "Clique sur <strong>Compter</strong> pour analyser cette conversation.",
        "stats.mine": "Mes messages",
        "stats.deleted": "Supprimés",
        "stats.remaining": "Restants",
        "stats.progress": "Progression",
        "opts.title": "Filtres et sauvegarde",
        "opts.count": (n) => `${n} ${plural(n, "filtre", "filtres")}`,
        "opts.backup": "<strong>Sauvegarder localement</strong> chaque message avant de le supprimer",
        "opts.backupHint": "Fichier texte <strong>DeleteAllMessages_Backup.txt</strong> dans le dossier des plugins.",
        "opts.files": "Seulement les messages avec des pièces jointes",
        "opts.keyword": "Mot-clé obligatoire",
        "opts.keywordPh": "Laisser vide pour tous les messages",
        "opts.from": "À partir du",
        "opts.to": "Jusqu'au (inclus)",
        "note.onlyYou": "Toi seul peux voir ce message •",
        "note.dismiss": "Ignorer le message",
        "amount.aria": "Nombre de messages à supprimer",
        "amount.suffix": "messages",
        "btn.count": "Compter",
        "btn.recount": "Recompter",
        "btn.delete": "Supprimer",
        "btn.deleteN": (n) => `Supprimer ${n} ${plural(n, "message", "messages")}`,
        "btn.stop": "Arrêter",
        "btn.check": "Vérifier",
        "status.waiting": "En attente…",
        "status.noRest": "Module HTTP interne de Discord introuvable — le plugin doit être mis à jour.",
        "status.filtersChanged": "Filtres modifiés — clique sur Recompter pour mettre à jour le total.",
        "status.counting": "Comptage en cours…",
        "status.found": (n) => `${n} ${plural(n, "message trouvé", "messages trouvés")}…`,
        "status.foundDone": (n) => `${n} ${plural(n, "message trouvé", "messages trouvés")}.`,
        "status.none": "Aucun message à supprimer.",
        "status.deleting": (n) => `Suppression de ${n} ${plural(n, "message", "messages")} en cours…`,
        "status.stopping": "Arrêt demandé…",
        "status.stopped": (n) => `Arrêté — ${n} ${plural(n, "supprimé", "supprimés")} dans ce lot.`,
        "status.batchDone": (n) => `Lot terminé — ${n} ${plural(n, "supprimé", "supprimés")}. Recomptage…`,
        "status.allDone": "Tous tes messages ont été supprimés.",
        "status.left": (n) => `${n} ${plural(n, "message restant", "messages restants")}.`,
        "status.tooManyErrors": "Interrompu : trop d'erreurs de l'API (limite de débit sévère).",
        "status.pause": "Petite pause anti-bot (5 à 9 secondes)…",
        "status.resume": "Reprise de la suppression…",
        "sub.scanning": "Analyse de la conversation…",
        "sub.none": "Cette conversation ne contient aucun de tes messages.",
        "sub.total": (n) => `Tu as <strong>${n} ${plural(n, "message", "messages")}</strong> dans cette conversation.`,
        "sub.leftAbout": (n) => `Il reste environ <strong>${n} ${plural(n, "message", "messages")}</strong> à supprimer.`,
        "sub.left": (n) => `Il reste <strong>${n} ${plural(n, "message", "messages")}</strong> à supprimer.`,
        "sub.allDone": "Cette conversation ne contient plus aucun de tes messages.",
        "backup.files": (n) => `[+${n} ${plural(n, "fichier", "fichiers")}] `,
        "backup.channel": (id) => `[Salon : ${id}]`,
        "backup.noText": "<Pas de texte>",
        "settings.usageTitle": "Utilisation",
        "settings.usage": "Clic droit sur une conversation, un salon ou un membre → <strong>Supprimer tous mes messages</strong>. Un message visible par toi seul apparaît dans le salon : compte tes messages, choisis combien en supprimer, puis lance le lot.",
        "settings.whatTitle": "Ce qui est supprimé",
        "settings.what1": "Uniquement tes messages texte et tes réponses ; les messages épinglés sont ignorés.",
        "settings.what2": "Filtres facultatifs : mot-clé, pièces jointes, période.",
        "settings.what3": "Sauvegarde facultative dans <strong>DeleteAllMessages_Backup.txt</strong> (dossier des plugins).",
        "settings.warning": "Délais aléatoires, lecture par blocs de 50 et pauses organiques pour protéger ton compte. La suppression est définitive."
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

// ─── Icônes (style Discord, prennent la couleur du texte) ────────────────────
const TRASH_PATH = "M9 2a1 1 0 0 0-1 1v1H4a1 1 0 0 0 0 2h16a1 1 0 1 0 0-2h-4V3a1 1 0 0 0-1-1H9ZM5 8h14l-.86 11.2A3 3 0 0 1 15.15 22H8.85a3 3 0 0 1-2.99-2.8L5 8Zm5 3a1 1 0 0 0-1 1v6a1 1 0 1 0 2 0v-6a1 1 0 0 0-1-1Zm4 0a1 1 0 0 0-1 1v6a1 1 0 1 0 2 0v-6a1 1 0 0 0-1-1Z";
const ICON_TRASH = `<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="${TRASH_PATH}"/></svg>`;
const ICON_CHEVRON = `<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M5.3 9.3a1 1 0 0 1 1.4 0L12 14.58l5.3-5.3a1 1 0 1 1 1.4 1.42l-6 6a1 1 0 0 1-1.4 0l-6-6a1 1 0 0 1 0-1.42Z"/></svg>`;
const ICON_EYE = `<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5ZM12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"/></svg>`;

// Icône du menu contextuel (BdApi.ContextMenu transmet la prop `icon`)
const TrashIcon = (props) => BdApi.React.createElement("svg",
    { className: props?.className, width: 18, height: 18, viewBox: "0 0 24 24", "aria-hidden": true },
    BdApi.React.createElement("path", { fill: "currentColor", fillRule: "evenodd", d: TRASH_PATH })
);

// Mise en page d'un message « visible par toi seul » (mode confortable de Discord)
const PLUGIN_CSS = `
.dam-ephemeral {
    position: relative; min-height: 44px; margin: 17px 0 4px; padding: 2px 48px 6px 72px;
    background: color-mix(in srgb, var(--dam-brand) 5%, transparent);
}
.dam-ephemeral:hover { background: color-mix(in srgb, var(--dam-brand) 8%, transparent); }
.dam-ephemeral.dam-floating {
    position: fixed; bottom: 80px; left: 50%; z-index: 9999; transform: translateX(-50%);
    width: min(620px, calc(100vw - 32px)); margin: 0; padding: 12px 16px 12px 72px;
    border-radius: 12px; background: var(--dam-bg);
    box-shadow: 0 0 0 1px var(--dam-border), var(--elevation-high, 0 8px 16px rgba(0, 0, 0, .24));
}
.dam-app-avatar {
    position: absolute; top: 4px; left: 16px; width: 40px; height: 40px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 50%; background: var(--dam-brand); color: #fff;
}
.dam-floating .dam-app-avatar { top: 14px; }
.dam-app-avatar svg { width: 22px; height: 22px; }
.dam-msg-header { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; min-height: 22px; }
.dam-author { color: var(--dam-header); font-size: 16px; font-weight: 500; line-height: 22px; }
.dam-msg-header .dam-tag { margin-left: 2px; }
.dam-time { margin-left: 4px; color: var(--dam-muted); font-size: 12px; font-weight: 500; line-height: 22px; }
.dam-embed, .dam-options { max-width: 520px; }
.dam-embed {
    margin-top: 4px; padding: 8px 16px 16px 12px;
    border-left: 4px solid var(--dam-warning); border-radius: 4px; background: var(--dam-bg-alt);
}
.dam-embed-title { margin-top: 8px; color: var(--dam-header); font-size: 16px; font-weight: 600; line-height: 22px; }
.dam-embed-desc { margin-top: 8px; color: var(--dam-text); font-size: 14px; line-height: 18px; }
.dam-embed-desc strong { color: var(--dam-header); font-weight: 600; }
.dam-stats { display: flex; flex-wrap: wrap; gap: 8px 28px; margin-top: 16px; }
.dam-stat-danger { color: var(--dam-danger); }
.dam-stat-success { color: var(--dam-success); }
.dam-embed .dam-progress { margin-top: 16px; }
#dam-bar { background: linear-gradient(90deg, var(--dam-warning), var(--dam-danger)); }
.dam-status { display: flex; align-items: center; gap: 6px; min-height: 16px; margin-top: 8px; color: var(--dam-muted); font-size: 12px; font-weight: 500; line-height: 16px; }
.dam-status[data-tone="success"] { color: var(--text-positive, var(--dam-success)); }
.dam-status[data-tone="danger"] { color: var(--text-danger, var(--dam-danger)); }
.dam-status[data-tone="warning"] { color: var(--text-warning, var(--dam-warning)); }
.dam-status[data-tone="busy"]::before {
    content: ""; flex: 0 0 auto; width: 8px; height: 8px;
    border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%;
    animation: dam-spin .8s linear infinite;
}
@keyframes dam-spin { to { transform: rotate(360deg); } }
.dam-options { margin-top: 8px; border: 1px solid var(--dam-border); border-radius: var(--dam-radius); background: var(--dam-bg-alt); }
.dam-options > summary {
    display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: var(--dam-radius);
    color: var(--dam-header-alt); font-size: 14px; font-weight: 500; line-height: 20px;
    list-style: none; cursor: pointer; user-select: none; transition: color .1s ease;
}
.dam-options > summary::-webkit-details-marker { display: none; }
.dam-options > summary:hover { color: var(--dam-header); }
.dam-options > summary:focus-visible { outline: 2px solid var(--dam-focus); outline-offset: 2px; }
.dam-options > summary svg { flex: 0 0 auto; transform: rotate(-90deg); transition: transform .15s ease; }
.dam-options[open] > summary svg { transform: none; }
.dam-options > summary .dam-pill { margin-left: auto; }
.dam-options > summary .dam-pill:empty { display: none; }
.dam-options-body { display: flex; flex-direction: column; gap: 12px; padding: 4px 12px 12px; }
.dam-options-body .dam-label { margin-bottom: 6px; }
.dam-options-body .dam-hint { margin: -6px 0 0 28px; font-size: 12px; line-height: 16px; }
.dam-dates { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.dam-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 8px; }
.dam-actions:empty { display: none; }
.dam-amount { width: 156px; }
.dam-amount .dam-input { min-height: 30px; padding-right: 4px; font-weight: 600; text-align: right; }
.dam-amount .dam-input::-webkit-inner-spin-button,
.dam-amount .dam-input::-webkit-outer-spin-button { margin: 0; -webkit-appearance: none; }
.dam-ephemeral-note { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; margin-top: 4px; color: var(--dam-muted); font-size: 12px; line-height: 16px; }
.dam-ephemeral-note svg { flex: 0 0 auto; }
.dam-ephemeral-note .dam-link:focus-visible { outline: 2px solid var(--dam-focus); outline-offset: 2px; border-radius: 2px; }
.dam-settings { display: flex; flex-direction: column; gap: 16px; }
.dam-settings ul { margin: 8px 0 0; padding-left: 20px; color: var(--dam-muted); line-height: 20px; }
.dam-settings li + li { margin-top: 4px; }
`;

module.exports = class DeleteAllMessages {

    constructor(meta) {
        this.meta = meta;
        this.patches = [];
        this.running = false;
        this.cancelled = false;
        this.embedNode = null;
        this.hasCounted = false;
        this.stopRequested = false;
        this.totalMessages = 0;
        this.deletedMessages = 0;
        this.restAPI = null;
    }

    start() {
        BdApi.DOM.addStyle(STYLE_ID, discordKitCSS("dam") + PLUGIN_CSS);
        this.patchContextMenus();
    }

    stop() {
        this.cancelled = true;
        this.running = false;
        this.removeEmbed();
        for (const unpatch of this.patches) {
            try { unpatch(); } catch(e) {}
        }
        this.patches = [];
        BdApi.DOM.removeStyle(STYLE_ID);
    }

    getCurrentUserId() {
        return BdApi.Webpack.getStore("UserStore")?.getCurrentUser()?.id;
    }

    getCurrentChannelId() {
        const match = location.pathname.match(/\/channels\/[^/]+\/(\d+)/);
        if (match) return match[1];
        try { return BdApi.Webpack.getStore("SelectedChannelStore")?.getChannelId?.(); } catch(e) {}
        return null;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    randomSleep(min, max) {
        return this.sleep(Math.floor(Math.random() * (max - min + 1)) + min);
    }

    getOptions() {
        if (!this.embedNode) return { backup: false, keyword: "", files: false, startDate: null, endDate: null };
        const q = sel => this.embedNode.querySelector(sel);
        return {
            backup: q("#dam-opt-backup")?.checked ?? false,
            keyword: (q("#dam-opt-keyword")?.value || "").toLowerCase().trim(),
            files: q("#dam-opt-files")?.checked ?? false,
            startDate: q("#dam-opt-start")?.value ? new Date(q("#dam-opt-start").value).getTime() : null,
            endDate: q("#dam-opt-end")?.value ? new Date(q("#dam-opt-end").value).getTime() + 86399999 : null // Included end day
        };
    }

    filterMessage(m, opts) {
        if (m.author?.id !== this.getCurrentUserId() || m.pinned || (m.type !== 0 && m.type !== 19)) return false;
        if (opts.keyword && !(m.content || "").toLowerCase().includes(opts.keyword)) return false;
        if (opts.files && (!m.attachments || m.attachments.length === 0)) return false;
        if (opts.startDate || opts.endDate) {
            const msgTime = new Date(m.timestamp).getTime();
            if (opts.startDate && msgTime < opts.startDate) return false;
            if (opts.endDate && msgTime > opts.endDate) return false;
        }
        return true;
    }

    saveBackup(channelId, msg) {
        try {
            const fs = require("fs");
            const path = require("path");
            const folder = typeof BdApi !== "undefined" && BdApi.Plugins ? BdApi.Plugins.folder : process.env.APPDATA || "";
            const backupPath = path.join(folder, "DeleteAllMessages_Backup.txt");
            const timeStr = new Date(msg.timestamp).toLocaleString();
            const attachStr = msg.attachments && msg.attachments.length ? t("backup.files", msg.attachments.length) : "";
            const logLine = `[${timeStr}] ${t("backup.channel", channelId)} ${attachStr}${msg.content || t("backup.noText")}\n`;
            fs.appendFileSync(backupPath, logLine, "utf8");
        } catch(e) {
            console.error("[DeleteAllMessages] Erreur lors de la sauvegarde :", e);
        }
    }

    // ─── API (module HTTP interne de Discord : aucun token à manipuler) ───────

    getRestAPI() {
        if (!this.restAPI) {
            this.restAPI = BdApi.Webpack.getModule(
                m => typeof m === "object" && typeof m?.get === "function" && typeof m?.put === "function" && typeof m?.del === "function",
                { searchExports: true }
            );
        }
        return this.restAPI;
    }

    async apiRequest(method, url, query, attempt = 0) {
        const RestAPI = this.getRestAPI();
        if (!RestAPI) throw new Error("Module HTTP interne de Discord introuvable");
        try {
            const res = await RestAPI[method](query ? { url, query } : { url });
            if (res?.ok === false) throw res;
            return res;
        } catch(err) {
            // Nombre de tentatives borné : plus de récursion infinie sur les 429
            if (err?.status === 429 && attempt < MAX_RETRIES) {
                await this.sleep((err.body?.retry_after ?? 2) * 1000 + 500);
                return this.apiRequest(method, url, query, attempt + 1);
            }
            throw err;
        }
    }

    async fetchMessages(channelId, beforeId = null) {
        const query = { limit: 50 };
        if (beforeId) query.before = beforeId;
        try {
            const res = await this.apiRequest("get", `/channels/${channelId}/messages`, query);
            return Array.isArray(res?.body) ? res.body : [];
        } catch(e) {
            console.error(`[DeleteAllMessages] fetch ${e?.status ?? ""}`, e);
            return [];
        }
    }

    async deleteMessage(channelId, messageId) {
        try {
            await this.apiRequest("del", `/channels/${channelId}/messages/${messageId}`);
            return true;
        } catch(e) {
            // 404 = message déjà supprimé : il n'existe plus, c'est le résultat voulu
            if (e?.status === 404) return true;
            console.error(`[DeleteAllMessages] delete ${e?.status ?? ""}`, e);
            return false;
        }
    }

    async countMyMessages(channelId, onProgress) {
        const opts = this.getOptions();
        let total = 0, lastId = null;
        while (true) {
            if (this.cancelled) break;
            const messages = await this.fetchMessages(channelId, lastId);
            if (!messages.length) break;
            total += messages.filter(m => this.filterMessage(m, opts)).length;
            if (onProgress) onProgress(total);
            lastId = messages[messages.length - 1].id;
            await this.randomSleep(600, 1100);
        }
        return total;
    }

    async deleteMessagesBatch(channelId, amount, onProgress) {
        const opts = this.getOptions();
        let deleted = 0, lastId = null, emptyRuns = 0;
        let consecutiveErrors = 0;
        let messagesSincePause = 0;
        let pauseThreshold = Math.floor(Math.random() * 6) + 15; // Pause entre 15 et 20 messages

        while (deleted < amount) {
            if (this.cancelled) break;
            const messages = await this.fetchMessages(channelId, lastId);
            if (!messages.length) break;
            // La pagination par ID reste valide après suppression : on continue
            // depuis le plus ancien message de la page au lieu de tout reparcourir.
            lastId = messages[messages.length - 1].id;
            const mine = messages.filter(m => this.filterMessage(m, opts));
            if (mine.length === 0) {
                emptyRuns++;
                if (emptyRuns > 20) break;
                await this.randomSleep(500, 900);
                continue;
            }
            emptyRuns = 0;
            for (const msg of mine) {
                if (deleted >= amount || this.cancelled) break;

                if (opts.backup) this.saveBackup(channelId, msg);
                const ok = await this.deleteMessage(channelId, msg.id);
                if (ok) {
                    deleted++;
                    messagesSincePause++;
                    consecutiveErrors = 0;
                    if (onProgress) onProgress(deleted);
                } else {
                    consecutiveErrors++;
                    if (consecutiveErrors >= 3) {
                        this.cancelled = true;
                        this.setStatus(t("status.tooManyErrors"), "danger");
                        break;
                    }
                }

                if (messagesSincePause >= pauseThreshold) {
                    this.setStatus(t("status.pause"), "busy");
                    await this.randomSleep(5000, 9000);
                    this.setStatus(t("status.resume"), "busy");
                    messagesSincePause = 0;
                    pauseThreshold = Math.floor(Math.random() * 6) + 15;
                } else {
                    await this.randomSleep(1500, 2800);
                }
            }
            if (consecutiveErrors >= 3) break;
        }
        return deleted;
    }

    // ─── Faux message éphémère ────────────────────────────────────────────────

    removeEmbed() {
        if (this.embedNode) { this.embedNode.remove(); this.embedNode = null; }
    }

    findMessageList() {
        return (
            document.querySelector('[class*="scroller"][class*="messages"]') ??
            document.querySelector('[class*="messagesWrapper"] [class*="scroller"]') ??
            document.querySelector('[class*="scrollerInner"]') ??
            document.querySelector('[class*="messagesWrapper"]')
        );
    }

    createEmbed(channelId) {
        this.removeEmbed();
        this.deletedMessages = 0;
        this.totalMessages = 0;
        this.hasCounted = false;

        const time = new Date().toLocaleTimeString(t("time.locale"), { hour: "2-digit", minute: "2-digit" });
        const wrapper = document.createElement("div");
        wrapper.id = "dam-ephemeral";
        wrapper.className = "dam-ui dam-ephemeral";
        wrapper.setAttribute("role", "article");
        wrapper.setAttribute("aria-label", t("embed.aria"));
        wrapper.innerHTML = `
            <div class="dam-app-avatar" aria-hidden="true">${ICON_TRASH}</div>
            <div class="dam-msg-header">
                <span class="dam-author">BetterDiscord</span>
                <span class="dam-tag">App</span>
                <time class="dam-time">${t("embed.today", time)}</time>
            </div>

            <div class="dam-embed">
                <div class="dam-embed-title">${t("embed.title")}</div>
                <div class="dam-embed-desc" id="dam-subtitle">${t("embed.intro")}</div>
                <div class="dam-stats">
                    <div><div class="dam-stat-value" id="dam-total">—</div><div class="dam-stat-label">${t("stats.mine")}</div></div>
                    <div><div class="dam-stat-value dam-stat-danger" id="dam-deleted">0</div><div class="dam-stat-label">${t("stats.deleted")}</div></div>
                    <div><div class="dam-stat-value dam-stat-success" id="dam-remaining">—</div><div class="dam-stat-label">${t("stats.remaining")}</div></div>
                </div>
                <div class="dam-progress" role="progressbar" aria-label="${t("stats.progress")}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
                    <div class="dam-progress-bar" id="dam-bar"></div>
                </div>
                <div class="dam-status" id="dam-status" aria-live="polite">${t("status.waiting")}</div>
            </div>

            <details class="dam-options">
                <summary>${ICON_CHEVRON}<span>${t("opts.title")}</span><span class="dam-pill dam-pill-brand" id="dam-opt-count"></span></summary>
                <div class="dam-options-body">
                    <label class="dam-check"><input type="checkbox" id="dam-opt-backup"><span>${t("opts.backup")}</span></label>
                    <p class="dam-hint">${t("opts.backupHint")}</p>
                    <label class="dam-check"><input type="checkbox" id="dam-opt-files"><span>${t("opts.files")}</span></label>
                    <div>
                        <label class="dam-label" for="dam-opt-keyword">${t("opts.keyword")}</label>
                        <input class="dam-input dam-input-sm" type="text" id="dam-opt-keyword" placeholder="${t("opts.keywordPh")}" spellcheck="false">
                    </div>
                    <div class="dam-dates">
                        <div>
                            <label class="dam-label" for="dam-opt-start">${t("opts.from")}</label>
                            <input class="dam-input dam-input-sm" type="date" id="dam-opt-start">
                        </div>
                        <div>
                            <label class="dam-label" for="dam-opt-end">${t("opts.to")}</label>
                            <input class="dam-input dam-input-sm" type="date" id="dam-opt-end">
                        </div>
                    </div>
                </div>
            </details>

            <div class="dam-actions" id="dam-btns"></div>

            <div class="dam-ephemeral-note">
                ${ICON_EYE}
                <span>${t("note.onlyYou")}</span>
                <a class="dam-link" id="dam-dismiss" role="button" tabindex="0">${t("note.dismiss")}</a>
            </div>
        `;

        const list = this.findMessageList();
        if (list) {
            list.appendChild(wrapper);
            wrapper.scrollIntoView({ behavior: "smooth", block: "end" });
        } else {
            wrapper.classList.add("dam-floating");
            document.body.appendChild(wrapper);
        }

        this.embedNode = wrapper;

        const dismiss = wrapper.querySelector("#dam-dismiss");
        const close = () => {
            this.cancelled = true;
            this.running = false;
            this.removeEmbed();
        };
        dismiss.addEventListener("click", close);
        dismiss.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); close(); }
        });

        // Les filtres changent le total : on le signale au lieu d'afficher un chiffre faux
        const options = wrapper.querySelector(".dam-options");
        const onFilterChange = () => {
            this.updateFilterCount();
            if (this.hasCounted && !this.running) {
                this.setStatus(t("status.filtersChanged"), "warning");
            }
        };
        options.addEventListener("input", onFilterChange);
        options.addEventListener("change", onFilterChange);

        if (!this.getRestAPI()) {
            this.setStatus(t("status.noRest"), "danger");
            return wrapper;
        }

        this.showBtn(t("btn.count"), "primary", () => this.doCount(channelId));
        return wrapper;
    }

    // ─── Helpers UI ───────────────────────────────────────────────────────────

    // tone : "busy" (indicateur animé), "success", "warning", "danger" ou rien (gris)
    setStatus(text, tone = "") {
        if (!this.embedNode) return;
        const el = this.embedNode.querySelector("#dam-status");
        el.textContent = text;
        if (tone) el.dataset.tone = tone; else delete el.dataset.tone;
    }

    setSubtitle(html) {
        if (this.embedNode) this.embedNode.querySelector("#dam-subtitle").innerHTML = html;
    }

    updateFilterCount() {
        if (!this.embedNode) return;
        const o = this.getOptions();
        const n = [o.files, o.keyword, o.startDate || o.endDate].filter(Boolean).length;
        this.embedNode.querySelector("#dam-opt-count").textContent = n ? t("opts.count", n) : "";
    }

    updateStats() {
        if (!this.embedNode) return;
        const remaining = Math.max(0, this.totalMessages - this.deletedMessages);
        const pct = this.totalMessages > 0 ? Math.min((this.deletedMessages / this.totalMessages) * 100, 100) : 0;
        this.embedNode.querySelector("#dam-total").textContent = this.totalMessages > 0 ? this.totalMessages : "—";
        this.embedNode.querySelector("#dam-deleted").textContent = this.deletedMessages;
        this.embedNode.querySelector("#dam-remaining").textContent = this.totalMessages > 0 ? remaining : "—";
        this.embedNode.querySelector("#dam-bar").style.width = `${pct}%`;
        this.embedNode.querySelector(".dam-progress").setAttribute("aria-valuenow", String(Math.round(pct)));
    }

    clearButtons() {
        if (this.embedNode) this.embedNode.querySelector("#dam-btns").innerHTML = "";
    }

    // variant : "primary", "secondary" ou "danger" (boutons du kit Discord)
    showBtn(label, variant, onClick) {
        if (!this.embedNode) return;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `dam-btn dam-btn-sm${variant && variant !== "primary" ? ` dam-btn-${variant}` : ""}`;
        btn.textContent = label;
        btn.addEventListener("click", onClick);
        this.embedNode.querySelector("#dam-btns").appendChild(btn);
        return btn;
    }

    // ─── Actions ─────────────────────────────────────────────────────────────

    async doCount(channelId) {
        if (this.running) return;
        this.running = true;
        this.cancelled = false;
        this.deletedMessages = 0;
        this.clearButtons();
        this.setStatus(t("status.counting"), "busy");
        this.setSubtitle(t("sub.scanning"));

        this.totalMessages = await this.countMyMessages(channelId, (n) => {
            this.setStatus(t("status.found", n), "busy");
            if (this.embedNode) this.embedNode.querySelector("#dam-total").textContent = n;
        });

        this.running = false;
        if (!this.embedNode) return;
        this.hasCounted = true;
        this.updateStats();

        if (this.totalMessages === 0) {
            this.setStatus(t("status.none"), "success");
            this.setSubtitle(t("sub.none"));
            this.showBtn(t("btn.recount"), "secondary", () => this.doCount(channelId));
        } else {
            this.setStatus(t("status.foundDone", this.totalMessages));
            this.setSubtitle(t("sub.total", this.totalMessages));
            this.showDeleteButtons(channelId);
        }
    }

    showDeleteButtons(channelId) {
        if (!this.embedNode) return;
        this.clearButtons();

        const remaining = Math.max(0, this.totalMessages - this.deletedMessages);
        const group = document.createElement("div");
        group.className = "dam-input-group dam-amount";
        group.innerHTML = `
            <input class="dam-input dam-input-sm" type="number" min="1" step="1" inputmode="numeric" aria-label="${t("amount.aria")}">
            <span class="dam-input-suffix">${t("amount.suffix")}</span>
        `;
        const input = group.querySelector("input");
        input.value = String(remaining > 0 ? Math.min(100, remaining) : 100);
        this.embedNode.querySelector("#dam-btns").appendChild(group);

        const readAmount = () => parseInt(input.value, 10);
        const del = this.showBtn(t("btn.delete"), "danger", () => {
            const amount = readAmount();
            if (amount > 0) this.doDelete(channelId, amount);
        });
        // Le bouton annonce exactement ce qu'il va faire
        const sync = () => {
            const n = readAmount();
            del.disabled = !(n > 0);
            del.textContent = n > 0 ? t("btn.deleteN", n) : t("btn.delete");
        };
        input.addEventListener("input", sync);
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !del.disabled) { e.preventDefault(); del.click(); }
        });
        sync();

        this.showBtn(t("btn.recount"), "secondary", () => this.doCount(channelId));
    }

    async doDelete(channelId, amount) {
        if (this.running) return;
        this.running = true;
        this.cancelled = false;
        this.stopRequested = false;

        this.clearButtons();
        this.setStatus(t("status.deleting", amount), "busy");
        const stopBtn = this.showBtn(t("btn.stop"), "secondary", () => {
            this.cancelled = true;
            this.stopRequested = true;
            stopBtn.disabled = true;
            this.setStatus(t("status.stopping"), "busy");
        });

        const batch = await this.deleteMessagesBatch(channelId, amount, () => {
            this.deletedMessages++;
            this.updateStats();
        });

        this.running = false;
        if (!this.embedNode) return;

        // Arrêt manuel ou trop d'erreurs : le recomptage serait lui aussi
        // interrompu (et renverrait 0 → faux "tout est supprimé").
        if (this.cancelled) {
            // Après trop d'erreurs, le message d'erreur reste affiché
            if (this.stopRequested) this.setStatus(t("status.stopped", batch), "warning");
            const left = Math.max(0, this.totalMessages - this.deletedMessages);
            this.setSubtitle(t("sub.leftAbout", left));
            this.updateStats();
            this.showDeleteButtons(channelId);
            return;
        }

        this.setStatus(t("status.batchDone", batch), "busy");

        // Le recomptage donne ce qui RESTE : on ne soustrait plus une deuxième
        // fois les messages déjà supprimés.
        const remaining = await this.countMyMessages(channelId);
        if (!this.embedNode) return;
        this.totalMessages = remaining + this.deletedMessages;
        this.updateStats();

        if (remaining === 0) {
            this.setStatus(t("status.allDone"), "success");
            this.setSubtitle(t("sub.allDone"));
            this.clearButtons();
            this.showBtn(t("btn.check"), "secondary", () => this.doCount(channelId));
        } else {
            this.setStatus(t("status.left", remaining));
            this.setSubtitle(t("sub.left", remaining));
            this.showDeleteButtons(channelId);
        }
    }

    // ─── Menu contextuel ─────────────────────────────────────────────────────

    patchContextMenus() {
        const menuIds = ["user-context", "gdm-context", "channel-context"];
        for (const menuId of menuIds) {
            const unpatch = BdApi.ContextMenu.patch(menuId, (menu, props) => {
                const channelId = props?.channel?.id ?? props?.channelId ?? this.getCurrentChannelId();
                if (!channelId) return;
                const item = BdApi.ContextMenu.buildItem({
                    type: "button",
                    id: "delete-all-messages",
                    label: t("menu.deleteAll"),
                    color: "danger",
                    icon: TrashIcon,
                    action: () => this.createEmbed(channelId)
                });
                const separator = BdApi.ContextMenu.buildItem({ type: "separator" });
                const children = menu?.props?.children;
                if (!children) return;
                if (Array.isArray(children)) {
                    children.push(separator, item);
                } else if (children?.props?.children && Array.isArray(children.props.children)) {
                    children.props.children.push(separator, item);
                }
            });
            this.patches.push(unpatch);
        }
    }

    getSettingsPanel() {
        const panel = document.createElement("div");
        panel.className = "dam-ui dam-settings";
        panel.innerHTML = `
            <div class="dam-card">
                <div class="dam-heading">${t("settings.usageTitle")}</div>
                <p class="dam-hint">${t("settings.usage")}</p>
            </div>
            <div class="dam-card">
                <div class="dam-heading">${t("settings.whatTitle")}</div>
                <ul>
                    <li>${t("settings.what1")}</li>
                    <li>${t("settings.what2")}</li>
                    <li>${t("settings.what3")}</li>
                </ul>
            </div>
            <div class="dam-notice dam-notice-warning">
                <span>${t("settings.warning")}</span>
            </div>
        `;
        return panel;
    }
};
