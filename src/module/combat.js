export default class MWIICombat extends Combat {
	_sortCombatants(a, b) {
		const ia = Number.isNumeric(a.initiative) ? a.initiative : -9999;
		const ib = Number.isNumeric(b.initiative) ? b.initiative : -9999;
		const ci = ia - ib;
		if (ci !== 0) return ci;

		let tacticsA = 0;
		let tacticsB = 0;
		if (game.settings.get('mwii', 'useTacticalInitiative')) {
			tacticsA = a.actor.data.data.skills.tactics.level;
			tacticsB = b.actor.data.data.skills.tactics.level;
		}

		const aInt = a.actor.data.data.attributes.int.value + tacticsA;
		const bInt = a.actor.data.data.attributes.int.value + tacticsB;
		const deltaInt = aInt - bInt;
		if (deltaInt !== 0) return deltaInt;

		const aRoll = new Roll("1d6").evaluate({async: false}).total;
		const bRoll = new Roll("1d6").evaluate({async: false}).total;
		const deltaRoll = aRoll - bRoll;
		if (deltaRoll !== 0) return deltaRoll;

		return a.id > b.id ? 1 : -1;
	}

	async nextRound() {
		await this.resetAll();
		await this.rollAll();

		return super.nextRound();
	}
}
