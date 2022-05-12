export default class MWIICombat extends Combat {
	_sortCombatants(a, b) {
		const ia = Number.isNumeric(a.initiative) ? a.initiative : -9999;
		const ib = Number.isNumeric(b.initiative) ? b.initiative : -9999;
		const ci = ia - ib;
		if (ci !== 0) return ci;
		return a.id > b.id ? 1 : -1;
	}

	async nextRound() {
		await this.resetAll();
		await this.rollAll();

		return super.nextRound();
	}
}
