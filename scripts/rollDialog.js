import { applyAxiomDieColors } from "./diceColors.js";

export class AxiomRollDialog extends Application {
  constructor(actor, { skillName, skillDie, attributeKey, attributeDie, focusStep, skillMod = 0, attributeMod = 0, penalty = 0 }) {
    super();
    this.actor = actor;
    this.skillName = skillName;
    this.skillDie = skillDie;
    this.attributeKey = attributeKey;
    this.attributeDie = attributeDie;
    this.focusStep = focusStep;
    this.skillMod = skillMod;
    this.attributeMod = attributeMod;
    this.penalty = penalty;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "axiom-roll-dialog",
      title: "Axiom Roll",
      template: "modules/axiom-csb/templates/roll-dialog.hbs",
      width: 400
    });
  }

  getData() {
    return {
      skillName: this.skillName,
      skillDie: this.skillDie,
      skillMod: this.skillMod ?? 0,
      attributeKey: this.attributeKey,
      attributeDie: this.attributeDie,
      attributeMod: this.attributeMod ?? 0,
      focusDie: `d${6 + this.focusStep * 2}`,
      modifier: 0,
      penalty: this.penalty ?? 0
    };
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find(".axiom-csb-mod-input .mod-plus").on("click", event => {
      const input = $(event.currentTarget).siblings("input");
      input.val((parseInt(input.val()) || 0) + 1).trigger("change");
    });

    html.find(".axiom-csb-mod-input .mod-minus").on("click", event => {
      const input = $(event.currentTarget).siblings("input");
      input.val((parseInt(input.val()) || 0) - 1).trigger("change");
    });

    html.find(".roll-button").on("click", async () => {
      const attrDie = html.find("select[name='attributeDie']").val();
      const skillDie = html.find("select[name='skillDie']").val();
      const focusDie = html.find("select[name='focusDie']").val();

      const attrMod = parseInt(html.find("input[name='attributeMod']").val()) || 0;
      const skillMod = parseInt(html.find("input[name='skillMod']").val()) || 0;
      const userMod = parseInt(html.find("input[name='modifier']").val()) || 0;
      const penalty = this.penalty ?? 0;
      const totalMod = attrMod + skillMod + userMod + penalty;

      const rollFormula = `1${attrDie} + ${attrMod} + 1${skillDie} + ${skillMod} + 1${focusDie}`;
      const roll = await Roll.create(rollFormula);
      await roll.evaluate();

      const diceTerms = applyAxiomDieColors(roll);
      const results = diceTerms.map(die => die.results[0].result);

      const modified = [
        results[0] + attrMod,
        results[1] + skillMod,
        results[2]
      ];

      const skillRaw = results[1];
      const isComplication = skillRaw === 1;

      const bestTwo = modified.sort((a, b) => b - a).slice(0, 2);
      const total = bestTwo.reduce((sum, v) => sum + v, 0) + totalMod;
      roll._total = total;

      const formatResultLine = (label, die, raw, mod) => {
        const op = mod < 0 ? "–" : mod > 0 ? "+" : "";
        const absMod = Math.abs(mod);
        return `${label}: ${die} → ${raw} ${op ? `${op} ${absMod}` : ""}`;
      };

      const flavor = `
        <strong>${this.skillName} Test</strong><br>
        ${formatResultLine("Attribute Die", this.attributeDie, results[0], attrMod)}<br>
        ${formatResultLine("Skill Die", this.skillDie, results[1], skillMod)} ${isComplication ? `<span style="color: red;"><strong>(Complication)</strong></span>` : ""}<br>
        Focus Die: ${6 + this.focusStep * 2} → ${results[2]}<br>
        <strong>Best 2:</strong> ${bestTwo.join(" + ")} + General Mod (${userMod}) + Penalty (${penalty}) = <strong>${total}</strong>
      `;

      await roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor,
        rollMode: game.settings.get("core", "rollMode")
      });

      this.close();
    });
  }
}

export function openRollFromRow({ row }) {
  const sheetApp = Object.values(ui.windows).find(w => w?.actor);
  const actor = sheetApp?.actor;
  if (!actor) return ui.notifications.warn("Actor not found.");

  const skillName = row.skill;
  const skillDie = row.skillDie ?? "d6";
  const skillMod = row.skillMod ?? 0;

  const attributeKey = row.attr;
  const attributeDie = row.attrDie ?? "d6";
  const attributeMod = row.attributeMod ?? 0;

  const penalty = row.penalty ?? 0;

  new AxiomRollDialog(actor, {
    skillName,
    skillDie,
    attributeKey,
    attributeDie,
    skillMod,
    attributeMod,
    penalty,
    focusStep: 0
  }).render(true);
}
