export const preloadTemplates = async function() {
	const templatePaths = [
		// Actors
		"systems/mwii/templates/actor/parts/actor-equipment.html",
		"systems/mwii/templates/actor/parts/actor-condition-monitor.html",
		"systems/mwii/templates/actor/parts/actor-advantages.html",

		// Items
		"systems/mwii/templates/item/parts/item-header.html",
		"systems/mwii/templates/item/parts/item-description.html"
	];

	return loadTemplates(templatePaths);
}
