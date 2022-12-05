import MWII from "../config.js";

/**
 * A specialized form used in editing a character skill.
 */
export default class EditSkillApplication extends FormApplication {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "edit-skill",
            classes: ["mwii", "edit-skill"],
            template: "systems/mwii/templates/apps/edit-skill-application.html",
            width: 320,
            height: "auto"
        });
    }

    /** @inheritdoc */
    get title() {
        return game.i18n.format("MWII.Applications.EditSkill.Title", {skill: MWII.skills[this.skill]});
    }

    /**
     * Return the name of the skill being edited.
     * 
     * @type {String}
     */
    get skill() {
        return this.options.skill;
    }

    getData() {
        const skill = foundry.utils.getProperty(this.object.system, `system.skills.${this.skill}`);

        return {
            skill
        };
    }

    /**
     * Handle any updates to the underlying object.
     * 
     * @param {JQuery.Event} event The event that triggers the update
     * @param {FormDataExtended} formData The data from the form
     */
    _updateObject(event, formData) {
        const key = `system.skills.${this.skill}`;
        this.object.update({
            [`${key}.level`]: formData.level,
            [`${key}.sp`]: formData.sp,
            [`${key}.natural_aptitude`]: formData.natural_aptitude,
            [`${key}.specialization`]: formData.specialization
        });
    }
}