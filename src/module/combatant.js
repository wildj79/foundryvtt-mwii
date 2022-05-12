export default class MWIICombatant extends Combatant {
    /** @inheritdoc */
    _getInitiativeFormula() {
		if (!this.actor) return "2d6";

		const parts = ["2d6", "@attributes.ref.value"];
		if (game.settings.get('mwii', 'useTacticalInitiative')) parts.push("@skills.tactics.level");

		return parts.filter(p => p !== null).join(' + ');
	}
}