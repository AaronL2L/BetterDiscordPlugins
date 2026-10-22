/**
 * @name MessageScheduler
 * @author AaronL2L
 * @version 1.0.0
 * @description Schedule messages and set reminders on existing messages, in a Discord-style interface. English and French.
 * @invite HdXp7sWRY3
 * @website https://valientebot.xyz
 * @source https://github.com/AaronL2L/BetterDiscordPlugins/tree/main/MessageScheduler
 * @updateUrl https://raw.githubusercontent.com/AaronL2L/BetterDiscordPlugins/main/MessageScheduler/MessageScheduler.plugin.js
 */

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

const MS_ID = "MessageScheduler";

// Au-delà de ce retard (Discord fermé à l'heure prévue), on demande avant d'envoyer
const MISSED_GRACE_MS   = 2 * 60 * 1000;
const TOAST_DURATION_MS = 60000;

const DEFAULT_SETTINGS = {
    customSound: "",
    soundEnabled: true,
    volume: 100
};

// Libellés lus au moment de l'affichage, pour suivre la langue de Discord
const RECURRENCE_LABELS = {
    get once()    { return t("rec.once"); },
    get daily()   { return t("rec.daily"); },
    get weekly()  { return t("rec.weekly"); },
    get monthly() { return t("rec.monthly"); }
};

const CLOCK_PATHS = [
    "M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z",
    "M13 7h-2v5.414l3.293 3.293 1.414-1.414L13 11.586z"
];

