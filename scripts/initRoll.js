import { applyAxiomDieColors } from "./diceColors.js";
import { getDieLabel } from "../axiom-csb.js";

export function overrideInitiativeRoll() {
  Hooks.once("ready", () => {
    const oldRollInitiative = Combat.prototype.rollInitiative;

    Combat.prototype.rollInitiative = async function (
      ids,
      { formula = null, updateTurn = true, messageOptions = {} } = {}
    ) {
      const combat = this;
      ids = typeof ids === "string" ? [ids] : ids;

      for (let id of ids) {
        const combatant = combat.combatants.get(id);
        if (!combatant?.actor) continue;

        const actor = combatant.actor;

        const config =
          (await actor.getFlag("axiom-csb", "attributeConfig")) ?? {};

        const getDieStep = async (key) => {
          const value = parseInt(
            (await actor.getFlag("axiom-csb", `${key}Value`)) ?? 3
          );
          const base = parseInt(config[`${key}BaseDie`] ?? 3);
          const mod = parseInt(config[`${key}DieMod`] ?? 0);
          const step = base + (value - 3) + mod;
          return getDieLabel(step);
        };

        const agiDie = await getDieStep("Agi");
        const resDie = await getDieStep("Res");
        const focusDie = "d10"; // fixed

        // Create and evaluate combined roll
        const roll = new Roll(`${agiDie} + ${resDie} + ${focusDie}`);
        await roll.evaluate();

        applyAxiomDieColors(roll, ["Attribute", "Skill", "Focus"]);

        if (game.dice3d) {
          await game.dice3d.showForRoll(roll, game.user, true);
        }

        // Extract dice and results
        const diceTerms = roll.terms.filter(
          (term) => term instanceof foundry.dice.terms.Die
        );
        const results = diceTerms.map((term, i) => ({
          label: ["Agility", "Resolve", "Focus"][i],
          die: `d${term.faces}`,
          total: term.results[0].result,
        }));

        const sorted = [...results].sort((a, b) => b.total - a.total);
        const total = sorted[0].total + sorted[1].total;

        await combat.setInitiative(id, total);

        const chatContent = `
    <div class="axiom-chat-card">
      <header><strong>Initiative Roll</strong></header>
      <div class="axiom-roll-columns">
        ${results
          .map(
            (r) => `
          <div class="axiom-roll-column">
            <div class="label">${r.label}</div>
            <div class="die">${r.total}</div>
            <div class="mod">${r.die}</div>
          </div>
        `
          )
          .join("")}
      </div>
      <div class="axiom-roll-summary">
        <strong>Total (Best 2): ${total}</strong>
      </div>
    </div>
  `;

        ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor }),
          content: chatContent,
          ...messageOptions,
        });
      }

      return this;
    };
  });
}
