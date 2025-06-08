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

  // ATTRIBUTE S //  
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
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: ${i <= value ? '#880000' : '#000000EE'};
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
        box.css("background-color", "#eaeaea"); // white for undamaged
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

//-------------------------------
// SKILL ROLL
//-------------------------------

class AxiomRollDialog extends Application {
  constructor(actor, { skillName, skillDie, attributeKey, attributeDie, focusStep, skillMod = 0, attributeMod = 0 }) {
    super();
    this.actor = actor;
    this.skillName = skillName;
    this.skillDie = skillDie;
    this.attributeKey = attributeKey;
    this.attributeDie = attributeDie;
    this.focusStep = focusStep;
    this.skillMod = skillMod;
    this.attributeMod = attributeMod;
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
      skillDie: this.skillDie,               // e.g. "d6"
      skillMod: this.skillMod ?? 0,
      attributeKey: this.attributeKey,
      attributeDie: this.attributeDie,       // e.g. "d8"
      attributeMod: this.attributeMod ?? 0,
      focusDie: `d${6 + this.focusStep * 2}`, // this one is calculated normally
      modifier: 0
    };
  }

  activateListeners(html) {
    super.activateListeners(html);

        html.find(".roll-button").on("click", async (event) => {
            console.log("[Axiom] Roll button clicked");

            const modifier = parseInt(html.find("input[name='modifier']").val()) || 0;

            const attrDie = html.find("select[name='attributeDie']").val();  // e.g. "d6"
            const skillDie = html.find("select[name='skillDie']").val();    // e.g. "d8"
            const focusDie = html.find("select[name='focusDie']").val();    // e.g. "d10"

            const attrMod = parseInt(html.find("input[name='attributeMod']").val()) || 0;
            const skillMod = parseInt(html.find("input[name='skillMod']").val()) || 0;
            const flatMod = parseInt(html.find("input[name='modifier']").val()) || 0;

            const rollFormula = `1${attrDie} + ${attrMod} + 1${skillDie} + ${skillMod} + 1${focusDie}`;

            console.log("[Axiom] Roll formula:", rollFormula);

            const roll = await Roll.create(rollFormula);
            await roll.evaluate();

            const results = roll.terms
              .filter(t => t instanceof foundry.dice.terms.Die)
              .map(die => die.results[0].result);

            // Apply modifiers
            const modified = [
              results[0] + attrMod,
              results[1] + skillMod,
              results[2] // no mod for focus
            ];

            // Keep best 2 and total
            const bestTwo = modified.sort((a, b) => b - a).slice(0, 2);
            const total = bestTwo.reduce((sum, v) => sum + v, 0) + flatMod;
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
  const skillDie = row.skillDie ?? "d6";
  const skillMod = row.skillMod ?? 0;

  const attributeKey = row.attr;
  const attributeDie = row.attrDie ?? "d6";
  const attributeMod = row.attributeMod ?? 0;

  console.log("[Axiom] Final roll setup:", {
    actor: actor.name,
    skillName,
    skillDie,
    skillMod,
    attributeKey,
    attributeDie,
    attributeMod
  });

  new AxiomRollDialog(actor, {
    skillName,
    skillDie,
    attributeKey,
    attributeDie,
    skillMod,
    attributeMod,
    focusStep: 0
  }).render(true);
}

//------------------------
// AMMO COUNT
//------------------------

Hooks.on("renderActorSheet", (app, html, data) => {
  html.find(".ammo-counter").each((_, el) => {
    const $el = $(el);
    const classList = $el.attr("class") ?? "";
    
    // Match the item ID from the class string
    const match = classList.match(/axiomCharacterWeapons\.([a-zA-Z0-9]+)\.itemCurrentAmmo/);
    if (!match) return;

    const itemId = match[1];
    const actor = app.actor;
    const item = actor.items.get(itemId);
    if (!item) return;

    $el.on("mousedown", async (event) => {
      event.preventDefault();

      const current = item.system.props.axiomWeaponCurrentAmmo ?? 0;
      const cap = item.system.props.axiomWeaponAmmoCap ?? 0;
      let newVal = current;

      if (event.button === 0) {
        newVal = Math.max(current - 1, 0);
      } else if (event.button === 2) {
        newVal = Math.min(current + 1, cap);
      } else {
        return;
      }

      await item.update({ "system.props.axiomWeaponCurrentAmmo": newVal });
    });

    // Prevent context menu on right click
    $el.on("contextmenu", (e) => e.preventDefault());
  });
});
