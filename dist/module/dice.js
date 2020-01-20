export class DiceMWII {
    static d6Roll({event, data, template, title, speaker, flavor, onClose, dialogOptions, isSave = false, isUntrained = false}) {
        flavor = flavor || title;

        let rollMode = game.settings.get("core", "rollMode");
        let roll = (formula) => {
            let roll = new Roll(formula).roll();

            roll.toMessage({
                speaker: speaker,
                flavor: flavor,
                rollMode: rollMode
            });

            return roll;
        };

        template = template || "systems/mwii/templates/chat/roll-dialog.html";
        let formula = "2d6";

        if (isSave) formula = "3d6kh2";
        else if (isUntrained) formula = "3d6kl2";

        let dialogData = {
            formula: formula,
            data: data,
            rollMode: rollMode,
            rollModes: CONFIG.rollModes
        };

        console.log(dialogData);

        renderTemplate(template, dialogData).then(dlg => {
            new Dialog({
                title: title,
                content: dlg,
                buttons: {
                    normal: {
                        label: "Roll"
                    }
                },
                default: "normal",
                close: html => {
                    if (onClose) onClose(html, parts, data);
                    rollMode = html.find('[name="rollMode"]').val();
                    data['mod'] = parseInt(html.find('[name="mod"]').val());
                    roll(formula);
                }
            }, dialogOptions).render(true);
        });
    }
}