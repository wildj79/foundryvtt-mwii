import DiceMWII from "../dice.js";
import MWII from "../config.js";
import EditSkillApplication from "../apps/edit-skill-application.js";

export class ActorMWII extends Actor {

    /**
     * The number used to calculate an attributes save target number.
     * 
     * @returns {Number}
     */
    static get ATTRIBUTE_SAVE() {
        return 12;
    }

    /**
     * The number used to calcualate a characteristics target number.
     * 
     * @returns {Number}
     */
    static get CHARACTERISTIC_SAVE() {
        return 18;
    }

    get hasArmor() {
        return this.items.filter(i => i.data.type === "armor" && i.data.data.equipped).length > 0;
    }

    prepareData() {
        super.prepareData();

        const data = this.data.data;

        // Attribute Saves
        for (let attr of Object.values(data.attributes)) {
            attr.save = ActorMWII.ATTRIBUTE_SAVE - attr.value;
        }

        // Characteristic saves
        for (let char of Object.values(data.characteristics)) {
            char.save = ActorMWII.CHARACTERISTIC_SAVE - (data.attributes[char.attribute1].value + data.attributes[char.attribute2].value);
        }

        // Skill targets
        for (let skl of Object.values(data.skills)) {
            skl.target = data.characteristics[skl.characteristic].save - skl.level;
        }

        this._processHitLocationDamageThresholds(data);
        this._processConditionMonitor(data);
        this._processMovement(data);
    }

    prepareBaseData() { super.prepareBaseData(); }
    prepareEmbeddedDocuments() { super.prepareEmbeddedDocuments(); }
    prepareDerivedData() { super.prepareDerivedData(); }

    _processMovement(data) {
        if (!data.movement) data.movement = {
            walking: {},
            running: {},
            sprinting: {},
            evade: {}
        };

        const attributes = data.attributes;
        const skills = data.skills;
        const rightLeg = data.hit_location.right_leg;
        const leftLeg = data.hit_location.left_leg;

        let walking = attributes['bld'].value;
        let running = walking + attributes['ref'].value + skills['running'].level;
        let sprinting = (walking * 2) + attributes['ref'].value + skills['running'].level;
        let evade = attributes['ref'].value;

        if (rightLeg.incapacitated || leftLeg.incapacitated) {
            walking = Math.floor(walking / 2);
            running = 0;
            sprinting = 0;
            evade = Math.floor(evade / 2);
        }

        if (rightLeg.incapacitated && leftLeg.incapacitated) {
            walking = Math.floor(walking / 2);
            evade = Math.floor(evade / 2);
        }

        if (rightLeg.disabled || leftLeg.disabled) {
            walking = 0;
            running = 0;
            sprinting = 0;
            evade = 0;
        }

        data.movement.walking.value = walking;
        data.movement.running.value = running;
        data.movement.sprinting.value = sprinting;
        data.movement.evade.value = evade;
    }

    _processHitLocationDamageThresholds(data) {
        const build = data.attributes.bld;
        const head = data.hit_location.head;
        const torso = data.hit_location.torso;
        const leftArm = data.hit_location.left_arm;
        const rightArm = data.hit_location.right_arm;
        const leftLeg = data.hit_location.left_leg;
        const rightLeg = data.hit_location.right_leg;

        head.damage_threshold = build.value * 2;
        torso.damage_threshold = build.value * 6;
        leftArm.damage_threshold = build.value * 3;
        rightArm.damage_threshold = build.value * 3;
        leftLeg.damage_threshold = build.value * 3;
        rightLeg.damage_threshold = build.value * 3;
    }

