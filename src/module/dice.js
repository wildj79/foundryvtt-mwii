/**
 * Function called when the roll dialog is closed.
 * 
 * @callback onRollDialogClosed
 * @param {JQuery} html The html of the dialog
 * @returns {void}
 */

import RollDialog from "./apps/roll-dialog.js";
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
    static async rollCheck({event = jQuery.Event('click'), data = {}, template, title, speaker = ChatMessage.getSpeaker(), flavor, onClose, dialogOptions={}, isSave = false, isUntrained = false, hasNaturalAptitude = false} = {}) {
        flavor = flavor || title;

        let rollMode = game.settings.get("core", "rollMode");
        let roll = async (formula) => {
            let roll = Roll.create(formula, data, {
                target: data.target,
                mod: data.mod || 0,
                isSave,
                isUntrained,
                hasNaturalAptitude,
                attackMods: data.attackMods || [],
                isAttackRoll: data.isAttackRoll || false,
                isRanged: data.isRanged || false,
                specializationMod: data.specializationMod || 0,
                skillUsed: data.skillUsed || ""
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

        if (data.isAttackRoll) {
            dialogData.config = {};

            if (data.isRanged) {
                dialogData.config.modifiers = MWII.rangedCombatModifiers;
                dialogData.config.modifierTable = MWII.rangedCombatModifiersTable;
                dialogData.tableName = game.i18n.localize("MWII.Modifiers.Ranged.Title");
            } else {
                dialogData.config.modifiers = MWII.meleeModifiers;
                dialogData.config.modifierTable = MWII.meleeModifiersTable;
                dialogData.tableName = game.i18n.localize("MWII.Modifiers.Melee.Title");
            }
        }

        return new Promise((resolve) => {
            renderTemplate(template, dialogData).then(dlg => {
                new Dialog({
                    title: title,
                    content: dlg,                    
                    buttons: {
                        normal: {
                            label: game.i18n.localize("MWII.Buttons.Roll.Title"),
                            callback: html => {
                                if (onClose) onClose(html);
                                const attackMods = [];
                                html.find('[name="modifier.enabled"]:checked').each((idx, el) => {
                                    attackMods.push($(el).val());
                                });
                                data['attackMods'] = attackMods;
                                rollMode = html.find('[name="rollMode"]').val();
                                data['mod'] = html.find('[name="mod"]').val();
                                if (data?.hasSpecialization ?? false) {
                                    if (html.find('[name="modifier.applySpecialization"]').is(':checked')) {
                                        data['specializationMod'] = -1;
                                    } else {
                                        data['specializationMod'] = 1;
                                    }
                                }
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
     * Describes the hit location.
     * 
     * @typedef {object} HitLocationData
     * @property {string}  location   The key for the location that was hit
     * @property {string}  label      The label for the location that was hit
     * @property {boolean} isCritical Was this a critical hit
     */

    /**
     * Convience method to quickly roll a to-hit location.
     * 
     * @returns {HitLocationData} Data about the hit location.
     */
    static async rollHitLocation() {
        const roll1 = await Roll.create("1d6").evaluate({async: true});
        const roll2 = await Roll.create("1d6").evaluate({async: true});
        const location = MWII.hitLocationTable[roll1.total][roll2.total];
        const isCritical = roll1.total === roll2.total;

        return {
            location,
            label: MWII.hitLocations[location],
            isCritical
        };
    }

    static async rollDamage({event = jQuery.Event('click'), formula, data, flavor, title, template, dialogOptions={}, speaker = ChatMessage.getSpeaker()} = {}) {
        flavor = flavor || title;
        let rollMode = game.settings.get("core", "rollMode");

        const roll = async (formula) => {
            let roll = Roll.create(formula, data, {
                hitLocation: data.hitLocation,
                isDamageRoll: true,
                damageType: data.damageType,
                lethality: data.lethality
            });
            await roll.evaluate({async: true});

            if (data.hitLocation.isCritical) {
                roll._total *= 2;
            }

            roll.toMessage({
                speaker: speaker,
                flavor: flavor
            }, {rollMode});

            return roll;
        };

        const dialogData = {
            formula: formula,
            data: data,
            rollMode: rollMode,
            rollModes: CONFIG.Dice.rollModes,
            isDamageRoll: true
        };
        template = template || "systems/mwii/templates/apps/roll-dialog.html";
        const content = await renderTemplate(template, dialogData);

        return new Promise((resolve) => {
            const dialog = new Dialog({
                title: title,
                content: content,
                buttons: {
                    normal: {
                        label: game.i18n.localize("MWII.Buttons.Roll.Title"),
                        callback: html => {
                            rollMode = html.find('[name="rollMode"]').val();
                            resolve(roll(formula));
                        }
                    }
                },
                default: "normal",
                close: html => {
                    resolve(null);
                }
            }, dialogOptions);
    
            dialog.render(true);
        });        
    }
}
