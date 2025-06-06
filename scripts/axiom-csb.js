Hooks.once("init", () => {
  game.axiom = {
    openRollFromRow
  };
});

Hooks.on("renderActorSheet", (app, html, data) => {

  // Delegate click on any plus/minus button within number fields
  html.find(".custom-system-number-field-control").on("click", event => {
    const input = $(event.currentTarget).siblings("input[type='number'], input[type='range'], input[type='text']");
    input.trigger("change");
  }); 

  // ATTRIBUTE PIPS //  
  const fields = ["StrValue", "IntValue", "AgiValue", "ResValue", "ForValue", "ChaValue"];

  for (const key of fields) {
    const container = html.find(`.${key}`);
    if (!container.length) continue;

    const input = container.find(`input[type='range'], input[name='system.props.${key}']`).last();
    if (!input.length) {
      console.warn(`[Axiom//Pips] Input for ${key} not found.`);
      continue;
    }

    // Hide the slider but keep it functional
    input.css({
      opacity: "0",
      width: "0px",
      height: "0px",
      pointerEvents: "none",
      position: "absolute",
    });

    // Only add pip display if not already present
    if (!input.siblings(".pip-display").length) {
      const pipDisplay = $(`<div class="pip-display" style="display: flex; gap: 4px; margin: 0 6px;"></div>`);
      input.after(pipDisplay);
    }

    const renderPips = () => {
      const pipDisplay = container.find(".pip-display");
      pipDisplay.empty();
      const value = parseInt(input.val()) || 1;

      for (let i = 1; i <= 5; i++) {
        const pip = $(`<div class="pip" style="
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: ${i <= value ? 'limegreen' : '#333'};
          transition: background-color 0.2s ease;
        "></div>`);
        pipDisplay.append(pip);
      }
    };

    // Initial render
    renderPips();

    // Live update on slider change
    input.on("input change", () => renderPips());

    // Re-render after update via +/– button
    Hooks.once("updateActor", () => {
      setTimeout(() => renderPips(), 50);
    });
  }

  // SKILL PIPS
    html.find("[class*='CharacterSkillLevel']").each((_, el) => {
        const container = $(el);

        // Match the actual input element
        const input = container.find("input[type='range'], input[name*='CharacterSkillLevel']").last();
        if (!input.length) return;

        // Hide the slider visually
        input.css({
            opacity: "0",
            width: "0px",
            height: "0px",
            pointerEvents: "none",
            position: "absolute",
        });

        // Add pip display if not present
        if (!input.siblings(".pip-display").length) {
            const pipDisplay = $(`<div class="pip-display" style="display: flex; gap: 4px; margin: 0 6px;"></div>`);
            input.after(pipDisplay);
        }

        // Render the pips
        const renderPips = () => {
            const pipDisplay = container.find(".pip-display");
            pipDisplay.empty();
            const rawValue = parseInt(input.val()) || 3; // Skill sliders start at 3 (d4)
            const value = rawValue - 2; // d4=3, so 1 pip = d4, 5 = d12

            for (let i = 1; i <= 5; i++) {
            const pip = $(`<div class="pip" style="
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background-color: ${i <= value ? 'limegreen' : '#333'};
                transition: background-color 0.2s ease;
            "></div>`);
            pipDisplay.append(pip);
            }
        };

        renderPips();
        input.on("input change", () => renderPips());

        Hooks.once("updateActor", () => {
            setTimeout(() => renderPips(), 50);
        });
    });
    
    // HEALTH BAR
    const actor = app.actor;
    const container = html.find(".axiomCharacterHealthBar");
    if (!container.length) return;

    const forDie = foundry.utils.getProperty(actor.system, "props.ForDieLabel") || "d6";
    const dieStep = parseInt(forDie.replace(/[^\d]/g, "")) || 6;
    const boxCount = 6 + Math.floor(dieStep / 2);

    // Defensive parseInt with fallback
    const physicalDamage = parseInt(foundry.utils.getProperty(actor.system, "props.axiomCharacterPhysicalDamage")) || 0;
    const stunDamage = parseInt(foundry.utils.getProperty(actor.system, "props.axiomCharacterStunDamage")) || 0;
    const totalDamage = physicalDamage + stunDamage;
    const totalDamageClamped = Math.min(totalDamage, boxCount);

    const bar = container.find(".health-bar");
    bar.empty();

    for (let i = 0; i < boxCount; i++) {
        const indexFromRight = boxCount - 1 - i;
        const box = $(`<div class="hp-box"></div>`);

        if (indexFromRight < physicalDamage) {
        box.css("background-color", "#800"); // red for physical damage
        } else if (indexFromRight < totalDamageClamped) {
        box.css("background-color", "#08f"); // blue for stun + physical damage (beyond physical)
        } else {
        box.css("background-color", "#999"); // white for undamaged
        }

        bar.append(box);
    }
    
    // BOONS DISPLAY
    const boonsField = html.find(".axiomCharacterBoonsCount");
    if (boonsField.length) {
        const inputSpan = boonsField.find(".custom-system-number-input-span");
        const input = inputSpan.find("input[type='number'], input[name*='axiomCharacterBoonsCount']").last();
        if (!input.length) return;

        // Hide the number field but keep +/– controls
        input.css({
            opacity: "0",
            width: "0px",
            height: "0px",
            pointerEvents: "none",
            position: "absolute"
        });

        // Optionally hide number value span (may vary based on theme)
        inputSpan.find("input[type='text'], input[type='number']").css("display", "none");

        // Add dice display
        if (!input.siblings(".boon-display").length) {
            const display = $(`<div class="boon-display" style="display: flex; gap: 4px; margin: 0 6px;"></div>`);
            input.after(display);
        }

        const renderBoons = () => {
            const display = boonsField.find(".boon-display");
            display.empty();
            const value = parseInt(input.val()) || 0;

            for (let i = 1; i <= 3; i++) {
            const die = $(`<i class="fa-solid fa-dice-d6" style="
                font-size: 18px;
                color: ${i <= value ? '#800' : '#333'};
                transition: color 0.2s ease;
            "></i>`);
            display.append(die);
            }
        };

        renderBoons();

        input.on("input change", () => renderBoons());
        Hooks.once("updateActor", () => setTimeout(() => renderBoons(), 50));
    }

    // DERIVED STATs
if (app.actor?.type === "character") {
  const actor = app.actor;
  const system = actor.toObject().system;
  const updates = {};

  // --- TOUGHNESS (Fortitude Attribute) ---
  const forDie = system.props?.ForDieLabel || "d4";
  const forStep = parseInt(forDie.replace(/[^\d]/g, "")) || 6;
  const toughness = 2 + Math.floor(forStep / 2);
  if ((system.props?.axiomCharacterToughness ?? 0) !== toughness) {
    updates["system.props.axiomCharacterToughness"] = toughness;
  }

  // --- CORRUPTION THRESHOLD (Resolve Attribute) ---
  const resDie = system.props?.ResDieLabel || "d4";
  const resStep = parseInt(resDie.replace(/[^\d]/g, "")) || 6;
  const corruptionThreshold = 2 + Math.floor(resStep / 2);
  if ((system.props?.axiomCharacterCorruptionThreshold ?? 0) !== corruptionThreshold) {
    updates["system.props.axiomCharacterCorruptionThreshold"] = corruptionThreshold;
  }

  // --- SKILL PANEL FETCH ---
  const skillPanel = system.props?.axiomCharacterSkillPanel;
  const skillEntries = Array.isArray(skillPanel) ? skillPanel : Object.values(skillPanel || {});

  // --- GUARD (based on Melee skill die) ---
  let meleeStep = 2;
  for (const skill of skillEntries) {
    const name = (skill?.CharacterSkillName || "").toLowerCase().trim();
    if (name === "melee") {
      const dieLabel = skill.CharacterSkillDie || "d6";
      meleeStep = parseInt(dieLabel.replace(/[^\d]/g, "")) || 6;
      break;
    }
  }
  const guard = 6 + Math.floor(meleeStep / 2);
  if ((system.props?.axiomCharacterGuard ?? 0) !== guard) {
    updates["system.props.axiomCharacterGuard"] = guard;
  }

  // --- MOVEMENT (based on Athletics skill die) ---
  let athleticsStep = 2;
  for (const skill of skillEntries) {
    const name = (skill?.CharacterSkillName || "").toLowerCase().trim();
    if (name === "athletics") {
      const dieLabel = skill.CharacterSkillDie || "d6";
      athleticsStep = parseInt(dieLabel.replace(/[^\d]/g, "")) || 6;
      break;
    }
  }
  const movement = 6 + Math.floor(athleticsStep / 2);
  if ((system.props?.axiomCharacterMovement ?? 0) !== movement) {
    updates["system.props.axiomCharacterMovement"] = movement;
  }

  // --- APPLY UPDATES ---
  if (Object.keys(updates).length > 0) {
    actor.update(updates);
  }
}

});

