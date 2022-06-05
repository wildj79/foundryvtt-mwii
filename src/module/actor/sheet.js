import MWII from "../config.js";

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
            width: 700,
            height: 550,
            tabs: [
                {navSelector: ".tabs", contentSelector: ".sheet-body", initial: "statistics" }
            ]
        });
    }

    get template() {
        const path = "systems/mwii/templates/actor/";
        if (!game.user.isGM && this.actor.limited) return path + "limited-sheet.html";
        return path + "character-sheet.html";
    }

    getData() {
        let isOwner = this.document.isOwner;
        const data = {
            owner: isOwner,
            limited: this.document.limited,
            options: this.options,
            editable: this.isEditable,
            cssClass: isOwner ? "editable" : "locked",
            isCharacter: this.document.data.type === "character",
            config: MWII
        };

        data.actor = foundry.utils.duplicate(this.actor.data);
        data.items = this.actor.items.map(i => {
            i.data.labels = i.labels;
            return i.data;
        });

        data.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));
        data.data = foundry.utils.duplicate(this.actor.data.data);
        data.labels = this.actor.labels || {};

        // Attributes
        for (let [a, att] of Object.entries(data.data.attributes)) {
            att.label = MWII.attributes[a];
        }

        // Characteristics
        for (let [c, char] of Object.entries(data.data.characteristics)) {
            char.label = MWII.characteristics[c];
        }

        // Skill labels
        for (let [s, skl] of Object.entries(data.data.skills)) {
            skl.characteristic = data.actor.data.characteristics[skl.characteristic].label;
            skl.target_display = `${skl.target}+`;

            let skillLabel = MWII.skills[s];
            if (skl.specialization) {
                skillLabel += ` (${skl.specialization})`;

                skl.target_display = `${skl.target - 1}+/${skl.target + 1}+ *`;
            }

            skl.label = skillLabel;
        }

        this._prepareItems(data);

        if (!data.data.movement) return data;

        for (let [m, movement] of Object.entries(data.data.movement)) {
            movement.label = MWII.movement[m];
        }

        return data;
    }

    _prepareItems(data) {
        const equipment = {
            weapons: { label: game.i18n.localize("MWII.Weapons.Title"), items: [], dataset: { type: "weapons" } },
            gear: { label: game.i18n.localize("MWII.Gear"), items: [], dataset: { type: "gear" } },
            armor: { label: game.i18n.localize("MWII.Armor.Title"), items: [], dataset: { type: "armor" } },
            power_pack: { label: game.i18n.localize("MWII.PowerPacks"), items: [], dataset: { type: "power_pack" } },
            vehicle: { label: game.i18n.localize("MWII.Vehicle.Title"), items: [], dataset: { type: "vehicle" } }
        };

        let [items, advantages, vehicles] = data.items.reduce((arr, item) => {
            item.img = item.img || DEFAULT_TOKEN;
            item.isStack = item.data.quantity ? item.data.quantity > 1 : false;
            item.hasAttack = item.type === 'weapons';
            item.hasDamage = !!(item.data.damage);
            if (item.type === "advantage") arr[1].push(item);
            else if (item.type === "vehicle") arr[2].push(item);
            else if (Object.keys(equipment).includes(item.type)) arr[0].push(item);

            return arr;
        }, [[], [], []]);

        equipment['vehicle'].items = vehicles;

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

    /**
     * @inheritdoc
     * @param {JQuery} html The prepared HTML object ready to be rendered into the DOM
     */
    activateListeners(html) {
        super.activateListeners(html);

        // Save scroll position
        html.find(".tab.active")[0].scrollTop = this._scrollTab;
        html.find(".tab").on("scroll", ev => this._scrollTab = ev.currentTarget.scrollTop);

        if (!this.options.editable) return;

        html.find('.attribute-name').on("click", this._onRollAttributeSave.bind(this));
        html.find('.characteristic-name').on("click", this._onRollCharacteristicSave.bind(this));
        html.find('.skill-name').on("click", this._onRollSkillCheck.bind(this));
        html.find('.item-delete').on("click", this._onItemDelete.bind(this));
        html.find('.item-edit').on("click", this._onItemEdit.bind(this));
        html.find('.item-create').on("click", this._onItemCreate.bind(this));
        html.find('tr.skill').on("contextmenu", this._onEditSkill.bind(this));
        html.find('.roll-attack').on('click', this._onRollAttack.bind(this));
        html.find('.roll-damage').on('click', this._onRollDamage.bind(this));
    }

    /**
     * Roll damage for a weapon.
     * 
     * @param {JQuery.Event} event The triggering click event
     */
    _onRollDamage(event) {
        event.preventDefault();

        const weaponId = $(event.currentTarget).data('weaponId');
        const weapon = this.actor.items.find(i => i.id === weaponId);
        const shouldSendConfirmationToGM = game.settings.get('mwii', 'sendHitLocationConfirmationToGM');

        if (!game.user.isGM && shouldSendConfirmationToGM) weapon.rollHitLocation(event);
        else weapon.rollDamage(event);
    }

    /**
     * Roll an attack check for a weapon.
     * 
     * @param {JQuery.Event} event The triggering click event
     */
    _onRollAttack(event) {
        event.preventDefault();

        const weaponId = $(event.currentTarget).data('weaponId');
        const weapon = this.actor.items.find(i => i.id === weaponId);

        weapon.rollAttack(event);
    }

    /**
     * Edit a skill.
     * 
     * @param {JQuery.Event} event The triggering event
     */
    _onEditSkill(event) {
        event.preventDefault();
        
        const header = event.currentTarget;
        const skillId = header.dataset.skill;

        this.actor.editSkill(skillId);
    }

    /**
     * Create a new item for the character.
     * 
     * @param {JQuery.Event} event The triggering event
     */
    _onItemCreate(event) {
        event.preventDefault();

        const header = event.currentTarget;
        const type = header.dataset.type;
        const itemData = {
            name: `New ${type.capitalize()}`,
            type: type,
            data: duplicate(header.dataset)
        };

        delete itemData.data['type'];

        return this.actor.createEmbeddedDocuments("Item", [itemData]);
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

        this.actor.deleteEmbeddedDocuments("Item", [itemId]);
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
        const item = this.actor.items.get(itemId);

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