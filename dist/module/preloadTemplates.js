export const preloadTemplates = async function() {
	const templatePaths = [
		"systems/mwii/templates/actor/parts/actor-equipment.html",
		"systems/mwii/templates/actor/parts/actor-condition-monitor.html",
		"systems/mwii/templates/actor/parts/actor-advantages.html"
	];

	return loadTemplates(templatePaths);
}
