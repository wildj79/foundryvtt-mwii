export const registerSettings = function() {
	game.settings.register("mwii", "useTacticalInitiative", {
		name: "MWII.UseTacticalInitiative",
		hint: "MWII.UseTacticalInitiativeHint",
		scope: "world",
		config: true,
		default: false,
		type: Boolean
	});

	game.settings.register("mwii", "sendHitLocationConfirmationToGM", {
		name: "MWII.HitLocation.Confirm.SendToGMTitle",
		hint: "MWII.HitLocation.Confirm.SendToGMHint",
		scope: "world",
		config: true,
		default: false,
		type: Boolean
	});
};
