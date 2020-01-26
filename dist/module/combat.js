/**
 * Acquire the default dice formula which should be used to roll initiative for a particular combatant.
 * Modules or systems could choose to override or extend this to accommodate special situations.
 * @private
 *
 * @param {Object} combatant      Data for the specific combatant for whom to acquire an initiative formula. This
 *                                is not used by default, but provided to give flexibility for modules and systems.
 * @return {string}               The initiative formula to use for this combatant.
 */
export const _getInitiativeFormula = function (combantant) {
    if (!combantant.actor) return "2d6";

    const parts = ["2d6", "@attributes.ref.value"];
    if (game.settings.get('mwii', 'useTacticalInitiative')) parts.push("@skills.tactics.level");

    return parts.filter(p => p !== null).join(' + ');
};
