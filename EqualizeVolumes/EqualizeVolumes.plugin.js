/**
 * @name EqualizeVolumes
 * @author AaronL2L
 * @version 1.0.0
 * @description Right-click a user → "Equalize everyone's volume": one level for the whole voice channel (slider or typed value), with an optional auto mode for newcomers. English and French.
 * @invite HdXp7sWRY3
 * @website https://valientebot.xyz
 * @source https://github.com/AaronL2L/BetterDiscordPlugins/tree/main/EqualizeVolumes
 * @updateUrl https://raw.githubusercontent.com/AaronL2L/BetterDiscordPlugins/main/EqualizeVolumes/EqualizeVolumes.plugin.js
 */

const DATA_KEY = "EqualizeVolumes";
const STYLE_ID = "EqualizeVolumes-styles";
const PRESETS = [25, 50, 75, 100];
const DEFAULT_API_VOLUME = 100; // volume d'origine de Discord pour chaque personne

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
        "menu.equalize": "Equalize everyone's volume",
        "menu.exclude": "Exclude from auto equalize",
        "toast.noAudio": "Discord's audio module was not found.",
        "toast.noUsers": "No one found in the voice channel.",
        "toast.done": (n, p) => `${n} ${plural(n, "person", "people")} set to ${p}%.`,
        "toast.error": "Couldn't equalize the volumes.",
        "toast.auto": (n, p) => `Auto equalize: ${n} ${plural(n, "person", "people")} set to ${p}%.`,
        "toast.saved": (p, auto) => `Saved: ${p}%, auto mode ${auto ? "on" : "off"}.`,
        "toast.excluded": (name) => `${name}'s volume won't be adjusted automatically anymore.`,
        "toast.included": (name) => `${name}'s volume will be adjusted automatically again.`,
        "modal.title": "Equalize everyone's volume",
        "modal.subtitle": "Sets the same volume for every member of the voice channel.",
        "modal.close": "Close",
        "modal.volume": "Volume",
        "modal.percentAria": "Volume in percent",
        "modal.target": (n, channel) => `Applies to <strong>${n} ${plural(n, "member", "members")}</strong>${channel ? ` in <strong>${channel}</strong>` : ""}.`,
        "modal.noTarget": "No other member found in this person's voice channel.",
        "modal.cancel": "Cancel",
        "modal.apply": "Apply",
        "modal.save": "Save",
        "auto.title": "Auto mode",
        "auto.desc": "Also sets this volume for people who join your voice channel, and for those already there when you join. People you adjusted by hand are left alone.",
        "settings.usageTitle": "How to use",
        "settings.usage": (p) => `Right-click any member in a voice channel and choose <strong>Equalize everyone's volume</strong>. The window opens on the last value used (currently <strong>${p}%</strong>).`,
        "settings.autoDesc": (p) => `People who join your voice channel, and those already there when you join, are set to <strong>${p}%</strong>. Only people still at Discord's default volume, or set by this plugin, are adjusted.`,
        "settings.excludedTitle": "Excluded from auto mode",
        "settings.excludedEmpty": "No one. Right-click a person and choose <strong>Exclude from auto equalize</strong>.",
        "settings.remove": "Remove",
        "settings.shortcutsTitle": "Shortcuts in the window",
        "settings.kbdType": "Type the percentage you want",
        "kbd.shift": "Shift",
        "kbd.enter": "Enter",
        "kbd.esc": "Esc",
        "settings.step1": "±1%",
        "settings.step10": "±10%",
        "pct": (v) => `${v}%`
    },
    fr: {
        "menu.equalize": "Égaliser le son de tout le monde",
        "menu.exclude": "Exclure de l'égalisation auto",
        "toast.noAudio": "Module audio Discord introuvable.",
        "toast.noUsers": "Aucun utilisateur trouvé dans le salon vocal.",
        "toast.done": (n, p) => `${n} ${plural(n, "personne", "personnes")} mise${plural(n, "", "s")} à ${p} %.`,
        "toast.error": "Erreur lors de l'égalisation.",
        "toast.auto": (n, p) => `Égalisation auto : ${n} ${plural(n, "personne", "personnes")} à ${p} %.`,
        "toast.saved": (p, auto) => `Réglage enregistré : ${p} %, mode auto ${auto ? "activé" : "désactivé"}.`,
        "toast.excluded": (name) => `Le volume de ${name} ne sera plus réglé automatiquement.`,
        "toast.included": (name) => `Le volume de ${name} sera de nouveau réglé automatiquement.`,
        "modal.title": "Égaliser le son de tout le monde",
        "modal.subtitle": "Applique le même volume à tous les membres du salon vocal.",
        "modal.close": "Fermer",
        "modal.volume": "Volume",
        "modal.percentAria": "Volume en pourcentage",
        "modal.target": (n, channel) => `S'appliquera à <strong>${n} ${plural(n, "membre", "membres")}</strong>${channel ? ` dans <strong>${channel}</strong>` : ""}.`,
        "modal.noTarget": "Aucun autre membre trouvé dans le salon vocal de cette personne.",
        "modal.cancel": "Annuler",
        "modal.apply": "Appliquer",
        "modal.save": "Enregistrer",
        "auto.title": "Mode automatique",
        "auto.desc": "Applique aussi ce volume aux personnes qui rejoignent ta vocale, et à celles déjà présentes quand tu arrives. Les personnes que tu as réglées à la main ne sont pas touchées.",
        "settings.usageTitle": "Utilisation",
        "settings.usage": (p) => `Fais un clic droit sur n'importe quel membre en vocal et choisis <strong>Égaliser le son de tout le monde</strong>. La fenêtre s'ouvre sur la dernière valeur utilisée (actuellement <strong>${p} %</strong>).`,
        "settings.autoDesc": (p) => `Les personnes qui rejoignent ta vocale, et celles déjà présentes quand tu arrives, passent à <strong>${p} %</strong>. Seules les personnes encore au volume d'origine de Discord, ou réglées par ce plugin, sont concernées.`,
        "settings.excludedTitle": "Exclus du mode auto",
        "settings.excludedEmpty": "Personne. Fais un clic droit sur quelqu'un et choisis <strong>Exclure de l'égalisation auto</strong>.",
        "settings.remove": "Retirer",
        "settings.shortcutsTitle": "Raccourcis dans la fenêtre",
        "settings.kbdType": "Tape directement le pourcentage voulu",
        "kbd.shift": "Maj",
        "kbd.enter": "Entrée",
        "kbd.esc": "Échap",
        "settings.step1": "±1 %",
        "settings.step10": "±10 %",
        "pct": (v) => `${v} %`
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

// Icône haut-parleur pour l'entrée du menu contextuel (style des icônes Discord)
const SpeakerIcon = (props) => BdApi.React.createElement("svg",
    { className: props?.className, width: 18, height: 18, viewBox: "0 0 24 24", "aria-hidden": true },
    BdApi.React.createElement("path", {
        fill: "currentColor",
        d: "M11 4.5 6.5 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h3.5l4.5 3.5a.6.6 0 0 0 1-.47V4.97a.6.6 0 0 0-1-.47ZM15.5 8.5a1 1 0 0 1 1.41 0 5 5 0 0 1 0 7 1 1 0 0 1-1.41-1.41 3 3 0 0 0 0-4.18 1 1 0 0 1 0-1.41ZM18.36 5.64a1 1 0 0 1 1.41 0 9 9 0 0 1 0 12.72 1 1 0 0 1-1.41-1.41 7 7 0 0 0 0-9.9 1 1 0 0 1 0-1.41Z"
    })
);

const PLUGIN_CSS = `
.eqv-volume-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
.eqv-volume-head .eqv-label { margin: 0; }
.eqv-number { width: 92px; }
.eqv-number .eqv-input { padding-right: 2px; font-weight: 600; text-align: right; }
.eqv-number .eqv-input::-webkit-inner-spin-button,
.eqv-number .eqv-input::-webkit-outer-spin-button { margin: 0; -webkit-appearance: none; }
.eqv-presets { display: flex; gap: 8px; margin-top: 16px; }
.eqv-presets .eqv-btn { flex: 1 1 0; min-width: 0; }
.eqv-preset.eqv-active { color: var(--eqv-header); background: color-mix(in srgb, var(--eqv-brand) 16%, transparent); box-shadow: inset 0 0 0 1px var(--eqv-brand); }
.eqv-target { margin-top: 20px; }
label.eqv-row { cursor: pointer; }
.eqv-auto { margin-top: 16px; border-top: 1px solid var(--eqv-border); }
.eqv-settings { display: flex; flex-direction: column; gap: 16px; }
.eqv-people { display: flex; flex-direction: column; gap: 2px; margin: 8px -8px 0; }
.eqv-people .eqv-list-item { padding: 8px; }
.eqv-person-name {
    flex: 1 1 auto; min-width: 0; overflow: hidden; color: var(--eqv-header);
    font-size: 16px; font-weight: 500; line-height: 20px; text-overflow: ellipsis; white-space: nowrap;
}
.eqv-kbd {
    display: inline-block; min-width: 22px; padding: 0 6px; border-radius: 4px;
    background: var(--eqv-bg-deep); box-shadow: inset 0 -1px 0 var(--eqv-accent);
    color: var(--eqv-header); font-size: 12px; font-weight: 600; line-height: 20px; text-align: center;
}
.eqv-shortcuts { display: grid; grid-template-columns: auto 1fr; gap: 8px 12px; align-items: center; margin-top: 12px; }
`;

module.exports = class EqualizeVolumes {

    constructor(meta) {
        this.meta = meta;
        this.patches = [];
        this.closeModal = null;
        this.running = false;
        this.myChannelId = null;
        this.onVoiceStates = this.onVoiceStates.bind(this);
    }

    start() {
        this.running = true;
        this.loadSettings();
        BdApi.DOM.addStyle(STYLE_ID, discordKitCSS("eqv") + PLUGIN_CSS);
        this.patchContextMenus();

        this.Dispatcher = BdApi.Webpack.getByKeys("dispatch", "subscribe");
        this.Dispatcher?.subscribe("VOICE_STATE_UPDATES", this.onVoiceStates);

        // Déjà en vocal quand le plugin démarre (réactivation, rechargement…)
        this.myChannelId = BdApi.Webpack.getStore("SelectedChannelStore")?.getVoiceChannelId?.() ?? null;
        if (this.settings.autoMode) this.autoEqualizeMyChannel({ toast: true });
    }

    stop() {
        this.running = false;
        this.Dispatcher?.unsubscribe("VOICE_STATE_UPDATES", this.onVoiceStates);
        this.Dispatcher = null;
        for (const unpatch of this.patches) {
            try { unpatch(); } catch(e) {}
        }
        this.patches = [];
        this.closeModal?.();
        BdApi.DOM.removeStyle(STYLE_ID);
    }

    // ─── Réglages ────────────────────────────────────────────────────────────
    // managed  : volume que le plugin a donné à chaque personne, ou false si tu
    //            l'as réglée à la main depuis (le mode auto ne la touche plus).
    // excluded : personnes exclues du mode auto (id → nom, pour l'affichage).
    loadSettings() {
        const isObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
        const managed = BdApi.Data.load(DATA_KEY, "managed");
        const excluded = BdApi.Data.load(DATA_KEY, "excluded");
        this.settings = {
            lastPercent: this.clampPercent(BdApi.Data.load(DATA_KEY, "lastPercent") ?? 100),
            autoMode: BdApi.Data.load(DATA_KEY, "autoMode") === true,
            managed: isObject(managed) ? managed : {},
            excluded: new Map(isObject(excluded) ? Object.entries(excluded) : [])
        };
    }

    save(...keys) {
        for (const key of keys) {
            const value = this.settings[key];
            BdApi.Data.save(DATA_KEY, key, value instanceof Map ? Object.fromEntries(value) : value);
        }
    }

    /**
     * Courbe calibrée sur les vraies valeurs Discord :
     *   50%  → API 14.6308...
     *   100% → API 100
     *
     * Formule : api = (display/100) ^ 2.7729 * 100
     *
     * Au-delà de 100%, Discord ne va pas plus loin (API max = 200),
     * donc on bride le slider à 100% pour rester dans la plage valide.
     */
    toDiscordVolume(displayPercent) {
        if (displayPercent <= 0) return 0;
        const EXP = 2.7729117071415468;
        const api = Math.pow(displayPercent / 100, EXP) * 100;
        return Math.min(Math.round(api * 1000) / 1000, 200);
    }

    // Pourcentage entier borné à 0-100 (valeur par défaut : 100)
    clampPercent(value) {
        const n = Math.round(Number(value));
        return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 100;
    }

    // Deux volumes sont considérés égaux à 1 % près (Discord arrondit ce qu'il enregistre)
    near(a, b) {
        return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) < 0.01 + 0.01 * Math.max(a, b);
    }

    getMyId() {
        return BdApi.Webpack.getStore("UserStore")?.getCurrentUser()?.id ?? null;
    }

    getDisplayName(userId) {
        const user = BdApi.Webpack.getStore("UserStore")?.getUser?.(userId);
        return user?.globalName || user?.username || this.settings.excluded.get(userId) || userId;
    }

    getAudioActions() {
        return BdApi.Webpack.getByKeys("setLocalVolume", "toggleSelfDeaf") ??
            BdApi.Webpack.getByKeys("setLocalVolume");
    }

    // ─── Salons vocaux ───────────────────────────────────────────────────────
    getUserChannelId(userId) {
        try {
            const VoiceStateStore = BdApi.Webpack.getStore("VoiceStateStore");
            if (typeof VoiceStateStore?.getVoiceStateForUser === "function") {
                return VoiceStateStore.getVoiceStateForUser(userId)?.channelId ?? null;
            }
            for (const guildStates of Object.values(VoiceStateStore?.getAllVoiceStates?.() ?? {})) {
                const channelId = guildStates?.[userId]?.channelId;
                if (channelId) return channelId;
            }
        } catch(e) {
            console.error("[EqualizeVolumes] getUserChannelId:", e);
        }
        return null;
    }

    // Membres d'un salon vocal, sans toi
    getChannelMembers(channelId) {
        if (!channelId) return [];
        try {
            const VoiceStateStore = BdApi.Webpack.getStore("VoiceStateStore");
            const myId = this.getMyId();
            let ids = [];

            // Accès direct quand le store le permet (évite de parcourir tous les serveurs)
            if (typeof VoiceStateStore?.getVoiceStatesForChannel === "function") {
                ids = Object.entries(VoiceStateStore.getVoiceStatesForChannel(channelId) ?? {})
                    .map(([uid, state]) => state?.userId ?? uid);
            } else {
                for (const guildStates of Object.values(VoiceStateStore?.getAllVoiceStates?.() ?? {})) {
                    for (const [uid, state] of Object.entries(guildStates ?? {})) {
                        if (state?.channelId === channelId) ids.push(state?.userId ?? uid);
                    }
                }
            }
            return ids.filter(uid => uid && uid !== myId);
        } catch(e) {
            console.error("[EqualizeVolumes] getChannelMembers:", e);
            return [];
        }
    }

    getUsersInSameChannel(targetUserId) {
        return this.getChannelMembers(this.getUserChannelId(targetUserId));
    }

    getVoiceChannelName(userId) {
        try {
            const channelId = this.getUserChannelId(userId);
            if (!channelId) return null;
            return BdApi.Webpack.getStore("ChannelStore")?.getChannel?.(channelId)?.name ?? null;
        } catch(e) {
            return null;
        }
    }

    // ─── Égalisation manuelle ────────────────────────────────────────────────
    equalizeAll(targetUserId, displayPercent) {
        try {
            const MediaEngineActions = this.getAudioActions();
            if (!MediaEngineActions?.setLocalVolume) {
                BdApi.UI.showToast(t("toast.noAudio"), { type: "error" });
                return;
            }

            const users = this.getUsersInSameChannel(targetUserId);
            if (users.length === 0) {
                BdApi.UI.showToast(t("toast.noUsers"), { type: "warning" });
                return;
            }

            const apiVolume = this.toDiscordVolume(displayPercent);
            for (const uid of users) {
                MediaEngineActions.setLocalVolume(uid, apiVolume);
                this.settings.managed[uid] = apiVolume;
            }
            this.save("managed");

            BdApi.UI.showToast(t("toast.done", users.length, displayPercent), { type: "success" });
        } catch(e) {
            console.error("[EqualizeVolumes] equalizeAll:", e);
            BdApi.UI.showToast(t("toast.error"), { type: "error" });
        }
    }

    // ─── Mode automatique ────────────────────────────────────────────────────
    // Discord envoie VOICE_STATE_UPDATES pour tous les serveurs : on ne garde
    // que ton propre état et les arrivées dans ton salon.
    onVoiceStates(event) {
        const voiceStates = event?.voiceStates;
        if (!Array.isArray(voiceStates) || voiceStates.length === 0) return;

        const myId = this.getMyId();
        const relevant = voiceStates
            .filter(s => s && (s.userId === myId || (this.myChannelId && s.channelId === this.myChannelId)))
            .map(s => ({ userId: s.userId, channelId: s.channelId ?? null }));
        if (relevant.length === 0) return;

        // Laisse Discord finir de mettre ses stores à jour avant de lire salons et volumes
        setTimeout(() => {
            if (this.running) this.handleVoiceStates(relevant, myId);
        }, 0);
    }

    handleVoiceStates(states, myId) {
        let joinedChannel = null;
        for (const { userId, channelId } of states) {
            if (userId !== myId || channelId === this.myChannelId) continue;
            this.myChannelId = channelId;
            joinedChannel = channelId;
        }
        if (!this.settings.autoMode) return;

        // Tu arrives dans un salon (ou en changes) : tout le salon d'un coup
        if (joinedChannel) {
            this.autoEqualize(this.getChannelMembers(joinedChannel), { toast: true });
            return;
        }
        const newcomers = states
            .filter(s => s.userId !== myId && s.channelId && s.channelId === this.myChannelId)
            .map(s => s.userId);
        if (newcomers.length) this.autoEqualize(newcomers);
    }

    autoEqualizeMyChannel(options) {
        if (this.myChannelId) this.autoEqualize(this.getChannelMembers(this.myChannelId), options);
    }

    // Ne règle que les personnes encore au volume d'origine de Discord (100) ou au
    // volume donné par le plugin. Si ce volume a changé depuis, c'est que tu l'as
    // réglé à la main : la personne est notée et le mode auto ne la touche plus.
    autoEqualize(userIds, { toast = false } = {}) {
        if (!this.settings.autoMode || userIds.length === 0) return;
        try {
            const MediaEngineActions = this.getAudioActions();
            const MediaEngineStore = BdApi.Webpack.getStore("MediaEngineStore");
            // Sans lecture du volume actuel, impossible de savoir qui a été réglé à la main
            if (!MediaEngineActions?.setLocalVolume || typeof MediaEngineStore?.getLocalVolume !== "function") return;

            const myId = this.getMyId();
            const percent = this.settings.lastPercent;
            const target = this.toDiscordVolume(percent);
            const managed = this.settings.managed;
            let changed = 0;
            let dirty = false;

            for (const uid of new Set(userIds)) {
                if (!uid || uid === myId || this.settings.excluded.has(uid) || managed[uid] === false) continue;

                const current = MediaEngineStore.getLocalVolume(uid, "default");
                if (typeof managed[uid] === "number" && !this.near(current, managed[uid])) {
                    managed[uid] = false;
                    dirty = true;
                    continue;
                }
                if (typeof managed[uid] !== "number" && !this.near(current, DEFAULT_API_VOLUME)) continue;

                if (!this.near(current, target)) {
                    MediaEngineActions.setLocalVolume(uid, target);
                    changed++;
                }
                if (managed[uid] !== target) {
                    managed[uid] = target;
                    dirty = true;
                }
            }

            if (dirty) this.save("managed");
            if (toast && changed > 0) BdApi.UI.showToast(t("toast.auto", changed, percent), { type: "info" });
        } catch(e) {
            console.error("[EqualizeVolumes] autoEqualize:", e);
        }
    }

    toggleExcluded(userId) {
        const name = this.getDisplayName(userId);
        if (this.settings.excluded.delete(userId)) {
            BdApi.UI.showToast(t("toast.included", name), { type: "info" });
            this.save("excluded");
            if (this.myChannelId && this.getUserChannelId(userId) === this.myChannelId) this.autoEqualize([userId]);
        } else {
            this.settings.excluded.set(userId, name);
            BdApi.UI.showToast(t("toast.excluded", name), { type: "info" });
            this.save("excluded");
        }
    }

    // ─── Fenêtre ─────────────────────────────────────────────────────────────
    openModal(userId) {
        this.closeModal?.();

        const users = this.getUsersInSameChannel(userId);
        const channelName = this.getVoiceChannelName(userId);
        let value = this.settings.lastPercent;

        const count = users.length;
        const target = count > 0
            ? `<p class="eqv-hint eqv-target">${t("modal.target", count, channelName ? escapeHtml(channelName) : "")}</p>`
            : `<div class="eqv-notice eqv-notice-warning eqv-target">${t("modal.noTarget")}</div>`;

        const backdrop = document.createElement("div");
        backdrop.className = "eqv-ui eqv-backdrop";
        backdrop.innerHTML = `
            <div class="eqv-modal" role="dialog" aria-modal="true" aria-labelledby="eqv-title">
                <div class="eqv-modal-header">
                    <div>
                        <h2 class="eqv-title" id="eqv-title">${t("modal.title")}</h2>
                        <p class="eqv-subtitle">${t("modal.subtitle")}</p>
                    </div>
                    <button type="button" class="eqv-icon-btn eqv-close" data-action="close" aria-label="${escapeHtml(t("modal.close"))}">${ICON_CLOSE}</button>
                </div>
                <div class="eqv-modal-body">
                    <div class="eqv-volume-head">
                        <label class="eqv-label" for="eqv-percent">${t("modal.volume")}</label>
                        <div class="eqv-input-group eqv-number">
                            <input class="eqv-input eqv-input-sm" id="eqv-percent" type="number" min="0" max="100" step="1" inputmode="numeric" autocomplete="off" aria-label="${escapeHtml(t("modal.percentAria"))}">
                            <span class="eqv-input-suffix">%</span>
                        </div>
                    </div>
                    <input class="eqv-range" type="range" min="0" max="100" step="1" aria-label="${escapeHtml(t("modal.volume"))}">
                    <div class="eqv-range-marks">${[0, 25, 50, 75, 100].map(v => `<span>${t("pct", v)}</span>`).join("")}</div>
                    <div class="eqv-presets">
                        ${PRESETS.map(v => `<button type="button" class="eqv-btn eqv-btn-sm eqv-btn-outline eqv-preset" data-value="${v}">${t("pct", v)}</button>`).join("")}
                    </div>
                    ${target}
                    <label class="eqv-row eqv-auto">
                        <div>
                            <div class="eqv-row-title">${t("auto.title")}</div>
                            <div class="eqv-row-desc">${t("auto.desc")}</div>
                        </div>
                        <input type="checkbox" class="eqv-switch"${this.settings.autoMode ? " checked" : ""}>
                    </label>
                </div>
                <div class="eqv-modal-footer">
                    <button type="button" class="eqv-btn eqv-btn-link" data-action="close">${t("modal.cancel")}</button>
                    <button type="button" class="eqv-btn" data-action="apply">${count > 0 ? t("modal.apply") : t("modal.save")}</button>
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

        // Ferme seulement si le clic a COMMENCÉ sur le fond : relâcher la souris
        // hors de la fenêtre en faisant glisser le curseur ne doit pas la fermer.
        let pressedOnBackdrop = false;
        backdrop.addEventListener("mousedown", (e) => { pressedOnBackdrop = e.target === backdrop; });
        backdrop.addEventListener("click", (e) => {
            if (pressedOnBackdrop && e.target === backdrop) close();
        });

        document.body.appendChild(backdrop);

        const range = backdrop.querySelector(".eqv-range");
        const number = backdrop.querySelector("#eqv-percent");
        const presets = [...backdrop.querySelectorAll(".eqv-preset")];
        const autoSwitch = backdrop.querySelector(".eqv-switch");
        const applyBtn = backdrop.querySelector('[data-action="apply"]');

        // Synchronise curseur, champ et raccourcis. Pendant la saisie, on ne réécrit
        // pas le champ (sinon taper "150" deviendrait "100" au milieu de la frappe).
        const render = (v, { keepField = false } = {}) => {
            value = v;
            range.value = String(v);
            range.style.setProperty("--eqv-fill", `${v}%`);
            if (!keepField) number.value = String(v);
            for (const btn of presets) btn.classList.toggle("eqv-active", Number(btn.dataset.value) === v);
        };

        // Sans personne dans le salon, le bouton enregistre quand même le niveau
        // et le mode auto pour les prochaines arrivées.
        const apply = () => {
            this.settings.lastPercent = value;
            this.settings.autoMode = autoSwitch.checked;
            this.save("lastPercent", "autoMode");
            if (count > 0) this.equalizeAll(userId, value);
            else BdApi.UI.showToast(t("toast.saved", value, this.settings.autoMode), { type: "success" });
            if (this.settings.autoMode) this.autoEqualizeMyChannel({ toast: true });
            close();
        };

        range.addEventListener("input", () => render(this.clampPercent(range.value)));

        number.addEventListener("input", () => {
            if (number.value.trim() === "" || !Number.isFinite(number.valueAsNumber)) return;
            render(this.clampPercent(number.valueAsNumber), { keepField: true });
        });
        // En quittant le champ, on affiche la valeur réellement retenue (bornée, entière)
        number.addEventListener("blur", () => render(value));
        number.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                render(value);
                apply();
            } else if (e.shiftKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
                e.preventDefault();
                render(this.clampPercent(value + (e.key === "ArrowUp" ? 10 : -10)));
            }
        });
        range.addEventListener("keydown", (e) => {
            if (e.key === "Enter") { e.preventDefault(); apply(); }
        });

        for (const btn of presets) {
            btn.addEventListener("click", () => render(Number(btn.dataset.value)));
        }
        for (const btn of backdrop.querySelectorAll('[data-action="close"]')) {
            btn.addEventListener("click", close);
        }
        applyBtn.addEventListener("click", apply);

        render(value);
        number.focus();
        number.select();
    }

    // ─── Menus contextuels ───────────────────────────────────────────────────
    injectIntoMenu(menu, userId) {
        try {
            const items = [
                BdApi.ContextMenu.buildItem({ type: "separator" }),
                BdApi.ContextMenu.buildItem({
                    type: "button",
                    id: "equalize-volumes",
                    label: t("menu.equalize"),
                    icon: SpeakerIcon,
                    action: () => this.openModal(userId)
                })
            ];
            if (this.settings.autoMode && userId !== this.getMyId()) {
                items.push(BdApi.ContextMenu.buildItem({
                    type: "toggle",
                    id: "equalize-volumes-exclude",
                    label: t("menu.exclude"),
                    checked: this.settings.excluded.has(userId),
                    action: () => this.toggleExcluded(userId)
                }));
            }

            const children = menu?.props?.children;
            if (!children) return;

            if (Array.isArray(children)) {
                children.push(...items);
            } else if (children?.props?.children) {
                const inner = children.props.children;
                if (Array.isArray(inner)) inner.push(...items);
            }
        } catch(e) {
            console.error("[EqualizeVolumes] injectIntoMenu:", e);
        }
    }

    patchContextMenus() {
        const menuIds = [
            "user-context",
            "voice-user-context",
            "guild-voice-user-context",
            "user-voice-context",
            "gdm-context"
        ];

        for (const menuId of menuIds) {
            const unpatch = BdApi.ContextMenu.patch(menuId, (menu, props) => {
                const userId = props?.user?.id ?? props?.userId ?? props?.member?.userId;
                if (!userId) return;
                this.injectIntoMenu(menu, userId);
            });
            this.patches.push(unpatch);
        }
    }

    // ─── Paramètres ──────────────────────────────────────────────────────────
    getSettingsPanel() {
        if (!this.settings) this.loadSettings();
        const last = this.settings.lastPercent;
        const kbd = (key) => `<span class="eqv-kbd">${key}</span>`;

        const panel = document.createElement("div");
        panel.className = "eqv-ui eqv-settings";
        panel.innerHTML = `
            <div class="eqv-card">
                <div class="eqv-heading">${t("settings.usageTitle")}</div>
                <p class="eqv-hint">${t("settings.usage", last)}</p>
            </div>
            <div class="eqv-card">
                <label class="eqv-row">
                    <div>
                        <div class="eqv-row-title">${t("auto.title")}</div>
                        <div class="eqv-row-desc">${t("settings.autoDesc", last)}</div>
                    </div>
                    <input type="checkbox" class="eqv-switch"${this.settings.autoMode ? " checked" : ""}>
                </label>
            </div>
            <div class="eqv-card">
                <div class="eqv-heading">${t("settings.excludedTitle")}</div>
                <div class="eqv-excluded"></div>
            </div>
            <div class="eqv-card">
                <div class="eqv-heading">${t("settings.shortcutsTitle")}</div>
                <div class="eqv-shortcuts eqv-muted">
                    <span>${kbd("0-9")}</span><span>${t("settings.kbdType")}</span>
                    <span>${kbd("↑")} ${kbd("↓")}</span><span>${t("settings.step1")}</span>
                    <span>${kbd(t("kbd.shift"))} + ${kbd("↑")} ${kbd("↓")}</span><span>${t("settings.step10")}</span>
                    <span>${kbd(t("kbd.enter"))}</span><span>${t("modal.apply")}</span>
                    <span>${kbd(t("kbd.esc"))}</span><span>${t("modal.close")}</span>
                </div>
            </div>
        `;

        const autoSwitch = panel.querySelector(".eqv-switch");
        autoSwitch.addEventListener("change", () => {
            this.settings.autoMode = autoSwitch.checked;
            this.save("autoMode");
            if (this.settings.autoMode) this.autoEqualizeMyChannel({ toast: true });
        });

        const excludedBox = panel.querySelector(".eqv-excluded");
        const renderExcluded = () => {
            const ids = [...this.settings.excluded.keys()];
            if (ids.length === 0) {
                excludedBox.innerHTML = `<p class="eqv-hint">${t("settings.excludedEmpty")}</p>`;
                return;
            }
            const UserStore = BdApi.Webpack.getStore("UserStore");
            excludedBox.innerHTML = `<div class="eqv-people">${ids.map(id => {
                const avatar = UserStore?.getUser?.(id)?.getAvatarURL?.(null, 64);
                return `
                    <div class="eqv-list-item">
                        ${avatar ? `<img class="eqv-avatar" src="${escapeHtml(avatar)}" alt="">` : `<span class="eqv-avatar"></span>`}
                        <span class="eqv-person-name">${escapeHtml(this.getDisplayName(id))}</span>
                        <button type="button" class="eqv-btn eqv-btn-sm eqv-btn-outline" data-remove="${escapeHtml(id)}">${t("settings.remove")}</button>
                    </div>`;
            }).join("")}</div>`;
        };
        excludedBox.addEventListener("click", (e) => {
            const btn = e.target.closest("[data-remove]");
            if (!btn) return;
            this.settings.excluded.delete(btn.dataset.remove);
            this.save("excluded");
            renderExcluded();
        });
        renderExcluded();

        return panel;
    }
};
