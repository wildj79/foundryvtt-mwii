export class DiceMWII {
    static d6Roll({event, data, template, title, speaker, flavor, onClose, dialogOptions, isSave = false, isUntrained = false, hasNaturalAptitude = false}) {
        flavor = flavor || title;

        let rollMode = game.settings.get("core", "rollMode");
        let roll = (formula) => {
            let roll = new Roll(formula).roll();

            let d6 = roll.parts[0];
            d6.options.target = data.target;
            d6.options.mod = data.mod && !isNaN(data.mod) ? data.mod : 0;
            d6.options.isSave = isSave;
            d6.options.isUntrained = isUntrained;
            d6.options.hasNaturalAptitude = hasNaturalAptitude;

            roll.toMessage({
                speaker: speaker,
                flavor: flavor,
                rollMode: rollMode
            });

            return roll;
        };

        template = template || "systems/mwii/templates/chat/roll-dialog.html";
        let formula = "2d6";

        if (isSave || hasNaturalAptitude) formula = "3d6kh2";
        else if (isUntrained) formula = "3d6kl2";

        let dialogData = {
            formula: formula,
            data: data,
            rollMode: rollMode,
            rollModes: CONFIG.rollModes
        };

        return new Promise((resolve, reject) => {
            renderTemplate(template, dialogData).then(dlg => {
                new Dialog({
                    title: title,
                    content: dlg,
                    buttons: {
                        normal: {
                            label: "Roll",
                            callback: html => {
                                if (onClose) onClose(html);
                                rollMode = html.find('[name="rollMode"]').val();
                                data['mod'] = parseInt(html.find('[name="mod"]').val());
                                resolve(roll(formula));
                            }
                        }
                    },
                    default: "normal",
                    close: html => {
                        reject("Form closed");   
                    }
                }, dialogOptions).render(true);
            }).catch(() => {});
        });        
    }
}

export const highlightSuccessOrFailure = function (message, html, data) {
    if (!message.isRoll || !message.isRollVisible || !message.roll.parts.length) return;

    let d = message.roll.parts[0];
    if (d instanceof Die && d.options && d.options.target) {
        let isSave = d.options.isSave || false;
        let isUntrained = d.options.isUntrained || false;
        let hasNaturalAptitude = d.options.hasNaturalAptitude || false;
        let mod = d.options.mod || 0;

        let autoSuccess = () => {
            html.find('.dice-total').addClass('success');

            const div = $('<div class="margin-success critical">');
            div.html("Automatic Success");
            html.find('.dice-result').append(div);
        };

        let autoFailure = () => {
            html.find('.dice-total').addClass('failure');

            const div = $('<div class="margin-failure failure">');
            div.html("Automatic Failure");
            html.find('.dice-result').append(div);
        }

        if (isSave || hasNaturalAptitude) {
            if (d.total === 12) {
                autoSuccess();

                return;
            } else if (d.total === 3) {
                autoFailure();

                return;
            }
        }

        if (isUntrained) {
            if (d.total === 18) {
                autoSuccess();

                return;
            } else if (d.total === 2) {
                autoFailure();

                return;
            }
        }

        if (d.total === 12) {
            autoSuccess();
            
            return;
        } else if (d.total === 2) {
            autoFailure();

            return;
        }
        
        if (d.total >= (d.options.target + mod)) {
            html.find('.dice-total').addClass('success');
            const marginOfSuccess = d.total - (d.options.target + mod);

            const div = $('<div class="margin-success">');
            div.html(`Margin of Success <span class="mos">${marginOfSuccess}</span>`);
            html.find('.dice-result').append(div);
        } else {
            html.find('.dice-total').addClass('failure');
            const marginOfFailure = (d.options.target + mod) - d.total;

            const div = $('<div class="margin-failure">');
            div.html(`Margin of Failure <span class="mof">${marginOfFailure}</span>`);
            html.find('.dice-result').append(div);
        }
    }
};
