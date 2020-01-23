/**
 * Extend the basic ActorSheet class to do all the Mechwarrior things!
 * 
 * @type {ActorSheet}
 */
export class ActorSheetMWII extends ActorSheet {
    constructor(...args) {
        super(...args);
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ['mwii', 'sheet', 'actor', 'character'],
            width: 600,
            height: 508
        });
    }

    get template() {
        const path = "systems/mwii/templates/actor/";
        if (!game.user.isGM && this.actor.limited) return path + "limited-sheet.html";
        return path + "character-sheet.html";
    }

    getData() {
        let isOwner = this.entity.owner;
        const data = {
            owner: isOwner,
            limited: this.entity.limited,
            options: this.options,
            editable: this.isEditable,
            cssClass: isOwner ? "editable" : "locked",
            isCharacter: this.entity.data.type === "character",
            config: CONFIG.MWII
        };

        data.actor = duplicate(this.actor.data);
        data.items = this.actor.items.map(i => {
            i.data.labels = i.labels;
            return i.data;
        });

        data.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));
        data.data = data.actor.data;
        data.labels = this.actor.labels || {};

        // Attributes
        for (let [a, att] of Object.entries(data.actor.data.attributes)) {
            att.label = CONFIG.MWII.attributes[a];
        }

        // Characteristics
        for (let [c, char] of Object.entries(data.actor.data.characteristics)) {
            char.label = CONFIG.MWII.characteristics[c];
        }

        // Skill labels
        for (let [s, skl] of Object.entries(data.actor.data.skills)) {
            skl.characteristic = data.actor.data.characteristics[skl.characteristic].label;

            let skillLabel = CONFIG.MWII.skills[s];
            if (skl.specialization) {
                skillLabel += ` (${skl.specialization})`;
            }

            skl.label = skillLabel;
        }

        this._prepareItems(data);

        return data;
    }

    _prepareItems(data) {
        const equipment = {
            weapons: { label: game.i18n.localize("MWII.Weapons"), items: [], dataset: { type: "weapons" } },
            gear: { label: game.i18n.localize("MWII.Gear"), items: [], dataset: { type: "gear" } },
            armor: { label: game.i18n.localize("MWII.Armor"), items: [], dataset: { type: "armor" } },
            power_pack: { label: game.i18n.localize("MWII.PowerPacks"), items: [], dataset: { type: "power_pack" } },
            vechilce: { label: game.i18n.localize("MWII.Vehicle"), items: [], dataset: { type: "vehicle" } }
        };

        let [items, advantages] = data.items.reduce((arr, item) => {
            item.img = item.img || DEFAULT_TOKEN;
            item.isStack = item.data.quantity ? item.data.quantity > 1 : false;
            if (item.type === "advantage") arr[1].push(item);
            else if (Object.keys(equipment).includes(item.type)) arr[0].push(item);

            return arr;
        }, [[], []]);

        for (let item of items) {
            item.data.quantity = item.data.quantity || 0;
            item.data.weight = item.data.weight || 0;

            let weight = parseFloat(item.data.weight);

            item.totalWeight = item.data.quantity * weight;
            equipment[item.type].items.push(item);
        }

        const advantage = {
            label: game.i18n.localize("MWII.Advantages"), 
            items: advantages, 
            dataset: { type: "advantage" }
        };

        data.equipment = Object.values(equipment);
        data.advantage = advantage;
    }

    activateListeners(html) {
        super.activateListeners(html);

        new Tabs(html.find('.tabs'), {
            initial: this['_sheetTab'],
            callback: clicked => {
                this['_sheetTab'] = clicked.data('tab');
            }
        });

        if (!this.options.editable) return;

        html.find('.attribute-name').click(this._onRollAttributeSave.bind(this));
        html.find('.characteristic-name').click(this._onRollCharacteristicSave.bind(this));
        html.find('.skill-name').click(this._onRollSkillCheck.bind(this));
        html.find('.item-delete').click(this._onItemDelete.bind(this));
        html.find('.item-edit').click(this._onItemEdit.bind(this));
    }

    /**
     * Delete an item from the characters inventory.
     * 
     * @param {Event} event The triggering event
     */
    _onItemDelete(event) {
        event.preventDefault();

        let li = $(event.currentTarget).parents('.item'),
            itemId = li.data('itemId');

        this.actor.deleteEmbeddedEntity("OwnedItem", itemId);
        li.slideUp(200, () => {});
    }

    /**
     * Edit an item in the characters inventory.
     * 
     * @param {Event} event The triggering event
     */
    _onItemEdit(event) {
        event.preventDefault();

        let itemId = $(event.currentTarget).parents('.item').data('itemId');
        const item = this.actor.getOwnedItem(itemId);

        item.sheet.render(true);
    }

    /**
     * Rolls an attribute save for the character.
     * 
     * @param {Event} event The originating click event
     */
    _onRollAttributeSave(event) {
        event.preventDefault();
        let attribute = event.currentTarget.parentElement.dataset.attribute;

        this.actor.rollAttributeSave(attribute, { event: event });
    }

    /**
     * Rolls a characteristic save for the character.
     * 
     * @param {Event} event The originating click event
     */
    _onRollCharacteristicSave(event) {
        event.preventDefault();
        let characteristic = event.currentTarget.parentElement.dataset.characteristic;

        this.actor.rollCharacteristicSave(characteristic, { event: event });
    }

    /**
     * Rolls a skill check for the character.
     * 
     * @param {Event} event The originating click event
     */
    _onRollSkillCheck(event) {
        event.preventDefault();
        let skill = event.currentTarget.parentElement.parentElement.dataset.skill;

        this.actor.rollSkillCheck(skill, { event: event });
    }
}