    _processConditionMonitor(data) {
        const build = data.attributes.bld;
        const condition = data.condition;

        condition.max = build.value * 2 * 5;

        const threshold1 = build.value * 2;
        const threshold2 = threshold1 * 2;
        const threshold3 = threshold1 * 3;
        const threshold4 = threshold1 * 4;
        const threshold5 = threshold1 * 5;

        if (condition.lethal.between(1, threshold1)) {
            condition.wound_factor = 1;            
        } else if (condition.lethal.between(threshold1 + 1, threshold2)) {
            condition.wound_factor = 2;
        } else if (condition.lethal.between(threshold2 + 1, threshold3)) {
            condition.wound_factor = 3;
        } else if (condition.lethal.between(threshold3 + 1, threshold4)) {
            condition.wound_factor = 4;
        } else if (condition.lethal.between(threshold4 + 1, threshold5)) {
            condition.wound_factor = 5;
        } else if (condition.lethal === 0) {
            condition.wound_factor = 0;
        }

        const total = condition.lethal + condition.bruise;

        if (total.between(1, threshold1)) {
            condition.save = 3;
            condition.condition = game.i18n.localize("MWII.Condition.Good");
        } else if (total.between(threshold1 + 1, threshold2)) {
            condition.save = 5;
            condition.condition = game.i18n.localize("MWII.Condition.Fair");
        } else if (total.between(threshold2 + 1, threshold3)) {
            condition.save = 7;
            condition.condition = game.i18n.localize("MWII.Condition.Poor");
        } else if (total.between(threshold3 + 1, threshold4)) {
            condition.save = 10;
            condition.condition = game.i18n.localize("MWII.Condition.Serious");
        } else if (total.between(threshold4 + 1, threshold5)) {
            condition.save = 11;
            condition.condition = game.i18n.localize("MWII.Condition.Critical");
        } else if (total === 0) {
            condition.save = 0;
            condition.condition = "";
        }
    }

    async rollAttributeSave(attributeId, options = {}) {
        const label = MWII.attributes[attributeId];
        const attribute = this.data.data.attributes[attributeId];

        const rollData = {
            target: attribute.save
        };

        return await DiceMWII.rollCheck({
            event: options.event,
            data: rollData,
            title: game.i18n.format("MWII.Rolls.Titles.AttributeSave", {label: label}),
            speaker: ChatMessage.getSpeaker({ actor: this }),
            isSave: true
        });
    }

    async rollCharacteristicSave(characteristicId, options = {}) {
        const label = MWII.characteristics[characteristicId];
        const characteristic = this.data.data.characteristics[characteristicId];

        const rollData = {
            target: characteristic.save
        };

        return await DiceMWII.rollCheck({
            event: options.event,
            data: rollData,
            title: game.i18n.format("MWII.Rolls.Titles.CharacteristicSave", {label: label}),
            speaker: ChatMessage.getSpeaker({ actor: this }),
            isSave: true
        });
    }

    async rollSkillCheck(skillId, options = {}) {
        const skill = this.data.data.skills[skillId];
        const hasSpecialization = skill.specialization?.trim()?.length > 0 ?? false;
        const label = !hasSpecialization ? MWII.skills[skillId] : `${MWII.skills[skillId]} (${skill.specialization})`;

        let title = game.i18n.format("MWII.Rolls.Titles.SkillCheck", {label: label});

        if (options?.isAttackRoll) {
            title = game.i18n.format("MWII.Rolls.Titles.AttackCheck", {weapon: options.weapon});
        }

        const rollData = {
            target: skill.target,
            isRanged: options?.isRanged ?? false,
            weapon: options?.weapon ?? "",
            isAttackRoll: options?.isAttackRoll ?? false,
            hasSpecialization: hasSpecialization,
            specialization: skill.specialization,
            skillUsed: options?.isAttackRoll ?? false ? label : null
        };
            
        return await DiceMWII.rollCheck({
            event: options.event,
            data: rollData,
            title: title,
            speaker: ChatMessage.getSpeaker({ actor: this }),
            isUntrained: skill.level < 1,
            hasNaturalAptitude: skill.natural_aptitude
        });
    }

    editSkill(skillId) {
        new EditSkillApplication(this, {
            skill: skillId
        }).render(true);
    }
}
