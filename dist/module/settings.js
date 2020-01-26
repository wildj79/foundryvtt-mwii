export const registerSettings = function() {
	game.settings.register("mwii", "useTacticalInitiative", {
		name: "MWII.UseTacticalInitiative",
		hint: "MWII.UseTacticalInitiativeHint",
		scope: "world",
		config: true,
		default: false,
		type: Boolean
	});
};
