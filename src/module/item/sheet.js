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
        
        return `${path}/${this.item.type}.html`;
    }

    async getData() {
        const data = super.getData();
        data.labels = this.item.labels;

        data.config = MWII;

        data.hasSubType = data.item.type === 'gear';
        data.itemType = data.item.type.replace('_', ' ').titleCase();
        data.itemSubType = this._getItemSubType(data.item);
        data.itemStatus = this._getItemStatus(data.item);
        data.itemProperties = this._getItemProperties(data.item);
        data.isPhysical = data.item.system.hasOwnProperty("quantity");
        data.isPowerPack = data.item.type === "power_pack";
        data.isAdvantage = data.item.type === "advantage";
        data.isVehicle = data.item.type === "vehicle";
        data.isHeavyWeapon = data.item.type === "weapons" && data.item.system.type === "support";
        data.isMelee = data.item.type === "weapons" && data.item.system.type === "melee";
        data.hasAreaOfEffect = data.item.type === "weapons" && ["support", "explosive"].includes(data.item.system.type);
        data.hasAmmo = data.item.type === "weapons" && ["support", "primitive_missle", "slug_throwers"].includes(data.item.system.type);
        data.isBA = data.item.type === "armor" && data.item.system.type === "barmor";
        data.hasPatchCost = data.item.type === "armor";

        data.enrichedDescription = await TextEditor.enrichHTML(this.item.system.description, {async: true});

        data.system = foundry.utils.duplicate(this.item.system);

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
        if (["weapons", "armor"].includes(item.type)) return item.system.equipped ? "Equipped" : "Unequipped";
        
        return null;
    }

    _getItemSubType(item) {
        if (item.type === "vehicle") return MWII.vehicleTypes[item.system.type];
        else if (item.type === "gear") return MWII.gearSubTypes[item.system.type];
        else if (item.type === "armor") return MWII.armorTypes[item.system.type];
        else if (item.type === "weapons") {
            const subtype = item.system.subtype;
            const type = item.system.type;
            
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

        if (item.system.damageType) {
            props.push(MWII.damageTypes[item.system.damageType]);
        }

        return props.filter(p => !!p);
    }
}