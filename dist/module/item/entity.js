export class ItemMWII extends Item {
    get hasAttack() {
        return this.data.type === "weapons";
    }

    get hasDamage() {
        return !!(this.data.data.damage);
    }

    prepareData() {
        super.prepareData();

        const config = CONFIG.MWII;
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

    _calculateArmorDamageAbsorption(damageType) {
        const percentages = {0: "None", [1/2]: "1/2", [1/3]: "1/3", [1/4]: "1/4",[2/3]: "2/3",[3/4]: "3/4", 1: "All"};

        return damageType.type === "percentage" ? percentages[damageType.value] : damageType.value;
    }
}