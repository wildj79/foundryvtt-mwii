import { DiceMWII } from "../dice.js";

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

    prepareData() {
        super.prepareData();
        const actorData = this.data;
        const data = actorData.data;

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

        const build = data.attributes.bld;
        const head = data.hit_location.head;
        const torso = data.hit_location.torso;
        const leftArm = data.hit_location.left_arm;
        const rightArm = data.hit_location.right_arm;
        const leftLeg = data.hit_location.left_leg;
        const rightLeg = data.hit_location.right_leg;

        head.damage_threshold = build.save * 2;
        torso.damage_threshold = build.save * 6;
        leftArm.damage_threshold = build.save * 3;
        rightArm.damage_threshold = build.save * 3;
        leftLeg.damage_threshold = build.save * 3;
        rightLeg.damage_threshold = build.save * 3;

        data.condition.max = build.value * 2 * 5;

        if (!data.movement) data.movement = {
            walking: {},
            running: {},
            sprinting: {},
            evade: {}
        };

        const attributes = data.attributes;
        const skills = data.skills;

        data.movement.walking.value = attributes['bld'].value;
        data.movement.running.value = attributes['bld'].value + attributes['ref'].value + skills['running'].level;
        data.movement.sprinting.value = (attributes['bld'].value * 2) + attributes['ref'].value + skills['running'].level;
        data.movement.evade.value = attributes['ref'].value;
    }

    async rollAttributeSave(attributeId, options = {}) {
        const label = CONFIG.MWII.attributes[attributeId];
        const attribute = this.data.data.attributes[attributeId];

        const rollData = {
            target: attribute.save
        };

        DiceMWII.d6Roll({
            event: options.event,
            data: rollData,
            title: `${label} Attribute Save`,
            speaker: ChatMessage.getSpeaker({ actor: this }),
            isSave: true
        }).catch(() => {});
    }

    rollCharacteristicSave(characteristicId, options = {}) {
        const label = CONFIG.MWII.characteristics[characteristicId];
        const characteristic = this.data.data.characteristics[characteristicId];

        const rollData = {
            target: characteristic.save
        };

        DiceMWII.d6Roll({
            event: options.event,
            data: rollData,
            title: `${label} Characteristic Save`,
            speaker: ChatMessage.getSpeaker({ actor: this }),
            isSave: true
        }).catch(() => {});
    }

    rollSkillCheck(skillId, options = {}) {
        const label = CONFIG.MWII.skills[skillId];
        const skill = this.data.data.skills[skillId];

        const rollData = {
            target: skill.target
        };
            
        DiceMWII.d6Roll({
            event: options.event,
            data: rollData,
            title: `${label} Skill Check`,
            speaker: ChatMessage.getSpeaker({ actor: this }),
            isUntrained: skill.level < 1,
            hasNaturalAptitude: skill.natural_aptitude
        }).catch(() => {});
    }
}
