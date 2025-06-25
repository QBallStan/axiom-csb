import { applyAxiomDieColors } from "./diceColors.js";
import { renderChatCard } from "./chatCard.js";

export class AxiomRollDialog extends Application {
  constructor(
    actor,
    {
      skillName,
      skillDie,
      attributeKey,
      attributeDie,
      focusMod = 0,
      skillMod = 0,
      attributeMod = 0,
      penalty = 0,
      dualAttribute = false,
    }
  ) {
    super();
    this.actor = actor;
    this.skillName = skillName;
    this.skillDie = skillDie;
    this.attributeKey = attributeKey;
    this.attributeDie = attributeDie;
    this.focusMod = focusMod;
    this.skillMod = skillMod;
    this.attributeMod = attributeMod;
    this.penalty = penalty;
    this.dualAttribute = dualAttribute;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "axiom-roll-dialog",
      title: "Axiom Roll",
      template: "modules/axiom-csb/templates/roll-dialog.hbs",
      classes: ["axiom-roll", "sheet"],
      width: 450,
      height: 400,
    });
  }

  getData() {
    return {
      dualAttribute: this.dualAttribute ?? false,
      skillName: this.skillName,
      skillDie: this.skillDie, // e.g. "d8"
      skillMod: this.skillMod, // flat +X
      attributeKey: this.attributeKey,
      attributeDie: this.attributeDie, // e.g. "d6"
      attributeMod: this.attributeMod, // flat +Y
      focusDie: "d8",
      focusMod: this.focusMod ?? 0,
      modifier: 0,
      penalty: this.penalty ?? 0,
    };
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find(".axiom-csb-mod-input .mod-plus").on("click", (event) => {
      const input = $(event.currentTarget).siblings("input");
      input.val((parseInt(input.val()) || 0) + 1).trigger("change");
    });

    html.find(".axiom-csb-mod-input .mod-minus").on("click", (event) => {
      const input = $(event.currentTarget).siblings("input");
      input.val((parseInt(input.val()) || 0) - 1).trigger("change");
    });

    html.find(".axiom-roll-button").on("click", async () => {
      const attrDie = html.find("select[name='attributeDie']").val();
      const skillDie = html.find("select[name='skillDie']").val();
      const focusDie = "d8"; // fixed
      const focusMod = parseInt(html.find("input[name='focusMod']").val()) || 0;

      const attrMod =
        parseInt(html.find("input[name='attributeMod']").val()) || 0;
      const skillMod = parseInt(html.find("input[name='skillMod']").val()) || 0;
      const userMod = parseInt(html.find("input[name='modifier']").val()) || 0;
      const penalty = this.penalty ?? 0;
      const damagePenalty =
        parseInt(this.actor.system?.props?.actorDamagePenalty ?? 0) || 0;
      const totalMod = attrMod + skillMod + userMod + penalty + damagePenalty;

      const parseDie = (dieStr, mod = 0) => {
        const match = dieStr.match(/^d(\d+)([+-]\d+)?$/);
        if (!match) return `1d6`; // fallback
        const die = `1d${match[1]}`;
        const bonus = mod + (match[2] ? parseInt(match[2]) : 0);
        return bonus === 0
          ? die
          : `${die} ${bonus > 0 ? "+" : "-"} ${Math.abs(bonus)}`;
      };

      const rollFormula = [
        parseDie(attrDie, attrMod),
        parseDie(skillDie, skillMod),
        `1${focusDie} ${focusMod >= 0 ? "+" : "-"} ${Math.abs(focusMod)}`,
      ].join(" + ");

      const roll = await Roll.create(rollFormula);
      await roll.evaluate();

      const diceTerms = applyAxiomDieColors(roll);
      const parseDieModifier = (dieStr) => {
        const match = dieStr.match(/^d(\d+)([+-]\d+)?$/);
        return match && match[2] ? parseInt(match[2]) : 0;
      };

      const results = diceTerms.map((die) => die.results[0].result);

      // Apply BOTH the string modifier (like -2 from d4-2) AND the separate flat mod
      const modified = [
        Math.max(1, results[0] + attrMod + parseDieModifier(attrDie)),
        Math.max(1, results[1] + skillMod + parseDieModifier(skillDie)),
        Math.max(1, results[2] + focusMod),
      ];

      const focusRaw = results[2];
      const isComplication = focusRaw === 1;

      const bestTwo = modified
        .slice()
        .sort((a, b) => b - a)
        .slice(0, 2);
      const total = bestTwo.reduce((sum, v) => sum + v, 0) + userMod + penalty + damagePenalty;
      roll._total = total;

      const formatResultLine = (label, die, raw) => {
        const stepMod = parseDieModifier(die);
        const total = raw + stepMod;
        if (stepMod === 0) {
          return `${label}: ${die} → ${raw}`;
        } else {
          const op = stepMod < 0 ? "–" : "+";
          return `${label}: ${die} → ${raw} ${op} ${Math.abs(
            stepMod
          )} = ${total}`;
        }
      };

      const flavor = `
        <strong>${this.skillName} Test</strong><br>
        ${formatResultLine("Attribute Die", attrDie, results[0])}<br>
        ${formatResultLine(
          this.dualAttribute ? "Second Attribute Die" : "Skill Die",
          skillDie,
          results[1]
        )}
        ${
          isComplication
            ? `<span style="color: red;"><strong>(Complication)</strong></span>`
            : ""
        }<br>
        Focus Die: ${focusDie} → ${results[2]}<br>
        <strong>Best 2:</strong> ${bestTwo.join(
          " + "
        )} + General Mod (${userMod}) + Penalty (${penalty}) = <strong>${total}</strong>
      `;

      const chatContent = await renderChatCard({
        skillName: this.skillName,
        skillDie,
        skillRaw: results[1],
        skillStepMod: parseDieModifier(skillDie),
        skillFinal: results[1] + parseDieModifier(skillDie),

        attributeDie: attrDie,
        attributeRaw: results[0],
        attributeStepMod: parseDieModifier(attrDie),
        attributeFinal: results[0] + parseDieModifier(attrDie),

        focusDie,
        focusRaw: focusRaw,
        focusFinal: focusRaw + focusMod,
        focusMod: focusMod,

        best2: bestTwo,
        total,
        userMod,
        penalty,
        damagePenalty,
        isComplication,
        dualAttribute: this.dualAttribute,
        rollFormula,
      });

      await roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: chatContent,
        rollMode: game.settings.get("core", "rollMode"),
      });

      this.close();
    });
  }
}

