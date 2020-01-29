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

/**
 * Return the Array of combatants sorted into initiative order, breaking ties alphabetically by name
 * @returns {Array}
 */
export const setupTurns = function () {
    const scene = game.scenes.get(this.data.scene);
    const players = game.users.players;

    // Populate additional data for each combatant
    let turns = this.data.combatants.map(c => {
      c.token = scene.getEmbeddedEntity("Token", c.tokenId);
      if ( !c.token ) return c;
      c.actor = Actor.fromToken(new Token(c.token, scene));
      c.players = c.actor ? players.filter(u => c.actor.hasPerm(u, "OWNER")) : [];
      c.owner = c.actor ? c.actor.owner : false;
      c.visible = c.owner || !c.hidden;
      return c;
    }).filter(c => c.token);

    // Sort turns into initiative order: (1) initiative, (2) name, (3) tokenId
    turns = turns.sort((a, b) => {
      let ci = (a.initiative || -9999) - (b.initiative || -9999);
      if ( ci !== 0 ) return ci;
      let [an, bn] = [a.token.name || "", b.token.name || ""];
      let cn = an.localeCompare(bn);
      if ( cn !== 0 ) return cn;
      return a.tokenId - b.tokenId;
    });

    // Ensure the current turn is bounded
    this.data.turn = Math.clamped(this.data.turn, 0, turns.length-1);
    this.turns = turns;

    // When turns change, tracked resources also change
    if ( ui.combat ) ui.combat.updateTrackedResources();
    return this.turns;
};

export const rollInitiative = async function (combat, update, options = {}, id) {
  const roundUpdate = !!getProperty(update, "round");

	if (!roundUpdate) return;
	if (update.round < 1 || update.round < combat.previous.round) return;
	
	const ids = combat.turns.map(c => c._id);

	// Taken from foundry.js Combat.rollInitiative() -->

	// Iterate over Combatants, performing an initiative roll for each
	const [updates, messages] = ids.reduce((results, id, i) => {
		let [updates, messages] = results;

		const messageOptions = options.messageOptions || {};

		// Get Combatant data
		const c = combat.getCombatant(id);
		if ( !c ) return results;
		const actorData = c.actor ? c.actor.data.data : {};
		const formula = combat.formula || combat._getInitiativeFormula(c);

		// Roll initiative
		const roll = new Roll(formula, actorData).roll();
		updates.push({_id: id, initiative: roll.total});

		// Construct chat message data
		const rollMode = messageOptions.rollMode || (c.token.hidden || c.hidden) ? "gmroll" : "roll";
		let messageData = mergeObject({
		speaker: {
			scene: canvas.scene._id,
			actor: c.actor ? c.actor._id : null,
			token: c.token._id,
			alias: c.token.name
		},
		flavor: `${c.token.name} rolls for Initiative!`
		}, messageOptions);
		const chatData = roll.toMessage(messageData, {rollMode, create:false});
		if ( i > 0 ) chatData.sound = null;   // Only play 1 sound for the whole set
		messages.push(chatData);

		// Return the Roll and the chat data
		return results;
	}, [[], []]);

	if ( !updates.length ) {
		return;
	}

	// Update multiple combatants
	await combat.updateManyEmbeddedEntities("Combatant", updates);
	
	// combat.turn = 0;

	// Create multiple chat messages
	await ChatMessage.createMany(messages);
	// <-- End of borrowed code
};
