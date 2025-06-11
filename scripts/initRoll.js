import { applyAxiomDieColors } from "./diceColors.js";

export function overrideInitiativeRoll() {
  Hooks.once("ready", () => {
    const oldRollInitiative = Combat.prototype.rollInitiative;

    Combat.prototype.rollInitiative = async function (ids, { formula = null, updateTurn = true, messageOptions = {} } = {}) {
      const combat = this;
      ids = typeof ids === "string" ? [ids] : ids;

      for (let id of ids) {
        const combatant = combat.combatants.get(id);
        if (!combatant?.actor) continue;

        const actor = combatant.actor;
        const agiDie = actor.system?.props?.AgiDieLabel || "d6";
        const resDie = actor.system?.props?.ResDieLabel || "d6";
        const focusDie = "d6";

        const rollFormula = `1${agiDie} + 1${resDie} + 1${focusDie}`;
        const roll = await new Roll(rollFormula).evaluate();

        const diceTerms = applyAxiomDieColors(roll, ["Attribute", "Skill", "Focus"]);

        if (game.dice3d) {
            await game.dice3d.showForRoll(roll, game.user, true);
        }

        const results = diceTerms.map((term, i) => ({
          label: ["Agility", "Resolve", "Focus"][i],
          die: term.faces,
          total: term.results[0].result,
          term
        }));

        const sorted = [...results].sort((a, b) => b.total - a.total);
        const total = sorted[0].total + sorted[1].total;

        await combat.setInitiative(id, total);

        const chatContent = `
          <strong>Initiative Roll</strong><br>
          ${results.map(r => `${r.label} (d${r.die}): <strong>${r.total}</strong>`).join("<br>")}
          <hr>
          <strong>Total (Best 2): ${total}</strong>
        `;

        ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor }),
          content: chatContent,
          ...messageOptions
        });
      }

      return this;
    };
  });
}
