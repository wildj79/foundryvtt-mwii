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

        console.log(data.actor.data.characteristics);

        // Skill labels
        for (let [s, skl] of Object.entries(data.actor.data.skills)) {
            skl.characteristic = data.actor.data.characteristics[skl.characteristic].label.substring(0, 3);

            let skillLabel = CONFIG.MWII.skills[s];
            if (skl.specialization) {
                skillLabel += ` (${skl.specialization})`;
            }

            skl.label = skillLabel;
        }
    }
}