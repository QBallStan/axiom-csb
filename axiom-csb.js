import { registerActorSheet } from "./scripts/actorSheet.js";
import { openRollFromRow } from "./scripts/rollDialog.js";
import { overrideInitiativeRoll } from "./scripts/initRoll.js";

Hooks.once("init", () => {
  game.axiom = game.axiom || {};
  game.axiom.openRollFromRow = openRollFromRow;
  game.axiom.getDieLabel = getDieLabel;
  game.axiom.getDieForStat = getDieForStat;
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

Hooks.on("renderCombatTracker", async (app, html, data) => {
  for (const li of html.find(".combatant").toArray()) {
    const $li = $(li);
    const combatantId = $li.data("combatant-id");
    const combatant = game.combat?.combatants.get(combatantId);
    const actor = combatant?.actor;
    if (!actor) continue;

    const ap = getProperty(actor.system, "props.actorAP") ?? 0;

    const apDiv = $(`
      <div class="axiom-ap-tracker" style="
        margin-left: auto;
        display: flex;
        align-items: center;
        gap: 4px;
        padding-right: 4px;
      ">
        ${[...Array(3)]
          .map(
            (_, i) => `
          <i class="fa-solid fa-bolt ap-dot"
             data-index="${i + 1}"
             style="cursor: pointer; font-size: 18px; color: ${
               i < ap ? "#b33" : "#444"
             };"></i>
        `
          )
          .join("")}
      </div>
    `);

    $li.find(".token-initiative").after(apDiv);

    apDiv.find(".ap-dot").on("click", async function (event) {
      event.stopPropagation();
      const index = parseInt($(this).data("index"));
      const newAP = index === ap ? index - 1 : index;
      await actor.update({ "system.props.actorAP": newAP });
    });
  }
});

Hooks.on("updateCombat", async (combat, changes) => {
  if ("round" in changes) {
    for (const c of combat.combatants) {
      const actor = c.actor;
      if (actor) {
        await actor.update({ "system.props.actorAP": 3 });
      }
    }
  }
});
