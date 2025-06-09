// ----------------------------
// Initialization Hooks
// ----------------------------
Hooks.once("init", () => {
  game.axiom = {
    openRollFromRow
  };
});

// Register Dice So Nice color sets for Axiom//Core
Hooks.once("diceSoNiceReady", () => {
  game.dice3d.addColorset({
    name: "axiom-attribute",
    description: "Attribute Die (Blue)",
    category: "Axiom",
    foreground: "#ffffff",
    background: "#1976d2",
    edge: "#0d47a1",
    material: "plastic",
    font: "Modesto",
    contrast: 1.2
  });

  game.dice3d.addColorset({
    name: "axiom-skill",
    description: "Skill Die (Red)",
    category: "Axiom",
    foreground: "#ffffff",
    background: "#d32f2f",
    edge: "#b71c1c",
    material: "plastic",
    font: "Modesto",
    contrast: 1.2
  });

  game.dice3d.addColorset({
    name: "axiom-focus",
    description: "Focus Die (Amber)",
    category: "Axiom",
    foreground: "#000000",
    background: "#ffca28",
    edge: "#ffb300",
    material: "plastic",
    font: "Modesto",
    contrast: 1.3
  });
});

function applyAxiomDieColors(roll) {
  const diceTerms = roll.terms.filter(t => t instanceof foundry.dice.terms.Die);

  if (diceTerms[0]) diceTerms[0].options.colorset = "axiom-attribute";
  if (diceTerms[1]) diceTerms[1].options.colorset = "axiom-skill";
  if (diceTerms[2]) diceTerms[2].options.colorset = "axiom-focus";

  return diceTerms;
}

