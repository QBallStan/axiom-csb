import { applyAxiomDieColors } from "./scripts/diceColors.js";
import { registerActorSheet } from "./scripts/actorSheet.js";
import { openRollFromRow } from "./scripts/rollDialog.js";
import { overrideInitiativeRoll } from "./scripts/initRoll.js";

Hooks.once("init", () => {
  game.axiom = {
    openRollFromRow
  };
});

registerActorSheet();
overrideInitiativeRoll();
