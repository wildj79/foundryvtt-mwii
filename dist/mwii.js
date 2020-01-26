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
import { _getInitiativeFormula } from './module/combat.js';

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
		"itemAvailability", "vehicleTypes", "itemLegality"
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