export async function openRollFromRow({ row }) {
  const sheetApp = Object.values(ui.windows).find((w) => w?.actor);
  const actor = sheetApp?.actor;
  if (!actor) return ui.notifications.warn("Actor not found.");

  const skillName = row.skill;
  const attributeKey = row.attr;
  const penalty = row.penalty ?? 0;

  // === Find skill item by name ===
  const skillItem = actor.items.find(
    (i) => i.name?.toLowerCase() === skillName?.toLowerCase()
  );
  if (!skillItem) {
    return ui.notifications.warn(`Skill '${skillName}' not found.`);
  }

  // === Get skillValue from flag ===
  let skillValue = await actor.getFlag(
    "axiom-csb",
    `skillValue.${skillItem.id}`
  );
  if (skillValue === undefined || skillValue === null) skillValue = 1;
  skillValue = parseInt(skillValue);

  const skillBase = parseInt(skillItem.system?.props?.skillBaseDie ?? 3);
  const skillMod = parseInt(skillItem.system?.props?.skillDieMod ?? 0);
  const finalSkillStep = skillBase + (skillValue - 1) + skillMod;
  const skillDie = getDieLabel(finalSkillStep);

  // === Attribute side ===
  const attributeDie = getDieForStat(actor, attributeKey);
  const config = (await actor.getFlag("axiom-csb", "attributeConfig")) ?? {};
  const attributeMod = parseInt(config[`${attributeKey}DieMod`] ?? 0);

  new AxiomRollDialog(actor, {
    skillName,
    skillDie,
    skillMod,
    attributeKey,
    attributeDie,
    attributeMod,
    penalty,
    focusMod: 0,
  }).render(true);
}