const STYLE_ID = MS_ID + "-CSS";

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
        "rec.once": "Once",
        "rec.daily": "Every day",
        "rec.weekly": "Every week",
        "rec.monthly": "Every month",
        "when.today": (hm) => `Today at ${hm}`,
        "when.tomorrow": (hm) => `Tomorrow at ${hm}`,
        "when.yesterday": (hm) => `Yesterday at ${hm}`,
        "when.day": (day, hm) => `${day} at ${hm}`,
        "rel.past": "time passed",
        "rel.soon": "in less than a minute",
        "rel.min": (m) => `in ${m} min`,
        "rel.hm": (h, m) => `in ${h} h ${m} min`,
        "rel.h": (h) => `in ${h} h`,
        "rel.dh": (d, h) => `in ${d} d ${h} h`,
        "rel.d": (d) => `in ${d} d`,
        "shortcut.tomorrow": "Tomorrow 9 AM",
        "shortcut.aria": "Shortcuts",
        "msg.user": "User",
        "msg.noContent": "No content",
        "msg.attachment": "[Attachment]",
        "field.when": "Date and time",
        "field.pick": "Choose a date and time.",
        "field.past": "This date has already passed.",
        "field.recurrence": "Repeat",
        "field.note": "Note (optional)",
        "field.notePh": "A word to remind you why",
        "field.destination": (name) => `Destination: ${name}`,
        "missed.title": "Missed scheduled messages",
        "missed.text": (n) => (n === 1
            ? "1 message wasn't sent at the scheduled time (Discord closed or PC asleep). Do you want to send it now?"
            : `${n} messages weren't sent at the scheduled time (Discord closed or PC asleep). Do you want to send them now?`),
        "missed.due": (when) => `Due ${when}`,
        "missed.hint": "“Don't send” deletes one-time messages and moves recurring ones to their next occurrence.",
        "missed.send": "Send now",
        "missed.skip": "Don't send",
        "toast.missedSkipped": "Missed messages not sent.",
        "toast.noSendModule": "Can't send: message module not found.",
        "toast.sendFailed": "Failed to send the scheduled message.",
        "toast.sent": "Scheduled message sent.",
        "toast.audioBlocked": "Audio URL blocked — fallback beep.",
        "toast.snoozed": (m) => `Reminder snoozed for ${m} min.`,
        "toast.noChannel": "Couldn't find the channel.",
        "toast.scheduled": (when) => `Message scheduled for ${when}.`,
        "toast.future": "The date must be in the future.",
        "toast.msgNotFound": "Message not found.",
        "toast.reminderSet": (when) => `Reminder set for ${when}.`,
        "toast.msgCancelled": "Message cancelled.",
        "toast.reminderDeleted": "Reminder deleted.",
        "toast.remindersDeleted": "Reminders deleted.",
        "toast.rescheduled": (when) => `Rescheduled for ${when}.`,
        "toast.reminderEdited": "Reminder updated.",
        "reminder.kicker": "Reminder",
        "reminder.dismiss": "Dismiss",
        "reminder.yourNote": "Your note",
        "reminder.jump": "Jump to message",
        "reminder.snooze": (m) => `Remind me in ${m} minutes`,
        "btn.schedule": "Schedule this message",
        "menu.addReminder": "Add a reminder",
        "modal.schedule": "Schedule",
        "modal.add": "Add",
        "common.cancel": "Cancel",
        "common.close": "Close",
        "common.save": "Save",
        "channel.dmWith": (name) => `DM with ${name}`,
        "channel.dm": "Direct message",
        "manager.title": "Scheduled messages and reminders",
        "manager.notice": "To schedule a message, type it first, then click the clock.",
        "settings.soundTitle": "Reminder sound",
        "settings.soundDesc": "Played when a reminder appears.",
        "settings.volumeAria": "Volume in percent",
        "settings.customSound": "Custom sound",
        "settings.customSoundDesc": "http(s) link to a public audio file. Leave empty for the default beep.",
        "settings.customSoundPh": "https://example.com/sound.mp3",
        "settings.test": "Test",
        "settings.urlError": "The address must start with http:// or https://",
        "settings.clearAll": "Delete all",
        "list.edit": "Edit",
        "list.scheduledTitle": (n) => `Scheduled messages — ${n}`,
        "list.noScheduled": "No scheduled messages",
        "list.noScheduledHint": "Type a message, then click the clock next to the text box.",
        "list.held": "Pending",
        "list.cancelSend": "Cancel sending",
        "list.remindersTitle": (n) => `Reminders — ${n}`,
        "list.noReminders": "No reminders",
        "list.noRemindersHint": "Right-click a message, then choose “Add a reminder”.",
        "list.deleteReminder": "Delete reminder",
        "clear.title": "Delete all reminders?",
        "clear.text": (n) => (n === 1 ? "The active reminder will be deleted." : `The ${n} active reminders will be deleted.`),
        "edit.msgTitle": "Edit scheduled message",
        "edit.remTitle": "Edit reminder"
    },
    fr: {
        "time.locale": "fr-FR",
        "rec.once": "Une seule fois",
        "rec.daily": "Tous les jours",
        "rec.weekly": "Toutes les semaines",
        "rec.monthly": "Tous les mois",
        "when.today": (hm) => `Aujourd'hui à ${hm}`,
        "when.tomorrow": (hm) => `Demain à ${hm}`,
        "when.yesterday": (hm) => `Hier à ${hm}`,
        "when.day": (day, hm) => `${day} à ${hm}`,
        "rel.past": "heure dépassée",
        "rel.soon": "dans moins d'une minute",
        "rel.min": (m) => `dans ${m} min`,
        "rel.hm": (h, m) => `dans ${h} h ${m}`,
        "rel.h": (h) => `dans ${h} h`,
        "rel.dh": (d, h) => `dans ${d} j ${h} h`,
        "rel.d": (d) => `dans ${d} j`,
        "shortcut.tomorrow": "Demain 9 h",
        "shortcut.aria": "Raccourcis",
        "msg.user": "Utilisateur",
        "msg.noContent": "Aucun contenu",
        "msg.attachment": "[Pièce jointe]",
        "field.when": "Date et heure",
        "field.pick": "Choisissez une date et une heure.",
        "field.past": "Cette date est déjà passée.",
        "field.recurrence": "Récurrence",
        "field.note": "Note (facultative)",
        "field.notePh": "Un mot pour vous rappeler pourquoi",
        "field.destination": (name) => `Destination : ${name}`,
        "missed.title": "Messages planifiés manqués",
        "missed.text": (n) => (n === 1
            ? "1 message n'a pas été envoyé à l'heure prévue (Discord fermé ou PC en veille). Voulez-vous l'envoyer maintenant ?"
            : `${n} messages n'ont pas été envoyés à l'heure prévue (Discord fermé ou PC en veille). Voulez-vous les envoyer maintenant ?`),
        "missed.due": (when) => `Prévu ${when}`,
        "missed.hint": "« Ne pas envoyer » supprime les messages uniques et passe les messages récurrents à leur prochaine occurrence.",
        "missed.send": "Envoyer maintenant",
        "missed.skip": "Ne pas envoyer",
        "toast.missedSkipped": "Messages manqués non envoyés.",
        "toast.noSendModule": "Impossible d'envoyer : module message introuvable.",
        "toast.sendFailed": "Échec de l'envoi du message planifié.",
        "toast.sent": "Message planifié envoyé.",
        "toast.audioBlocked": "URL audio bloquée — bip de secours.",
        "toast.snoozed": (m) => `Rappel reporté de ${m} min.`,
        "toast.noChannel": "Impossible de trouver le salon.",
        "toast.scheduled": (when) => `Message planifié pour ${when}.`,
        "toast.future": "La date doit être dans le futur.",
        "toast.msgNotFound": "Message introuvable.",
        "toast.reminderSet": (when) => `Rappel prévu ${when}.`,
        "toast.msgCancelled": "Message annulé.",
        "toast.reminderDeleted": "Rappel supprimé.",
        "toast.remindersDeleted": "Rappels supprimés.",
        "toast.rescheduled": (when) => `Nouvel envoi prévu ${when}.`,
        "toast.reminderEdited": "Rappel modifié.",
        "reminder.kicker": "Rappel",
        "reminder.dismiss": "Ignorer",
        "reminder.yourNote": "Votre note",
        "reminder.jump": "Aller au message",
        "reminder.snooze": (m) => `Me le rappeler dans ${m} minutes`,
        "btn.schedule": "Planifier ce message",
        "menu.addReminder": "Ajouter un rappel",
        "modal.schedule": "Planifier",
        "modal.add": "Ajouter",
        "common.cancel": "Annuler",
        "common.close": "Fermer",
        "common.save": "Enregistrer",
        "channel.dmWith": (name) => `MP avec ${name}`,
        "channel.dm": "Message privé",
        "manager.title": "Messages planifiés et rappels",
        "manager.notice": "Pour planifier un message, écrivez-le d'abord, puis cliquez sur l'horloge.",
        "settings.soundTitle": "Son des rappels",
        "settings.soundDesc": "Joué à l'apparition d'un rappel.",
        "settings.volumeAria": "Volume en pourcentage",
        "settings.customSound": "Son personnalisé",
        "settings.customSoundDesc": "Lien http(s) vers un fichier audio public. Laissez vide pour le bip par défaut.",
        "settings.customSoundPh": "https://exemple.com/son.mp3",
        "settings.test": "Tester",
        "settings.urlError": "L'adresse doit commencer par http:// ou https://",
        "settings.clearAll": "Tout supprimer",
        "list.edit": "Modifier",
        "list.scheduledTitle": (n) => `Messages planifiés — ${n}`,
        "list.noScheduled": "Aucun message planifié",
        "list.noScheduledHint": "Écrivez un message, puis cliquez sur l'horloge à côté de la zone de saisie.",
        "list.held": "En attente",
        "list.cancelSend": "Annuler l'envoi",
        "list.remindersTitle": (n) => `Rappels — ${n}`,
        "list.noReminders": "Aucun rappel",
        "list.noRemindersHint": "Faites un clic droit sur un message, puis choisissez « Ajouter un rappel ».",
        "list.deleteReminder": "Supprimer le rappel",
        "clear.title": "Supprimer tous les rappels ?",
        "clear.text": (n) => (n === 1 ? "Le rappel actif sera supprimé." : `Les ${n} rappels actifs seront supprimés.`),
        "edit.msgTitle": "Modifier le message planifié",
        "edit.remTitle": "Modifier le rappel"
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
const ICON_CLOCK  = `<svg aria-hidden="true" role="img" width="24" height="24" viewBox="0 0 24 24">${CLOCK_PATHS.map(d => `<path fill="currentColor" d="${d}"/>`).join("")}</svg>`;
const ICON_BELL   = `<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a1.5 1.5 0 0 0-1.5 1.5v.6A6.5 6.5 0 0 0 5.5 10.5v3.2l-1.6 2.6A1 1 0 0 0 4.75 18h14.5a1 1 0 0 0 .85-1.53l-1.6-2.6v-3.37A6.5 6.5 0 0 0 13.5 4.1v-.6A1.5 1.5 0 0 0 12 2ZM9 19.5a3 3 0 0 0 6 0H9Z"/></svg>`;
const ICON_REPEAT = `<svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>`;
const ICON_PENCIL = `<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M15.3 3.3a2.4 2.4 0 0 1 3.4 0l2 2a2.4 2.4 0 0 1 0 3.4L9.4 20a2 2 0 0 1-1 .55l-4.3.95a1 1 0 0 1-1.2-1.2l.95-4.3a2 2 0 0 1 .55-1L15.3 3.3Z"/></svg>`;
const ICON_TRASH  = `<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M9.5 2A1.5 1.5 0 0 0 8 3.5V4H4a1 1 0 0 0 0 2h16a1 1 0 1 0 0-2h-4v-.5A1.5 1.5 0 0 0 14.5 2h-5ZM5.1 8l.82 11.2A3 3 0 0 0 8.9 22h6.2a3 3 0 0 0 2.99-2.8L18.9 8H5.1Z"/></svg>`;

const PLUGIN_CSS = `
/* Bouton horloge de la barre de message (repli si aucun bouton natif n'est copiable) */
.ms-schedule-btn-fallback {
    display: flex; align-items: center; padding: 0 8px; border: none; background: transparent;
    color: var(--interactive-normal, #b5bac1); cursor: pointer; transition: color .15s ease;
}
.ms-schedule-btn-fallback:hover { color: var(--interactive-hover, #dbdee1); }

/* Infobulles posées sur <body>, au-dessus des fenêtres et des notifications */
.ms-tooltip.ms-tooltip-layer { z-index: 100002; }

/* Notification de rappel, comme une carte flottante de Discord */
#ms-toast-container {
    position: fixed; top: 84px; right: 16px; z-index: 100001;
    display: flex; flex-direction: column; gap: 8px;
    width: 360px; max-width: calc(100vw - 32px); pointer-events: none;
}
.ms-toast {
    position: relative; display: flex; flex-direction: column; gap: 12px;
    overflow: hidden; padding: 12px 12px 16px 16px;
    border-radius: var(--ms-radius); background: var(--ms-bg);
    box-shadow: 0 0 0 1px var(--ms-border), var(--shadow-high, 0 8px 24px rgba(0, 0, 0, .32));
    pointer-events: auto; animation: ms-toast-in .25s cubic-bezier(.2, .9, .3, 1.1);
}
.ms-toast.ms-toast-hide { pointer-events: none; animation: ms-toast-out .2s ease-in forwards; }
@keyframes ms-toast-in { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: none; } }
@keyframes ms-toast-out { to { opacity: 0; transform: translateX(24px); } }
.ms-toast-head { display: flex; align-items: center; gap: 8px; min-height: 24px; }
.ms-toast-kicker { display: inline-flex; align-items: center; gap: 6px; color: var(--ms-header); font-size: 14px; font-weight: 600; line-height: 18px; }
.ms-toast-kicker svg { display: block; color: var(--ms-brand); }
.ms-toast-head .ms-pill { padding: 0 6px; }
.ms-icon-btn.ms-toast-close { width: 24px; height: 24px; margin-left: auto; border-radius: 4px; }
.ms-icon-btn.ms-toast-close svg { width: 18px; height: 18px; }
.ms-toast-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.ms-toast-actions .ms-btn:first-child { flex: 1 1 auto; }
/* Temps restant : la barre (et le minuteur) s'arrêtent au survol */
.ms-progress.ms-toast-timer { position: absolute; right: 0; bottom: 0; left: 0; height: 3px; border-radius: 0; background: transparent; }
.ms-toast-timer .ms-progress-bar {
    width: 100%; border-radius: 0; transform-origin: left center;
    animation: ms-drain ${TOAST_DURATION_MS / 1000}s linear forwards;
}
.ms-toast:hover .ms-toast-timer .ms-progress-bar { animation-play-state: paused; }
@keyframes ms-drain { from { transform: scaleX(1); } to { transform: scaleX(0); } }

/* Aperçu d'un message, mis en page comme dans le salon */
.ms-msg { display: flex; gap: 12px; padding: 8px 12px; border-radius: var(--ms-radius); background: var(--ms-bg-alt); }
.ms-msg .ms-avatar { width: 40px; height: 40px; }
.ms-msg-body { flex: 1 1 auto; min-width: 0; }
.ms-msg-head { display: flex; align-items: baseline; gap: 8px; min-width: 0; }
.ms-msg-author { overflow: hidden; color: var(--ms-header); font-size: 16px; font-weight: 500; line-height: 22px; white-space: nowrap; text-overflow: ellipsis; }
.ms-msg-time { flex: 0 0 auto; color: var(--ms-muted); font-size: 12px; font-weight: 500; line-height: 22px; }
.ms-msg-text {
    display: -webkit-box; overflow: hidden; -webkit-line-clamp: 3; -webkit-box-orient: vertical;
    color: var(--ms-text); font-size: 14px; line-height: 18px; overflow-wrap: anywhere;
}
.ms-msg-empty { color: var(--ms-muted); font-style: italic; }
.ms-avatar-letter { display: flex; align-items: center; justify-content: center; color: #fff; background: var(--ms-brand); font-size: 16px; font-weight: 600; }

/* Citation, comme un bloc « > » de Discord */
.ms-quote {
    padding: 0 0 0 12px; border-left: 4px solid var(--interactive-muted, #4e5058); border-radius: 4px;
    color: var(--ms-text); font-size: 14px; line-height: 18px; white-space: pre-wrap; overflow-wrap: anywhere;
}
.ms-quote-label { margin-bottom: 2px; color: var(--ms-header-alt); font-size: 12px; font-weight: 700; line-height: 16px; letter-spacing: .02em; text-transform: uppercase; }
.ms-quote-clamp { display: -webkit-box; overflow: hidden; -webkit-line-clamp: 4; -webkit-box-orient: vertical; }

/* Formulaire des fenêtres (planifier, rappel, modifier) */
.ms-form { padding: 4px 0 0; }
.ms-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.ms-chip {
    height: 28px; margin: 0; padding: 0 12px; border: none; border-radius: 14px;
    color: var(--ms-text); background: var(--ms-accent);
    font: inherit; font-size: 14px; font-weight: 500; line-height: 28px; white-space: nowrap;
    cursor: pointer; transition: background-color .15s ease, color .15s ease;
}
.ms-chip:hover { background: var(--ms-selected); }
.ms-chip.ms-active { color: #fff; background: var(--ms-brand); }
.ms-chip:focus-visible { outline: 2px solid var(--ms-focus); outline-offset: 2px; }
.ms-input::-webkit-calendar-picker-indicator { cursor: pointer; }
.ms-when { margin-top: 8px; color: var(--ms-muted); font-size: 14px; line-height: 18px; }
.ms-when-error, .ms-field-error { color: var(--text-danger, var(--ms-danger)); }
.ms-field-error { margin-top: 4px; font-size: 14px; line-height: 18px; }
.ms-input.ms-invalid { border-color: var(--ms-danger); }
.ms-text { margin: 0 0 16px; color: var(--ms-text); font-size: 16px; line-height: 20px; }

/* Messages manqués */
.ms-missed { display: flex; flex-direction: column; gap: 8px; max-height: 40vh; margin-bottom: 12px; }
.ms-missed-item { padding: 8px 12px; border-radius: var(--ms-radius); background: var(--ms-bg-alt); }
.ms-missed-head { display: flex; align-items: baseline; gap: 8px; min-width: 0; }
.ms-missed-channel { overflow: hidden; color: var(--ms-header); font-weight: 600; white-space: nowrap; text-overflow: ellipsis; }
.ms-missed-time { flex: 0 0 auto; color: var(--ms-muted); font-size: 12px; font-weight: 500; }
.ms-missed-text { display: -webkit-box; overflow: hidden; -webkit-line-clamp: 2; -webkit-box-orient: vertical; margin-top: 2px; color: var(--ms-text); overflow-wrap: anywhere; }

/* Panneau de réglages et gestionnaire */
.ms-settings { display: flex; flex-direction: column; gap: 24px; }
.ms-section-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 24px; margin-bottom: 8px; }
.ms-section-head .ms-label { margin: 0; }
.ms-row.ms-switch-row { padding-bottom: 0; border-bottom: none; }
.ms-sound-options > .ms-row:first-child { margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--ms-border); }
.ms-row.ms-row-stack { flex-direction: column; align-items: stretch; gap: 8px; }
.ms-volume-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.ms-sound-line { display: flex; gap: 8px; }
.ms-sound-line .ms-input { flex: 1 1 auto; min-width: 0; }
.ms-sound-line .ms-btn { flex: 0 0 auto; min-height: 40px; }
.ms-number { width: 88px; }
.ms-number .ms-input { padding-right: 2px; font-weight: 600; text-align: right; }
.ms-number .ms-input::-webkit-inner-spin-button,
.ms-number .ms-input::-webkit-outer-spin-button { margin: 0; -webkit-appearance: none; }

.ms-list { max-height: 320px; margin: 0 -8px; }
.ms-manager .ms-list { max-height: none; }
.ms-item { position: relative; display: flex; align-items: center; gap: 12px; padding: 10px 8px; border-radius: var(--ms-radius); transition: background-color .1s ease; }
.ms-item::before { content: ""; position: absolute; top: 0; right: 8px; left: 8px; height: 1px; background: var(--ms-border); }
.ms-item:first-child::before,
.ms-item:hover::before, .ms-item:focus-within::before,
.ms-item:hover + .ms-item::before, .ms-item:focus-within + .ms-item::before { opacity: 0; }
.ms-item:hover, .ms-item:focus-within { background: var(--ms-hover); }
.ms-item > .ms-avatar { width: 40px; height: 40px; }
.ms-item-icon {
    display: flex; align-items: center; justify-content: center; flex: 0 0 auto; width: 40px; height: 40px;
    border-radius: 50%; color: var(--ms-brand); background: color-mix(in srgb, var(--ms-brand) 16%, transparent);
}
.ms-item-icon svg { width: 22px; height: 22px; }
.ms-item-body { display: flex; flex-direction: column; gap: 2px; flex: 1 1 auto; min-width: 0; }
.ms-item-head { display: flex; align-items: center; gap: 6px; min-width: 0; }
.ms-item-title { overflow: hidden; color: var(--ms-header); font-size: 16px; font-weight: 600; line-height: 20px; white-space: nowrap; text-overflow: ellipsis; }
.ms-item-head .ms-pill { flex: 0 0 auto; padding: 0 6px; }
.ms-pill svg { flex: 0 0 auto; width: 12px; height: 12px; }
.ms-item-time { overflow: hidden; color: var(--ms-header-alt); font-size: 12px; font-weight: 500; line-height: 16px; white-space: nowrap; text-overflow: ellipsis; }
.ms-item-text { overflow: hidden; color: var(--ms-muted); font-size: 14px; line-height: 18px; white-space: nowrap; text-overflow: ellipsis; }
.ms-item .ms-quote { margin-top: 4px; font-size: 13px; line-height: 16px; }
.ms-item-actions { display: flex; flex: 0 0 auto; gap: 4px; }
.ms-list .ms-empty { padding: 24px 16px; }
.ms-empty-art { display: flex; align-items: center; justify-content: center; width: 56px; height: 56px; margin-bottom: 4px; border-radius: 50%; color: var(--ms-muted); background: var(--ms-accent); }
.ms-empty-art svg { width: 28px; height: 28px; }
.ms-empty .ms-hint { margin: 0; max-width: 320px; }
`;

// Raccourcis de date proposés dans les fenêtres
const TIME_SHORTCUTS = [
    { label: "+5 min",     at: () => Date.now() + 5 * 60000 },
    { label: "+15 min",    at: () => Date.now() + 15 * 60000 },
    { label: "+1 h",       at: () => Date.now() + 60 * 60000 },
    { label: "+4 h",       at: () => Date.now() + 4 * 60 * 60000 },
    { label: "+24 h",      at: () => Date.now() + 24 * 60 * 60000 },
    { get label() { return t("shortcut.tomorrow"); }, at: () => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); return d.getTime(); } }
];
const DEFAULT_SHORTCUT = TIME_SHORTCUTS[1];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers texte — tout contenu venant de Discord est échappé avant d'être inséré en HTML
// ─────────────────────────────────────────────────────────────────────────────

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

