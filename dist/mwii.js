/// <reference path="../node_modules/foundry-pc-types/index.d.ts" />
/**
 * Game system defintion for Mechwarrior, 2nd Edition by FASA corporation.
 * 
 * Author: widlj79
 * Software License: MIT
 */

// Import JavaScript modules
import { registerSettings } from './module/settings.js';
import { preloadTemplates } from './module/preloadTemplates.js';
import { MWII } from './module/config.js';
import { ActorMWII } from './module/actor/entity.js';
import { ItemMWII } from './module/item/entity.js';
import { ActorSheetMWII } from './module/actor/sheet.js';
import { ItemSheetMWII } from './module/item/sheet.js';
import { highlightSuccessOrFailure } from './module/dice.js';
import { _getInitiativeFormula, setupTurns } from './module/combat.js';

/* ------------------------------------ */
/* Initialize system					*/
/* ------------------------------------ */
Hooks.once('init', async function () {
	console.log('Mechwarrior 2 | Initializing ');

	// Assign custom classes and constants here
	game.mwii = {};

	CONFIG.MWII = MWII;
	CONFIG.Actor.entityClass = ActorMWII;
	CONFIG.Item.entityClass = ItemMWII;

	// Register custom system settings
	registerSettings();

	// Preload Handlebars templates
	await preloadTemplates();

	Combat.prototype._getInitiativeFormula = _getInitiativeFormula;
	Combat.prototype.setupTurns = setupTurns;

	// Register custom sheets (if any)
	Actors.unregisterSheet("core", ActorSheet);
	Actors.registerSheet("mwii", ActorSheetMWII, { types: ["character"], makeDefault: true });

	Items.unregisterSheet("core", ItemSheet);
	Items.registerSheet("mwii", ItemSheetMWII, { makeDefault: true });
});

/* ------------------------------------ */
/* Setup system							*/
/* ------------------------------------ */
Hooks.once('setup', function () {
	const toLocalize = [
		"attributes", "characteristics", "skills", "movement", "damageTypes",
		"unitsOfMeasureWeight", "unitsOfMeasureDistance", "itemTechLevel",
		"itemAvailability", "vehicleTypes", "itemLegality", "lethality",
		"weaponTypes"
	];

	for (let o of toLocalize) {
		CONFIG.MWII[o] = Object.entries(CONFIG.MWII[o]).reduce((obj, e) => {
			obj[e[0]] = game.i18n.localize(e[1]);

			return obj;
		}, {});
	}
});

/* ------------------------------------ */
/* When ready							*/
/* ------------------------------------ */
Hooks.once('ready', function () {
	// Do anything once the system is ready

	console.log("Mechwarrior 2 | Reactor: online, Sensors: online, Weapons: online. All systems nominal");
});

// Add any additional hooks if necessary
Hooks.on("renderChatMessage", highlightSuccessOrFailure);
Hooks.on("preUpdateCombat", async (combat, diff, options = {}) => {
	const roundUpdate = !!getProperty(diff, "round");

	if (!roundUpdate) return;
	if (diff.round < 1 || diff.round < combat.previous.round) return;
	
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
	
	combat.turn = 0;

	// Create multiple chat messages
	await ChatMessage.createMany(messages);
	// <-- End of borrowed code
});
