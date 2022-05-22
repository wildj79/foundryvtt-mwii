/**
 * Function called when the roll dialog is closed.
 * 
 * @callback onRollDialogClosed
 * @param {JQuery} html The html of the dialog
 * @returns {void}
 */

import MWII from "./config.js";

/**
 * Helper class used to handle dice rolls for Mechwarrior's.
 */
export default class DiceMWII {
    /**
     * Roll a check for this Mechwarrior. 
     * 
     * @param {object}             params                      The parameters passed to the function.
     * @param {JQuery.Event}       [params.event]              The event that triggered the roll
     * @param {Object}             [params.data]               Any extra data needed by the roll
     * @param {String}             params.template             An optional path for an HTML template to use for rendering
     * @param {String}             params.title                The title of the chat message
     * @param {Object}             [params.speaker]            The ChatMessage speaker to pass when creating the chat
     * @param {String}             params.flavor               Flavor text passed to the ChatMessage
     * @param {onRollDialogClosed} [params.onClose]            Callback for actions to take when the dialog form is closed
     * @param {Object}             params.dialogOptions        Modal dialog options
     * @param {Boolean}            [params.isSave]             Is this roll an attribute or characteristic save
     * @param {Boolean}            [params.isUntrained]        Is this an untrained skill check
     * @param {Boolean}            [params.hasNaturalAptitude] Is this a skill check for a skill that the character has a natural aptitude for
     * @returns {Promise<Roll>} 
     */
    static async rollCheck({event = jQuery.Event('click'), data = {}, template, title, speaker = ChatMessage.getSpeaker(), flavor, onClose, dialogOptions, isSave = false, isUntrained = false, hasNaturalAptitude = false} = {}) {
        flavor = flavor || title;

        let rollMode = game.settings.get("core", "rollMode");
        let roll = async (formula) => {
            let roll = Roll.create(formula, data, {
                target: data.target,
                mod: data.mod || 0,
                isSave,
                isUntrained,
                hasNaturalAptitude
            });
            await roll.evaluate({async: true});

            roll.toMessage({
                speaker: speaker,
                flavor: flavor
            }, {rollMode});

            return roll;
        };

        template = template || "systems/mwii/templates/apps/roll-dialog.html";
        let formula = "2d6";

        if (isSave || hasNaturalAptitude) formula = "3d6kh2";
        else if (isUntrained) formula = "3d6kl2";

        let dialogData = {
            formula: formula,
            data: data,
            rollMode: rollMode,
            rollModes: CONFIG.Dice.rollModes
        };

        return new Promise((resolve) => {
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
                                data['mod'] = html.find('[name="mod"]').val();
                                resolve(roll(formula));
                            }
                        }
                    },
                    default: "normal",
                    close: html => {
                        resolve(null);   
                    }
                }, dialogOptions).render(true);
            });
        });        
    }

    /**
     * Convience method to quickly roll a to-hit location.
     * 
     * @returns {string} The location hit by the damage roll.
     */
    static async rollHitLocation() {
        const roll1 = await Roll.create("1d6").evaluate({async: true});
        const roll2 = await Roll.create("1d6").evaluate({async: true});
        const location = MWII.hitLocationTable[roll1.total][roll2.total];

        return {
            location,
            label: MWII.hitLocations[location]
        };
    }

    static async rollDamage({event = jQuery.Event('click'), formula, data, flavor, title, template} = {}) {
        const content = await renderTemplate(template, dialogData);

        return new Promise((resolve) => {
            const dialog = new Dialog({
                title: title,
                content: content,
                buttons: {
                    normal: {
                        label: "",
                        callback: html => {
    
                        }
                    },
                    default: "normal",
                    close: html => {
                        resolve(null);
                    }
                }
            }, dialogOptions);
    
            dialog.render(true);
        });        
    }
}

/**
 * This method has been deprecated. I'm keeping it here for historical reference
 * for the moment. Needs to be removed before launch.
 * 
 * @deprecated This functionality has been moved to the @see {MWIIRoll} class.
 */
export const highlightSuccessOrFailure = function (message, html, data) {
    if (!message.isRoll || !message.isContentVisible) return;
    console.log(data);

    const d = message.roll.terms[0];
    const roll = message.roll;
    if (roll.options && roll.options.target) {
        let isSave = roll.options.isSave || false;
        let isUntrained = roll.options.isUntrained || false;
        let hasNaturalAptitude = roll.options.hasNaturalAptitude || false;
        let mod = Roll.safeEval(roll.options.mod) || 0;
        let title = `Target = Base(${roll.options.target}) + Mod(${mod}) = ${(roll.options.target + mod)}`;

        let autoSuccess = () => {
            html.find('.dice-total').addClass('success');

            const div = $('<div class="margin-success critical">');
            div.html("Automatic Success");
            div.attr('title', title);
            html.find('.dice-result').append(div);
        };

        let autoFailure = () => {
            html.find('.dice-total').addClass('failure');

            const div = $('<div class="margin-failure failure">');
            div.html("Automatic Failure");
            div.attr('title', title);
            html.find('.dice-result').append(div);
        };

        let addRolls = () => d.results.map(el => el.result).reduce((a, b) => a + b, 0);

        if (isSave || hasNaturalAptitude) {
            if (d.total === 12) {
                autoSuccess();

                return;
            } else if (d.results.length === 3 && addRolls() === 3) {
                autoFailure();

                return;
            }
        }

        if (isUntrained) {
            if (d.results.length === 3 && addRolls() === 18) {
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
        
        if (roll.total >= (roll.options.target + mod)) {
            html.find('.dice-total').addClass('success');
            const marginOfSuccess = roll.total - (roll.options.target + mod);

            const div = $('<div class="margin-success">');
            div.html(`Margin of Success <span class="mos">${marginOfSuccess}</span>`);
            div.attr('title', title);
            html.find('.dice-result').append(div);
        } else {
            html.find('.dice-total').addClass('failure');
            const marginOfFailure = (roll.options.target + mod) - roll.total;

            const div = $('<div class="margin-failure">');
            div.html(`Margin of Failure <span class="mof">${marginOfFailure}</span>`);
            div.attr('title', title);
            html.find('.dice-result').append(div);
        }
    }
};
