import MWII from "../config.js";
import DiceMWII from "../dice.js";

export class ItemMWII extends Item {
    get hasAttack() {
        return this.data.type === "weapons";
    }

    get hasDamage() {
        return !!(this.data.data.damage);
    }

    get skillUsed() {
        if (this.data.type === "weapons") return this.data.data.skill;
        
        return null;
    }

    get isRanged() {
        return this.data.data.type !== "melee";
    }

    prepareData() {
        super.prepareData();

        const config = MWII;
        const labels = {};
        const itemData = this.data;
        const data = itemData.data;

        if (itemData.type === 'armor') {
            labels.energy = data.energy.value ? `Energy ${this._calculateArmorDamageAbsorption(data.energy)}` : "";
            labels.ballistic = data.ballistic.value ? `Ballistic ${this._calculateArmorDamageAbsorption(data.ballistic)}` : "";
            labels.melee = data.melee.value ? `Melee ${this._calculateArmorDamageAbsorption(data.melee)}` : "";
            labels.damage_capacity = data.damage_capacity.max ? `Damage Cap ${data.damage_capacity.max}` : "";
        }

        this.labels = labels;
    }


    sendToChat() {

    }

    /**
     * Roll an attack for this weapon.
     * 
     * @param {JQuery.Event} event The triggering event
     * @returns {Promise<Roll>} Returns the roll object used to make the check
     */
    async rollAttack(event) {
        if (!this.hasAttack) throw new Error("Shit be broken!");

        const skillUsed = this.skillUsed;
        const isRanged = this.isRanged;

        if (!skillUsed) {
            ui.notifications.warn(game.i18n.format("MWII.Weapons.Errors.NoSkillUsed", {weapon: this.data.name}));
            return null;
        }

        return this.actor.rollSkillCheck(skillUsed, {event, isAttackRoll: true, isRanged, weapon: this.data.name});
    }

    async rollDamage(event) {
        if (!this.hasDamage) throw new Error("Shit be even more broken!");

        const hitLocation = await DiceMWII.rollHitLocation();

        return await DiceMWII.rollCheck({
            event,
            data: {},
            template: "",
            title: "",
            speaker: ChatMessage.getSpeaker(),
            flavor: "",
            onClose: (html) => {},
            dialogOptions: {},
            isSave: false,
            isUntrained: false,
            hasNaturalAptitude: false
        });
    }

    _calculateArmorDamageAbsorption(damageType) {
        const percentages = {0: "None", [1/2]: "1/2", [1/3]: "1/3", [1/4]: "1/4",[2/3]: "2/3",[3/4]: "3/4", 1: "All"};

        return damageType.type === "percentage" ? percentages[damageType.value] : `${damageType.value} pt(s)`;
    }
}