class AxiomRollDialog extends Application {
  constructor(actor, { skillName, skillDie, attributeKey, attributeDie, focusStep }) {
    super();
    this.actor = actor;
    this.skillName = skillName;
    this.skillDie = skillDie;
    this.attributeKey = attributeKey;
    this.attributeDie = attributeDie;
    this.focusStep = focusStep;
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
      skillDie: `d${this.skillDie}`,
      attributeKey: this.attributeKey,
      attributeDie: `d${this.attributeDie}`,
      focusDie: `d${6 + this.focusStep * 2}` // d6 = step 0
    };
  }

  activateListeners(html) {
    super.activateListeners(html);

        html.find(".roll-button").on("click", async (event) => {
            console.log("[Axiom] Roll button clicked");

            const modifier = parseInt(html.find("input[name='modifier']").val()) || 0;

            const attrDie = `1d${this.attributeDie}`;
            const skillDie = `1d${this.skillDie}`;
            const focusDie = `1d${6 + this.focusStep * 2}`;

            const rollFormula = `${attrDie} + ${skillDie} + ${focusDie}`;
            console.log("[Axiom] Roll formula:", rollFormula);

            const roll = await Roll.create(rollFormula);
            await roll.evaluate();

            const results = roll.terms
            .filter(t => t instanceof foundry.dice.terms.Die)
            .map(die => die.results[0].result);

            console.log("[Axiom] Raw results:", results);

            const bestTwo = results.sort((a, b) => b - a).slice(0, 2);
            const total = bestTwo.reduce((sum, v) => sum + v, 0) + modifier;
            roll._total = total;

            const flavor = `<strong>${this.skillName} Test</strong><br>
            Attribute Die: ${this.attributeDie} → ${results[0]}<br>
            Skill Die: ${this.skillDie} → ${results[1]}<br>
            Focus Die: ${6 + this.focusStep * 2} → ${results[2]}<br>
            <strong>Best 2:</strong> ${bestTwo.join(" + ")} + Mod ${modifier} = <strong>${total}</strong>`;

            await roll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            flavor: flavor,
            rollMode: game.settings.get("core", "rollMode")
            });

            this.close();
        });
    }
}

function openRollFromRow({ row }) {
  console.log("[Axiom] Roll button clicked with row data:", row);

  const sheetApp = Object.values(ui.windows).find(w => w?.actor);
  const actor = sheetApp?.actor;

  if (!actor) {
    console.warn("[Axiom] No actor found from sheet.");
    ui.notifications.warn("Actor not found.");
    return;
  }

  const skillName = row.skill;
  const skillDieRaw = row.skillDie ?? "d6";
  const skillDie = parseInt(skillDieRaw.replace("d", "")) || 6;

  const attributeKey = row.attr;
  const attrDieRaw = row.attrDie ?? "d6";
  const attributeDie = parseInt(attrDieRaw.replace("d", "")) || 6;

  console.log("[Axiom] Final roll setup:", {
    actor: actor.name,
    skillName,
    skillDieRaw,
    skillDie,
    attributeKey,
    attrDieRaw,
    attributeDie
  });

  new AxiomRollDialog(actor, {
    skillName,
    skillDie,
    attributeKey,
    attributeDie,
    focusStep: 0 // update later if needed
  }).render(true);
}
