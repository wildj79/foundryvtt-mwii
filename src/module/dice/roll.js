import MWII from '../config.js';

export default class MWIIRoll extends Roll {
    constructor(formula, data={}, options={}) {
        super(formula, data, options);
    }

    static CHAT_TEMPLATE = "systems/mwii/templates/dice/roll.html";
    static TOOLTIP_TEMPLATE = "systems/mwii/templates/dice/tooltip.html";

    /** @override */
    _prepareData(data) {
        return data;
    }

    /** @override */
    async render({flavor, template=this.constructor.CHAT_TEMPLATE, isPrivate=false}={}) {
        if (!this._evaluated) await this.evaluate({async: true});

        const attackData = this._processAttackDataForRender(isPrivate);
        const damageData = this._processDamageDataForRender(isPrivate);
        const systemData = foundry.utils.mergeObject(attackData, damageData);

        const chatData = foundry.utils.mergeObject({
            formula: isPrivate ? "???" : this._formula,
            flavor: isPrivate ? null : flavor,
            user: game.user.id,
            tooltip: isPrivate ? "" : await this.getTooltip(),
            total: isPrivate ? "?" : Math.round(this.total * 100) / 100,
        }, systemData);

        return renderTemplate(template, chatData);
    }

    _processDamageDataForRender(isPrivate) {
        if (isPrivate || !("isDamageRoll" in this.options)) return {};

        return {
            isDamageRoll: this.options.isDamageRoll,
            hitLocation: this.options.hitLocation,
            damageType: MWII.damageTypes[this.options.damageType],
            lethality: MWII.lethality[this.options.lethality]
        }
    }

    /**
     * Pull data from the roll options and prepare them for use in the custom 
     * Roll chat cards used by the system.
     * 
     * @param {boolean} isPrivate Flag whether this roll is private or not
     * @returns {object} Extra data used by the MWII system for rolls
     * @private
     */
    _processAttackDataForRender(isPrivate) {
        if (isPrivate || !("target" in this.options)) return {};

        const isSave = this.options?.isSave ?? false;
        const isUntrained = this.options?.isUntrained ?? false;
        const hasNaturalAptitude = this.options?.hasNaturalAptitude ?? false;
        const isAttackRoll = this.options?.isAttackRoll ?? false;
        const mod = Roll.safeEval(this.options?.mod ?? "0");
        const specializationMod = Roll.safeEval(this.options?.specializationMod ?? "0");
        const attackMods = this.options?.attackMods ?? [];
        const allMods = mod + specializationMod + attackMods.map(x => parseInt(x)).reduce((a, b) => a + b, 0);
        const target = this.options.target + allMods;
        let autoSuccess = false;
        let autoFailure = false;
        let success = false;
        let failure = false;
        let marginOfSuccess = 0;
        let marginOfFailure = 0;
        const term = this.terms[0];
        

        const addRolls = () => term.results.map(el => el.result).reduce((a, b) => a + b, 0);

        if (isAttackRoll && target > 12) {
            autoFailure = true;
            failure = true;
        } else if (isSave || hasNaturalAptitude) {
            if (term.total === 12) {
                autoSuccess = true;
                success = true;
            } else if (term.results.length === 3 && addRolls() === 3) {
                autoFailure = true;
                failure = true;
            }
        } else if (isUntrained) {
            if (term.results.length === 3 && addRolls() === 18) {
                autoSuccess = true;
                success = true;
            } else if (term.total === 2) { 
                autoFailure = true;
                failure = true;
            }
        } else {
            if (term.total === 12) {
                autoSuccess = true;
                success = true;
            } else if (term.total === 2) {
                autoFailure = true;
                failure = true;
            }
        }

        if (!autoSuccess && !autoFailure) {
            if (this.total >= target) {
                success = true;
                marginOfSuccess = this.total - target;
            } else {
                failure = true;
                marginOfFailure = target - this.total;
            }
        }

        return {
            baseTarget: this.options.target,
            targetModifier: allMods,
            target: target,
            success: success,
            failure: failure,
            autoSuccess: autoSuccess,
            autoFailure: autoFailure,
            marginOfSuccess: marginOfSuccess,
            marginOfFailure: marginOfFailure,
            skillUsed: this.options.skillUsed
        };
    }
}