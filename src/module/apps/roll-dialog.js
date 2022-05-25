import MWII from "../config.js";

export default class RollDialog extends Dialog {
    /** @override */
    getData(options) {
        const data = super.getData();
        data.config = {};
        data.formula = this.data.formula;
        data.rollMode = this.data.rollMode;
        data.rollModes = this.data.rollModes;
        
        if (this.data.isAttackRoll) {
            if (this.data.isRanged) {
                data.config.modifiers = MWII.rangedCombatModifiers;
                data.config.modifierTable = MWII.rangedCombatModifiersTable;
                data.tableName = game.i18n.localize("MWII.Modifiers.Ranged.Title");
            } else {
                data.config.modifiers = MWII.meleeModifiers;
                data.config.modifierTable = MWII.meleeModifiersTable;
                data.tableName = game.i18n.localize("MWII.Modifiers.Melee.Title");
            }
        }
        console.log(data);

        return data;
    }
}