// N'accepte que les URL http(s)
function safeUrl(url) {
    return typeof url === "string" && /^https?:\/\//i.test(url.trim()) ? url.trim() : "";
}

function truncate(text, max) {
    text = String(text ?? "");
    return text.length > max ? text.substring(0, max) + "…" : text;
}

function firstLetter(name) {
    return ([...(name || "?")][0] || "?").toUpperCase();
}

function snowflakeToTime(id) {
    try { return Number((BigInt(id) >> 22n) + 1420070400000n); } catch { return null; }
}

// Nombre de jours entre aujourd'hui et la date (0 = aujourd'hui, 1 = demain, -1 = hier)
function dayOffset(time) {
    return Math.round((new Date(time).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000);
}

// Date lisible, comme les horodatages de Discord : « Aujourd'hui à 14:30 », « Demain à 09:00 »…
function formatWhen(time) {
    const d     = new Date(time);
    const hm    = d.toLocaleTimeString(t("time.locale"), { hour: "2-digit", minute: "2-digit" });
    const days  = dayOffset(time);
    if (days === 0)  return t("when.today", hm);
    if (days === 1)  return t("when.tomorrow", hm);
    if (days === -1) return t("when.yesterday", hm);
    const opts = { weekday: "long", day: "numeric", month: "long" };
    if (d.getFullYear() !== new Date().getFullYear()) opts.year = "numeric";
    const day = d.toLocaleDateString(t("time.locale"), opts);
    return t("when.day", `${day.charAt(0).toUpperCase()}${day.slice(1)}`, hm);
}

// Même date, à placer en milieu de phrase (en anglais, les jours de la semaine gardent leur majuscule)
function whenPhrase(time) {
    const s = formatWhen(time);
    if (getLang() === "en" && Math.abs(dayOffset(time)) > 1) return s;
    return s.charAt(0).toLowerCase() + s.slice(1);
}

// Délai restant : « dans 12 min », « dans 3 h 05 », « dans 2 j 4 h »
function formatRelative(ms) {
    if (ms <= 0) return t("rel.past");
    if (ms < 60000) return t("rel.soon");
    const min = Math.ceil(ms / 60000);
    if (min < 60) return t("rel.min", min);
    const h = Math.floor(min / 60), m = min % 60;
    if (h < 24) return m ? t("rel.hm", h, String(m).padStart(2, "0")) : t("rel.h", h);
    const d = Math.floor(h / 24), rh = h % 24;
    return rh ? t("rel.dh", d, rh) : t("rel.d", d);
}

// Valeur attendue par <input type="datetime-local"> (heure locale, à la minute)
function toLocalInput(time) {
    return new Date(time - new Date(time).getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function avatarHtml(url, name) {
    const src    = safeUrl(url);
    const letter = escapeHtml(firstLetter(name));
    return src
        ? `<img class="ms-avatar" src="${escapeHtml(src)}" alt="" data-ms-avatar="${letter}">`
        : `<div class="ms-avatar ms-avatar-letter" aria-hidden="true">${letter}</div>`;
}

// Les images ne peuvent pas utiliser onerror="..." (HTML inline) : on branche l'écouteur après insertion.
// Un avatar introuvable est remplacé par l'initiale, comme le fait Discord.
function replaceBrokenAvatars(root) {
    root.querySelectorAll("img[data-ms-avatar]").forEach(img => {
        img.addEventListener("error", () => {
            const letter = document.createElement("div");
            letter.className = "ms-avatar ms-avatar-letter";
            letter.setAttribute("aria-hidden", "true");
            letter.textContent = img.dataset.msAvatar || "?";
            img.replaceWith(letter);
        }, { once: true });
    });
}

// Infobulle de Discord pour tout élément [data-ms-tip] (une seule à la fois, posée sur <body>)
const Tip = {
    el: null,
    target: null,
    watch: null,
    show(target) {
        const text = target?.getAttribute("data-ms-tip");
        if (!text || !target.isConnected) { this.hide(); return; }
        if (!this.el) {
            this.el = document.createElement("div");
            this.el.className = "ms-ui ms-tooltip ms-tooltip-layer";
            this.el.setAttribute("role", "tooltip");
        }
        const el = this.el;
        this.target = target;
        el.textContent = text;
        const r     = target.getBoundingClientRect();
        const below = r.top < 48;
        el.classList.toggle("ms-tooltip-bottom", below);
        el.style.left = `${r.left + r.width / 2}px`;
        el.style.top  = `${below ? r.bottom + 8 : r.top - 8}px`;
        el.style.marginLeft = "0px";
        el.style.setProperty("--ms-tip-shift", "0px");
        document.body.appendChild(el);
        // Reste à 8 px des bords de la fenêtre, la flèche garde l'ancre
        const t     = el.getBoundingClientRect();
        const shift = Math.max(8 - t.left, 0) - Math.max(t.right - (window.innerWidth - 8), 0);
        if (shift) { el.style.marginLeft = `${shift}px`; el.style.setProperty("--ms-tip-shift", `${shift}px`); }
        // Disparaît avec son élément (fenêtre fermée au clavier, liste redessinée…)
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
        const find = node => node?.closest?.("[data-ms-tip]");
        root.addEventListener("mouseover", e => { const t = find(e.target); if (t && t !== this.target) this.show(t); });
        root.addEventListener("mouseout",  e => { const t = find(e.target); if (t && !t.contains(e.relatedTarget)) this.hide(); });
        root.addEventListener("focusin",   e => { const t = find(e.target); if (t?.matches(":focus-visible")) this.show(t); });
        root.addEventListener("focusout",  () => this.hide());
        root.addEventListener("click",     () => this.hide());
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers Webpack — 100% via BdApi.Webpack, zéro lib externe
// ─────────────────────────────────────────────────────────────────────────────

function getMessageActions() {
    return BdApi.Webpack.getByKeys("sendMessage", "jumpToMessage")
        || BdApi.Webpack.getModule(m => m?.sendMessage && typeof m.sendMessage === "function");
}

function getSelectedChannelStore() {
    return BdApi.Webpack.getStore("SelectedChannelStore")
        || BdApi.Webpack.getModule(m => m?.getChannelId && m?.getLastSelectedChannelId);
}

function getChannelInfoStore() {
    return BdApi.Webpack.getStore("ChannelStore")
        || BdApi.Webpack.getModule(m => m?.getChannel && m?.hasChannel);
}

function getTransitionTo() {
    const fn = BdApi.Webpack.getModule(BdApi.Webpack.Filters.byStrings("transitionTo - Transitioning to"), { searchExports: true });
    if (typeof fn === "function") return fn;
    const router = BdApi.Webpack.getByKeys("transitionTo", "replaceWith")
        || BdApi.Webpack.getByKeys("transitionTo", "back");
    return typeof router?.transitionTo === "function" ? router.transitionTo.bind(router) : null;
}

function getMessageJumper() {
    return BdApi.Webpack.getModule(m => m && typeof m.jumpToMessage === "function");
}

function getFluxDispatcher() {
    return BdApi.Webpack.getByKeys("dispatch", "subscribe");
}

function ClockIcon(props) {
    return BdApi.React.createElement("svg", { ...props, "aria-hidden": "true", role: "img", width: 18, height: 18, viewBox: "0 0 24 24", fill: "none" },
        ...CLOCK_PATHS.map(d => BdApi.React.createElement("path", { key: d, fill: "currentColor", d }))
    );
}

// Avatar avec repli sur l'initiale si l'image ne charge pas
function Avatar({ src, name }) {
    const React = BdApi.React;
    const [broken, setBroken] = React.useState(false);
    const url = safeUrl(src);
    if (!url || broken) return React.createElement("div", { className: "ms-avatar ms-avatar-letter", "aria-hidden": true }, firstLetter(name));
    return React.createElement("img", { className: "ms-avatar", src: url, alt: "", onError: () => setBroken(true) });
}

// Message cité tel qu'il apparaît dans le salon
function MessagePreview({ iconUrl, author, timestamp, content }) {
    const h = BdApi.React.createElement;
    return h("div", { className: "ms-msg" },
        h(Avatar, { src: iconUrl, name: author }),
        h("div", { className: "ms-msg-body" },
            h("div", { className: "ms-msg-head" },
                h("span", { className: "ms-msg-author" }, author || t("msg.user")),
                timestamp ? h("span", { className: "ms-msg-time" }, formatWhen(timestamp)) : null
            ),
            content
                ? h("div", { className: "ms-msg-text" }, content)
                : h("div", { className: "ms-msg-text ms-msg-empty" }, t("msg.noContent"))
        )
    );
}

// Date et heure : raccourcis, champ natif et échéance écrite en clair.
// La valeur reste lisible via document.getElementById(id) au moment de valider.
function DateTimeField({ id, defaultTime, defaultChip = null }) {
    const React = BdApi.React;
    const h     = React.createElement;
    const [value, setValue] = React.useState(() => toLocalInput(defaultTime));
    const [chip, setChip]   = React.useState(defaultChip);
    const [, refresh]       = React.useState(0);
    // Garde « dans X min » à jour tant que la fenêtre reste ouverte
    React.useEffect(() => {
        const timer = setInterval(() => refresh(n => n + 1), 20000);
        return () => clearInterval(timer);
    }, []);

    const time   = new Date(value).getTime();
    const valid  = !isNaN(time);
    const future = valid && time > Date.now();
    const whenId = id + "-when";

    return h("div", { className: "ms-field" },
        h("label", { className: "ms-label", htmlFor: id }, t("field.when")),
        h("div", { className: "ms-chips", role: "group", "aria-label": t("shortcut.aria") },
            TIME_SHORTCUTS.map(s => h("button", {
                key: s.label,
                type: "button",
                className: "ms-chip" + (chip === s.label ? " ms-active" : ""),
                "aria-pressed": chip === s.label,
                onClick: () => { setValue(toLocalInput(s.at())); setChip(s.label); }
            }, s.label))
        ),
        h("input", {
            id, type: "datetime-local", value,
            className: "ms-input" + (valid && !future ? " ms-invalid" : ""),
            min: toLocalInput(Date.now()),
            "aria-describedby": whenId,
            "aria-invalid": valid && !future,
            onChange: e => { setValue(e.target.value); setChip(null); }
        }),
        h("div", { id: whenId, className: "ms-when" + (future ? "" : " ms-when-error"), "aria-live": "polite" },
            !valid ? t("field.pick")
                : future ? `${formatWhen(time)} · ${formatRelative(time - Date.now())}`
                : t("field.past")
        )
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Classe principale
// ─────────────────────────────────────────────────────────────────────────────

module.exports = class MessageScheduler {
    constructor(meta) {
        this.meta               = meta;
        this.scheduledMessages  = [];
        this.reminders          = [];
        this.settings           = { ...DEFAULT_SETTINGS };
        this.interval           = null;
        this.btnObserver        = null;
        this.btnCheckQueued     = false;
        this.unpatchContextMenu = null;
        this.heldMessageIds     = new Set();
        this.toastTimers        = new Set();
        this.session            = null;
        this.currentAudioCtx    = null;
        this.currentAudioEl     = null;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Lifecycle
    // ──────────────────────────────────────────────────────────────────────────

    start() {
        this.session = {};
        this._loadData();
        BdApi.DOM.addStyle(STYLE_ID, discordKitCSS("ms") + PLUGIN_CSS);
        this._checkMissedMessages();
        this._startEngine();
        this._patchUI();
    }

    stop() {
        this.session = null;
        this._stopEngine();
        if (this.btnObserver) { this.btnObserver.disconnect(); this.btnObserver = null; }
        if (this.unpatchContextMenu) { this.unpatchContextMenu(); this.unpatchContextMenu = null; }
        BdApi.Patcher.unpatchAll(MS_ID);
        BdApi.DOM.removeStyle(STYLE_ID);
        Tip.hide();
        this._stopSound();
        this._cleanupToasts();
        document.getElementById("ms-schedule-btn-dom")?.remove();
        this.heldMessageIds.clear();
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Persistence
    // ──────────────────────────────────────────────────────────────────────────

    _loadData() {
        const data = BdApi.Data.load(MS_ID, "data") || {};
        this.scheduledMessages = data.scheduledMessages || [];
        this.reminders         = data.reminders         || [];
        this.settings          = Object.assign({}, DEFAULT_SETTINGS, data.settings || {});
    }

    _saveData() {
        BdApi.Data.save(MS_ID, "data", {
            scheduledMessages: this.scheduledMessages,
            reminders:         this.reminders,
            settings:          this.settings
        });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Moteur de déclenchement
    // ──────────────────────────────────────────────────────────────────────────

    _startEngine() {
        this.interval = setInterval(() => this._tick(), 1000);
    }

    _stopEngine() {
        if (this.interval) { clearInterval(this.interval); this.interval = null; }
    }

    _tick() {
        const now = Date.now();

        for (let i = this.reminders.length - 1; i >= 0; i--) {
            const rem = this.reminders[i];
            if (rem.time <= now) {
                this._triggerReminder(rem);
                const next = this._nextRecurrence(rem.time, rem.recurrence, now);
                if (next) { rem.time = next; }
                else { this.reminders.splice(i, 1); }
                this._saveData();
            }
        }

        let hasMissed = false;
        for (let i = this.scheduledMessages.length - 1; i >= 0; i--) {
            const msg = this.scheduledMessages[i];
            // Les messages manqués attendent la réponse de l'utilisateur
            if (this.heldMessageIds.has(msg.id)) continue;
            // Très en retard (PC sorti de veille…) : on demande au lieu d'envoyer
            if (msg.time <= now - MISSED_GRACE_MS) { hasMissed = true; continue; }
            if (msg.time <= now) {
                this._sendScheduledMessage(msg);
                const next = this._nextRecurrence(msg.time, msg.recurrence, now);
                if (next) { msg.time = next; }
                else { this.scheduledMessages.splice(i, 1); }
                this._saveData();
            }
        }
        if (hasMissed) this._checkMissedMessages();
    }

    _nextRecurrence(startTime, recurrence, now = Date.now()) {
        if (!recurrence || recurrence === "once") return null;
        const date = new Date(startTime);
        while (date.getTime() <= now) {
            if      (recurrence === "daily")   date.setDate(date.getDate() + 1);
            else if (recurrence === "weekly")  date.setDate(date.getDate() + 7);
            else if (recurrence === "monthly") date.setMonth(date.getMonth() + 1);
            else break;
        }
        return date.getTime();
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Messages manqués (Discord fermé ou PC en veille à l'heure prévue)
    // ──────────────────────────────────────────────────────────────────────────

    _checkMissedMessages() {
        const now    = Date.now();
        const missed = this.scheduledMessages.filter(m => m.time <= now - MISSED_GRACE_MS && !this.heldMessageIds.has(m.id));
        if (!missed.length) return;

        missed.forEach(m => this.heldMessageIds.add(m.id));

        const session = this.session;
        let resolved  = false;
        const resolve = (send) => {
            if (resolved || session !== this.session) return;
            resolved = true;
            this._resolveMissed(missed, send);
        };

        const h     = BdApi.React.createElement;
        const count = missed.length;
        BdApi.UI.showConfirmationModal(
            t("missed.title"),
            h("div", { className: "ms-ui ms-form" },
                h("p", { className: "ms-text" }, t("missed.text", count)),
                h("div", { className: "ms-missed ms-scroller" },
                    missed.map(m => h("div", { key: m.id, className: "ms-missed-item" },
                        h("div", { className: "ms-missed-head" },
                            h("span", { className: "ms-missed-channel" }, this._channelName(m.channelId)),
                            h("span", { className: "ms-missed-time" }, t("missed.due", whenPhrase(m.time)))
                        ),
                        h("div", { className: "ms-missed-text" }, m.content)
                    ))
                ),
                h("p", { className: "ms-hint" }, t("missed.hint"))
            ),
            {
                confirmText: t("missed.send"),
                cancelText:  t("missed.skip"),
                onConfirm: () => resolve(true),
                onCancel:  () => resolve(false)
            }
        );
    }

    _resolveMissed(missed, send) {
        const now = Date.now();
        for (const msg of missed) {
            this.heldMessageIds.delete(msg.id);
            if (!this.scheduledMessages.includes(msg)) continue; // annulé entre-temps
            if (msg.time > now) continue;                         // reprogrammé entre-temps
            if (send) this._sendScheduledMessage(msg);
            const next = this._nextRecurrence(msg.time, msg.recurrence, now);
            if (next) msg.time = next;
            else this.scheduledMessages = this.scheduledMessages.filter(m => m !== msg);
        }
        this._saveData();
        if (!send) BdApi.UI.showToast(t("toast.missedSkipped"), { type: "info" });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Envoi de message planifié
    // ──────────────────────────────────────────────────────────────────────────

    _sendScheduledMessage(msg) {
        const actions = getMessageActions();
        if (!actions) {
            BdApi.UI.showToast(t("toast.noSendModule"), { type: "error" });
            return;
        }
        const onError = (e) => {
            console.error("[MessageScheduler] Erreur envoi:", e);
            BdApi.UI.showToast(t("toast.sendFailed"), { type: "error" });
        };
        try {
            Promise.resolve(actions.sendMessage(msg.channelId, { content: msg.content, validNonShortcutEmojis: [] }))
                .then(() => BdApi.UI.showToast(t("toast.sent"), { type: "success" }))
                .catch(onError);
        } catch (e) {
            onError(e);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Son de notification — 100% natif (AudioContext Web API)
    // ──────────────────────────────────────────────────────────────────────────

    _playSound() {
        if (!this.settings.soundEnabled) return;
        this._stopSound();

        try {
            const volume      = (this.settings.volume ?? 100) / 100;
            const customSound = safeUrl(this.settings.customSound || "");

            const playBeep = () => {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                this.currentAudioCtx = ctx;
                const gain = ctx.createGain();
                gain.gain.setValueAtTime(volume, ctx.currentTime);
                gain.connect(ctx.destination);

                const playNote = (freq, t, dur) => {
                    const osc  = ctx.createOscillator();
                    const ng   = ctx.createGain();
                    osc.connect(ng); ng.connect(gain);
                    osc.type = "sine";
                    osc.frequency.setValueAtTime(freq, t);
                    ng.gain.setValueAtTime(0.5, t);
                    ng.gain.exponentialRampToValueAtTime(0.01, t + dur);
                    osc.start(t); osc.stop(t + dur);
                };
                const play = () => {
                    const now = ctx.currentTime;
                    playNote(880,     now,        0.4);
                    playNote(1108.73, now + 0.15, 0.6);
                };
                if (ctx.state === "suspended") ctx.resume().then(play).catch(() => {});
                else play();
            };

            // URL externe → <Audio> natif du navigateur
            if (customSound) {
                const audio = new Audio(customSound);
                audio.volume = volume;
                this.currentAudioEl = audio;
                audio.onended = () => { if (this.currentAudioEl === audio) this.currentAudioEl = null; };
                audio.play().catch(() => {
                    BdApi.UI.showToast(t("toast.audioBlocked"), { type: "warning" });
                    playBeep();
                });
                return;
            }

            playBeep();
        } catch (e) {
            console.error("[MessageScheduler] Erreur AudioContext:", e);
        }
    }

    _stopSound() {
        try { this.currentAudioEl?.pause(); this.currentAudioEl && (this.currentAudioEl.src = ""); } catch {} this.currentAudioEl = null;
        try { this.currentAudioCtx?.close(); } catch {} this.currentAudioCtx = null;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Rappels — toast personnalisé
    // ──────────────────────────────────────────────────────────────────────────

    _triggerReminder(rem) {
        this._playSound();
        this._showReminderToast(rem);
    }

    _showReminderToast(rem) {
        const isDM     = !rem.guildId || rem.guildId === "@me";
        const recLabel = rem.recurrence && rem.recurrence !== "once" ? RECURRENCE_LABELS[rem.recurrence] : null;

        const toast = document.createElement("div");
        toast.className = "ms-ui ms-toast";
        toast.setAttribute("role", "status");
        toast.innerHTML = `
            <div class="ms-toast-head">
                <span class="ms-toast-kicker">${ICON_BELL}${t("reminder.kicker")}</span>
                ${recLabel ? `<span class="ms-pill ms-pill-brand">${ICON_REPEAT}${escapeHtml(recLabel)}</span>` : ""}
                <button type="button" class="ms-icon-btn ms-toast-close" data-action="dismiss" aria-label="${t("reminder.dismiss")}" data-ms-tip="${t("reminder.dismiss")}">${ICON_CLOSE}</button>
            </div>
            <div class="ms-msg">
                ${avatarHtml(rem.iconUrl, rem.authorName)}
                <div class="ms-msg-body">
                    <div class="ms-msg-head">
                        <span class="ms-msg-author">${escapeHtml(rem.authorName || t("msg.user"))}</span>
                        ${rem.timestamp ? `<span class="ms-msg-time">${escapeHtml(formatWhen(rem.timestamp))}</span>` : ""}
                    </div>
                    ${rem.contentSnippet
                        ? `<div class="ms-msg-text">${escapeHtml(rem.contentSnippet)}</div>`
                        : `<div class="ms-msg-text ms-msg-empty">${t("msg.noContent")}</div>`}
                </div>
            </div>
            ${rem.note ? `<div class="ms-quote"><div class="ms-quote-label">${t("reminder.yourNote")}</div>${escapeHtml(rem.note)}</div>` : ""}
            <div class="ms-toast-actions">
                <button type="button" class="ms-btn ms-btn-sm" data-action="link">${t("reminder.jump")}</button>
                <button type="button" class="ms-btn ms-btn-sm ms-btn-secondary" data-action="snooze5" data-ms-tip="${t("reminder.snooze", 5)}">+5 min</button>
                <button type="button" class="ms-btn ms-btn-sm ms-btn-secondary" data-action="snooze15" data-ms-tip="${t("reminder.snooze", 15)}">+15 min</button>
            </div>
            <div class="ms-progress ms-toast-timer" aria-hidden="true"><div class="ms-progress-bar"></div></div>
        `;
        replaceBrokenAvatars(toast);
        Tip.bind(toast);

        let container = document.getElementById("ms-toast-container");
        if (!container) {
            container = document.createElement("div");
            container.id = "ms-toast-container";
            (document.getElementById("app-mount") || document.body).appendChild(container);
        }
        container.appendChild(toast);

        // Fermeture automatique, mise en pause tant que la souris est sur la notification
        let autoClose = null;
        let remaining = TOAST_DURATION_MS;
        let startedAt = 0;
        const startTimer = () => {
            if (autoClose || toast.classList.contains("ms-toast-hide")) return;
            startedAt = Date.now();
            autoClose = setTimeout(dismiss, remaining);
            this.toastTimers.add(autoClose);
        };
        const pauseTimer = () => {
            if (!autoClose) return;
            clearTimeout(autoClose);
            this.toastTimers.delete(autoClose);
            autoClose = null;
            remaining = Math.max(remaining - (Date.now() - startedAt), 0);
        };

        const dismiss = () => {
            pauseTimer();
            if (!toast.isConnected || toast.classList.contains("ms-toast-hide")) return;
            Tip.hideWithin(toast);
            this._stopSound();
            toast.classList.add("ms-toast-hide");
            const removeTimer = setTimeout(() => { toast.remove(); this.toastTimers.delete(removeTimer); }, 250);
            this.toastTimers.add(removeTimer);
        };

        const snooze = (minutes) => {
            this.reminders.push({
                ...rem,
                id: Date.now() + "-" + Math.floor(Math.random() * 10000),
                time: Date.now() + minutes * 60000,
                recurrence: "once"
            });
            this._saveData();
            dismiss();
            BdApi.UI.showToast(t("toast.snoozed", minutes), { type: "success" });
        };

        const on = (action, handler) => {
            toast.querySelector(`[data-action="${action}"]`)?.addEventListener("click", e => {
                e.preventDefault(); e.stopPropagation();
                handler();
            });
        };
        on("snooze5",  () => snooze(5));
        on("snooze15", () => snooze(15));
        on("dismiss",  dismiss);
        on("link", () => {
            this._stopSound();
            this._navigateTo(isDM ? "@me" : rem.guildId, rem.channelId, rem.messageId);
            dismiss();
        });

        toast.addEventListener("mouseenter", pauseTimer);
        toast.addEventListener("mouseleave", startTimer);
        startTimer();
    }

    // Navigation 100% native BdApi — sans ZeresLib ni BDFDB
    _navigateTo(guildId, channelId, messageId) {
        const transitionTo = getTransitionTo();
        const jumper       = getMessageJumper();
        const dispatcher   = getFluxDispatcher();

        const doJump = () => {
            if (jumper && messageId) {
                try { jumper.jumpToMessage({ channelId, messageId, flash: true, offset: 0, context: "CHANNEL", returnMessageId: null }); } catch {}
            }
        };

        if (transitionTo) {
            try { transitionTo(`/channels/${guildId}/${channelId}`); setTimeout(doJump, 500); return; } catch {}
        }

        if (dispatcher?.dispatch) {
            try {
                if (guildId && guildId !== "@me") {
                    dispatcher.dispatch({ type: "GUILD_SELECT",   guildId });
                    setTimeout(() => {
                        try { dispatcher.dispatch({ type: "CHANNEL_SELECT", guildId, channelId }); setTimeout(doJump, 300); } catch {}
                    }, 150);
                } else {
                    dispatcher.dispatch({ type: "CHANNEL_SELECT", guildId: null, channelId });
                    setTimeout(doJump, 300);
                }
                return;
            } catch {}
        }

        doJump();
    }

    _cleanupToasts() {
        for (const timer of this.toastTimers) clearTimeout(timer);
        this.toastTimers.clear();
        document.getElementById("ms-toast-container")?.remove();
    }

    // ──────────────────────────────────────────────────────────────────────────
    // UI
    // ──────────────────────────────────────────────────────────────────────────

    _patchUI() {
        this._injectScheduleButton();
        this._patchContextMenu();
    }

    // Bouton dans la barre de message : réinjecté dès que Discord recrée la zone de saisie
    _injectScheduleButton() {
        const session = this.session;
        this.btnObserver = new MutationObserver(() => {
            if (this.btnCheckQueued) return;
            this.btnCheckQueued = true;
            requestAnimationFrame(() => {
                this.btnCheckQueued = false;
                if (session === this.session) this._ensureScheduleButton();
            });
        });
        this.btnObserver.observe(document.getElementById("app-mount") || document.body, { childList: true, subtree: true });
        this._ensureScheduleButton();
    }

    _ensureScheduleButton() {
        if (document.getElementById("ms-schedule-btn-dom")) return;
        const container = document.querySelector('div[class*="channelTextArea"] div[class*="buttons"]');
        if (!container) return;

        const refBtn = Array.from(container.querySelectorAll('button,[role="button"]')).pop();
        let btn;

        if (refBtn) {
            // Copie du dernier bouton natif pour reprendre son apparence
            btn = refBtn.cloneNode(true);
            btn.id = "ms-schedule-btn-dom";
            ["aria-expanded", "aria-haspopup", "aria-controls", "aria-describedby", "title"].forEach(a => btn.removeAttribute(a));
            const svgNode = btn.querySelector("svg");
            if (svgNode?.parentElement) svgNode.parentElement.innerHTML = ICON_CLOCK;
            else btn.innerHTML = ICON_CLOCK;
        } else {
            btn = document.createElement("button");
            btn.type = "button";
            btn.id = "ms-schedule-btn-dom";
            btn.className = "ms-schedule-btn-fallback";
            btn.innerHTML = ICON_CLOCK;
        }

        // Infobulle de Discord plutôt que l'info-bulle grise du navigateur
        btn.setAttribute("aria-label", t("btn.schedule"));
        btn.setAttribute("data-ms-tip", t("btn.schedule"));
        btn.addEventListener("mouseenter", () => Tip.show(btn));
        btn.addEventListener("mouseleave", () => Tip.hide());
        btn.addEventListener("click", () => {
            Tip.hide();
            const channelId = getSelectedChannelStore()?.getChannelId?.() || null;
            if (!channelId) { BdApi.UI.showToast(t("toast.noChannel"), { type: "error" }); return; }

            const editor = document.querySelector('div[class*="channelTextArea"] [data-slate-editor="true"]');
            const text   = editor
                ? Array.from(editor.querySelectorAll('[data-slate-string="true"]')).map(n => n.textContent).join("")
                : "";

            this._openScheduleModal(channelId, text);
        });

        container.prepend(btn);
    }

    // Entrée « Ajouter un rappel » dans le menu contextuel natif des messages
    _patchContextMenu() {
        this.unpatchContextMenu = BdApi.ContextMenu.patch("message", (tree, props) => {
            const message = props?.message;
            const channel = props?.channel;
            if (!message?.id || !channel?.id) return;

            const item = BdApi.ContextMenu.buildItem({
                type:   "button",
                id:     "ms-add-reminder",
                label:  t("menu.addReminder"),
                icon:   ClockIcon,
                action: () => this._openReminderModal(this._reminderSourceFromMessage(message, channel))
            });

            const group = BdApi.Utils.findInTree(tree, x => Array.isArray(x) && x.some(c => c?.props?.id === "copy-text"), { walkable: ["props", "children"] });
            if (group) group.push(item);
            else if (Array.isArray(tree?.props?.children)) tree.props.children.push(BdApi.ContextMenu.buildItem({ type: "separator" }), item);
        });
    }

    // Données du message lues directement depuis Discord (plus de lecture du DOM)
    _reminderSourceFromMessage(message, channel) {
        const author   = message.author;
        const guildId  = channel.guild_id || null;
        const member   = guildId && author?.id ? BdApi.Webpack.getStore("GuildMemberStore")?.getMember(guildId, author.id) : null;

        let content = message.content || "";
        if (!content && message.attachments?.length) content = t("msg.attachment");
        if (!content && message.embeds?.length)      content = "[Embed]";
        if (!content && message.stickerItems?.length) content = "[Sticker]";

        let iconUrl = "";
        try { iconUrl = author?.getAvatarURL?.(guildId, 64) || ""; } catch {}

        return {
            id:         message.id,
            channel_id: channel.id,
            guild_id:   guildId,
            content:    content || "...",
            author:     { username: member?.nick || author?.globalName || author?.username || "Message" },
            iconUrl,
            jumpLink:   `https://discord.com/channels/${guildId || "@me"}/${channel.id}/${message.id}`,
            timestamp:  snowflakeToTime(message.id)
        };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Modales
    // ──────────────────────────────────────────────────────────────────────────

    _buildRecurrenceSelect(id, defaultVal = "once") {
        const h = BdApi.React.createElement;
        return h("div", { className: "ms-field" },
            h("label", { className: "ms-label", htmlFor: id }, t("field.recurrence")),
            h("select", { id, className: "ms-select", defaultValue: defaultVal },
                Object.entries(RECURRENCE_LABELS).map(([value, label]) => h("option", { key: value, value }, label))
            )
        );
    }

    _buildNoteField(id, defaultVal = "") {
        const h = BdApi.React.createElement;
        return h("div", { className: "ms-field" },
            h("label", { className: "ms-label", htmlFor: id }, t("field.note")),
            h("textarea", { id, className: "ms-textarea", rows: 2, defaultValue: defaultVal, placeholder: t("field.notePh") })
        );
    }

    // Texte à envoyer, cité comme dans Discord, avec le salon de destination
    _buildTextPreview(text, channelId) {
        const h = BdApi.React.createElement;
        return h("div", { className: "ms-field" },
            h("div", { className: "ms-label" }, "Message"),
            h("div", { className: "ms-quote ms-quote-clamp" }, text),
            h("p", { className: "ms-hint" }, t("field.destination", this._channelName(channelId)))
        );
    }

    _buildMessagePreview(source) {
        const h = BdApi.React.createElement;
        return h("div", { className: "ms-field" },
            h("div", { className: "ms-label" }, "Message"),
            h(MessagePreview, source)
        );
    }

    _openScheduleModal(channelId, textValue) {
        if (!textValue?.trim()) { this._openManagerModal(); return; }

        const uid     = Date.now();
        const inputId = "ms-time-" + uid;
        const recId   = "ms-rec-"  + uid;
        const h       = BdApi.React.createElement;

        BdApi.UI.showConfirmationModal(
            t("btn.schedule"),
            h("div", { className: "ms-ui ms-form" },
                this._buildTextPreview(textValue, channelId),
                h(DateTimeField, { id: inputId, defaultTime: DEFAULT_SHORTCUT.at(), defaultChip: DEFAULT_SHORTCUT.label }),
                this._buildRecurrenceSelect(recId)
            ),
            {
                confirmText: t("modal.schedule"),
                cancelText:  t("common.cancel"),
                onConfirm: () => {
                    const time       = new Date(document.getElementById(inputId)?.value || "").getTime();
                    const recurrence = document.getElementById(recId)?.value || "once";
                    if (!isNaN(time) && time > Date.now()) {
                        this.scheduledMessages.push({
                            id:         Date.now() + "-" + Math.floor(Math.random() * 10000),
                            time, content: textValue, channelId, recurrence
                        });
                        this._saveData();
                        BdApi.UI.showToast(t("toast.scheduled", whenPhrase(time)), { type: "success" });
                    } else {
                        BdApi.UI.showToast(t("toast.future"), { type: "error" });
                    }
                }
            }
        );
    }

    _openReminderModal(message) {
        if (!message || message.id === "0") { BdApi.UI.showToast(t("toast.msgNotFound"), { type: "error" }); return; }

        const uid     = Date.now();
        const inputId = "ms-rem-time-" + uid;
        const noteId  = "ms-rem-note-" + uid;
        const recId   = "ms-rem-rec-"  + uid;
        const h       = BdApi.React.createElement;

        BdApi.UI.showConfirmationModal(
            t("menu.addReminder"),
            h("div", { className: "ms-ui ms-form" },
                this._buildMessagePreview({ iconUrl: message.iconUrl, author: message.author?.username, timestamp: message.timestamp, content: message.content }),
                h(DateTimeField, { id: inputId, defaultTime: DEFAULT_SHORTCUT.at(), defaultChip: DEFAULT_SHORTCUT.label }),
                this._buildNoteField(noteId),
                this._buildRecurrenceSelect(recId)
            ),
            {
                confirmText: t("modal.add"),
                cancelText:  t("common.cancel"),
                onConfirm: () => {
                    const time       = new Date(document.getElementById(inputId)?.value || "").getTime();
                    const note       = document.getElementById(noteId)?.value  || "";
                    const recurrence = document.getElementById(recId)?.value   || "once";
                    if (!isNaN(time) && time > Date.now()) {
                        this._addReminder(message, time - Date.now(), note, recurrence);
                    } else {
                        BdApi.UI.showToast(t("toast.future"), { type: "error" });
                    }
                }
            }
        );
    }

    _addReminder(message, offsetMs, note, recurrence) {
        const time = Date.now() + offsetMs;
        this.reminders.push({
            id:             Date.now() + "-" + Math.floor(Math.random() * 10000),
            time,
            contentSnippet: truncate(message.content, 80),
            authorName:     message.author.username,
            guildId:        message.guild_id || "@me",
            channelId:      message.channel_id,
            messageId:      message.id,
            iconUrl:        message.iconUrl  || "",
            jumpLink:       message.jumpLink || "",
            timestamp:      message.timestamp || null,
            note:           note || "",
            recurrence:     recurrence || "once"
        });
        this._saveData();
        BdApi.UI.showToast(t("toast.reminderSet", whenPhrase(time)), { type: "success" });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Panneau de paramètres (gestionnaire)
    // ──────────────────────────────────────────────────────────────────────────

    _channelName(id) {
        try {
            const c = getChannelInfoStore()?.getChannel?.(id);
            if (!c) return `ID: ${id}`;
            if (c.name) return `#${c.name}`;
            const recipientId = c.recipients?.[0];
            const user = recipientId && BdApi.Webpack.getStore("UserStore")?.getUser(recipientId);
            return user ? t("channel.dmWith", user.globalName || user.username) : t("channel.dm");
        } catch {
            return `ID: ${id}`;
        }
    }

    // Ouvert par l'horloge quand la zone de saisie est vide
    _openManagerModal() {
        const panel = this.getSettingsPanel();
        panel.classList.add("ms-manager");
        const h = BdApi.React.createElement;
        BdApi.UI.showConfirmationModal(t("manager.title"),
            h("div", { className: "ms-ui" },
                h("div", { className: "ms-notice", style: { marginBottom: "20px" } },
                    t("manager.notice")
                ),
                h("div", {
                    className: "ms-scroller",
                    ref: el => { if (el && !el.contains(panel)) { el.innerHTML = ""; el.appendChild(panel); } },
                    style: { maxHeight: "60vh", marginRight: "-8px", paddingRight: "8px" }
                })
            ),
            { confirmText: t("common.close"), cancelText: null }
        );
    }

    getSettingsPanel() {
        const volume = Math.min(100, Math.max(0, Math.round(Number(this.settings.volume ?? 100))));
        const panel  = document.createElement("div");
        panel.className = "ms-ui ms-settings";

        panel.innerHTML = `
            <section>
                <h3 class="ms-label">Notifications</h3>
                <div class="ms-card">
                    <div class="ms-row ms-switch-row">
                        <div>
                            <label class="ms-row-title" for="ms-sound-enabled">${t("settings.soundTitle")}</label>
                            <div class="ms-row-desc" id="ms-sound-desc">${t("settings.soundDesc")}</div>
                        </div>
                        <input id="ms-sound-enabled" class="ms-switch" type="checkbox" role="switch" aria-describedby="ms-sound-desc" ${this.settings.soundEnabled ? "checked" : ""}>
                    </div>
                    <div class="ms-sound-options" id="ms-sound-options" ${this.settings.soundEnabled ? "" : "hidden"}>
                        <div class="ms-row ms-row-stack">
                            <div class="ms-volume-head">
                                <label class="ms-row-title" for="ms-volume-slider">Volume</label>
                                <div class="ms-input-group ms-number">
                                    <input id="ms-volume-input" class="ms-input ms-input-sm" type="number" min="0" max="100" step="1" inputmode="numeric" aria-label="${t("settings.volumeAria")}" value="${volume}">
                                    <span class="ms-input-suffix" aria-hidden="true">%</span>
                                </div>
                            </div>
                            <input id="ms-volume-slider" class="ms-range" type="range" min="0" max="100" step="1" value="${volume}" style="--ms-fill:${volume}%">
                        </div>
                        <div class="ms-row ms-row-stack">
                            <div>
                                <label class="ms-row-title" for="ms-audio-input">${t("settings.customSound")}</label>
                                <div class="ms-row-desc" id="ms-audio-desc">${t("settings.customSoundDesc")}</div>
                            </div>
                            <div class="ms-sound-line">
                                <input id="ms-audio-input" class="ms-input" type="url" spellcheck="false" placeholder="${t("settings.customSoundPh")}" aria-describedby="ms-audio-desc ms-audio-error" value="${escapeHtml(this.settings.customSound || "")}">
                                <button type="button" id="ms-test-sound" class="ms-btn ms-btn-secondary">${t("settings.test")}</button>
                            </div>
                            <div class="ms-field-error" id="ms-audio-error" role="alert" hidden>${t("settings.urlError")}</div>
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <div class="ms-section-head">
                    <h3 class="ms-label" id="ms-msg-title"></h3>
                </div>
                <div class="ms-list ms-scroller" id="ms-scheduled-list"></div>
            </section>

            <section>
                <div class="ms-section-head">
                    <h3 class="ms-label" id="ms-rem-title"></h3>
                    <button type="button" id="ms-clear-reminders" class="ms-btn ms-btn-xs ms-btn-outline-danger">${t("settings.clearAll")}</button>
                </div>
                <div class="ms-list ms-scroller" id="ms-reminders-list"></div>
            </section>
        `;
        Tip.bind(panel);

        // Les réglages s'enregistrent d'eux-mêmes, comme dans Discord
        let saveTimer = null;
        const saveSoon = () => { clearTimeout(saveTimer); saveTimer = setTimeout(() => this._saveData(), 300); };

        // Son
        const soundSwitch  = panel.querySelector("#ms-sound-enabled");
        const soundOptions = panel.querySelector("#ms-sound-options");
        soundSwitch.addEventListener("change", () => {
            this.settings.soundEnabled = soundSwitch.checked;
            soundOptions.hidden = !soundSwitch.checked;
            if (!soundSwitch.checked) this._stopSound();
            this._saveData();
        });

        // Volume : curseur et pourcentage saisi au clavier restent synchronisés
        const slider = panel.querySelector("#ms-volume-slider");
        const number = panel.querySelector("#ms-volume-input");
        const renderVolume = (value, { keepField = false } = {}) => {
            const v = Math.min(100, Math.max(0, Math.round(Number(value) || 0)));
            slider.value = v;
            slider.style.setProperty("--ms-fill", v + "%");
            if (!keepField) number.value = v;
            return v;
        };
        const setVolume = (value, opts) => { this.settings.volume = renderVolume(value, opts); saveSoon(); };
        slider.addEventListener("input", () => setVolume(slider.value));
        number.addEventListener("input", () => {
            if (number.value !== "" && Number.isFinite(Number(number.value))) setVolume(number.value, { keepField: true });
        });
        number.addEventListener("blur", () => renderVolume(this.settings.volume));
        number.addEventListener("keydown", e => {
            if (e.key === "Enter") { number.blur(); return; }
            if (e.shiftKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
                e.preventDefault();
                setVolume(this.settings.volume + (e.key === "ArrowUp" ? 10 : -10));
            }
        });

        // Son personnalisé : enregistré dès que l'adresse est valide (ou vide)
        const audioInput = panel.querySelector("#ms-audio-input");
        const audioError = panel.querySelector("#ms-audio-error");
        const audioValid = () => { const v = audioInput.value.trim(); return !v || !!safeUrl(v); };
        const showAudioError = (on) => {
            audioError.hidden = !on;
            audioInput.classList.toggle("ms-invalid", on);
            audioInput.setAttribute("aria-invalid", String(on));
        };
        audioInput.addEventListener("input", () => {
            if (!audioValid()) return;
            this.settings.customSound = audioInput.value.trim();
            showAudioError(false);
            saveSoon();
        });
        audioInput.addEventListener("change", () => showAudioError(!audioValid()));
        panel.querySelector("#ms-test-sound").addEventListener("click", () => {
            if (!audioValid()) { showAudioError(true); audioInput.focus(); return; }
            this._playSound();
        });

        // Listes
        const scheduledEl = panel.querySelector("#ms-scheduled-list");
        const remindersEl = panel.querySelector("#ms-reminders-list");
        const clearBtn    = panel.querySelector("#ms-clear-reminders");

        const recPill = (rec) => rec && rec !== "once" && RECURRENCE_LABELS[rec]
            ? `<span class="ms-pill ms-pill-brand">${ICON_REPEAT}${escapeHtml(RECURRENCE_LABELS[rec])}</span>` : "";
        const when = (time) => `${escapeHtml(formatWhen(time))} · ${escapeHtml(formatRelative(time - Date.now()))}`;
        const itemActions = (type, id, deleteLabel) => `
            <div class="ms-item-actions">
                <button type="button" class="ms-icon-btn" data-action="edit" data-type="${type}" data-id="${escapeHtml(id)}" aria-label="${t("list.edit")}" data-ms-tip="${t("list.edit")}">${ICON_PENCIL}</button>
                <button type="button" class="ms-icon-btn ms-icon-btn-danger" data-action="delete" data-type="${type}" data-id="${escapeHtml(id)}" aria-label="${deleteLabel}" data-ms-tip="${deleteLabel}">${ICON_TRASH}</button>
            </div>`;
        const empty = (icon, title, hint) => `
            <div class="ms-empty">
                <div class="ms-empty-art">${icon}</div>
                <div class="ms-empty-title">${title}</div>
                <p class="ms-hint">${hint}</p>
            </div>`;

        const renderScheduled = () => {
            Tip.hideWithin(scheduledEl);
            panel.querySelector("#ms-msg-title").textContent = t("list.scheduledTitle", this.scheduledMessages.length);
            if (!this.scheduledMessages.length) {
                scheduledEl.innerHTML = empty(ICON_CLOCK, t("list.noScheduled"), t("list.noScheduledHint"));
                return;
            }
            scheduledEl.innerHTML = [...this.scheduledMessages].sort((a, b) => a.time - b.time).map(msg => `
                <div class="ms-item">
                    <div class="ms-item-icon" aria-hidden="true">${ICON_CLOCK}</div>
                    <div class="ms-item-body">
                        <div class="ms-item-head">
                            <span class="ms-item-title">${escapeHtml(this._channelName(msg.channelId))}</span>
                            ${recPill(msg.recurrence)}
                            ${this.heldMessageIds.has(msg.id) ? `<span class="ms-pill ms-pill-warning">${t("list.held")}</span>` : ""}
                        </div>
                        <div class="ms-item-time">${when(msg.time)}</div>
                        <div class="ms-item-text">${escapeHtml(truncate(msg.content, 140))}</div>
                    </div>
                    ${itemActions("msg", msg.id, t("list.cancelSend"))}
                </div>`).join("");
        };

        const renderReminders = () => {
            Tip.hideWithin(remindersEl);
            panel.querySelector("#ms-rem-title").textContent = t("list.remindersTitle", this.reminders.length);
            clearBtn.hidden = !this.reminders.length;
            if (!this.reminders.length) {
                remindersEl.innerHTML = empty(ICON_BELL, t("list.noReminders"), t("list.noRemindersHint"));
                return;
            }
            remindersEl.innerHTML = [...this.reminders].sort((a, b) => a.time - b.time).map(rem => `
                <div class="ms-item">
                    ${avatarHtml(rem.iconUrl, rem.authorName)}
                    <div class="ms-item-body">
                        <div class="ms-item-head">
                            <span class="ms-item-title">${escapeHtml(rem.authorName || t("msg.user"))}</span>
                            ${recPill(rem.recurrence)}
                        </div>
                        <div class="ms-item-time">${when(rem.time)}</div>
                        <div class="ms-item-text">${escapeHtml(rem.contentSnippet || t("msg.noContent"))}</div>
                        ${rem.note ? `<div class="ms-quote">${escapeHtml(rem.note)}</div>` : ""}
                    </div>
                    ${itemActions("rem", rem.id, t("list.deleteReminder"))}
                </div>`).join("");
            replaceBrokenAvatars(remindersEl);
        };

        scheduledEl.addEventListener("click", e => {
            const btn = e.target.closest("button[data-type='msg']");
            if (!btn) return;
            const id  = btn.getAttribute("data-id");
            const msg = this.scheduledMessages.find(m => m.id === id);
            if (btn.dataset.action === "edit") {
                this._editScheduledMessage(msg, renderScheduled);
            } else {
                this.scheduledMessages = this.scheduledMessages.filter(m => m.id !== id);
                this.heldMessageIds.delete(id);
                this._saveData(); renderScheduled();
                BdApi.UI.showToast(t("toast.msgCancelled"), { type: "info" });
            }
        });

        remindersEl.addEventListener("click", e => {
            const btn = e.target.closest("button[data-type='rem']");
            if (!btn) return;
            const id  = btn.getAttribute("data-id");
            const rem = this.reminders.find(r => r.id === id);
            if (btn.dataset.action === "edit") {
                this._editReminder(rem, renderReminders);
            } else {
                this.reminders = this.reminders.filter(r => r.id !== id);
                this._saveData(); renderReminders();
                BdApi.UI.showToast(t("toast.reminderDeleted"), { type: "info" });
            }
        });

        clearBtn.addEventListener("click", () => {
            const count = this.reminders.length;
            if (!count) return;
            BdApi.UI.showConfirmationModal(t("clear.title"),
                t("clear.text", count), {
                confirmText: t("settings.clearAll"), cancelText: t("common.cancel"), danger: true,
                onConfirm: () => { this.reminders = []; this._saveData(); renderReminders(); BdApi.UI.showToast(t("toast.remindersDeleted"), { type: "info" }); }
            });
        });

        renderScheduled();
        renderReminders();

        // Rafraîchit les échéances (« dans 5 min ») et retire les rappels passés tant que le panneau est affiché
        const refresh = setInterval(() => {
            if (!panel.isConnected) { clearInterval(refresh); return; }
            // Pas de rafraîchissement sous la souris ni pendant la navigation au clavier dans une liste
            if (panel.matches(":hover") || (panel.contains(document.activeElement) && document.activeElement.closest(".ms-list"))) return;
            renderScheduled();
            renderReminders();
        }, 30000);

        return panel;
    }

    _editScheduledMessage(msg, onDone) {
        if (!msg) return;
        const uid     = Date.now();
        const inputId = "ms-edit-time-" + uid;
        const recId   = "ms-edit-rec-"  + uid;
        const h       = BdApi.React.createElement;

        BdApi.UI.showConfirmationModal(t("edit.msgTitle"),
            h("div", { className: "ms-ui ms-form" },
                this._buildTextPreview(msg.content, msg.channelId),
                h(DateTimeField, { id: inputId, defaultTime: msg.time }),
                this._buildRecurrenceSelect(recId, msg.recurrence || "once")
            ),
            {
                confirmText: t("common.save"), cancelText: t("common.cancel"),
                onConfirm: () => {
                    const newTime    = new Date(document.getElementById(inputId)?.value || "").getTime();
                    const recurrence = document.getElementById(recId)?.value || "once";
                    if (!isNaN(newTime) && newTime > Date.now()) {
                        msg.time = newTime; msg.recurrence = recurrence;
                        // Reprogrammé dans le futur : il n'est plus « manqué »
                        this.heldMessageIds.delete(msg.id);
                        this._saveData(); onDone?.();
                        BdApi.UI.showToast(t("toast.rescheduled", whenPhrase(newTime)), { type: "success" });
                    } else {
                        BdApi.UI.showToast(t("toast.future"), { type: "error" });
                    }
                }
            }
        );
    }

    _editReminder(rem, onDone) {
        if (!rem) return;
        const uid     = Date.now();
        const inputId = "ms-edit-rem-time-" + uid;
        const noteId  = "ms-edit-rem-note-" + uid;
        const recId   = "ms-edit-rem-rec-"  + uid;
        const h       = BdApi.React.createElement;

        BdApi.UI.showConfirmationModal(t("edit.remTitle"),
            h("div", { className: "ms-ui ms-form" },
                this._buildMessagePreview({ iconUrl: rem.iconUrl, author: rem.authorName, timestamp: rem.timestamp, content: rem.contentSnippet }),
                h(DateTimeField, { id: inputId, defaultTime: rem.time }),
                this._buildNoteField(noteId, rem.note || ""),
                this._buildRecurrenceSelect(recId, rem.recurrence || "once")
            ),
            {
                confirmText: t("common.save"), cancelText: t("common.cancel"),
                onConfirm: () => {
                    const newTime    = new Date(document.getElementById(inputId)?.value || "").getTime();
                    const note       = document.getElementById(noteId)?.value  || "";
                    const recurrence = document.getElementById(recId)?.value   || "once";
                    if (!isNaN(newTime) && newTime > Date.now()) {
                        rem.time = newTime; rem.note = note; rem.recurrence = recurrence;
                        this._saveData(); onDone?.();
                        BdApi.UI.showToast(t("toast.reminderEdited"), { type: "success" });
                    } else {
                        BdApi.UI.showToast(t("toast.future"),
 { type: "error" });
                    }
                }
            }
        );
    }
};
