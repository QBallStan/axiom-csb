import { registerActorSheet } from "./scripts/actorSheet.js";
import { openRollFromRow } from "./scripts/rollDialog.js";
import { overrideInitiativeRoll } from "./scripts/initRoll.js";

Hooks.once("init", () => {
  game.axiom = game.axiom || {};
  game.axiom.openRollFromRow = openRollFromRow;
  game.axiom.getDieLabel = getDieLabel;
  game.axiom.getDieForStat = getDieForStat;
  game.axiom.getDieForSkill = getDieForSkill;
});

registerActorSheet();
overrideInitiativeRoll();

/**
 * Converts a numeric stat (1–19+) to a die label string (e.g., "d6", "d12+2").
 * @param {number} value
 * @returns {string}
 */
export function getDieLabel(value) {
  const baseDice = ["d4-2", "d4-1", "d4", "d6", "d8", "d10", "d12"];
  if (value <= 0) return "—";
  if (value <= 7) return baseDice[value - 1];
  return `d12+${value - 7}`;
}

/**
 * Gets the die label for an actor's attribute.
 */
export function getDieForStat(actor, statKey, path = `system.props.${statKey}Value`) {
  const raw = foundry.utils.getProperty(actor, path);
  const base = raw != null && !isNaN(raw) && raw > 0 ? raw : 3;
  return getDieLabel(Math.max(1, base));
}

/**
 * Gets the die label for an actor's skill.
 */
export function getDieForSkill(actor, item) {
  const base = parseInt(item.system?.props?.skillBaseDie ?? 3);
  const level = parseInt(item.system?.props?.skillValue ?? 1);
  return getDieLabel(Math.max(1, base + (level - 1))); 
}

