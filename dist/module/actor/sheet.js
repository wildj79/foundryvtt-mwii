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
            height: 600
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
            skl.characteristic = data.actor.data.characteristics[skl.characteristic].label.substring(0, 3);

            let skillLabel = CONFIG.MWII.skills[s];
            if (skl.specialization) {
                skillLabel += ` (${skl.specialization})`;
            }

            skl.label = skillLabel;
        }

        return data;
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
    }

    /**
     * Rolls an attribute save for the character.
     * 
     * @param {Event} event The originating click event
     */
    _onRollAttributeSave(event) {
        event.preventDefault();
        let attribute = event.currentTarget.parentElement.dataset.attribute;

        this.actor.rollAttributeSave(attribute, {event: event});
    }

    /**
     * Rolls a characteristic save for the character.
     * 
     * @param {Event} event The originating click event
     */
    _onRollCharacteristicSave(event) {
        event.preventDefault();
        let characteristic = event.currentTarget.parentElement.dataset.characteristic;

        this.actor.rollCharacteristicSave(characteristic, {event: event});
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