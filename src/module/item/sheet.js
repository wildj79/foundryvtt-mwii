import { MWII } from "../config.js";

export class ItemSheetMWII extends ItemSheet {
    constructor(...args) {
        super(...args);
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ['mwii', 'sheet', 'item'],
            width: 600,
            height: 570,
            tabs: [
                {navSelector: ".tabs", contentSelector: ".sheet-body" }
            ]
        });
    }

    get template() {
        const path = "systems/mwii/templates/item";
        
        return `${path}/${this.item.data.type}.html`;
    }

    getData() {
        const data = super.getData();
        data.labels = this.item.labels;

        data.config = MWII;

        data.itemType = data.item.type.replace('_', ' ').titleCase();
        data.itemStatus = this._getItemStatus(data.item);
        data.itemProperties = this._getItemProperties(data.item);
        data.isPhysical = data.item.data.hasOwnProperty("quantity");
        data.isPowerPack = data.item.type === "power_pack";
        data.isAdvantage = data.item.type === "advantage";
        data.isVehicle = data.item.type === "vehicle";
        data.isHeavyWeapon = data.item.type === "weapons" && data.item.data.type === "support";
        data.isMelee = data.item.type === "weapons" && data.item.data.type === "melee";
        data.hasAreaOfEffect = data.item.type === "weapons" && ["support", "explosive"].includes(data.item.data.type);
        data.hasAmmo = data.item.type === "weapons" && ["support", "archery", "stpistol", "mpistol", "npistol", "rifle", "shotgun", "smg", "gyrojet"].includes(data.item.data.type);
        data.isBA = data.item.type === "armor" && data.item.data.type === "barmor";

        data.data = foundry.utils.duplicate(this.item.data.data);

        console.log(data);

        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);
    }

    _getItemStatus(item) {
        if (["weapons", "armor"].includes(item.type)) return item.data.equipped ? "Equipped" : "Unequipped";
        else if (item.type === "vehicle") return MWII.vehicleTypes[item.data.type];
    }

    _getItemProperties(item) {
        const props = [];
        const labels = this.item.labels;

        if (item.data.damageType) {
            props.push(MWII.damageTypes[item.data.damageType]);
        }

        return props.filter(p => !!p);
    }
}