// ----------------------------
// Actor Sheet Enhancements
// ----------------------------
Hooks.on("renderActorSheet", (app, html) => {

  // Enables +/– buttons on number fields
  html.find(".custom-system-number-field-control").on("click", event => {
    const input = $(event.currentTarget).siblings("input[type='number'], input[type='range'], input[type='text']");
    input.trigger("change");
  }); 

  // Attribute Pip SVG Rendering  
  const fields = ["StrValue", "IntValue", "AgiValue", "ResValue", "ForValue", "ChaValue"];

  for (const key of fields) {
    const container = html.find(`.${key}`);
    if (!container.length) continue;

    const input = container.find(`input[type='range'], input[name='system.props.${key}']`).last();
    if (!input.length) {
      console.warn(`[Axiom//Pips] Input for ${key} not found.`);
      continue;
    }

    input.css({
      opacity: "0",
      width: "0px",
      height: "0px",
      pointerEvents: "none",
      position: "absolute",
    });

    if (!input.siblings(".pip-display").length) {
      const pipDisplay = $(`<div class="pentagon-display"></div>`);
      input.after(pipDisplay);
    }

    const renderPips = () => {
    const pipDisplay = container.find(".pentagon-display");
    pipDisplay.empty();
    const value = parseInt(input.val()) || 1;

    const svg = $(`
      <svg width="69" height="69" viewBox="0 0 100 100" class="pentagon-svg">
        <polygon points="50,5 95,35 77,90 23,90 5,35" class="pentagon-outline"/>
        ${[...Array(5)].map((_, i) => {
          const sides = [
            [[50, 5], [95, 35]],        // side 1
            [[95, 35], [77, 90]],       // side 2
            [[77, 90], [23, 90]],       // side 3
            [[23, 90], [5, 35]],        // side 4
            [[5, 35], [50, 5]]          // side 5
          ];
          const [[x1, y1], [x2, y2]] = sides[i];
          return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${i < value ? '#880000' : '#333'}" stroke-width="5"/>`;
        }).join("")}
      </svg>
    `);

    pipDisplay.append(svg);
  };

    renderPips();

    input.on("input change", () => renderPips());

    Hooks.once("updateActor", () => {
      setTimeout(() => renderPips(), 50);
    });
  }

  // Skill Pip SVG Rendering
    html.find("[class*='CharacterSkillLevel']").each((_, el) => {
        const container = $(el);

        const input = container.find("input[type='range'], input[name*='CharacterSkillLevel']").last();
        if (!input.length) return;

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
        const rawValue = parseInt(input.val()) || 3;
        const value = rawValue - 2; // d4=3, so 1 pip = d4, 5 = d12

        const center = [50, 50];
        const radius = 45;
        const angles = [...Array(6)].map((_, i) => (Math.PI * 2 * i) / 5 - Math.PI / 2); // Start top center

        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("width", "20");
        svg.setAttribute("height", "20");
        svg.setAttribute("viewBox", "0 0 100 100");
        svg.classList.add("pentagon-skill-svg");

        for (let i = 0; i < 5; i++) {
          const a1 = angles[i];
          const a2 = angles[(i + 1) % 5];
          const x1 = center[0] + Math.cos(a1) * radius;
          const y1 = center[1] + Math.sin(a1) * radius;
          const x2 = center[0] + Math.cos(a2) * radius;
          const y2 = center[1] + Math.sin(a2) * radius;

          const path = document.createElementNS(svgNS, "path");
          path.setAttribute("d", `M${center[0]},${center[1]} L${x1},${y1} L${x2},${y2} Z`);
          path.setAttribute("fill", i < value ? "#880000" : "#333");
          svg.appendChild(path);
        }

        pipDisplay.append(svg);
      };


        renderPips();
        input.on("input change", () => renderPips());

        Hooks.once("updateActor", () => {
            setTimeout(() => renderPips(), 50);
        });
    });
    
    // Health Bar Display
    const actor = app.actor;
    const container = html.find(".axiomCharacterHealthBar");
    if (!container.length) return;

    const forDie = foundry.utils.getProperty(actor.system, "props.ForDieLabel") || "d6";
    const dieStep = parseInt(forDie.replace(/[^\d]/g, "")) || 6;
    const boxCount = 6 + Math.floor(dieStep / 2);

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
        box.css("background-color", "#800"); 
        } else if (indexFromRight < totalDamageClamped) {
        box.css("background-color", "#08f"); 
        } else {
        box.css("background-color", "#eaeaea");
        }

        bar.append(box);
    }
    
    // Boons Display using dice icons
    const boonsField = html.find(".axiomCharacterBoonsCount");
    if (boonsField.length) {
        const inputSpan = boonsField.find(".custom-system-number-input-span");
        const input = inputSpan.find("input[type='number'], input[name*='axiomCharacterBoonsCount']").last();
        if (!input.length) return;

        input.css({
            opacity: "0",
            width: "0px",
            height: "0px",
            pointerEvents: "none",
            position: "absolute"
        });

        inputSpan.find("input[type='text'], input[type='number']").css("display", "none");

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

// Derived Stats Calculation (Toughness, Guard, Movement, etc)
if (app.actor?.type === "character") {
  const actor = app.actor;
  const system = actor.toObject().system;
  const updates = {};

  // --- TOUGHNESS ---
  const forDie = system.props?.ForDieLabel || "d4";
  const forStep = parseInt(forDie.replace(/[^\d]/g, "")) || 6;
  const toughness = 2 + Math.floor(forStep / 2);
  if ((system.props?.axiomCharacterToughness ?? 0) !== toughness) {
    updates["system.props.axiomCharacterToughness"] = toughness;
  }

    // --- CORRUPTION THRESHOLD ---
  const resDie = system.props?.ResDieLabel || "d4";
  const resStep = parseInt(resDie.replace(/[^\d]/g, "")) || 6;
  const corruptionThreshold = 2 + Math.floor(resStep / 2);
  if ((system.props?.axiomCharacterCorruptionThreshold ?? 0) !== corruptionThreshold) {
    updates["system.props.axiomCharacterCorruptionThreshold"] = corruptionThreshold;
  }

  const skillPanel = system.props?.axiomCharacterSkillPanel;
  const skillEntries = Array.isArray(skillPanel) ? skillPanel : Object.values(skillPanel || {});

  // --- GUARD ---
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

  // --- MOVEMENT ---
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

    if (Object.keys(updates).length > 0) {
      actor.update(updates);
    }
  }
});

// ----------------------------
// Skill Roll Dialog and Logic
// ----------------------------
class AxiomRollDialog extends Application {
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
      modifier: 0, // default is 0 for user to modify
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

      html.find(".roll-button").on("click", async (event) => {
        console.log("[Axiom] Roll button clicked");

        const attrDie = html.find("select[name='attributeDie']").val();  // e.g. "d6"
        const skillDie = html.find("select[name='skillDie']").val();    // e.g. "d8"
        const focusDie = html.find("select[name='focusDie']").val();    // e.g. "d10"

        const attrMod = parseInt(html.find("input[name='attributeMod']").val()) || 0;
        const skillMod = parseInt(html.find("input[name='skillMod']").val()) || 0;
        const userMod = parseInt(html.find("input[name='modifier']").val()) || 0;
        const penalty = this.penalty ?? 0;
        const totalMod = attrMod + skillMod + userMod + penalty;

        const rollFormula = `1${attrDie} + ${attrMod} + 1${skillDie} + ${skillMod} + 1${focusDie}`;

        console.log("[Axiom] Roll formula:", rollFormula);

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
        flavor: flavor,
        rollMode: game.settings.get("core", "rollMode")
        })

        this.close();
      });
    }
}

// Open skill roll dialog when clicking roll button in CSB sheet
function openRollFromRow({ row }) {
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

// ----------------------------
// Ammo Counter UI Controls
// ----------------------------
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

// ----------------------------
// Initiative Override Logic
// ----------------------------
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
