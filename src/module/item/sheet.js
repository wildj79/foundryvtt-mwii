import MWII from "../config.js";

export class ItemSheetMWII extends ItemSheet {
    constructor(...args) {
        super(...args);
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ['mwii', 'sheet', 'item'],
            width: 830,
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
        data.item = data.item.data;

        data.hasSubType = data.item.type === 'gear';
        data.itemType = data.item.type.replace('_', ' ').titleCase();
        data.itemSubType = this._getItemSubType(data.item);
        data.itemStatus = this._getItemStatus(data.item);
        data.itemProperties = this._getItemProperties(data.item);
        data.isPhysical = data.item.data.hasOwnProperty("quantity");
        data.isPowerPack = data.item.type === "power_pack";
        data.isAdvantage = data.item.type === "advantage";
        data.isVehicle = data.item.type === "vehicle";
        data.isHeavyWeapon = data.item.type === "weapons" && data.item.data.type === "support";
        data.isMelee = data.item.type === "weapons" && data.item.data.type === "melee";
        data.hasAreaOfEffect = data.item.type === "weapons" && ["support", "explosive"].includes(data.item.data.type);
        data.hasAmmo = data.item.type === "weapons" && ["support", "primitive_missle", "slug_throwers"].includes(data.item.data.type);
        data.isBA = data.item.type === "armor" && data.item.data.type === "barmor";
        data.hasPatchCost = data.item.type === "armor";

        data.data = foundry.utils.duplicate(this.item.data.data);

        return data;
    }

    /**
     * Activate listeners for interactive item sheet events.
     * 
     * @param {JQuery} html The sheet's DOM object
     */
    activateListeners(html) {
        super.activateListeners(html);

        // Save scroll position
        html.find(".tab.active")[0].scrollTop = this._scrollTab;
        html.find(".tab").on("scroll", ev => this._scrollTab = ev.currentTarget.scrollTop);
    }

    _getItemStatus(item) {
        if (["weapons", "armor"].includes(item.type)) return item.data.equipped ? "Equipped" : "Unequipped";
        
        return null;
    }

    _getItemSubType(item) {
        if (item.type === "vehicle") return MWII.vehicleTypes[item.data.type];
        else if (item.type === "gear") return MWII.gearSubTypes[item.data.type];
        else if (item.type === "armor") return MWII.armorTypes[item.data.type];
        else if (item.type === "weapons") {
            const subtype = item.data.subtype;
            const type = item.data.type;
            
            if (!!subtype) {
                return `${MWII.weaponTypes[type]} (${MWII.weaponSubTypes[subtype]})`;
            }

            return MWII.weaponTypes[type];
        }

        return null;
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